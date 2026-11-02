"use strict";
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const exec = promisify(execFile);
const { parseResets } = require("./resets");
const CONFIG = path.join(
  os.homedir(),
  "Library/Application Support/Claude/config.json",
);
class UsageError extends Error {
  constructor(code, retryMs = 60000) {
    super(code);
    this.code = code;
    this.retryMs = retryMs;
  }
}
let decryptionKey;
function decrypt(encoded, key) {
  const bytes = Buffer.from(encoded, "base64");
  if (bytes.subarray(0, 3).toString() !== "v10")
    throw new UsageError("DESKTOP_CHANGED");
  const decoder = crypto.createDecipheriv(
    "aes-128-cbc",
    key,
    Buffer.alloc(16, 32),
  );
  return JSON.parse(
    Buffer.concat([
      decoder.update(bytes.subarray(3)),
      decoder.final(),
    ]).toString("utf8"),
  );
}
function selectCredential(cache, account, now = Date.now()) {
  if (typeof account !== "string" || !account)
    throw new UsageError("OPEN_CLAUDE");
  const entries = Object.entries(cache).filter(
    ([key, value]) =>
      key.startsWith(`acct:${account}|`) &&
      key.includes(":https://api.anthropic.com:") &&
      key.includes("user:profile") &&
      typeof value?.token === "string" &&
      value.expiresAt > now + 5000,
  );
  // The Code-compatible client already cached by Desktop can read reset grants.
  // Choose its least-scoped token; retain other tokens as a weekly-only fallback.
  const compatible = (key) =>
    key.includes("|9d1c250a-e61b-44d9-88ed-5944d1962f5e:");
  entries.sort(
    ([a], [b]) =>
      Number(compatible(b)) - Number(compatible(a)) || a.length - b.length,
  );
  if (!entries.length) throw new UsageError("OPEN_CLAUDE");
  const orgs = new Set(entries.map(([key]) => key.split("|")[1].split(":")[1]));
  if (orgs.size > 1) throw new UsageError("MULTIPLE_ORGS");
  return entries[0][1].token;
}
async function desktopToken() {
  let config;
  try {
    config = JSON.parse(await fs.readFile(CONFIG, "utf8"));
  } catch {
    throw new UsageError("OPEN_CLAUDE");
  }
  if (!config["oauth:tokenCacheV2"]) throw new UsageError("OPEN_CLAUDE");
  if (!decryptionKey) {
    try {
      const result = await exec(
        "/usr/bin/security",
        ["find-generic-password", "-s", "Claude Safe Storage", "-w"],
        { timeout: 20000, maxBuffer: 65536 },
      );
      decryptionKey = crypto.pbkdf2Sync(
        result.stdout.trim(),
        "saltysalt",
        1003,
        16,
        "sha1",
      );
    } catch {
      throw new UsageError("KEYCHAIN", 300000);
    }
  }
  let cache;
  try {
    cache = decrypt(config["oauth:tokenCacheV2"], decryptionKey);
  } catch {
    decryptionKey = undefined;
    throw new UsageError("DESKTOP_CHANGED", 300000);
  }
  return selectCredential(cache, config.lastKnownAccountUuid);
}
function parseWeekly(body, now = Date.now()) {
  const limit = body?.limits?.find(
    (x) => x.kind === "weekly_all" && x.is_active !== false,
  );
  const used = limit?.percent ?? body?.seven_day?.utilization;
  const resetsAt = limit?.resets_at ?? body?.seven_day?.resets_at;
  const reset = Date.parse(resetsAt);
  if (
    typeof used !== "number" ||
    !Number.isFinite(used) ||
    !Number.isFinite(reset)
  )
    throw new UsageError("NO_WEEKLY");
  if (reset <= now) throw new UsageError("WAIT_RESET");
  return {
    remaining: Math.max(0, Math.min(100, 100 - used)),
    resetsAt: new Date(reset).toISOString(),
    fetchedAt: now,
  };
}
async function fetchUsage() {
  const token = await desktopToken();
  let response;
  try {
    response = await fetch(
      "https://api.anthropic.com/api/oauth/usage?cedar_ember=1",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "anthropic-beta": "oauth-2025-04-20",
          "User-Agent": "claude-cli/2.1.309 (external, cli)",
        },
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      },
    );
  } catch {
    throw new UsageError("OFFLINE");
  }
  if (response.status === 401 || response.status === 403)
    throw new UsageError("OPEN_CLAUDE");
  if (response.status === 429) {
    const header = response.headers.get("retry-after");
    const seconds = Number(header);
    const ms =
      header && Number.isFinite(seconds)
        ? seconds * 1000
        : Date.parse(header) - Date.now();
    throw new UsageError(
      "RATE_LIMIT",
      Math.max(60000, Math.min(3600000, ms > 0 ? ms : 300000)),
    );
  }
  if (!response.ok) throw new UsageError("API_ERROR");
  try {
    const body = await response.json(),
      now = Date.now();
    let weekly;
    try {
      weekly = parseWeekly(body, now);
    } catch (e) {
      weekly = { fetchedAt: now, weeklyError: e.code || "NO_WEEKLY" };
    }
    return { ...weekly, resetCredits: parseResets(body.cedar_ember, now) };
  } catch (error) {
    if (error instanceof UsageError) throw error;
    throw new UsageError("API_ERROR");
  }
}
module.exports = {
  fetchUsage,
  parseWeekly,
  selectCredential,
  decrypt,
  UsageError,
};
if (require.main === module)
  fetchUsage()
    .then((data) => console.log(JSON.stringify(data)))
    .catch((error) => {
      console.log(JSON.stringify({ error: error.code || "ERROR" }));
      process.exitCode = 1;
    });
