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

## No-send staging readiness repair (2026-10-04)

Isolated checkout base: `8ed56061cca411a7d057110348ed0807f8d16454`, verified against GitHub draft PR #1 and a direct fetch of `repair/asi-shadow-validation-20261003`. Main was not modified.

- `node --test asi-website/tests/*.test.cjs`: **55/55 pass** on Node 24.14.0, including all 49 existing tests unchanged and six new staging tests. Coverage includes conflicting activation, malformed flags, missing production approvals, unreadable credential getters, zero provider calls, truthful liveness/readiness, intake rejection, full-prefix routes and a real child-process HTTP smoke test with an allowlisted OS environment.
- `python asi-website/tests/check_site.py`: PASS, 12 pages.
- `python asi-website/tests/check_artifact.py`: PASS, 23 public files identical to source; private files excluded; production build blocked.
- Windows Python checks require `$env:PYTHONUTF8='1'` before running the commands (initial system-codepage attempts failed decoding existing UTF-8 HTML). Public checkout bytes were restored from the base commit to avoid Git CRLF conversion; the generated Windows-path BUILD_MANIFEST was restored, not included in this repair.
- `npm --prefix asi-website/backend ci --ignore-scripts --offline`: PASS, no dependencies; expected engine warning because hosting specifies Node 22.x and available local Node is 24.14.0. Independent Linux validation also passed all 55 tests, 12 HTML checks and 23 artifact hashes. Node 22 remains for published CI; actual host execution remains unverified.
- `node --check asi-website/backend/runtime.cjs`, syntax checks of all nonempty inline JavaScript in index.html and quote.html, and `git diff --check`: PASS.

No real provider request, key access, browser interaction, purchase, push, merge, deployment, or live configuration change. The liveness repair is local test evidence only; it does not clear business, delivery, rendered QA or launch gates. Exact unapplied setup is in backend/README.md and deployment/api-proposal.yaml.

## Frontend readiness follow-up (2026-10-04)

Base: published repair commit `de4f48ccc2df31651f1f9bd2e9ba0335826bf350`, fetched into an isolated local branch. Five new tests cover generic HTML 503 at authorization versus quote submission, invalid JSON/HTML success pages, network errors, retry identity retention, and truthful visible recovery messaging. Existing tests were retained.

- `node --test asi-website/tests/*.test.cjs`: **60/60 pass**, Node 24.14.0. The published base's Node 22/24 CI results were previously reported; this new local change has not run in remote CI.
- With Windows `$env:PYTHONUTF8='1'`, `python asi-website/tests/check_site.py`: PASS, 12 pages; `python asi-website/tests/check_artifact.py`: PASS, 23 public source/artifact hashes, private exclusion and production refusal.
- `npm --prefix asi-website/backend ci --ignore-scripts --offline`: PASS, no dependencies; expected Node22 engine warning on local Node24.
- `node --check` on every backend CJS/public JS file and all nonempty inline scripts in index.html and quote.html: PASS. `git diff --check`: PASS.
- BUILD_MANIFEST.json refreshed for the two changed public files, retaining portable forward-slash paths. No visual layout, business claim, backend activation, environment setting, or preview/noindex gate changed.

The repaired frontend is not deployed by changing the API component. Rendered acceptance, exact deployed static revision, host-generated 503 diagnosis and a separately authorized real inbox test remain outside this offline evidence. No account credentials were read, no public endpoint retried, no provider request sent, and no hosting/browser action, publication or merge performed.


### Review correction: validation failures (2026-10-04)

Authorization failure copy is now neutral: it asks the visitor to check the details without calling every failure temporary or implying that waiting fixes an invalid field. A new 422 authorization/UI regression uses an over-limit scope, verifies only the token route was attempted, retains details, and checks that no proxy/server text or duplicate warning is displayed. The full suite now passes **61/61** on Node 24.14.0; the 12-page static check, 23-file artifact comparison/production refusal, public/backend/inline syntax checks, offline install and diff checks also pass. The public release-gate document excludes account-specific billing/credential observations; private review evidence and earlier patches remain outside the repository publication candidate. No activation, sending, publication or deployment occurred.

Rendered QA remains blocked: the cloud browser could not render the loopback preview package (`net::ERR_BLOCKED_BY_CLIENT`). No bypass was attempted. This is not a rendered acceptance pass.
