# Contributing

Use English for documentation, code comments, interface text, issues, and pull requests.

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

- `com.local.claude-desktop-week.sdPlugin/bin/desktop.js`: credential reader and usage fetch.
- `com.local.claude-desktop-week.sdPlugin/bin/render.js`: weekly button and color rules.
- `com.local.claude-desktop-week.sdPlugin/bin/resets.js`: reset inventory parsing and rendering.
- `com.local.claude-desktop-week.sdPlugin/bin/plugin.js`: Stream Deck protocol and shared polling.
- `com.local.claude-desktop-week.sdPlugin/ui/`: English property inspectors.
- `com.local.claude-desktop-week.sdPlugin/tests/`: offline regression tests.
- `scripts/package.mjs`: installer and ZIP packaging.

Keep the plugin/action UUIDs stable. Update both package manifests, lockfiles, the Stream Deck version, and CHANGELOG.md when releasing. Run tests before packaging. Never include `status.json`, credentials, personal profiles, or local app-inspection files.

## Scope

The current implementation supports Claude Desktop on macOS. Codex support is future work and should be introduced with its own data provider, tests, privacy notes, and explicit feature documentation. Do not reuse Claude authentication for another service.
