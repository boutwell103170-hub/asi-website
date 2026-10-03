from pathlib import Path
import hashlib,json,subprocess,sys
root=Path(__file__).resolve().parents[1]
subprocess.run([sys.executable,str(root/'deployment/build.py')],check=True)
def manifest(base):return {str(p.relative_to(base)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(base.rglob('*')) if p.is_file()}
source=manifest(root/'site');artifact=manifest(root/'dist')
assert source==artifact,'Build differs from public source'
assert not any('intake@example.invalid' in p.read_text(errors='ignore') for p in (root/'dist').rglob('*') if p.is_file()),'Server-only recipient leaked into public artifact'
assert not any(p.startswith(('backend/','docs/','.git/','tests/','deployment/')) or p.startswith('.env') for p in artifact)
(root/'BUILD_MANIFEST.json').write_text(json.dumps(artifact,indent=2)+'\n')
result=subprocess.run([sys.executable,str(root/'deployment/build.py'),'--production'],capture_output=True,text=True)
assert result.returncode!=0 and 'BLOCKED:' in result.stderr,'Production gate did not block'
assert 'source_dir: /asi-website' in (root/'deployment/app.yaml').read_text()
assert 'deploy_on_push: false' in (root/'deployment/app.yaml').read_text()
assert 'working-directory: asi-website' in (root.parent/'.github/workflows/validate.yml').read_text()
print(f'PASS: {len(artifact)} public files hash-identical; private files excluded; nested deployment/CI paths; production blocked')
