# Details-only intake core: offline candidate

A disabled-by-default Resend transport, renderer and runtime bootstrap are present. No provider is activated and no real email has been sent. `node backend/quote-server.cjs` starts an intentionally unconfigured loopback server; it returns 503 for intake. The public website remains sandbox. This is code and controlled test evidence, not an operating production workflow.

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
4. Verified `limiter.consume({ipKey, kind, submissionId?}) -> boolean`, using either genuinely shared enforcement or the explicitly bounded single-instance strategy described below. It must enforce per-client burst/sustained limits, global capacity and daily delivery quota for `kind: 'delivery'`, plus token/intake request limits. An approved edge service may supply enforcement; this interface does not mandate a database. Proxy headers are ignored until actual ingress identity semantics are verified. A single-process counter alone is insufficient; the selected bounded strategy additionally requires verified single-instance hosting and an independent provider hard quota.
5. Host-level request/header deadlines and ingress limits, monitoring ownership, provider quota/bounce handling, privacy/retention approval and an authorized synthetic staging delivery actually observed in the intended inbox.

Default missing dependencies fail closed. Bootstrap wiring and provider/rate implementations now exist but remain disabled pending explicit activation approval and verification. No purchase, persistent access grant, sender-DNS change, host configuration or deployment is implied by implementing this core.

## Tests

From repository root: `node --test asi-website/tests/*.test.cjs`. Tests inject synthetic transport and fixture state; an adapter-to-handler test uses real FormData serialization but no network. Static build excludes this entire backend directory and all environment configuration.

### Guarantee boundary and dependency timeouts

No durable historical tombstones exist in provider-bounded mode. A deliberately new authorization request can mint a new token for an old ID; after provider retention ends, the server cannot prove historical non-delivery. The guarantee is bounded to the signed retry window and verified provider retention, plus the supplied client’s no-auto-renewal behavior. It is not global or indefinite exactly-once delivery. Operators must reconcile expired/uncertain references before instructing a new submission.

Limiter and durable-store calls have two-second deadlines; provider submission has an eight-second deadline. Deadline expiry releases per-process active slots and yields no success. External operations may finish late, so durable implementations must retain atomic idempotent semantics; a timed-out reserve/confirm may need reconciliation. Tests simulate unavailable/hung dependencies.

## Resend/runtime implementation and operational boundaries

`resend-transport.cjs` uses fixed `https://api.resend.com/emails`, Bearer authorization and `Idempotency-Key`. It sends deterministic plain text with fixed configured From/To and validated customer Reply-To. It never creates an HTML body, attachments, CC/BCC, user-selected recipients or retry timestamps. Provider error bodies are not exposed; successful JSON is bounded to 4 KiB and requires a provider UUID. A 6.5-second transport deadline covers response reading; redirects and uncertain responses fail closed.

`runtime.cjs` is the proposed entry point (`npm start` in backend/). Delivery defaults off. Enabling it requires every approval/verification flag in `.env.example`, one instance, fixed server addresses, exact HTTPS origin, a signing secret and a valid-shaped provider credential. These flags are operator attestations, not proof that a setting or approval exists. They must remain false until the corresponding real checks and approvals are complete. Startup must not print credential values. `/api/health` indicates configured/disabled state only and explicitly does not verify email delivery.

The selected `SingleInstanceLimiter` is **not shared or durable**: 20 token/intake requests per minute and 60 per hour per socket-derived pseudonymous client key, 120 global requests per minute, at most 75 distinct delivery identities per rolling day. Four in-flight requests are capped separately. Same-reference retries do not spend another local delivery identity. These are conservative initial limits, not a promised service volume. Runtime requires a verified provider-side hard quota with no automatic paid overage as the independent cost/abuse backstop. Counters reset on restart; overlapping deployment processes can each have local counters. The provider backstop must remain effective across those resets. Do not claim a global 75/day guarantee. Scaling beyond one instance requires a new verified rate strategy.

Forwarded client-IP headers remain untrusted. The socket-derived key may group users behind the hosting proxy, conservatively reducing throughput; verify this behavior and accept or explicitly change the ingress policy before launch. Do not silently trust arbitrary forwarded headers.

`deployment/api-proposal.yaml` is an unapplied merge fragment, not a replacement for the existing app. It proposes one Node API component and an `/api` ingress rule preserving the prefix; retain the static `/` rule. All route, origin, port, health, sender-domain, DNS and secret configuration must be verified in approved staging. Node 22 is declared for the hosting buildpack; local tests ran under Node 24, with CI set to check both versions.

## Primary implementation references

- [Resend Send Email API](https://resend.com/docs/api-reference/emails/send-email): request fields, endpoint and response contract
- [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys): 24-hour retention and conflicting/concurrent request semantics
- [DigitalOcean app specification](https://docs.digitalocean.com/products/app-platform/reference/app-spec/): proposed service and ingress structure
- [DigitalOcean Node buildpack](https://docs.digitalocean.com/products/app-platform/reference/buildpacks/nodejs/): Node runtime/package detection

References checked 2026-10-03. No live provider call or configuration was used to verify this candidate; tests inject fake HTTP responses.

## Explicit no-send staging (unapplied)

Set `ASI_NO_SEND_STAGING=true` together with `ASI_ENABLE_DELIVERY=false` to bind the runtime to `0.0.0.0`. Both values are exact, case-sensitive strings. Missing or conflicting delivery settings block startup in staging; malformed staging values also block startup. With staging absent or `false`, the existing disabled default still binds only `127.0.0.1`. Production activation still requires every existing approval and configuration check; staging must be absent or `false` before any separately approved production activation.

Staging constructs only the unconfigured intake handler. It does not read provider credentials or signing secrets, create a provider transport, issue tokens, accept quotes, or send email, even if production approval flags are accidentally present. No credentials, sender, recipient, origin or approval attestations are needed for staging. Leave them unset; never set an approval flag just to satisfy a health check.

- `GET /api/live`: HTTP 200, `{"status":"alive","deliveryEnabled":false,"deliveryVerified":false}` in no-send staging. This indicates process liveness only.
- `GET /api/health`: remains HTTP 503, `{"status":"disabled","deliveryVerified":false}` in no-send staging. With separately approved delivery configuration it still reports `configured` (200), never verified inbox delivery.
- `POST /api/quote` and `POST /api/quote/token`: HTTP 503 with `NOT_CONFIGURED`; no receipt or token. Public quote UI remains sandbox.

### Exact DigitalOcean configuration for later review

`deployment/api-proposal.yaml` is an **unapplied merge fragment**, not a replacement spec or permission to create a paid component. Hosting must use the reviewed branch containing this repair only after separate hosting authorization. Keep the existing static component, root route, source history and design intact.

| Setting / spec field | Required value |
| --- | --- |
| Component name | `asi-quote-api` |
| Source Directory / `source_dir` | `/asi-website/backend` |
| Build Command / `build_command` | `npm ci --ignore-scripts --offline` |
| Run Command / `run_command` | `node runtime.cjs` |
| HTTP Port / `http_port` | `8081` (replace the wizard's `8080`) |
| Health check HTTP path / `health_check.http_path` | `/api/live` |
| Runtime environment variable `PORT` | `8081` |
| Runtime environment variable `ASI_NO_SEND_STAGING` | `true` |
| Runtime environment variable `ASI_ENABLE_DELIVERY` | `false` |
| Runtime environment variable `ASI_INSTANCE_COUNT` | `1` |
| Instance count / `instance_count` | `1` |
| Auto Deploy / `github.deploy_on_push` | Off / `false` |
| Git branch | Separately approved review branch containing this repair; never `main` |
| Ingress prefix / `ingress.rules[].match.path.prefix` | `/api` |
| Ingress target / `ingress.rules[].component.name` | `asi-quote-api` |
| Preserve prefix / `ingress.rules[].component.preserve_path_prefix` | `true`; no `rewrite` |

Merge the `/api` rule ahead of the existing static `/` rule, retaining the latter. The backend must receive `/api/live`, `/api/health`, `/api/quote` and `/api/quote/token` unchanged. Stripping `/api` causes 404 responses. Health checks default to the component HTTP port; the explicit `PORT=8081` and `http_port: 8081` must agree. These field semantics were checked against the [official DigitalOcean app spec reference](https://docs.digitalocean.com/products/app-platform/reference/app-spec/) on 2026-10-04. Wizard labels can differ; the spec keys above are authoritative.

After separate hosting authorization, verify liveness is 200, readiness is 503, and both intake POST routes remain 503/`NOT_CONFIGURED` on the actual HTTPS origin. A successful liveness check cannot establish email readiness or satisfy any launch gate. Hosting, cost authorization, real routing and rendered QA remain unverified. This repair does not authorize hosting submission or deployment.
