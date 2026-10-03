from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import re,json,sys
root=Path(__file__).resolve().parents[1];site=root/'site';errors=[]
class Document(HTMLParser):
 def __init__(self,text):
  super().__init__();self.ids=set();self.refs=[];self.feed(text)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if a.get('id'):self.ids.add(a['id'])
  for key in ['src','href']:
   if a.get(key):self.refs.append(a[key])
docs={p:Document(p.read_text()) for p in site.rglob('*.html')}
required=['index.html','quote.html','404.html','config/site-config.js','js/site-runtime.js','js/quote-adapter.js','assets/logos/favicon.svg','site.webmanifest','robots.txt','sitemap.xml','_headers']+[f'services/{name}.html' for name in ['plan-review','inspections','permit-assistance','fire-life-safety','consulting','private-provider']]
for file in required:
 if not (site/file).is_file():errors.append(f'Missing required dependency: {file}')
for p,d in docs.items():
 text=p.read_text()
 if '<title>' not in text or 'name="description"' not in text:errors.append(f'Metadata missing: {p.name}')
 if 'content="noindex,nofollow"' not in text:errors.append(f'Preview indexing guard missing: {p.name}')
 refs=d.refs+re.findall(r'url\([\'\"]?([^\)\'\"]+)',text)
 for ref in refs:
  u=urlsplit(ref)
  if u.scheme or u.netloc:continue
  target=((site/u.path.lstrip('/')) if u.path.startswith('/') else (p.parent/unquote(u.path))).resolve() if u.path else p
  if target.is_dir():target=target/'index.html'
  if not target.is_relative_to(site.resolve()) or not target.is_file():errors.append(f'{p.relative_to(site)}: missing/escaped {ref}')
  elif u.fragment and target in docs and unquote(u.fragment) not in docs[target].ids:errors.append(f'{p.name}: missing fragment {ref}')
for u in re.findall(r'<loc>(.*?)</loc>',(site/'sitemap.xml').read_text()):
 path=urlsplit(u).path.strip('/') or 'index.html'
 if not (site/path).is_file():errors.append(f'Invalid sitemap path {path}')
json.loads((site/'site.webmanifest').read_text())
config=(site/'config/site-config.js').read_text()
if 'quoteMode: "sandbox"' not in config or 'factsVerified: false' not in config:errors.append('Preview gates changed; launch review required')
if 'Disallow: /' not in (site/'robots.txt').read_text():errors.append('Preview robots gate missing')
headers=(site/'_headers').read_text()
for directive in ['X-Content-Type-Options: nosniff','X-Robots-Tag: noindex, nofollow',"frame-ancestors 'self'","connect-src 'self';"]:
 if directive not in headers:errors.append(f'Security template missing {directive}')
if errors:print('\n'.join(errors));sys.exit(1)
print(f'PASS: {len(docs)} HTML pages; dependencies, internal paths/fragments, CSS references, sitemap, manifest, preview gates')
