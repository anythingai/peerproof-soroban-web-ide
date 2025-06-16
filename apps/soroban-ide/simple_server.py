#!/usr/bin/env python3
"""
Simple HTTP server for Soroban IDE with API proxy
"""

import http.server
import socketserver
import json
import urllib.request
import urllib.error

class IDEHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory='', **kwargs)
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        if self.path.startswith('/api'):
            self.handle_api_request('GET')
        elif self.path == '/' or not self.path.startswith('/'):
            self.path = '/index.html'
            super().do_GET()
        else:
            super().do_GET()
    
    def do_POST(self):
        if self.path.startswith('/api'):
            self.handle_api_request('POST')
        else:
            self.send_error(405)
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def handle_api_request(self, method):
        try:
            # Remove /api prefix
            backend_path = self.path[4:] or '/'
            backend_url = f'http://localhost:8000{backend_path}'
            
            # Read request body for POST
            data = None
            if method == 'POST':
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length > 0:
                    data = self.rfile.read(content_length)
            
            # Make backend request
            req = urllib.request.Request(backend_url, data=data, method=method)
            req.add_header('Content-Type', 'application/json')
            
            with urllib.request.urlopen(req, timeout=10) as response:
                self.send_response(response.status)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(response.read())
                
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_msg = json.dumps({"error": f"Backend error: {e.reason}"})
            self.wfile.write(error_msg.encode())
            
        except Exception as e:
            self.send_response(503)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_msg = json.dumps({"error": f"Service unavailable: {str(e)}"})
            self.wfile.write(error_msg.encode())

if __name__ == "__main__":
    PORT = 5000
    
    try:
        with socketserver.TCPServer(("0.0.0.0", PORT), IDEHandler) as httpd:
            httpd.allow_reuse_address = True
            print(f"Soroban IDE running at http://0.0.0.0:{PORT}")
            httpd.serve_forever()
    except OSError as e:
        if "Address already in use" in str(e):
            PORT = 5001
            with socketserver.TCPServer(("0.0.0.0", PORT), IDEHandler) as httpd:
                httpd.allow_reuse_address = True
                print(f"Soroban IDE running at http://0.0.0.0:{PORT}")
                httpd.serve_forever()
        else:
            raise