#!/usr/bin/env python3
"""
Simple Python backend server for health checks and basic API endpoints.
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.parse
from datetime import datetime

class APIHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        
        if parsed_path.path == '/api/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'status': 'healthy',
                'service': 'python-backend',
                'timestamp': datetime.now().isoformat(),
                'version': '1.0.0'
            }
            self.wfile.write(json.dumps(response).encode())
            
        elif parsed_path.path.startswith('/api/download/'):
            # Handle download requests with 404 since conversion is disabled
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'error': 'File conversion services are currently disabled'
            }
            self.wfile.write(json.dumps(response).encode())
            
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'error': 'Endpoint not found'
            }
            self.wfile.write(json.dumps(response).encode())
    
    def do_POST(self):
        # Handle POST requests for conversion APIs
        self.send_response(503)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            'error': 'Conversion services are currently disabled'
        }
        self.wfile.write(json.dumps(response).encode())
    
    def do_OPTIONS(self):
        # Handle CORS preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        # Custom logging format
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")

def run_server(port=8000):
    server_address = ('0.0.0.0', port)
    httpd = HTTPServer(server_address, APIHandler)
    print(f"Starting Python backend server on http://0.0.0.0:{port}")
    print(f"Server ready and listening on port {port}")
    print("Available endpoints:")
    print("  GET /api/health - Health check endpoint")
    print("  GET /api/download/* - File download (returns 404)")
    print("  POST /* - All conversion endpoints (returns 503)")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.shutdown()

if __name__ == '__main__':
    run_server()