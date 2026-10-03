# ASI recovered preview: launch gates

This is a non-live review candidate, not an approved production release. Publication of the review branch does not authorize deployment, DNS changes, expenses, production launch, pricing changes or business claims.

## Blocking decisions and evidence

- Verify remaining contact details, credential titles/numbers, experience and project counts, service geography, private-provider and expedited-permit language. Inherited business prose is preserved, not newly verified. Placeholder configuration remains explicitly unverified. See FINAL_FACT_PASS_CHECKLIST.txt.
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

Public phone is `334-733-9576` with telephone link `tel:+13347339576`. Quote-notification recipient configuration is server-only and absent from the repository. No public email, verified credentials, experience counts or project counts are added by this repair.

## Details-only implementation update

The details-only launch scope is selected. Upload input is visibly disabled with instructions to arrange document transfer afterward; server rejects any file part. A bounded offline intake core now exists, with disabled provider transport, bounded rate policy and runtime bootstrap now implemented but not operationally configured or approved for activation. The recommended strategy uses 30-minute content-bound signed tokens and provider-backed idempotency, avoiding a mandatory new database. See backend/README.md for exact transport, token, rate, origin and routing dependencies.

Only an explicit `submitted_for_email_delivery` acceptance stage can trigger the client completion message. This does not mean inbox arrival. The quote notification recipient must be supplied through approved server-only deployment configuration, not published in this repository. Earlier descriptions of an unimplemented backend refer to the historical baseline; the current implementation remains disabled and unverified against live infrastructure.


## Operator identification and activation gates

The website operator is identified as American Standard Construction & Safety Consulting LLC while retaining ASI branding. This identification does not assert a registered d/b/a. Final privacy/terms and unverified credentials/claims remain outstanding.

The proposed delivery approach does not itself approve deployment, expenses, credential creation, sender DNS changes or activation. Keep all runtime approval flags false until the relevant checks and authorization exist. Single-instance local rate counters reset and require a verified independent provider hard quota with no paid overage. No new database is required by this implementation. See backend/README.md for the exact limits and staged verification checklist.
