from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os
ROOT=Path(__file__).resolve().parents[1]
os.chdir(ROOT)
print('ASI repository sandbox: http://localhost:8080/site/')
ThreadingHTTPServer(('0.0.0.0',8080),SimpleHTTPRequestHandler).serve_forever()
