# Details-only intake core: offline candidate

No provider is activated and no real email has been sent. `node backend/quote-server.cjs` starts an intentionally unconfigured loopback server; it returns 503 for intake. The public website remains sandbox. This is code and controlled test evidence, not an operating production workflow.

## Contract

- `POST /api/quote/token`: multipart with one `payload` JSON part containing all form fields, submission UUID, explicit consent/version, blank honeypot and `token: ""`. Validates first, then returns a 30-minute signed token binding the UUID, canonical payload hash, issue/expiry times and rendering version.
- `POST /api/quote`: identical multipart with that token. Details only; every file part is rejected with `FILES_DEFERRED`, including unknown field names with filename metadata.
- Confirmed transport acceptance returns `{ "ok": true, "receiptId": "submission UUID", "deliveryStage": "submitted_for_email_delivery" }`. This means the provider accepted the email submission, not inbox arrival or human receipt.
- Body limit 64 KiB enforced incrementally, including chunked requests. Field/enumeration/length/email/consent checks are server-side. Body read deadline 10 seconds; proposed server header/request deadlines 10/15 seconds. Per-process active requests capped at four. Safe logs contain only random request ID, status and code.

## Proposed bounded production strategy, no database requirement

`createHandler` defaults to `strategy: 'provider-bounded'`. A 30-minute browser retry window is shorter than the required provider idempotency retention of at least 24 hours. The provider key is always `asi-quote/<submissionId>` and transport fields/renderVersion remain identical. The browser persists exact details, UUID and token before sending. It never automatically refreshes an attempted token, or creates a new identity for edited details after uncertainty. Expiry requires reconciliation with ASI using the reference. No unlimited exactly-once guarantee is made.

A small process-local cache prevents simultaneous duplicate calls in one process; provider idempotency must protect retries across restarts/replicas. An uncertain response can retry the same key/body while the signed token remains valid. The provider must atomically reject the same key with different content and deduplicate concurrent identical requests. Rendering must be deterministic with fixed sender, recipient and `asi-quote-v1` template; no retry timestamps, random strings or user-selected destination. Old valid tokens must remain supported for their window or fail safely. Provider approval, contract verification and deployment-bound version retention are still missing.

The optional `durable` strategy supports an atomic external receipt-store interface. It is not the recommended minimal launch path and does not provision or require a new database. `MemoryTestStore` and `MemoryTestLimiter` are explicitly test fixtures and cannot satisfy production capability checks.

## Exact dependencies before any production enablement

Provide an approved bootstrap with all of:

1. Fixed `recipient` loaded from server-only deployment configuration `ASI_NOTIFICATION_EMAIL`. The approved value is held outside this public repository. Never accept recipient/sender from a client request. Validate the sender separately with the chosen provider.
2. Exact HTTPS `origin`, a securely provisioned token-signing secret of at least 32 characters, and verified same-origin routing for both `/api/quote` and `/api/quote/token`. No secret value belongs in this repository or public artifact.
3. Approved `transport.submit({recipient, fields, idempotencyKey, renderVersion, signal})`. It must respect cancellation, return only confirmed `{accepted: true, providerMessageId}`, use HTTPS, fixed verified sender and validated Reply-To, enforce deterministic rendering and reject key/body conflicts. Production also requires `authorized: true`, `idempotencyWindowMs >= 86400000`, and `renderVersion: 'asi-quote-v1'`. These capability declarations are integration prerequisites, not verification in themselves. No Resend or other provider implementation/key is enabled here.
4. Verified `limiter.consume({ipKey, kind, submissionId?}) -> boolean`, with `shared: true` after operational validation. It must enforce per-client burst/sustained limits, global capacity and daily delivery quota for `kind: 'delivery'`, plus token/intake request limits. An approved edge service may supply enforcement; this interface does not mandate a database. Proxy headers are ignored until actual ingress identity semantics are verified. An unverified single-process counter is not production protection.
5. Host-level request/header deadlines and ingress limits, monitoring ownership, provider quota/bounce handling, privacy/retention approval and an authorized synthetic staging delivery actually observed in the intended inbox.

Default missing dependencies fail closed. The bootstrap wiring and provider/rate integration remain deliberately absent pending approval. No purchase, persistent access grant, sender-DNS change, host configuration or deployment is implied by implementing this core.

## Tests

From repository root: `node --test asi-website/tests/*.test.cjs`. Tests inject synthetic transport and fixture state; an adapter-to-handler test uses real FormData serialization but no network. Static build excludes this entire backend directory and all environment configuration.

### Guarantee boundary and dependency timeouts

No durable historical tombstones exist in provider-bounded mode. A deliberately new authorization request can mint a new token for an old ID; after provider retention ends, the server cannot prove historical non-delivery. The guarantee is bounded to the signed retry window and verified provider retention, plus the supplied client’s no-auto-renewal behavior. It is not global or indefinite exactly-once delivery. Operators must reconcile expired/uncertain references before instructing a new submission.

Limiter and durable-store calls have two-second deadlines; provider submission has an eight-second deadline. Deadline expiry releases per-process active slots and yields no success. External operations may finish late, so durable implementations must retain atomic idempotent semantics; a timed-out reserve/confirm may need reconciliation. Tests simulate unavailable/hung dependencies.
