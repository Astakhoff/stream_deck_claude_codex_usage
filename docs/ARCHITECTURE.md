# Architecture and privacy

## Data flow

1. Stream Deck launches `bin/plugin.js` using its Node.js 20 runtime.
2. The plugin registers with Stream Deck over a loopback WebSocket on the port supplied by the host.
3. `bin/desktop.js` reads the standard `~/Library/Application Support/Claude/config.json` file and its encrypted `oauth:tokenCacheV2` entry.
4. macOS `security find-generic-password` reads **Claude Safe Storage** from Keychain. Its output is held in memory, used to derive the cache decryption key, and never logged or written to disk.
5. A valid OAuth credential is selected for `lastKnownAccountUuid`. The Code-compatible client already cached by Desktop is preferred because the reset inventory is surface-gated. The least-scoped token for that client is selected. Multiple organizations cause an explicit error.
6. A read-only request fetches usage and the optional `cedar_ember` reset inventory. Credentials are sent only to Anthropic over HTTPS. Redirects are rejected.
7. The parsers retain only display data. Redemption handles are not retained. SVG images are sent to Stream Deck and the property inspector.

The client ID in the source is a public OAuth application identifier, not a credential. The compatibility User-Agent corresponds to the Claude Code version bundled with the tested Claude Desktop release. These values and the endpoint are internal compatibility details, not a stable public API contract.

## Scheduling

Visible keys share a single in-flight request and a minimum 60-second interval after completion. A second key does not create a second poll. No request is made while neither action is visible. A successful response updates both displays.

Network requests time out after 15 seconds. Keychain operations time out after 20 seconds. HTTP 429 uses Retry-After with a delay clamped between one minute and one hour; an absent or invalid value defaults to five minutes.

## Reset semantics

The saved count sums `resets_left`, deduplicates IDs, and excludes paused, future, exhausted, and expired grants. A false `usable_now` does not erase an otherwise saved credit: redemption may require reaching a limit. The key displays the earliest expiry in the system timezone. Expired grants are also removed during rendering between network reads.

An eligible empty inventory or explicit `no_grant` is a known zero. An absent block, unsupported surface, or malformed inventory is unknown, not zero. Weekly data and reset inventory are parsed independently so an unavailable weekly period need not hide a valid reset inventory.

## Files and permissions

- **Reads:** Claude Desktop's standard configuration and the Claude Safe Storage Keychain item.
- **Writes:** `status.json` inside the installed plugin directory, containing display data and polling state only.
- **Network:** authenticated GET to `https://api.anthropic.com/api/oauth/usage?cedar_ember=1`; loopback WebSocket to Stream Deck.
- **Does not:** redeem resets, submit prompts, write credentials, use refresh tokens, change Claude's configuration, or contact a project-owned analytics/backend service.

Desktop remains responsible for renewing its login. The plugin rereads the cache on each network poll. It does not maintain a separate token store. The decryption key is retained in process memory until the process exits.

## Compatibility boundary

The current cache reader supports Electron's macOS `v10` encrypted payload using AES-128-CBC and the standard Keychain-derived key. A format change produces `Update needed`. A new endpoint schema can require parser changes. This project currently supports only macOS and the default Claude Desktop profile location.
