from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
site=root/'site'
required=[site/'index.html',site/'quote.html',site/'services/plan-review.html',site/'services/inspections.html',site/'services/permit-assistance.html',site/'services/fire-life-safety.html',site/'services/consulting.html',site/'services/private-provider.html']
errors=[]
for p in required:
    if not p.exists(): errors.append(f'Missing: {p.relative_to(root)}')
for p in site.rglob('*.html'):
    t=p.read_text(encoding='utf-8')
    if '<title>' not in t: errors.append(f'Missing title: {p.relative_to(root)}')
    if 'name="description"' not in t: errors.append(f'Missing description: {p.relative_to(root)}')
if errors:
    print('\n'.join(errors)); sys.exit(1)
print('ASI site checks passed.')
