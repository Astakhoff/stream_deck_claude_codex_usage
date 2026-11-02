"use strict";
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { UsageError } = require("./desktop");
const BASE = "https://chatgpt.com/backend-api/wham/";

function parseAuth(raw) {
  if (
    !raw ||
    (raw.auth_mode && raw.auth_mode !== "chatgpt") ||
    typeof raw.tokens?.access_token !== "string" ||
    !raw.tokens.access_token ||
    typeof raw.tokens?.account_id !== "string" ||
    !raw.tokens.account_id
  ) {
    throw new UsageError("OPEN_CODEX");
  }
  return { token: raw.tokens.access_token, accountId: raw.tokens.account_id };
}
async function readAuth() {
  try {
    const home = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
    return parseAuth(
      JSON.parse(await fs.readFile(path.join(home, "auth.json"), "utf8")),
    );
  } catch {
    throw new UsageError("OPEN_CODEX");
  }
}
function parseWeekly(body, now = Date.now()) {
  const windows = [
    body?.rate_limit?.primary_window,
    body?.rate_limit?.secondary_window,
  ];
  const weekly = windows.find((w) => w?.limit_window_seconds === 604800);
  if (
    !weekly ||
    typeof weekly.used_percent !== "number" ||
    !Number.isFinite(weekly.used_percent) ||
    typeof weekly.reset_at !== "number" ||
    !Number.isFinite(weekly.reset_at) ||
    weekly.reset_at <= 0
  ) {
    throw new UsageError("NO_WEEKLY");
  }
  const reset = weekly.reset_at * 1000;
  if (reset <= now) throw new UsageError("WAIT_RESET");
  return {
    remaining: Math.max(0, Math.min(100, 100 - weekly.used_percent)),
    resetsAt: new Date(reset).toISOString(),
    fetchedAt: now,
  };
}
function parseResetCredits(body, now = Date.now()) {
  const count = body?.available_count;
  if (!Number.isSafeInteger(count) || count < 0 || count > 1000)
    throw new UsageError("RESET_DATA");
  if (count === 0) return { known: true, reason: null, grants: [] };
  if (!Array.isArray(body.credits)) throw new UsageError("RESET_DATA");
  const grants = [],
    seen = new Set();
  let listed = 0;
  for (const credit of body.credits) {
    if (
      !credit ||
      credit.status !== "available" ||
      credit.is_supported_by_plan === false
    )
      continue;
    if (typeof credit.id === "string") {
      if (seen.has(credit.id)) continue;
      seen.add(credit.id);
    }
    const expiry =
      credit.expires_at == null ? null : Date.parse(credit.expires_at);
    if (expiry !== null && !Number.isFinite(expiry))
      throw new UsageError("RESET_DATA");
    listed++;
    if (expiry !== null && expiry <= now) continue;
    grants.push({
      count: 1,
      expiresAt: expiry === null ? null : new Date(expiry).toISOString(),
    });
  }
  // The total can exceed the detailed list. Keep the extra count without inventing an expiry.
  if (count > listed) grants.push({ count: count - listed, expiresAt: null });
  if (listed > count) throw new UsageError("RESET_DATA");
  return { known: true, reason: null, grants };
}
function retryDelay(header, now = Date.now()) {
  const seconds = Number(header);
  const ms =
    header && Number.isFinite(seconds)
      ? seconds * 1000
      : Date.parse(header) - now;
  return Math.max(60000, Math.min(3600000, ms > 0 ? ms : 300000));
}
async function request(route, auth, fetchImpl) {
  let response;
  try {
    response = await fetchImpl(BASE + route, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "ChatGPT-Account-Id": auth.accountId,
        "User-Agent": "codex-cli",
        Accept: "application/json",
      },
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new UsageError("OFFLINE");
  }
  if (response.status === 401 || response.status === 403)
    throw new UsageError("OPEN_CODEX");
  if (response.status === 429)
    throw new UsageError(
      "RATE_LIMIT",
      retryDelay(response.headers.get("retry-after")),
    );
  if (!response.ok) throw new UsageError("API_ERROR");
  try {
    return await response.json();
  } catch {
    throw new UsageError("API_ERROR");
  }
}
async function fetchUsage({
  readCredentials = readAuth,
  fetchImpl = fetch,
  now = Date.now,
} = {}) {
  const auth = await readCredentials();
  const results = await Promise.allSettled([
    request("usage", auth, fetchImpl).then((body) => parseWeekly(body, now())),
    request("rate-limit-reset-credits", auth, fetchImpl).then((body) =>
      parseResetCredits(body, now()),
    ),
  ]);
  const data = {
    accountKey: crypto
      .createHash("sha256")
      .update(auth.accountId)
      .digest("hex"),
  };
  let retryMs = 60000;
  const [weekly, resets] = results;
  if (weekly.status === "fulfilled") Object.assign(data, weekly.value);
  else {
    data.weeklyError = weekly.reason.code || "API_ERROR";
    retryMs = Math.max(retryMs, weekly.reason.retryMs || 60000);
  }
  if (resets.status === "fulfilled") {
    data.resetCredits = resets.value;
    data.resetFetchedAt = now();
  } else {
    data.resetError = resets.reason.code || "API_ERROR";
    retryMs = Math.max(retryMs, resets.reason.retryMs || 60000);
  }
  return { ...data, retryMs };
}
module.exports = {
  fetchUsage,
  parseAuth,
  parseWeekly,
  parseResetCredits,
  retryDelay,
};
if (require.main === module)
  fetchUsage()
    .then(({ accountKey, ...data }) => console.log(JSON.stringify(data)))
    .catch((error) => {
      console.log(JSON.stringify({ error: error.code || "ERROR" }));
      process.exitCode = 1;
    });
