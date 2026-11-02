# Marketplace submission

See [submission status](SUBMISSION-STATUS.md) for completed stages, review state, and remaining external steps.

This directory contains the English listing materials for **Claude & Codex Weekly Usage**, published by **Astakhoff** as a free macOS plugin.

## Files

- `description.txt`: public description, including requirements and AI disclosure.
- `release-notes.txt`: first Marketplace release notes.
- `AI-DISCLOSURE.md`: detailed and explicit record of Codex's contribution.
- `REVIEWER-NOTES.md`: setup, verification, authentication, limitations, and distribution details.
- `media/app-icon-288.png`: 288 × 288 Marketplace app icon.
- `media/thumbnail.png`: 1920 × 960 cover.
- `media/gallery-01-remaining-used.png`: 1920 × 960 percentage toggle illustration.
- `media/gallery-02-resets-countdown.png`: 1920 × 960 reset/countdown illustration.
- `media/gallery-03-local-login.png`: 1920 × 960 local-login and requirements illustration.
- `media/source/`: editable vector sources containing the actual plugin key renderings with sample data. Rasterize at their native dimensions when making changes.

## Build and distribution channels

Run `npm ci`, `npm run setup`, `npm test`, and `npm run pack:marketplace` from the repository root. The installer is produced in `dist/marketplace/`.

The Marketplace channel uses `com.astakhoff.claude-codex-weekly-usage`, manifest SDK 3, Stream Deck 6.9+, and the official Elgato Node SDK 2 transport to support Marketplace DRM. The existing direct installer keeps `com.local.claude-desktop-week`, the WebSocket transport, and Stream Deck 6.6+. Their action, renderer, and provider code is shared. The Marketplace builder never renames the existing source plugin or edits the user's Stream Deck profiles.

Switching from GitHub to Marketplace requires adding the Marketplace actions to the profile. Existing direct-distribution keys continue to use the original channel. Avoid leaving duplicate provider actions active across both installations, since separate plugin processes poll independently.

The official SDK requests a Zod version containing an affected v4-mini implementation. The package overrides Zod to 4.6.6. Tests exercise the real official SDK over a loopback connection with synthetic usage and no live credentials.

## Submission stages

1. Create the Maker organization, add GitHub support, and choose the actual region. The owner accepts the Maker Agreement personally. Stripe is unnecessary for this free product.
2. Build the author-qualified Marketplace installer and upload it. Confirm SDK 3, Stream Deck 6.9+, and DRM readiness in Maker Console.
3. Use the exact product name, free pricing, macOS compatibility, public description, and support/setup/privacy/source links. Disclose substantial AI assistance in the public description and supporting notes.
4. Upload the app icon, cover, and three gallery images. All images are illustrative sample data, not live authenticated-session evidence.
5. Supply release notes and requested reviewer details. If the review requires a video of paid-service integration, record a real authenticated demonstration without exposing credentials. Do not substitute an illustration for live verification.
6. Submit for review with automatic publication disabled; record the resulting review status and product link. Approval and publication are separate stages.
7. Download the processed DRM package from Maker Console for compatibility testing where available. A successful pre-upload test is not a protected-package test.

## Public links

- Source: https://github.com/Astakhoff/stream_deck_claude_codex_usage
- Support: https://github.com/Astakhoff/stream_deck_claude_codex_usage/issues
- Setup: https://github.com/Astakhoff/stream_deck_claude_codex_usage/blob/main/docs/INSTALLATION.md
- Privacy: https://github.com/Astakhoff/stream_deck_claude_codex_usage/blob/main/PRIVACY.md
- AI disclosure: https://github.com/Astakhoff/stream_deck_claude_codex_usage/blob/main/marketplace/AI-DISCLOSURE.md

## Official references

- https://docs.elgato.com/maker-console/submitting-products/
- https://docs.elgato.com/maker-console/review-process/
- https://docs.elgato.com/guidelines/products/
- https://docs.elgato.com/guidelines/stream-deck/plugins/
- https://docs.elgato.com/streamdeck/sdk/introduction/distribution/
