"use strict";
function remainingTime(resetsAt, now = Date.now()) {
  const reset = Date.parse(resetsAt);
  if (!Number.isFinite(reset) || reset <= now) return null;
  const totalHours = Math.floor((reset - now) / 3600000);
  return {
    days: Math.floor(totalHours / 24),
    hours: totalHours % 24,
    underOneHour: totalHours === 0,
  };
}
function renderCountdown(data, config = {}, error, now = Date.now()) {
  const time = remainingTime(data?.resetsAt, now);
  const stale = time && (!!error || now - data.fetchedAt > 150000);
  const provider = config.provider === "codex" ? "Codex" : "Claude";
  const accent = /^#[0-9a-f]{6}$/i.test(config.greenColor)
    ? config.greenColor
    : "#55e58c";
  const color = !time ? "#91a1b9" : stale ? "#ffd45c" : accent;
  const labels = {
    OPEN_CODEX: "Open Codex",
    OPEN_CLAUDE: "Open Claude",
    KEYCHAIN: "Keychain",
    MULTIPLE_ORGS: "Multi org",
    RATE_LIMIT: "Retry later",
    DESKTOP_CHANGED: "Update needed",
  };
  const hours = time?.underOneHour ? "&lt;1h" : `${time?.hours}h`;
  const reason =
    data?.resetsAt && Date.parse(data.resetsAt) <= now
      ? "Refreshing"
      : labels[error] || "No data";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144"><defs><radialGradient id="bg"><stop stop-color="#1b2335"/><stop offset="1" stop-color="#0c111d"/></radialGradient></defs><rect width="144" height="144" rx="16" fill="url(#bg)"/><g font-family="Arial, Helvetica, sans-serif" text-anchor="middle" font-weight="800"><text x="72" y="26" font-size="${stale ? 17 : 21}" fill="${color}">${stale ? "Week · stale" : "Week"}</text><text x="72" y="77" font-size="48" fill="${time ? "#f3f8ff" : "#91a1b9"}">${time ? time.days + "d" : "—"}</text><text x="72" y="111" font-size="${time ? 35 : 16}" fill="#e5edf8">${time ? hours : reason}</text><text x="72" y="136" font-size="17" fill="${color}">${provider}</text></g></svg>`;
}
module.exports = { remainingTime, renderCountdown };
