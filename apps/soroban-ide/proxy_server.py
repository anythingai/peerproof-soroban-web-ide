#!/usr/bin/env python3
"""
Proxy server for Soroban IDE that serves static files and proxies API calls
"""

import http.server
import socketserver
import urllib.request
import urllib.error
import json
import os

class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory='', **kwargs)
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        if self.path == '/api/health':
            self.proxy_request('GET')
        elif self.path == '/' or self.path == '/index.html':
            super().do_GET()
        else:
            super().do_GET()
    
    def do_POST(self):
        if self.path.startswith('/api/'):
            self.proxy_request('POST')
        else:
            self.send_error(405)
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def proxy_request(self, method):
        try:
            backend_url = f'http://localhost:8000{self.path[4:] if self.path.startswith("/api") else self.path}'
            
            data = None
            if method == 'POST':
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length > 0:
                    data = self.rfile.read(content_length)
            
            req = urllib.request.Request(backend_url, data=data, method=method)
            if data:
                req.add_header('Content-Type', 'application/json')
            
            with urllib.request.urlopen(req, timeout=10) as response:
                self.send_response(response.status)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(response.read())
                
        except urllib.error.URLError:
            self.send_response(503)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error = json.dumps({"error": "Backend service unavailable"})
            self.wfile.write(error.encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error = json.dumps({"error": str(e)})
            self.wfile.write(error.encode())

if __name__ == "__main__":
    PORT = 5000
    Handler = ProxyHandler
    
    with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
        httpd.allow_reuse_address = True
        print(f"Soroban IDE with proxy running on http://0.0.0.0:{PORT}")
        httpd.serve_forever()