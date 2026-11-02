# Stream Deck Claude / Codex Usage

A small, local Stream Deck plugin for checking AI subscription capacity without copying session keys.

**Current release: Claude Desktop on macOS.** Two actions are implemented: **Weekly remaining** and **Saved resets**. Codex is not implemented in this repository yet. Existing third-party Codex plugins are not bundled.

![Weekly remaining capacity examples](docs/images/claude-week-preview.png)
![Saved reset examples](docs/images/claude-resets-preview.png)

The previews use example values and dates, not a real account snapshot.

## Features

- Remaining weekly capacity as a large percentage, progress bar, and countdown.
- Saved reset inventory as `R1`, `R2`, `R3`, etc., with the earliest expiry date.
- `none` when the server confirms there are no saved resets.
- Configurable remaining-capacity thresholds and colors.
- One shared usage request every 60 seconds while either action is visible.
- Automatic use of the existing Claude Desktop login on the same Mac.
- Explicit unavailable/stale states instead of treating errors as zero resets.
- Read-only monitoring: pressing a key checks usage; it does not redeem a reset.

## Install

1. [Install and connect Stream Deck](docs/INSTALLATION.md#1-install-stream-deck).
2. Install Claude Desktop and sign in to your subscription account.
3. Download the `.streamDeckPlugin` installer from the [latest release](https://github.com/Astakhoff/stream_deck_claude_codex_usage/releases/latest) and open it with Stream Deck.
4. In Stream Deck, find **Claude Desktop** and drag **Weekly remaining** and **Saved resets** onto two keys.
5. If macOS asks for access to **Claude Safe Storage**, review the request and allow access if you trust this plugin.

For a manual installation, source checkout, updates, removal, and troubleshooting, see the [installation guide](docs/INSTALLATION.md).

## Requirements and compatibility

| Component        | Support                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| Operating system | macOS 13 or later; the installed Stream Deck version may require a newer OS                        |
| Stream Deck app  | Manifest minimum 6.6; tested with 7.4.2                                                            |
| Claude Desktop   | Standard macOS installation and signed-in account; tested with 4.4212.0                            |
| Node runtime     | Node.js 20 supplied by Stream Deck; users do not need a separate Node install for release packages |
| Devices          | Keypad actions; tested on Stream Deck XL                                                           |
| Windows / Linux  | Not implemented                                                                                    |
| Codex            | Not implemented                                                                                    |

Claude Desktop's credential cache and Anthropic's usage endpoint are internal interfaces. Future updates may require changes to this plugin. Multiple organizations are currently reported as `Multi org` rather than silently choosing one.

## Reading the keys

### Weekly remaining

`37%` means **37% left**, not 37% used. `4 days` with `11:08` underneath means four full days, eleven hours, and eight minutes until the weekly reset. The countdown uses the reset timestamp returned by the server.

| Remaining capacity | Default color |
| ------------------ | ------------- |
| Above 50%          | Green         |
| 50% or less        | Yellow        |
| 20% or less        | Red           |
| 10% or less        | Critical red  |

Select the key in Stream Deck to change thresholds and colors. Thresholds must satisfy `100 ≥ yellow > red > critical ≥ 0`.

### Saved resets

`R2` means two saved resets remain. `EXPIRES DEC 2` is the earliest expiry among the counted grants, in the Mac's local timezone. Select the key to see the complete list of expiry dates.

Expired, paused, not-yet-started, and exhausted grants do not count. A saved reset that requires reaching a usage limit before redemption still counts as saved. Unknown or malformed inventory displays `No data`; it never becomes `none` merely because the lookup failed.

## Privacy and authentication

The plugin reads Claude Desktop's encrypted OAuth cache and uses the macOS Keychain to decrypt it in memory. It sends an authenticated `GET` only to `https://api.anthropic.com/api/oauth/usage?cedar_ember=1`. It does not write credentials, use refresh tokens, modify Claude's login, or send data to a project-owned server.

A local `status.json` contains usage and polling state only. It is excluded from Git and distribution packages. See [architecture and privacy details](docs/ARCHITECTURE.md).

## Development

Node.js 20+ and npm are required for development. From the repository root:

```sh
npm ci
npm run setup
npm test
npm run validate
npm run pack
```

The installer is written to `dist/`. The pack command uses Elgato's official Stream Deck CLI. Tests use synthetic credentials and inventories and do not access a live account. A deliberate live check is available with `npm run check:live`; it prints usage data, never tokens.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the project layout and contribution workflow.

## License

[MIT](LICENSE). This is an unofficial community project, not affiliated with Anthropic, OpenAI, or Elgato. Product names belong to their respective owners.
