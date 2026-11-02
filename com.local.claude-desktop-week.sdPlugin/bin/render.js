"use strict";
const defaults = {
  yellow: 50,
  red: 20,
  critical: 10,
  greenColor: "#55e58c",
  yellowColor: "#ffd45c",
  redColor: "#ff6b70",
  criticalColor: "#ff344f",
};
function settings(raw = {}) {
  const s = { ...defaults, ...raw };
  for (const k of ["yellow", "red", "critical"]) s[k] = Number(s[k]);
  if (!(
    s.yellow <= 100 &&
    s.yellow > s.red &&
    s.red > s.critical &&
    s.critical >= 0
  ))
    Object.assign(s, { yellow: 50, red: 20, critical: 10 });
  for (const k of ["greenColor", "yellowColor", "redColor", "criticalColor"])
    if (!/^#[0-9a-f]{6}$/i.test(s[k])) s[k] = defaults[k];
  delete s.language;
  return s;
}
function colorFor(remaining, s) {
  return remaining <= s.critical
    ? s.criticalColor
    : remaining <= s.red
      ? s.redColor
      : remaining <= s.yellow
        ? s.yellowColor
        : s.greenColor;
}
function countdown(reset, now) {
  const minutes = Math.max(0, Math.ceil((Date.parse(reset) - now) / 60000));
  const days = Math.floor(minutes / 1440),
    hours = Math.floor((minutes % 1440) / 60),
    mins = minutes % 60;
  return {
    main: days ? `${days} ${days === 1 ? "day" : "days"}` : `${hours} hours`,
    sub: days
      ? `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
      : `${mins} min`,
  };
}
function render(data, raw, error, now = Date.now()) {
  const s = settings(raw);
  const expired = data && Date.parse(data.resetsAt) <= now;
  const stale = !!error || (data && now - data.fetchedAt > 150000);
  const valid =
    data &&
    Number.isFinite(data.remaining) &&
    Number.isFinite(Date.parse(data.resetsAt)) &&
    !expired;
  const color = valid ? colorFor(data.remaining, s) : "#91a1b9";
  const time = valid
    ? countdown(data.resetsAt, now)
    : { main: "No data", sub: "" };
  const errors = {
    KEYCHAIN: "Keychain",
    OPEN_CLAUDE: "Open Claude",
    OPEN_CODEX: "Open Codex",
    MULTIPLE_ORGS: "Multi org",
    DESKTOP_CHANGED: "Update needed",
    OFFLINE: "Offline",
    RATE_LIMIT: "Retry later",
    NO_WEEKLY: "No weekly",
    API_ERROR: "API error",
    WAIT_RESET: "Refreshing",
  };
  const foot =
    stale || expired
      ? valid
        ? "STALE"
        : errors[error] || "Refreshing"
      : time.sub;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144"><defs><radialGradient id="bg"><stop stop-color="#1b2335"/><stop offset="1" stop-color="#0c111d"/></radialGradient></defs><rect width="144" height="144" rx="16" fill="url(#bg)"/><g font-family="Arial, Helvetica, sans-serif" text-anchor="middle"><text x="72" y="28" font-size="21" font-weight="700" fill="${color}">${"Week"}</text><text x="72" y="77" font-size="51" font-weight="800" letter-spacing="-2" fill="${valid ? "#f3f8ff" : "#91a1b9"}">${valid ? Math.round(data.remaining) + "%" : "—"}</text><rect x="21" y="87" width="102" height="9" rx="4.5" fill="#303c51"/>${valid && data.remaining > 0 ? `<rect x="21" y="87" width="${Math.max(4, (102 * data.remaining) / 100)}" height="9" rx="4.5" fill="${color}"/>` : ""}<text x="72" y="117" font-size="20" font-weight="700" fill="#e5edf8">${time.main}</text><text x="72" y="135" font-size="13" font-weight="600" fill="${stale || expired ? "#ffcf65" : "#aab9d0"}">${foot}</text></g></svg>`;
}
module.exports = { render, settings, defaults, colorFor, countdown };
