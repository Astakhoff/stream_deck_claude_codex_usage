# Architecture and privacy

## Claude data flow

1. Stream Deck launches `bin/plugin.js` using its Node.js 20 runtime.
2. The plugin registers with Stream Deck over a loopback WebSocket on the port supplied by the host.
3. `bin/desktop.js` reads the standard `~/Library/Application Support/Claude/config.json` file and its encrypted `oauth:tokenCacheV2` entry.
4. macOS `security find-generic-password` reads **Claude Safe Storage** from Keychain. Its output is held in memory, used to derive the cache decryption key, and never logged or written to disk.
5. A valid OAuth credential is selected for `lastKnownAccountUuid`. The Code-compatible client already cached by Desktop is preferred because the reset inventory is surface-gated. The least-scoped token for that client is selected. Multiple organizations cause an explicit error.
6. A read-only request fetches usage and the optional `cedar_ember` reset inventory. Credentials are sent only to Anthropic over HTTPS. Redirects are rejected.
7. The parsers retain only display data. Redemption handles are not retained. SVG images are sent to Stream Deck and the property inspector.

The client ID in the source is a public OAuth application identifier, not a credential. The compatibility User-Agent corresponds to the Claude Code version bundled with the tested Claude Desktop release. These values and the endpoint are internal compatibility details, not a stable public API contract.

## Scheduling

Each provider has independent in-flight state, retained readings, and a minimum 60-second interval after completion. Visible keys for the same provider share that provider’s poll. Claude uses one request; Codex fetches usage and reset inventory in parallel using two read-only requests. A second key does not duplicate requests. An error or retry delay for one provider does not block the other. No request is made for a provider with no visible actions.

Network requests time out after 15 seconds. Keychain operations time out after 20 seconds. HTTP 429 uses Retry-After with a delay clamped between one minute and one hour; an absent or invalid value defaults to five minutes.

## Codex data flow

`bin/codex.js` reads `auth.json` from `CODEX_HOME` or the default `~/.codex` directory. Only a file-backed ChatGPT login with an access token and account ID is accepted. API-key-only and OS-credential-store-only logins are unsupported. Codex remains responsible for token renewal.

The access token and `ChatGPT-Account-Id` header are sent only to these fixed HTTPS routes:

- `GET https://chatgpt.com/backend-api/wham/usage`
- `GET https://chatgpt.com/backend-api/wham/rate-limit-reset-credits`

Redirects are rejected and each request has a 15-second timeout. No redemption endpoint is called. The weekly window is selected by its seven-day duration, whether primary or secondary. A short window or an unrelated additional limit is never substituted for the weekly limit.

Reset inventory uses `available_count`, not `applicable_available_count`: a saved reset still counts when it cannot be applied to the current usage state. Available, plan-supported credits supply expiry dates. Expired credits are removed, duplicate IDs are deduplicated, and a count not fully described by the detailed list retains its remainder without inventing an expiry date. IDs and profile fields are discarded after parsing.

Usage and reset failures are independent. The last good reading for the affected part is retained with its original timestamp and update diagnostics in the property inspector. A changed local account cannot inherit the previous account's retained reading; authentication failures clear affected retained data. A process-only account fingerprint is not included in diagnostics or inspector messages.

## Claude reset semantics

The saved count sums `resets_left`, deduplicates IDs, and excludes paused, future, exhausted, and expired grants. A false `usable_now` does not erase an otherwise saved credit: redemption may require reaching a limit. The key displays the earliest expiry in the system timezone. Expired grants are also removed during rendering between network reads.

An eligible empty inventory or explicit `no_grant` is a known zero. An absent block, unsupported surface, or malformed inventory is unknown, not zero. Weekly data and reset inventory are parsed independently so an unavailable weekly period need not hide a valid reset inventory.

## Files and permissions

- **Reads:** Claude Desktop's standard configuration and the Claude Safe Storage Keychain item; Codex's local `auth.json`.
- **Writes:** `status.json` inside the installed plugin directory, containing display data and polling state only.
- **Network:** authenticated GET to the fixed Anthropic and OpenAI usage/reset routes described above; loopback WebSocket to Stream Deck. Credentials stay within their provider.
- **Does not:** redeem resets, submit prompts, write credentials, use refresh tokens, change either provider's configuration, or contact a project-owned analytics/backend service.

Each provider application remains responsible for renewing its login. The plugin rereads the cache on each network poll. It does not maintain a separate token store. The decryption key is retained in process memory until the process exits.

## Compatibility boundary

The current cache reader supports Electron's macOS `v10` encrypted payload using AES-128-CBC and the standard Keychain-derived key. A format change produces `Update needed`. New endpoint schemas can require parser changes. Codex currently supports file-backed ChatGPT authentication only. This project currently supports only macOS and the default Claude Desktop profile location.
