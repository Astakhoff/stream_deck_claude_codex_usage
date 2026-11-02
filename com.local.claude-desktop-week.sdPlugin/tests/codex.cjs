const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  parseAuth,
  parseWeekly,
  parseResetCredits,
  fetchUsage,
  retryDelay,
} = require("../bin/codex");
const now = Date.parse("2026-11-02T05:00Z");
const weekly = {
  used_percent: 25,
  limit_window_seconds: 604800,
  reset_at: (now + 4 * 86400000) / 1000,
};
const credit = (id, extra = {}) => ({
  id,
  status: "available",
  is_supported_by_plan: true,
  expires_at: "2026-12-02T12:00Z",
  ...extra,
});
const credentials = async () => ({
  token: "synthetic-test-token",
  accountId: "synthetic-account",
});
test("Codex weekly window can be primary or secondary; short window never substitutes", () => {
  for (const key of ["primary_window", "secondary_window"])
    assert.equal(
      parseWeekly({ rate_limit: { [key]: weekly } }, now).remaining,
      75,
    );
  assert.throws(
    () =>
      parseWeekly(
        {
          rate_limit: {
            primary_window: { ...weekly, limit_window_seconds: 18000 },
          },
        },
        now,
      ),
    /NO_WEEKLY/,
  );
});
test("missing, nonnumeric, and elapsed weekly windows are unavailable", () => {
  for (const w of [
    null,
    { ...weekly, used_percent: null },
    { ...weekly, reset_at: 0 },
    { ...weekly, reset_at: now / 1000 - 1 },
  ])
    assert.throws(() =>
      parseWeekly({ rate_limit: { primary_window: w } }, now),
    );
});
test("Codex auth requires subscription tokens and rejects API-key mode", () => {
  assert.deepEqual(
    parseAuth({
      auth_mode: "chatgpt",
      tokens: {
        access_token: "test",
        account_id: "account",
        refresh_token: "not-used",
      },
    }),
    { token: "test", accountId: "account" },
  );
  for (const a of [
    {},
    { auth_mode: "apikey", tokens: { access_token: "old", account_id: "old" } },
    { tokens: { access_token: "test" } },
  ])
    assert.throws(() => parseAuth(a), /OPEN_CODEX/);
});
test("saved rather than applicable count and earliest expiry", () => {
  const credits = parseResetCredits(
    {
      available_count: 2,
      applicable_available_count: 0,
      credits: [credit("a"), credit("b", { expires_at: "2026-11-20T00:00Z" })],
    },
    now,
  );
  const { availableResets } = require("../bin/resets");
  const r = availableResets(credits, now);
  assert.equal(r.count, 2);
  assert.equal(r.expiresAt, "2026-11-20T00:00:00.000Z");
});
test("reset inventory excludes expired, redeemed and unsupported entries", () => {
  const r = parseResetCredits(
    {
      available_count: 1,
      credits: [
        credit("a", { expires_at: "2026-10-01" }),
        credit("b", { status: "redeemed" }),
        credit("c", { is_supported_by_plan: false }),
      ],
    },
    now,
  );
  assert.equal(r.grants.length, 0);
});
test("duplicate IDs do not double count, unknown expiry remains absent", () => {
  const r = parseResetCredits(
    { available_count: 2, credits: [credit("a"), credit("a")] },
    now,
  );
  assert.equal(
    r.grants.reduce((n, g) => n + g.count, 0),
    2,
  );
  assert.equal(r.grants[1].expiresAt, null);
});
test("zero confirmed; malformed or missing data never means none", () => {
  assert.equal(
    parseResetCredits({ available_count: 0, credits: [] }, now).known,
    true,
  );
  for (const body of [
    null,
    {},
    { available_count: "1" },
    { available_count: 1 },
    { available_count: 1, credits: [credit("a", { expires_at: "invalid" })] },
    { available_count: 1, credits: [credit("a"), credit("b")] },
  ])
    assert.throws(() => parseResetCredits(body, now));
});
test("Codex calls only read-only fixed OpenAI routes, strips private response fields", async () => {
  const calls = [];
  const data = await fetchUsage({
    readCredentials: credentials,
    now: () => now,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return new Response(
        JSON.stringify(
          url.endsWith("/usage")
            ? { rate_limit: { primary_window: weekly } }
            : {
                available_count: 1,
                credits: [
                  credit("private-id", {
                    profile_user_id: "private-profile",
                    redeem_token: "private-handle",
                  }),
                ],
              },
        ),
      );
    },
  });
  assert.equal(data.remaining, 75);
  assert.equal(data.resetCredits.grants.length, 1);
  assert.equal(calls.length, 2);
  for (const { url, options } of calls) {
    assert.ok(
      [
        "https://chatgpt.com/backend-api/wham/usage",
        "https://chatgpt.com/backend-api/wham/rate-limit-reset-credits",
      ].includes(url),
    );
    assert.equal(options.method, "GET");
    assert.equal(options.redirect, "error");
    assert.equal(options.headers["ChatGPT-Account-Id"], "synthetic-account");
  }
  assert.doesNotMatch(
    JSON.stringify(data),
    /synthetic-test-token|synthetic-account|private-id|private-profile|private-handle/,
  );
});
test("reset endpoint failure does not discard weekly data", async () => {
  const data = await fetchUsage({
    readCredentials: credentials,
    now: () => now,
    fetchImpl: async (url) =>
      url.endsWith("/usage")
        ? new Response(
            JSON.stringify({ rate_limit: { primary_window: weekly } }),
          )
        : new Response("{}", { status: 503 }),
  });
  assert.equal(data.remaining, 75);
  assert.equal(data.resetError, "API_ERROR");
  assert.equal(data.resetCredits, undefined);
});
test("weekly failure does not discard reset inventory", async () => {
  const data = await fetchUsage({
    readCredentials: credentials,
    now: () => now,
    fetchImpl: async (url) =>
      url.endsWith("/usage")
        ? new Response("{}", { status: 401 })
        : new Response(JSON.stringify({ available_count: 0, credits: [] })),
  });
  assert.equal(data.weeklyError, "OPEN_CODEX");
  assert.equal(data.resetCredits.known, true);
});
test("429 backoff and bad JSON are sanitized", async () => {
  const data = await fetchUsage({
    readCredentials: credentials,
    now: () => now,
    fetchImpl: async () =>
      new Response("secret error", {
        status: 429,
        headers: { "retry-after": "600" },
      }),
  });
  assert.equal(data.retryMs, 600000);
  assert.equal(data.weeklyError, "RATE_LIMIT");
  assert.equal(data.resetError, "RATE_LIMIT");
  const bad = await fetchUsage({
    readCredentials: credentials,
    fetchImpl: async () => new Response("private body"),
  });
  assert.equal(bad.resetError, "API_ERROR");
  assert.doesNotMatch(JSON.stringify(bad), /private body/);
  assert.equal(retryDelay("2", now), 60000);
  assert.equal(retryDelay("999999", now), 3600000);
  assert.equal(retryDelay(null, now), 300000);
});
