# Installation guide

## 1. Install Stream Deck

1. Open [Elgato's official downloads page](https://www.elgato.com/us/en/s/downloads).
2. Select **Stream Deck** and choose the installer for your operating system. This plugin currently supports **macOS only**.
3. Download and run the installer. Follow the on-screen instructions, then open the Stream Deck app from Applications.
4. Connect your Stream Deck to a USB port on your Mac. Select it in the device menu at the top of the app.
5. Check that the app displays the device's key grid. You can test the setup by dragging a built-in action onto a key.

Elgato's [official quick start guide](https://www.elgato.com/us/en/explorer/products/stream-deck/elgato-stream-deck-quick-start-guide/) covers app installation, USB connection, and assigning actions. Check the [current Stream Deck system requirements](https://help.elgato.com/hc/en-us/articles/34512594204049-Elgato-Stream-Deck-Software-System-Requirements) before installing the latest app on an older Mac.

## 2. Prepare your provider logins

### Claude Desktop

1. Download Claude Desktop from [Claude's official download page](https://claude.ai/download).
2. Install it in Applications and sign in to the account whose limits you want to monitor.
3. Open Claude Desktop at least once and confirm that usage information is available for that account.

The plugin uses the existing desktop login. No session key, API key, or separate terminal login is required. If the required OAuth cache is not present, the plugin displays `Open Claude`; it cannot create the cache by itself.

### Codex

1. Open Codex and sign in with **ChatGPT**, using the account whose limits you want to monitor. An OpenAI API key does not provide subscription usage or saved reset inventory.
2. This reader uses the existing `~/.codex/auth.json` file. If `CODEX_HOME` is set in the environment that launches Stream Deck, it reads `CODEX_HOME/auth.json` instead.
3. Keep the login managed by Codex. The plugin rereads the file on each poll and never refreshes or writes the token itself. No token needs to be pasted into Stream Deck.

If your Codex installation stores credentials only in the OS credential store, this reader currently displays `Open Codex`; Keychain-only Codex login is not implemented. See OpenAI's [authentication documentation](https://learn.chatgpt.com/docs/auth) for credential-store choices. Do not publish or share `auth.json`.

You can use either provider independently; a missing Claude login does not prevent the Codex keys from working.

## 3. Install the plugin

### Recommended: release installer

1. Open [Releases](https://github.com/Astakhoff/stream_deck_claude_codex_usage/releases/latest).
2. Download the file ending in `.streamDeckPlugin`.
3. Open the file with the Stream Deck app and follow its installation prompts.
4. Search for **Claude & Codex Weekly Usage** in the actions list.
5. Drag the **Claude weekly remaining / Claude saved resets** and/or **Codex weekly remaining / Codex saved resets** actions onto empty keys.
6. Wait for the first reading. If macOS requests access to **Claude Safe Storage**, review and approve the request if you trust the plugin.

The installer does not contain account data. Access to your own Claude login happens locally after installation.

### Alternative: release ZIP

1. Download the ZIP asset from the same release and extract it.
2. Quit Stream Deck completely using **Stream Deck → Quit Stream Deck**.
3. In Finder, choose **Go → Go to Folder** and enter:

   ```text
   ~/Library/Application Support/com.elgato.StreamDeck/Plugins/
   ```

4. Copy `com.local.claude-desktop-week.sdPlugin` from the extracted archive into that directory. For an update, back up the old folder first, then replace it with the new folder. Do not rename the plugin folder.
5. Reopen Stream Deck and assign the actions as above.

Do not copy a bare GitHub source archive directly into the Plugins directory: it does not include runtime dependencies.

### Build from source

Install Node.js 20+ and npm, then run:

```sh
git clone https://github.com/Astakhoff/stream_deck_claude_codex_usage.git
cd stream_deck_claude_codex_usage
npm ci
npm run setup
npm test
npm run pack
```

Install the generated file in `dist/` using either method above.

## 4. Configure the keys

Select a key in Stream Deck to view its settings below the key grid.

- **Weekly remaining:** change yellow, red, and critical thresholds and the four colors. Thresholds always refer to remaining capacity.
- **Saved resets:** change the expiry text color. The settings panel lists each counted grant and its expiry.
- **Check now:** requests a reading when the shared one-minute interval allows it. It respects server retry delays.

Keys share polling within each provider. Claude makes one request per poll; Codex makes one usage request and one reset-inventory request. The providers have independent cooldowns and error states. An inactive provider is not polled. The bottom `HH:MM` on the weekly key is the remainder after full days; it is not a clock time.

## Updating

Install the newer release package over the same plugin UUID. The action UUIDs are kept stable so existing key assignments can continue to work. For manual updates, quit Stream Deck, back up the installed plugin folder, and replace it with the new release folder. Keep your Stream Deck profile backups separately.

If an update fails, quit Stream Deck and restore the previous plugin folder or reinstall the previous release.

## Removing

Remove the plugin through Stream Deck's plugin management, or quit Stream Deck and move `com.local.claude-desktop-week.sdPlugin` out of the Plugins directory. Reopen Stream Deck. Removing the plugin does not sign you out of Claude.

## Troubleshooting

| Display / symptom                 | What to do                                                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `Open Codex`                      | Open Codex and check the ChatGPT login and local auth file. API-key-only and Keychain-only login are unsupported.     |
| `Open Claude`                     | Open Claude Desktop and check its sign-in. The plugin never refreshes or replaces desktop credentials itself.         |
| `Keychain`                        | Check the macOS access request for Claude Safe Storage. Access denied or a timeout causes a retry after five minutes. |
| `Multi org`                       | The cache contains multiple organizations for the active account. Automatic selection is deliberately unsupported.    |
| `Update needed`                   | The desktop cache format may have changed. Check releases or open an issue with the app versions.                     |
| `No data` on resets               | The server did not provide a supported reset inventory. This is different from having no resets.                      |
| `none` on resets                  | The server confirmed no saved resets, or all returned grants are expired, paused, future, or exhausted.               |
| `STALE`                           | The most recent request failed or the last reading is over 150 seconds old. Check the connection and wait for retry.  |
| `Retry later`                     | The endpoint returned HTTP 429; the plugin honors Retry-After with a bounded delay.                                   |
| Plugin missing                    | Reopen Stream Deck; check that the folder name ends in `.sdPlugin` and that release dependencies are included.        |
| Old percentage after weekly reset | The old percentage is hidden until a valid new period arrives; wait for the next successful refresh.                  |

For local diagnosis, the installed plugin may contain `status.json`. It includes usage and timestamps, not credentials. Review it before sharing. Never upload Codex's `auth.json`, Claude's `config.json`, Keychain exports, tokens, or personal Stream Deck profile backups to an issue.
