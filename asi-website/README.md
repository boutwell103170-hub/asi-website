# ASI Website

Production repository for the American Standard Construction & Inspection website.

## Current Version

`1.0.0-alpha.1`

## Local Preview

```bash
python3 deployment/serve_local.py
```

Then open `http://localhost:8080/site/`.

## Structure

- `site/` — deployable website pages
- `site/services/` — service pages
- `site/legal/` — legal/accessibility pages
- `css/` — shared styles
- `js/` — runtime and form adapters
- `config/` — centralized business/contact configuration
- `backend/` — future secure quote/upload backend
- `deployment/` — hosting and local server files
- `docs/` — architecture, deployment, DNS, forms, branding
- `decisions/` — architecture decision records
- `tests/` — validation and QA scripts
