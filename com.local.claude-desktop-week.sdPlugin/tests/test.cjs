const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseWeekly, selectCredential, decrypt } = require("../bin/desktop");
const { settings, colorFor, countdown, render } = require("../bin/render");
const now = Date.parse("2026-11-02T05:00Z"),
  reset = "2026-11-06T17:00Z";
test("weekly remaining and actual reset", () =>
  assert.deepEqual(
    parseWeekly({ seven_day: { utilization: 63, resets_at: reset } }, now),
    { remaining: 37, resetsAt: "2026-11-06T17:00:00.000Z", fetchedAt: now },
  ));
test("new limits schema preferred and inactive scoped limits ignored", () =>
  assert.equal(
    parseWeekly(
      {
        limits: [
          { kind: "weekly_scoped", percent: 99 },
          { kind: "weekly_all", percent: 25, resets_at: reset },
        ],
      },
      now,
    ).remaining,
    75,
  ));
test("missing and expired data never invent reset", () => {
  for (const body of [
    {},
    { seven_day: { utilization: null, resets_at: reset } },
    { seven_day: { utilization: 50, resets_at: "2026-11-01" } },
  ])
    assert.throws(() => parseWeekly(body, now));
});
test("threshold boundaries based on remaining", () => {
  const s = settings();
  for (const [v, c] of [
    [51, s.greenColor],
    [50, s.yellowColor],
    [21, s.yellowColor],
    [20, s.redColor],
    [11, s.redColor],
    [10, s.criticalColor],
    [0, s.criticalColor],
  ])
    assert.equal(colorFor(v, s), c);
});
test("invalid configuration cannot inject SVG and uses defaults", () => {
  const s = settings({ greenColor: "<script>", yellow: 10, red: 20 });
  assert.equal(s.greenColor, "#55e58c");
  assert.equal(s.yellow, 50);
});
test("percentage countdown uses compact days and hours", () =>
  assert.deepEqual(countdown(reset, now, false), {
    main: "4d 12h",
    sub: "",
  }));
test("stale and reset states clearly marked", () => {
  const d = { remaining: 37, resetsAt: reset, fetchedAt: now };
  assert.match(render(d, {}, "OFFLINE", now), /STALE/);
  assert.match(render(d, {}, null, Date.parse(reset) + 1), /No data/);
  assert.doesNotMatch(render(d, {}, null, Date.parse(reset) + 1), /37%/);
});
test("only current desktop account with profile scope; least permission token preferred", () => {
  const k = "acct:a|client:org:https://api.anthropic.com:";
  assert.equal(
    selectCredential(
      {
        [k + "user:profile"]: { token: "profile", expiresAt: now + 60000 },
        [k + "user:profile user:inference"]: {
          token: "other",
          expiresAt: now + 60000,
        },
        ["acct:b|client:org:https://api.anthropic.com:user:profile"]: {
          token: "wrong",
          expiresAt: now + 60000,
        },
      },
      "a",
      now,
    ),
    "profile",
  );
  assert.throws(() => selectCredential({}, "a", now));
});
test("multiple organizations refuse silent account choice", () => {
  const obj = {};
  for (const org of ["one", "two"])
    obj[`acct:a|client:${org}:https://api.anthropic.com:user:profile`] = {
      token: "x",
      expiresAt: now + 60000,
    };
  assert.throws(() => selectCredential(obj, "a", now), /MULTIPLE_ORGS/);
});
test("desktop encrypted cache format roundtrip", () => {
  const crypto = require("node:crypto"),
    key = Buffer.alloc(16, 4),
    c = crypto.createCipheriv("aes-128-cbc", key, Buffer.alloc(16, 32));
  const encoded = Buffer.concat([
    Buffer.from("v10"),
    c.update(JSON.stringify({ example: "test" })),
    c.final(),
  ]).toString("base64");
  assert.deepEqual(decrypt(encoded, key), { example: "test" });
});
