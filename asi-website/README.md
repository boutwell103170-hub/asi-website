# ASI recovered repair candidate

Existing Moonshot site continued from 785f9a2, without redesign. Preview only; see [launch gates](docs/LAUNCH_GATES.md).

From the repository root:

```
python3 asi-website/tests/check_site.py
node --test asi-website/tests/*.test.cjs
python3 asi-website/deployment/build.py
python3 asi-website/deployment/serve_local.py
```

Open http://127.0.0.1:8080/. The `asi-website/site/` directory is a self-contained public root. The build copies only that root to `asi-website/dist/`; no backend, environment example, source manifest or recovery docs are published. The existing top-level css/js are historical scaffolding; the public site uses its own contained assets.

The GitHub validation workflow lives at repository root, with nested working-directory corrected. Hosting template changes are unapplied; deploy-on-push is disabled in that template. Production build (`--production`) fails closed pending separately approved launch gates.

**Release warning:** Current DigitalOcean hosting has main-branch auto-deploy ON and no build command. The local production-build refusal is not enforced by that host. Do not push this candidate to main. The app template is unapplied; see docs/LAUNCH_GATES.md for verified current settings and approval requirements.

The details-only intake core in backend/ is an offline, fail-closed candidate. Run all `tests/*.test.cjs`; backend/README.md lists exact missing production integrations. The public artifact remains sandbox and excludes all backend/configuration files.
