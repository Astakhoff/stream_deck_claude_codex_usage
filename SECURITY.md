# Security and privacy reporting

Do not publish tokens, Keychain contents, Claude configuration files, Codex auth files, account identifiers, or personal Stream Deck profiles in issues or pull requests.

For a potential credential exposure or another security issue, use GitHub's private vulnerability reporting feature if available on this repository. Otherwise, open a minimal issue asking for a private contact channel, without including exploit details or private data.

This plugin accesses sensitive local OAuth credentials to read account usage. Install a release only if you trust its source. The implementation does not log or persist credentials, refresh tokens, or Keychain passwords. Usage diagnostics can still reveal subscription activity and timestamps; review them before sharing.

The usage endpoint and credential cache are internal interfaces. Schema or authentication changes can interrupt monitoring. The project is provided under the MIT license without a service availability guarantee.

## Build tooling

The release runtime dependency (`ws`) is audited separately from development tooling. At initial publication, npm reported a moderate denial-of-service advisory in the official Elgato CLI's transitive `minimatch` dependency and its dependency chain. The CLI is used locally/CI for validation and packaging of this repository's controlled files; it is not included in plugin installers. Avoid feeding untrusted glob patterns into build tools. Update the pinned CLI when the upstream dependency is fixed.
