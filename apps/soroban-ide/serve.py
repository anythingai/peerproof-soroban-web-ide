#!/usr/bin/env python3
"""
Simple static file server for the Soroban IDE frontend
"""

import http.server
import socketserver
import os
import json
import urllib.request
import urllib.parse
import urllib.error
from urllib.parse import urlparse

class SorobanIDEHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory='', **kwargs)
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        # Handle API proxy requests
        if self.path.startswith('/api'):
            self.proxy_to_backend('GET')
            return
        
        # Serve index.html for SPA routing
        if self.path == '/' or not os.path.exists('.' + self.path):
            self.path = '/index.html'
        return super().do_GET()
    
    def do_POST(self):
        # Handle API proxy requests
        if self.path.startswith('/api'):
            self.proxy_to_backend('POST')
            return
        
        # Default POST handling
        self.send_error(405, "Method Not Allowed")
    
    def do_OPTIONS(self):
        # Handle API proxy requests
        if self.path.startswith('/api'):
            self.proxy_to_backend('OPTIONS')
            return
        
        # Default OPTIONS handling
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def proxy_to_backend(self, method):
        """Proxy requests to the backend server"""
        try:
            # Remove /api prefix and forward to backend
            backend_path = self.path[4:]  # Remove '/api'
            if not backend_path:
                backend_path = '/'
            
            backend_url = f'http://localhost:8000{backend_path}'
            
            # Prepare request data
            data = None
            if method in ['POST', 'PUT']:
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length > 0:
                    data = self.rfile.read(content_length)
            
            # Create request
            req = urllib.request.Request(backend_url, data=data, method=method)
            
            # Copy headers
            for header_name, header_value in self.headers.items():
                if header_name.lower() not in ['host', 'content-length']:
                    req.add_header(header_name, header_value)
            
            # Make request
            with urllib.request.urlopen(req, timeout=30) as response:
                # Send response status
                self.send_response(response.status)
                
                # Copy response headers
                for header_name, header_value in response.headers.items():
                    self.send_header(header_name, header_value)
                
                # Add CORS headers
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.end_headers()
                
                # Copy response body
                response_data = response.read()
                self.wfile.write(response_data)
                
        except urllib.error.HTTPError as e:
            # Forward HTTP errors
            self.send_response(e.code)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = json.dumps({"error": f"Backend error: {e.reason}"})
            self.wfile.write(error_response.encode())
            
        except Exception as e:
            # Handle connection errors
            self.send_response(503)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = json.dumps({"error": f"Backend unavailable: {str(e)}"})
            self.wfile.write(error_response.encode())

def start_server():
    PORT = 5000
    Handler = SorobanIDEHandler
    
    print(f"Starting Soroban IDE frontend server on http://0.0.0.0:{PORT}")
    
    try:
        # Try port 5000 first, then fallback to 5001
        try:
            httpd = socketserver.TCPServer(("0.0.0.0", PORT), Handler)
        except OSError:
            PORT = 5001
            print(f"Port 5000 in use, trying port {PORT}")
            httpd = socketserver.TCPServer(("0.0.0.0", PORT), Handler)
        
        httpd.allow_reuse_address = True
        print(f"Server is ready at http://0.0.0.0:{PORT}")
        httpd.serve_forever()
    except Exception as e:
        print(f"Server failed to start: {e}")
        import sys
        sys.exit(1)

if __name__ == "__main__":
    start_server()