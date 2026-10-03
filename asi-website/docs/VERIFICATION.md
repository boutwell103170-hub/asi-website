# Verification of recovered repair candidate

Run on 2026-10-03 UTC from repository root:

- `python asi-website/tests/check_site.py`: PASS, 12 pages, required dependencies, local href/src/CSS URLs, fragments, sitemap, manifest and preview gates.
- `node --test asi-website/tests/*.test.cjs`: PASS, 13 deterministic tests. Sandbox/no send; missing configuration; cross-origin/non-HTTPS rejection; HTTP, invalid JSON, negative or absent receipt; network error; explicit confirmed receipt; timeout/abort; sandbox UI retention; negative result UI; denied storage after acceptance; duplicate-click suppression.
- `python asi-website/tests/check_artifact.py`: PASS, 23 public files source/artifact SHA-256 match, non-public files excluded, nested CI/deployment paths checked, production build fails closed.
- `node --check` on all nonempty inline JavaScript in index.html and quote.html: PASS.
- `git diff --check`: PASS.

Source-level independent review found and prompted additional accessibility/failure-language repairs. Rendered browser acceptance and screenshots could not be completed: local cloud-browser navigation returned ERR_BLOCKED_BY_CLIENT. No alternative port/hostname workaround was used. Responsiveness, visual fidelity, actual keyboard focus and navigation history still require rendered QA. Tests here use controlled VM mocks, not a real backend or delivery claim.

The test runs performed no live form submissions, hosting deployment or DNS edits. No secrets or customer information were used in tests. Public website availability, production response headers, current hosting origin and backend delivery remain unverified. Production launch remains blocked by LAUNCH_GATES.md.

Final source-level follow-ups add keyboard-native service toggle buttons, focus-within capabilities menu, and invalid-field focus after restoring a hidden step. The process/resource placeholder CTAs remain explicit content gates. Rendered results are still unverified.

Navigation tests cover accordion initial ARIA state, click and Escape/focus, dropdown click/ArrowDown/Escape/focusout and pointer state. Four unfinished CTAs are disabled in the preview with content-pending labels; they no longer navigate to dead anchors.

Current hosting directly serves `asi-website/site` from `main` with Auto Deploy ON and no build command. Therefore the production-script refusal is NOT a live-host release control. Do not merge or push to main without separate production approval; see LAUNCH_GATES.md.

## Details-only final offline pass (2026-10-03)

`node --test asi-website/tests/*.test.cjs`: 37 tests pass, including real multipart serialization through adapter and handler with an injected synthetic transport and no network. Coverage includes schema/consent/enum/CRLF tampering, any-file rejection, malformed multipart/JSON, declared/chunked body limits, bound token hash/expiry, duplicate/concurrent/conflicting identity, provider timeout/fake acceptance, simulated restart/idempotency, hung limiter/store deadlines, receipt identity matching and safe visible recovery references. Existing navigation/quote tests remain covered.

This verifies only bounded offline behavior. No real email provider, credentials, live limiter, recipient delivery, hosting route or rendered browser outcome was exercised. Production provider capabilities are explicit required assertions to verify during approved integration, not evidence supplied by these tests.

The review candidate is based directly on the original repository baseline. Public content includes code, tests and engineering documentation only; recipient configuration remains server-side and absent from the repository.

## Disabled provider/runtime implementation pass

The suite now includes 49 passing offline tests. Added official-API request formatting, deterministic plain-text renderer and reply routing, redacted provider errors, bounded response parsing/timeouts, missing-approval/configuration rejection, bounded single-instance quotas, operator identification, safe proposed routing and runtime-to-provider fake integration. No real network email calls were made. `npm ci --ignore-scripts --offline` succeeded with zero dependencies; local Node24 reports the expected engine warning because the proposed hosting engine is Node22. CI checks both Node22 and Node24; its result must be verified for the published candidate. The provider remains disabled and the proposed app fragment is unapplied.
