# Privacy policy

Effective date: November 2, 2026

Claude & Codex Weekly Usage is a free, open-source Stream Deck plugin maintained by Astakhoff. It reads usage and saved-reset information for the account already signed in on your own Mac.

## Local access and purpose

When a provider's action is visible, the plugin reads that provider's existing local login to request your own weekly usage and saved-reset inventory. Claude uses its Desktop configuration and macOS Keychain; Codex uses its local file-backed ChatGPT login. Access tokens and, for Codex, the account ID are used only to authenticate requests to the corresponding provider. The Claude cache is decrypted in process memory using the existing Keychain entry. macOS may ask you to authorize Keychain access.

Credentials are never sent to the developer or shared between providers. The plugin does not request chat messages, prompts, conversation history, generated files, or billing records. It does not refresh tokens, modify your login, purchase credits, or redeem resets.

## Network destinations

The plugin sends authenticated, read-only HTTPS GET requests to `api.anthropic.com` for Claude and `chatgpt.com` for Codex. These providers receive normal network information, such as your IP address, and handle requests under their own policies. Stream Deck communicates with the plugin over a local WebSocket connection. The plugin has no developer-operated server, analytics, advertising, or telemetry.

## Local storage

Access tokens, refresh tokens, Keychain passwords, and account fingerprints are not written to plugin settings or diagnostic files. Display preferences are stored by Stream Deck. A local `status.json` in the installed plugin folder contains sanitized usage percentages, reset times and counts, timestamps, and error codes. This file is overwritten by subsequent updates; it is not an account-history database and is never uploaded automatically. Such activity information may be personal to you, so review it before sharing.

## Your controls

Remove all actions for a provider, or disable/uninstall the plugin, to stop that provider's polling. Quit Stream Deck and delete the plugin's local `status.json` to remove its diagnostic snapshot. Stream Deck manages its own settings and backups. Signing out of Claude or Codex is managed in those applications. The developer holds no server-side usage or credential records to delete.

## Support

Support is available at https://github.com/Astakhoff/stream_deck_claude_codex_usage/issues. Do not post credentials, account identifiers, raw login files, Keychain contents, or personal profiles. Information you voluntarily post to GitHub is handled by GitHub under its policies. For a sensitive issue, follow the repository's SECURITY.md instructions to arrange a private contact channel.

## Changes

Changes to data access or processing will be documented in this policy and release notes. This policy describes the plugin; Elgato Marketplace, GitHub, Anthropic, and OpenAI operate their own services and privacy policies.
