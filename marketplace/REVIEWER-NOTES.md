# Reviewer notes

## Product and distribution

- Product: Claude & Codex Weekly Usage
- Maker: Astakhoff
- Pricing: Free; no external payment or plugin subscription.
- Platform: macOS 13+; Stream Deck 6.9+; keypad actions.
- Marketplace UUID: `com.astakhoff.claude-codex-weekly-usage`.
- Historical direct-distribution UUID: `com.local.claude-desktop-week`.
- Both packages share the same polling, rendering, and action logic. Marketplace uses the official @elgato/streamdeck v2 transport, SDKVersion 3, and a minimum Stream Deck version of 6.9 for DRM compatibility. The direct installer retains the raw WebSocket transport and Stream Deck 6.6 minimum. Marketplace uses an author-qualified UUID. Existing direct-distribution installations retain their identity; switching channels requires adding the Marketplace actions to the profile. The two channels may coexist and poll separately.

## Setup and verification

Use a reviewer-owned eligible Claude subscription in Claude Desktop, and/or a Codex ChatGPT login stored in `~/.codex/auth.json` (`CODEX_HOME` is respected). File-backed subscription credentials are required for Codex; API-key-only and Keychain-only login storage are not supported. Each provider works independently. Add its weekly percentage, saved resets, and countdown actions. macOS may prompt for Claude Keychain access.

1. Verify weekly percentage and reset time against the provider account's usage page.
2. Press the percentage key twice. Number and bar invert between Remaining and Used and return to the original mode. Warning colors stay tied to remaining capacity. Reopen the settings inspector to verify the saved mode.
3. Confirm the reset key shows the saved count and earliest expiry, or confirmed `none`. Unknown inventory is not presented as zero. This is a monitor and cannot redeem a reset.
4. Confirm the dedicated countdown shows days/hours on one line and the local reset weekday/time below.
5. Leave an action visible for a minute to observe polling. Failed requests retain the last valid reading until the period expires; update diagnostics are in the property inspector. Rate limits apply provider-specific retry delays.

## Authentication and privacy

Claude credentials come from the installed Desktop application's encrypted OAuth cache and macOS Keychain. Codex credentials come from the existing file-backed ChatGPT login. They are used for read-only GET requests to each corresponding provider's internal usage/reset endpoints. There is no developer-operated backend. Credentials are not logged or written by the plugin. No chat history or prompts are requested. A local diagnostic snapshot stores sanitized usage/reset fields. See the linked privacy policy and source.

These are internal service interfaces, not an official Anthropic/OpenAI integration. Authentication or schema changes can interrupt readings; the listing discloses this limitation.

## AI assistance

AI assistance was substantial: Codex generated and modified implementation, tests, documentation and artwork. The human creator supplied requirements and references, directed iterations and evaluated the plugin on his Stream Deck. See AI-DISCLOSURE.md. We request review on that disclosed basis and do not assert that the code was independently human-audited.

## Media and demonstration

Listing artwork depicts the real renderers using clearly marked illustrative sample data. It is not evidence of a live authenticated session. A demonstration of paid-service integration may be requested or required during review; the three submitted gallery images are illustrations, not a recorded interaction demo. Do not label illustrative media as live verification. No account credentials are supplied with the package.
