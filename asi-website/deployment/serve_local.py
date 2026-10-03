from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from functools import partial
ROOT=Path(__file__).resolve().parents[1]/'site'
print('ASI preview only: http://127.0.0.1:8080/', flush=True)
ThreadingHTTPServer(('127.0.0.1',8080),partial(SimpleHTTPRequestHandler,directory=str(ROOT))).serve_forever()
