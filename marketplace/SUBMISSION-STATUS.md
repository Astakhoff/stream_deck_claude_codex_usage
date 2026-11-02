# Submission status

Last checked: November 2, 2026 (Asia/Dubai).

## Outcome

**Submitted for review. Version 1.8 is Pending review.** The product remains Draft until approved and released. Automatic publication after approval is disabled.

Maker Console: https://maker.elgato.com/4dc83d09-8587-4d82-a9fa-c91dd0f77e9c/products/bdbcb035-2491-4797-bccd-6b6d898301a6

No public Marketplace product URL is available yet.

## Completed stages

1. **Maker setup:** Astakhoff / @astakhoff, United Arab Emirates. The account owner personally accepted the Maker Agreement. Stripe was skipped for the free product.
2. **Package readiness:** Built version 1.8.0.0 with the author-qualified UUID. Maker Console accepted SDK 3, Stream Deck 6.9+, and DRM readiness. The local direct-install channel retains its original UUID.
3. **Listing:** English only, Monitoring category, Free pricing. The description discloses local login access, service limitations, supported platform, substantial Codex assistance, and independent community status.
4. **Links:** Privacy policy, installation guide, support issues, and open-source repository linked.
5. **Media:** Uploaded the 288 × 288 app icon, 1920 × 960 cover, and three 1920 × 960 gallery illustrations. Sample data is clearly labeled.
6. **Release:** Added release notes and a link to detailed AI disclosure/reviewer notes; submitted with automatic publication disabled.
7. **Protected-package check:** Downloaded the processed DRM package from Maker Console and reran the real-SDK loopback test against its extracted entry point. Registration, key rendering, Remaining / Used persistence, and inspector routing pass with synthetic data. This is not an on-device test of the protected installation.
8. **Validation:** 51 tests pass, including a loopback integration test of the real official SDK. Runtime npm audit reports zero vulnerabilities. Both direct and Marketplace packages pass Elgato validation/packaging. CI passed for the implementation commit.

## Remaining external stages

- Elgato moderation and any requested changes.
- Perform an on-device smoke test of the protected installation before the final public release. The downloaded processed package has passed the loopback SDK integration test.
- The real interaction video has been recorded and uploaded as supplemental gallery media. It shows the live Stream Deck display responding to physical key presses for both providers. See REVIEWER-NOTES.md for capture details and the distinction between the direct and Marketplace builds.
- After approval and protected-package verification, manually release the approved version to make it public.

## Evidence

The local output folder contains the submitted materials, installer checksum, and a screenshot of the Pending review status. Account credentials, account-profile screenshots, and personal Stream Deck profiles are not published in this repository.

## Listing clarification

The saved Marketplace description now begins with "Weekly limits only" and explicitly excludes hourly, 5-hour session, daily, and other short-window usage limits. It explains that days/hours are a countdown to the weekly reset.
