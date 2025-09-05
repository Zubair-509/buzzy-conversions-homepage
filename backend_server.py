#!/usr/bin/env python3
"""
Python backend server for PDF conversion and API endpoints.
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.parse
import os
import tempfile
import uuid
import threading
import shutil
from datetime import datetime
from urllib.parse import parse_qs
import cgi
import io
from pdf_to_word_converter import convert_pdf_file
from pdf_to_powerpoint_converter import PDFToPowerPointConverter
from pdf_to_excel_converter import PDFToExcelConverter

# Global storage for conversion results
conversion_storage = {}
temp_dir = tempfile.mkdtemp()

# Initialize converters
powerpoint_converter = PDFToPowerPointConverter(temp_dir)
excel_converter = PDFToExcelConverter(temp_dir)

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
                'version': '2.0.0',
                'features': ['pdf-to-word-conversion', 'advanced-formatting', 'image-preservation']
            }
            self.wfile.write(json.dumps(response).encode())
            
        elif parsed_path.path.startswith('/api/status/'):
            # Check conversion status
            path_parts = parsed_path.path.split('/')
            if len(path_parts) >= 4:
                conversion_id = path_parts[3]
                
                if conversion_id in conversion_storage:
                    result = conversion_storage[conversion_id]
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    
                    status_response = {
                        'conversion_id': conversion_id,
                        'success': result.get('success', False),
                        'status': 'completed' if result.get('success') else ('failed' if 'error' in result else 'processing'),
                        'filename': result.get('filename'),
                        'download_url': f'/api/download/{conversion_id}/{result.get("filename", "")}' if result.get('success') else None,
                        'error': result.get('error'),
                        'metadata': result.get('metadata', {})
                    }
                    self.wfile.write(json.dumps(status_response).encode())
                    return
                
            # Conversion not found
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {'error': 'Conversion not found'}
            self.wfile.write(json.dumps(response).encode())
            
        elif parsed_path.path.startswith('/api/download/'):
            # Extract download ID and filename from path
            path_parts = parsed_path.path.split('/')
            if len(path_parts) >= 4:
                download_id = path_parts[3]
                filename = path_parts[4] if len(path_parts) > 4 else None
                
                if download_id in conversion_storage:
                    result = conversion_storage[download_id]
                    if result.get('success') and os.path.exists(result.get('output_path', '')):
                        # Serve the converted file
                        self.serve_file(result['output_path'], result['filename'])
                        return
                
            # File not found
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {'error': 'File not found or has expired'}
            self.wfile.write(json.dumps(response).encode())
            
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {'error': 'Endpoint not found'}
            self.wfile.write(json.dumps(response).encode())
    
    def serve_file(self, file_path, filename):
        """Serve a file for download"""
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            
            # Determine content type based on file extension
            if filename.endswith('.pptx'):
                content_type = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            elif filename.endswith('.docx'):
                content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            elif filename.endswith('.xlsx'):
                content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            else:
                content_type = 'application/octet-stream'
            
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
            self.send_header('Content-Length', str(len(content)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(content)
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {'error': f'Failed to serve file: {str(e)}'}
            self.wfile.write(json.dumps(response).encode())
    
    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        
        if parsed_path.path == '/api/convert/pdf-to-word':
            self.handle_pdf_to_word_conversion()
        elif parsed_path.path == '/api/convert/pdf-to-powerpoint':
            self.handle_pdf_to_powerpoint_conversion()
        elif parsed_path.path == '/api/convert/pdf-to-excel':
            self.handle_pdf_to_excel_conversion()
        else:
            # Handle other POST requests
            self.send_response(503)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {'error': 'This conversion service is not available'}
            self.wfile.write(json.dumps(response).encode())
    
    def handle_pdf_to_word_conversion(self):
        """Handle PDF to Word conversion requests"""
        try:
            # Parse multipart form data
            content_type = self.headers.get('Content-Type', '')
            if not content_type.startswith('multipart/form-data'):
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {'error': 'Content-Type must be multipart/form-data'}
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Get content length
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {'error': 'No file uploaded'}
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Read the request body
            body = self.rfile.read(content_length)
            
            # Parse multipart data
            boundary = content_type.split('boundary=')[1].encode()
            parts = body.split(b'--' + boundary)
            
            pdf_file_content = None
            pdf_filename = None
            
            for part in parts:
                if b'Content-Disposition' in part and b'filename=' in part:
                    # Extract filename
                    lines = part.split(b'\r\n')
                    for line in lines:
                        if b'Content-Disposition' in line:
                            if b'filename=' in line:
                                filename_part = line.split(b'filename=')[1]
                                pdf_filename = filename_part.strip(b'"').decode('utf-8')
                                break
                    
                    # Extract file content
                    if b'\r\n\r\n' in part:
                        pdf_file_content = part.split(b'\r\n\r\n', 1)[1]
                        # Remove trailing boundary markers
                        if pdf_file_content.endswith(b'\r\n'):
                            pdf_file_content = pdf_file_content[:-2]
                        break
            
            if not pdf_file_content or not pdf_filename:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {'error': 'No valid PDF file found in request'}
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Generate unique ID for this conversion
            conversion_id = str(uuid.uuid4())
            
            # Save uploaded PDF temporarily
            pdf_temp_path = os.path.join(temp_dir, f"{conversion_id}_{pdf_filename}")
            with open(pdf_temp_path, 'wb') as f:
                f.write(pdf_file_content)
            
            # Start conversion in a background thread
            def convert_async():
                try:
                    result = convert_pdf_file(pdf_temp_path, temp_dir)
                    result['conversion_id'] = conversion_id
                    conversion_storage[conversion_id] = result
                    
                    # Clean up input file
                    if os.path.exists(pdf_temp_path):
                        os.remove(pdf_temp_path)
                        
                except Exception as e:
                    conversion_storage[conversion_id] = {
                        'success': False,
                        'error': f'Conversion failed: {str(e)}',
                        'conversion_id': conversion_id
                    }
            
            # Start background conversion
            thread = threading.Thread(target=convert_async)
            thread.daemon = True
            thread.start()
            
            # Return immediate response with conversion ID
            self.send_response(202)  # Accepted
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'success': True,
                'conversion_id': conversion_id,
                'status': 'processing',
                'message': 'PDF conversion started. Use the conversion ID to check status.'
            }
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.log_message(f"Error in PDF conversion: {str(e)}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {'error': f'Internal server error: {str(e)}'}
            self.wfile.write(json.dumps(response).encode())
    
    def do_OPTIONS(self):
        # Handle CORS preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def handle_pdf_to_powerpoint_conversion(self):
        """Handle PDF to PowerPoint conversion requests"""
        try:
            # Parse multipart form data (reuse same logic as Word conversion)
            content_type = self.headers.get('Content-Type', '')
            if not content_type.startswith('multipart/form-data'):
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {'error': 'Content-Type must be multipart/form-data'}
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Get content length
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {'error': 'No file uploaded'}
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Read and parse multipart data
            body = self.rfile.read(content_length)
            boundary = content_type.split('boundary=')[1].encode()
            parts = body.split(b'--' + boundary)
            
            pdf_file_content = None
            pdf_filename = None
            
            for part in parts:
                if b'Content-Disposition' in part and b'filename=' in part:
                    # Extract filename
                    lines = part.split(b'\r\n')
                    for line in lines:
                        if b'Content-Disposition' in line:
                            if b'filename=' in line:
                                filename_part = line.split(b'filename=')[1]
                                pdf_filename = filename_part.strip(b'"').decode('utf-8')
                                break
                    
                    # Extract file content
                    if b'\r\n\r\n' in part:
                        pdf_file_content = part.split(b'\r\n\r\n', 1)[1]
                        if pdf_file_content.endswith(b'\r\n'):
                            pdf_file_content = pdf_file_content[:-2]
                        break
            
            if not pdf_file_content or not pdf_filename:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {'error': 'No valid PDF file found in request'}
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Generate unique ID for this conversion
            conversion_id = str(uuid.uuid4())
            
            # Save uploaded PDF temporarily
            pdf_temp_path = os.path.join(temp_dir, f"{conversion_id}_{pdf_filename}")
            with open(pdf_temp_path, 'wb') as f:
                f.write(pdf_file_content)
            
            # Start conversion in a background thread
            def convert_async():
                try:
                    result = powerpoint_converter.convert_pdf_to_powerpoint(pdf_temp_path)
                    
                    if result['success']:
                        # Generate output filename
                        base_name = os.path.splitext(pdf_filename)[0]
                        output_filename = f"{conversion_id}_{base_name}_converted.pptx"
                        final_output_path = os.path.join(temp_dir, output_filename)
                        
                        # Move converted file to final location
                        if os.path.exists(result['output_path']):
                            shutil.move(result['output_path'], final_output_path)
                            result['output_path'] = final_output_path
                            result['filename'] = output_filename
                    
                    result['conversion_id'] = conversion_id
                    conversion_storage[conversion_id] = result
                    
                    # Clean up input file
                    try:
                        os.remove(pdf_temp_path)
                    except:
                        pass
                        
                except Exception as e:
                    error_result = {
                        'success': False,
                        'error': f'PowerPoint conversion failed: {str(e)}',
                        'conversion_id': conversion_id
                    }
                    conversion_storage[conversion_id] = error_result
            
            # Start background conversion
            thread = threading.Thread(target=convert_async)
            thread.daemon = True
            thread.start()
            
            # Send immediate response with conversion ID
            self.send_response(202)  # Accepted
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'success': True,
                'conversion_id': conversion_id,
                'message': 'PDF to PowerPoint conversion started',
                'status_url': f'/api/status/{conversion_id}'
            }
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            print(f"Error in PDF to PowerPoint conversion: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {'error': f'Conversion failed: {str(e)}'}
            self.wfile.write(json.dumps(response).encode())

    def handle_pdf_to_excel_conversion(self):
        """Handle PDF to Excel conversion requests"""
        try:
            # Parse multipart form data (reuse same logic as other conversions)
            content_type = self.headers.get('Content-Type', '')
            if not content_type.startswith('multipart/form-data'):
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {'error': 'Content-Type must be multipart/form-data'}
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Get content length
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {'error': 'No file uploaded'}
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Read and parse multipart data
            body = self.rfile.read(content_length)
            boundary = content_type.split('boundary=')[1].encode()
            parts = body.split(b'--' + boundary)
            
            pdf_file_content = None
            pdf_filename = None
            
            for part in parts:
                if b'Content-Disposition' in part and b'filename=' in part:
                    # Extract filename
                    lines = part.split(b'\r\n')
                    for line in lines:
                        if b'Content-Disposition' in line:
                            if b'filename=' in line:
                                filename_part = line.split(b'filename=')[1]
                                pdf_filename = filename_part.strip(b'"').decode('utf-8')
                                break
                    
                    # Extract file content
                    if b'\r\n\r\n' in part:
                        pdf_file_content = part.split(b'\r\n\r\n', 1)[1]
                        if pdf_file_content.endswith(b'\r\n'):
                            pdf_file_content = pdf_file_content[:-2]
                        break
            
            if not pdf_file_content or not pdf_filename:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {'error': 'No valid PDF file found in request'}
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Generate unique ID for this conversion
            conversion_id = str(uuid.uuid4())
            
            # Save uploaded PDF temporarily
            pdf_temp_path = os.path.join(temp_dir, f"{conversion_id}_{pdf_filename}")
            with open(pdf_temp_path, 'wb') as f:
                f.write(pdf_file_content)
            
            # Start conversion in a background thread
            def convert_async():
                try:
                    result = excel_converter.convert_pdf_to_excel(pdf_temp_path)
                    
                    if result['success']:
                        # Generate output filename
                        base_name = os.path.splitext(pdf_filename)[0]
                        output_filename = f"{conversion_id}_{base_name}_converted.xlsx"
                        final_output_path = os.path.join(temp_dir, output_filename)
                        
                        # Move converted file to final location
                        if os.path.exists(result['output_path']):
                            shutil.move(result['output_path'], final_output_path)
                            result['output_path'] = final_output_path
                            result['filename'] = output_filename
                    
                    result['conversion_id'] = conversion_id
                    conversion_storage[conversion_id] = result
                    
                    # Clean up input file
                    try:
                        os.remove(pdf_temp_path)
                    except:
                        pass
                        
                except Exception as e:
                    error_result = {
                        'success': False,
                        'error': f'Excel conversion failed: {str(e)}',
                        'conversion_id': conversion_id
                    }
                    conversion_storage[conversion_id] = error_result
            
            # Start background conversion
            thread = threading.Thread(target=convert_async)
            thread.daemon = True
            thread.start()
            
            # Send immediate response with conversion ID
            self.send_response(202)  # Accepted
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'success': True,
                'conversion_id': conversion_id,
                'message': 'PDF to Excel conversion started',
                'status_url': f'/api/status/{conversion_id}'
            }
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            print(f"Error in PDF to Excel conversion: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {'error': f'Conversion failed: {str(e)}'}
            self.wfile.write(json.dumps(response).encode())

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
    print("  POST /api/convert/pdf-to-word - PDF to Word conversion")
    print("  POST /api/convert/pdf-to-powerpoint - PDF to PowerPoint conversion")
    print("  POST /api/convert/pdf-to-excel - PDF to Excel conversion")
    print("  GET /api/status/{id} - Check conversion status")
    print("  GET /api/download/{id}/{filename} - Download converted files")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.shutdown()

if __name__ == '__main__':
    run_server()