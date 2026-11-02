"use strict";
// Retain only display fields. Grant IDs are used for deduplication and discarded;
// redemption handles are neither retained nor sent anywhere.
function parseResets(block, now = Date.now()) {
  if (!block || typeof block !== "object")
    return { known: false, reason: "UNAVAILABLE", grants: [] };
  if (block.eligible === false)
    return {
      known: block.ineligible_reason === "no_grant",
      reason: block.ineligible_reason === "no_grant" ? null : "UNAVAILABLE",
      grants: [],
    };
  if (block.eligible !== true || !Array.isArray(block.grants))
    return { known: false, reason: "UNAVAILABLE", grants: [] };
  const grants = [],
    seen = new Set();
  for (const g of block.grants) {
    if (
      !g ||
      !Number.isSafeInteger(g.resets_left) ||
      g.resets_left < 0 ||
      g.resets_left > 1000 ||
      typeof g.paused !== "boolean"
    )
      return { known: false, reason: "INVALID_DATA", grants: [] };
    const start = g.starts_at == null ? null : Date.parse(g.starts_at);
    const end = g.ends_at == null ? null : Date.parse(g.ends_at);
    if (
      (start !== null && !Number.isFinite(start)) ||
      (end !== null && !Number.isFinite(end))
    )
      return { known: false, reason: "INVALID_DATA", grants: [] };
    if (
      !g.resets_left ||
      g.paused ||
      (start !== null && start > now) ||
      (end !== null && end <= now)
    )
      continue;
    if (typeof g.id === "string") {
      if (seen.has(g.id)) continue;
      seen.add(g.id);
    }
    // usable_now can be false until a usage limit is reached; the saved credit still exists.
    grants.push({
      count: g.resets_left,
      expiresAt: end === null ? null : new Date(end).toISOString(),
    });
  }
  return { known: true, reason: null, grants };
}
function availableResets(credits, now = Date.now()) {
  if (!credits?.known) return { known: false, count: null, expiresAt: null };
  const grants = credits.grants.filter(
    (g) => !g.expiresAt || Date.parse(g.expiresAt) > now,
  );
  const dates = grants
    .map((g) => g.expiresAt)
    .filter(Boolean)
    .sort();
  return {
    known: true,
    count: grants.reduce((n, g) => n + g.count, 0),
    expiresAt: dates[0] || null,
  };
}
function renderResets(data, config = {}, error, now = Date.now()) {
  const credits = availableResets(data?.resetCredits, now);
  const has = credits.known && credits.count > 0;
  const accent = /^#[0-9a-f]{6}$/i.test(config.greenColor)
    ? config.greenColor
    : "#55e58c";
  let date = "";
  if (has && credits.expiresAt)
    date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })
      .format(new Date(credits.expiresAt))
      .replace(".", "")
      .toUpperCase();
  const main = credits.known ? (has ? `R${credits.count}` : "none") : "—";
  const font = main.length > 3 ? 44 : 63;
  const sub = !credits.known
      ? error === "OPEN_CODEX"
        ? "Open Codex"
        : error === "OPEN_CLAUDE"
          ? "Open Claude"
          : "No data"
      : has
        ? credits.expiresAt
          ? "EXPIRES"
          : "AVAILABLE"
        : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144"><defs><radialGradient id="bg"><stop stop-color="#1b2335"/><stop offset="1" stop-color="#0c111d"/></radialGradient></defs><rect width="144" height="144" rx="16" fill="url(#bg)"/><g font-family="Arial, Helvetica, sans-serif" font-weight="800" text-anchor="middle"><text x="72" y="${credits.known && !has ? 88 : 77}" font-size="${font}" fill="${credits.known ? "#f3f8ff" : "#91a1b9"}">${main}</text><text x="72" y="101" font-size="15" fill="${accent}">${sub}</text><text x="72" y="128" font-size="27" fill="${accent}">${date}</text></g></svg>`;
}
module.exports = { parseResets, availableResets, renderResets };
