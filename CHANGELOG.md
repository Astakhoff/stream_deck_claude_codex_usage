# Changelog

## 1.7.0 — 2026-11-02

- Press a percentage key to toggle Remaining / Used instantly.
- Save the mode separately for each key and synchronize the settings selector.
- Toggle using cached usage without an additional network request.

## 1.6.4 — 2026-11-02

- Show days and hours together on one line on dedicated countdown keys.
- Enlarge the reset weekday and local time at the bottom.

## 1.6.3 — 2026-11-02

- Remove stale labels from percentage, reset, and countdown keys.
- Keep last-reading and update diagnostics in action settings.

## 1.6.2 — 2026-11-02

- Enlarge the days/hours countdown below the percentage bar.

## 1.6.1 — 2026-11-02

- Remove Claude / Codex footers from weekly countdown keys.
- Space the days, hours, and exact reset time evenly within the key.

## 1.6.0 — 2026-11-02

- Use a single live days/hours countdown, such as 6d 13h, on percentage keys.
- Show exact reset weekday and local 24-hour time on dedicated Weekly countdown keys.
- Retain provider labels and English-only formatting.

## 1.5.0 — 2026-11-02

- Add a per-key Remaining / Used display setting for Claude and Codex percentage actions.
- Keep the percentage and progress bar in sync with the selected mode, including empty and full states.
- Keep warning colors based on remaining capacity in both modes.
- Preserve Remaining as the default for existing installations.

## 1.4.0 — 2026-11-02

- Add separate Claude and Codex weekly countdown actions: Week heading, large days/hours, and provider footer.
- Reuse existing provider polls without extra network requests.
- Handle the last partial hour, elapsed deadlines, and stale data explicitly.

## 1.3.1 — 2026-11-02

- Rename the plugin and action category to Claude & Codex Weekly Usage.
- Add an original AI/key/usage-bar logo and matching monochrome calendar and reset action icons.
- Export transparent category icons at 28/56 px and action icons at 20/40 px.
- Keep all plugin and action UUIDs unchanged for existing installations.
- Enforce English-only interface and date formatting; remove legacy language settings.

## 1.3.0 — 2026-11-02

- Add Codex weekly remaining capacity and saved reset inventory using the existing local ChatGPT login.
- Add independent provider polling, per-resource error handling, and account-isolated retained readings.
- Reuse the visual style and color controls across all four actions.
- Update English documentation, privacy notes, offline tests, and release packages for both providers.

## 1.2.0 — 2026-11-02

- Initial public release with English documentation and property inspectors.
- Claude weekly remaining-capacity key with configurable thresholds and colors.
- Saved reset inventory and earliest expiry key, including explicit `none` and unavailable states.
- Shared one-minute read-only polling through the installed Claude Desktop login.
- Offline tests, reproducible packaging, and installation instructions.

## 1.1.0

- Local saved reset action added alongside weekly remaining capacity.

## 1.0.0

- Initial local weekly usage monitor.
