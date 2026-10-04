# ASI recovered preview: launch gates

This is a non-live review candidate, not an approved production release. Publication of the review branch does not authorize deployment, DNS changes, expenses, production launch, pricing changes or business claims.

## Blocking decisions and evidence

- Verify remaining contact details, credential titles/numbers, service geography, private-provider and expedited-permit language. Inherited business prose is preserved, not newly verified. Placeholder configuration remains explicitly unverified. See FINAL_FACT_PASS_CHECKLIST.txt.
- Approve final privacy, terms, accessibility and retention practices. Draft persistence currently uses browser localStorage; selected files do not persist. Do not enter real client material into the preview.
- Implement and verify the quote backend: details-only validation, limits, spam/rate controls, notification routing and explicit receipt contract. No backend destination has been invented. The proposed adapter contract requires same-origin HTTPS POST multipart, JSON `{ "ok": true, "receiptId": "nonempty reference" }`. Controlled mocks are not evidence of an operating backend.
- Confirm the actual hosting account/app, current deployed source, domain routing and existing mail records. A matching public source repository does not prove it is the deployed origin. The unapplied DigitalOcean template is corrected for the nested repository but must not be applied without separate approval.
- Review and authorize production release separately. Default artifact and HTML are noindex; robots blocks all crawling; sandbox never transmits. Production build deliberately refuses until these gates are resolved in a subsequent approved change. `_headers` is a provider-specific template, not evidence headers are live on DigitalOcean or any other host.

- Complete or explicitly approve removal of four inherited placeholder CTAs: the process detail link and three resource/guide links. No destination or article was invented.
- Complete rendered desktop/mobile and keyboard/accessibility acceptance before release; cloud local-preview navigation was blocked.

## Repairs and preservation

Source lineage starts at repository commit 785f9a2eb0382e23ca227a50986dfdc187465ca7. The original repository history is preserved. RECOVERY_PROVENANCE.json records dependency donor paths and original hashes. The V13 runtime/config/adapter/assets/SEO are restored then minimally repaired; final build hashes are generated separately.

The deployable public root is now `asi-website/site/`, self-contained. Runtime assets are inside it. Existing Moonshot layout, image data, typography and visual foundation are retained. Technical changes correct links, service canonical paths, mobile toggle, accessibility controls, storage failure handling and submission semantics. Sandbox tests retain drafts and never show delivered success. Delivery failures retain the draft; confirmed receipts alone clear it. Duplicate clicks are guarded while a submission is pending.

## Release caveat (2026-10-03)

Current hosting serves `asi-website/site` from `main` with Auto Deploy **ON**, Build Command **None** and Output Directory **Auto**.

**Do not merge or push this candidate to main without separate production approval.** The host does not execute `deployment/build.py`; its local `--production` refusal is a script-level guard, not an enforced host release gate. A main push may automatically publish the preview source. Sandbox/noindex defaults do not prevent public access.

The unapplied `deployment/app.yaml` proposes source directory `/asi-website`, an explicit preview build command and output `dist`, and deploy-on-push disabled. It does not change the live app. Hosting configuration changes, disabling auto-deploy, branch selection and deployment require separate approval and verification.

## Contact configuration

Public phone is `334-733-9576` with telephone link `tel:+13347339576`. Quote-notification recipient configuration is server-only and absent from the repository. No public email or verified credentials are added by this repair.

## Details-only implementation update

The details-only launch scope is selected. Upload input is visibly disabled with instructions to arrange document transfer afterward; server rejects any file part. A bounded offline intake core now exists, with disabled provider transport, bounded rate policy and runtime bootstrap now implemented but not operationally configured or approved for activation. The recommended strategy uses 30-minute content-bound signed tokens and provider-backed idempotency, avoiding a mandatory new database. See backend/README.md for exact transport, token, rate, origin and routing dependencies.

Only an explicit `submitted_for_email_delivery` acceptance stage can trigger the client completion message. This does not mean inbox arrival. The quote notification recipient must be supplied through approved server-only deployment configuration, not published in this repository. Earlier descriptions of an unimplemented backend refer to the historical baseline; the current implementation remains disabled and unverified against live infrastructure.


## Operator identification and activation gates

The website operator is identified as American Standard Construction & Safety Consulting LLC while retaining ASI branding. This identification does not assert a registered d/b/a. Final privacy/terms and unverified credentials/claims remain outstanding.

The proposed delivery approach does not itself approve deployment, expenses, credential creation, sender DNS changes or activation. Keep all runtime approval flags false until the relevant checks and authorization exist. Single-instance local rate counters reset and require a verified independent provider hard quota with no paid overage. No new database is required by this implementation. See backend/README.md for the exact limits and staged verification checklist.

## Current completion sequence (2026-10-04; supersedes historical setup gaps)

This sequence records engineering requirements, not private account configuration or a live operational audit. Keep deployment evidence and account-specific observations outside the public repository. No delivery or approval flags are changed by this candidate.

1. Review the local frontend error-handling repair and its offline evidence. The adapter already rejects generic HTML 503 responses without accepting them as receipts. It now distinguishes failed token authorization (no email-submission request started) from a failure after quote submission (outcome uncertain). Both retain the draft; only the latter retains a recovery reference and requires reconciliation. Server/proxy response text is never displayed. The public health endpoint's HTML 503 does not prove an application defect; its origin still requires a read-only host diagnosis. Do not change readiness to 200 to hide it.
2. Verify and publish the repaired frontend only after separate review and hosting authorization. The preserved static component tracks `main` with auto-deploy on; the API tracks the repair branch. Therefore the API deployment alone does not publish the repaired static assets. Compare deployed static commit and asset hashes with the reviewed candidate before rendered QA. Do not merge to main as an incidental setup step.
3. Complete rendered desktop/mobile and keyboard QA of the actual repaired frontend: navigation, required-field focus, all form steps, draft retention, unavailable authorization, uncertain submission reference, and confirmed-receipt messaging. Available offline VM tests cover behavior but cannot establish visual or device acceptance. Keep sandbox/noindex and disabled uploads during this review.
4. Resolve public facts and policy decisions: credential titles/numbers and scope, service geography and private-provider/permit wording, final privacy/terms/accessibility, browser draft and provider retention, and the four unfinished resource/process CTAs. Existing approved phone and operator identification need not be re-collected. Do not invent marketing facts, legal authority, articles, a public inbox or a client auto-reply.
5. Complete the remaining provider/host verification without retrieving secrets: verified sending domain and fixed sender, approved fixed notification recipient (server-only), exact HTTPS origin, single-instance configuration and deployment-overlap behavior, accepted proxy-IP grouping/ingress deadlines, signing-secret provisioning status, and monitoring/reconciliation owner. Key permissions alone do not establish sending-domain verification or inbox delivery. Verify required capabilities without retrieving credential values.
6. After separate authorization for controlled delivery, validate one synthetic inquiry end to end and observe the intended inbox, including same-reference retry and uncertain-outcome handling. Only then adjudicate the relevant verification flags and delivery activation with explicit release approval. The runtime currently uses `ASI_RELEASE_APPROVED` even for real synthetic sends; this plan does not bypass that gate or authorize such a test. Any noindex/robots changes, sitemap submission, production mode, merge or final launch remain separate release work.

### Provider quota evidence: no new paid service required

The [official quota documentation](https://resend.com/docs/knowledge-base/account-quotas-and-limits) and [pricing](https://resend.com/pricing) describe a Free-plan cost backstop. Applicability to a deployment must be established in private operational evidence; no account identity, billing observation or credential configuration belongs in this public document. The architecture does not require a paid quota product or new database. Documented plan semantics do not activate the provider or approve any verification flag.

Free-plan quotas are 100 emails per UTC calendar day and 3,000 per month; sent and received email consume that quota. Other team usage reduces availability. The local limit remains at most 75 distinct delivery identities per rolling day per process, with reset/overlap caveats. Do not describe the provider's daily reset as a rolling 24-hour window or claim a global 75/day guarantee. Recheck the backstop if the account plan changes. Retention and operational ownership still require agreement; quota evidence does not settle those decisions.

### Read-only diagnosis still required

Capture the deployed API commit and inspect internal GET `/api/live` and GET `/api/health` status/content type/body alongside the external responses, without printing environment variables or credentials. This distinguishes application JSON readiness from host-generated error pages. Existing network restrictions must not be bypassed. Do not treat public HTML 503 as proof of sending capability, as a reason to enable delivery, or as a reason to provision infrastructure. No real POST or provider request is part of that diagnosis.

## Owner-confirmed team wording (2026-10-04)

The owner confirmed the general claim of 20+ years of team experience. Attribute it to the team, not ASI company age. This confirmation does not establish individual license status, continuous tenure in a particular inspection role, or a sum of career durations. The project wording is "approximately 1,000 projects across our team’s careers": an owner-reported career estimate, not an independently verified minimum or an ASI company project count. No other business fact or release gate is marked verified. Employment and partner details are not published.
