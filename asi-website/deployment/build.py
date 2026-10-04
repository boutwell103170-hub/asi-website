"""Build a closed, preview-only public artifact. Never publishes anything."""
from pathlib import Path
import shutil, subprocess, sys
root=Path(__file__).resolve().parents[1]
if '--production' in sys.argv:
    raise SystemExit('BLOCKED: factual/legal approval and verified quote backend/hosting are still required. See docs/LAUNCH_GATES.md.')
subprocess.run([sys.executable,str(root/'tests/check_site.py')],check=True)
out=root/'dist'
if out.exists(): shutil.rmtree(out)
shutil.copytree(root/'site',out)
print(f'Preview artifact: {out} (noindex; quote sandbox; not production approved)')
