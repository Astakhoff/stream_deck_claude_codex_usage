# Contributing

Use English for documentation, code comments, interface text, issues, and pull requests. The product is English-only: do not add language selectors or locale-dependent interface text. Format user-visible dates and times explicitly with `en-US`, while retaining the user’s system timezone.

## Setup and validation

```sh
npm ci
npm run setup
npm test
npm run validate
npm run pack
```

Unit tests use synthetic data and do not read Keychain or call Anthropic. `npm run check:live` is a separate, explicit diagnostic command that accesses the local desktop login and prints sanitized usage data.

## Layout

- `com.local.claude-desktop-week.sdPlugin/bin/desktop.js`: Claude credential reader and usage fetch.
- `com.local.claude-desktop-week.sdPlugin/bin/codex.js`: Codex local login reader, usage/reset fetches, and parsers.
- `com.local.claude-desktop-week.sdPlugin/bin/poller.js`: per-provider scheduling and retained-reading isolation.
- `com.local.claude-desktop-week.sdPlugin/bin/countdown.js`: dedicated days/hours countdown renderer.
- `com.local.claude-desktop-week.sdPlugin/bin/render.js`: weekly button and color rules.
- `com.local.claude-desktop-week.sdPlugin/bin/resets.js`: reset inventory parsing and rendering.
- `com.local.claude-desktop-week.sdPlugin/bin/plugin.js`: Stream Deck protocol and shared polling.
- `com.local.claude-desktop-week.sdPlugin/ui/`: English property inspectors.
- `com.local.claude-desktop-week.sdPlugin/tests/`: offline regression tests.
- `scripts/package.mjs`: installer and ZIP packaging.

Keep the plugin/action UUIDs stable. Update both package manifests, lockfiles, the Stream Deck version, and CHANGELOG.md when releasing. Run tests before packaging. Never include `status.json`, credentials, personal profiles, or local app-inspection files.

## Scope

The current implementation supports Claude Desktop and file-backed Codex ChatGPT logins on macOS. Keep provider credentials, polling state, errors, and retained readings isolated. Never send one provider’s credentials to another service. Preserve the existing plugin folder and UUID for upgrades, even though the public display name now covers both providers.
