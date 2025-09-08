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
from pdf_to_jpg_converter import PDFToJPGConverter
from word_to_pdf_converter import WordToPDFConverter # Import the new converter
from powerpoint_to_pdf_converter import PowerPointToPDFConverter # Import PowerPoint to PDF converter
from excel_to_pdf_converter import ExcelToPDFConverter # Import Excel to PDF converter
from html_to_pdf_converter import convert_html_file # Import HTML to PDF converter

# Global storage for conversion results
conversion_storage = {}
temp_dir = tempfile.mkdtemp()

# Initialize converters
powerpoint_converter = PDFToPowerPointConverter(temp_dir)
excel_converter = PDFToExcelConverter(temp_dir)
jpg_converter = PDFToJPGConverter(temp_dir)
word_to_pdf_converter = WordToPDFConverter(temp_dir) # Initialize the new converter
powerpoint_to_pdf_converter = PowerPointToPDFConverter(temp_dir) # Initialize PowerPoint to PDF converter
excel_to_pdf_converter = ExcelToPDFConverter(temp_dir) # Initialize Excel to PDF converter

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
                'features': ['pdf-to-word-conversion', 'pdf-to-powerpoint-conversion', 'pdf-to-excel-conversion', 'pdf-to-jpg-conversion', 'word-to-pdf-conversion', 'powerpoint-to-pdf-conversion', 'excel-to-pdf-conversion', 'html-to-pdf-conversion', 'advanced-formatting', 'image-preservation']
            }
            self.wfile.write(json.dumps(response).encode())

        elif parsed_path.path.startswith('/api/status/'):
            # Check conversion status
            path_parts = parsed_path.path.split('/')
            if len(path_parts) >= 4:
                conversion_id = path_parts[3]
                print(f"Status check for conversion {conversion_id}")
                print(f"Available conversions: {list(conversion_storage.keys())}")

                if conversion_id in conversion_storage:
                    result = conversion_storage[conversion_id]
                    print(f"Found conversion result: {result}")

                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()

                    status_response = {
                        'conversion_id': conversion_id,
                        'success': result.get('success', False),
                        'status': result.get('status', 'completed' if result.get('success') else ('failed' if 'error' in result else 'processing')),
                        'filename': result.get('filename'),
                        'download_url': f'/api/download/{conversion_id}/{result.get("filename", "")}' if result.get('success') and result.get('filename') else None,
                        'error': result.get('error'),
                        'metadata': result.get('metadata', {}),
                        'method': result.get('method')
                    }
                    self.wfile.write(json.dumps(status_response).encode())
                    return

            # Conversion not found (set default value if not in path)
            conversion_id = conversion_id if 'conversion_id' in locals() else 'unknown'
            print(f"Conversion {conversion_id} not found in storage")
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
                filename = urllib.parse.unquote(path_parts[4]) if len(path_parts) > 4 else None

                print(f"Download request - ID: {download_id}, Filename: {filename}")
                print(f"Available files in storage: {list(conversion_storage.keys())}")

                if download_id in conversion_storage:
                    result = conversion_storage[download_id]
                    print(f"Found result: {result}")
                    print(f"Looking for file at: {result.get('output_path', '')}")
                    print(f"File exists: {os.path.exists(result.get('output_path', ''))}")

                    if result.get('success') and os.path.exists(result.get('output_path', '')):
                        # Serve the converted file
                        self.serve_file(result['output_path'], result['filename'])
                        return
                    else:
                        print(f"File not found or conversion not successful")
                else:
                    print(f"Download ID {download_id} not found in storage")

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
            elif filename.endswith('.jpg') or filename.endswith('.jpeg'):
                content_type = 'image/jpeg'
            elif filename.endswith('.png'):
                content_type = 'image/png'
            elif filename.endswith('.zip'):
                content_type = 'application/zip'
            elif filename.endswith('.pdf'):
                content_type = 'application/pdf' # Added for PDF files
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

    def do_OPTIONS(self):
        # Handle CORS preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def _send_json_response(self, data, status_code=200):
        """Helper to send JSON responses"""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def _send_error_response(self, status_code, message):
        """Helper to send error responses"""
        self._send_json_response({'error': message}, status_code)

    def do_POST(self):
        try:
            if self.path == '/api/convert/html-to-pdf':
                print("Received HTML to PDF conversion request")

                # Parse form data
                form = cgi.FieldStorage(
                    fp=self.rfile,
                    headers=self.headers,
                    environ={'REQUEST_METHOD': 'POST'}
                )

                file_item = form['file']
                if not file_item.filename:
                    self._send_error_response(400, "No file provided")
                    return

                # Generate unique conversion ID
                conversion_id = str(uuid.uuid4())

                # Save uploaded file
                temp_file_path = os.path.join(temp_dir, f"{conversion_id}_{file_item.filename}")

                with open(temp_file_path, 'wb') as temp_file:
                    temp_file.write(file_item.file.read())

                print(f"Saved uploaded HTML file to: {temp_file_path}")

                # Start async conversion
                def convert_async():
                    print(f"Starting async HTML to PDF conversion for {conversion_id}")
                    try:
                        result = convert_html_file(temp_file_path, temp_dir)

                        print(f"Conversion result for {conversion_id}: {result}")

                        if result["success"]:
                            # Store successful result
                            conversion_storage[conversion_id] = {
                                "conversion_id": conversion_id,
                                "success": True,
                                "status": "completed",
                                "filename": result["filename"],
                                "download_url": f"/api/download/{conversion_id}/{result['filename']}",
                                "error": None,
                                "metadata": result.get("metadata", {}),
                                "method": result.get("method", "unknown"),
                                "output_path": result["output_path"]
                            }

                            # Move file to permanent location if needed
                            final_path = os.path.join(temp_dir, result["filename"])
                            if result["output_path"] != final_path:
                                print(f"Moving file from {result['output_path']} to {final_path}")
                                shutil.move(result["output_path"], final_path)
                                conversion_storage[conversion_id]["output_path"] = final_path
                                print(f"File successfully moved to {final_path}")

                            print(f"Stored result for {conversion_id} in conversion_storage")
                        else:
                            # Store error result
                            conversion_storage[conversion_id] = {
                                "conversion_id": conversion_id,
                                "success": False,
                                "status": "failed",
                                "error": result["error"],
                                "filename": None,
                                "download_url": None
                            }

                        # Clean up temp file
                        try:
                            os.remove(temp_file_path)
                            print(f"Cleaned up temp file {temp_file_path}")
                        except Exception as e:
                            print(f"Failed to clean up temp file: {e}")

                        print(f"Async conversion completed for {conversion_id}. Available conversions: {list(conversion_storage.keys())}")

                    except Exception as e:
                        print(f"Error in async HTML to PDF conversion: {e}")
                        conversion_storage[conversion_id] = {
                            "conversion_id": conversion_id,
                            "success": False,
                            "status": "failed",
                            "error": str(e),
                            "filename": None,
                            "download_url": None
                        }

                # Run conversion in background thread
                conversion_thread = threading.Thread(target=convert_async)
                conversion_thread.start()

                # Send immediate response
                response_data = {
                    "success": True,
                    "conversion_id": conversion_id,
                    "status": "processing",
                    "message": "HTML to PDF conversion started"
                }

                self._send_json_response(response_data, 202)
                return

            elif self.path == '/api/convert/pdf-to-word':
                self.handle_pdf_to_word_conversion()
            elif self.path == '/api/convert/pdf-to-powerpoint':
                self.handle_pdf_to_powerpoint_conversion()
            elif self.path == '/api/convert/pdf-to-excel':
                self.handle_pdf_to_excel_conversion()
            elif self.path == '/api/convert/pdf-to-jpg':
                self.handle_pdf_to_jpg_conversion()
            elif self.path == '/api/convert/word-to-pdf': # Added handler for Word to PDF
                self.handle_word_to_pdf_conversion()
            elif self.path == '/api/convert/powerpoint-to-pdf': # Added handler for PowerPoint to PDF
                self.handle_powerpoint_to_pdf_conversion()
            elif self.path == '/api/convert/excel-to-pdf': # Added handler for Excel to PDF
                self.handle_excel_to_pdf_conversion()
            else:
                # Handle other POST requests
                self.send_response(404)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()

                response = {'error': 'Endpoint not found'}
                self.wfile.write(json.dumps(response).encode())

        except Exception as e:
            self.log_message(f"Error in POST request: {str(e)}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            response = {'error': f'Internal server error: {str(e)}'}
            self.wfile.write(json.dumps(response).encode())

    def handle_pdf_to_word_conversion(self):
        """Handle PDF to Word conversion requests"""
        try:
            # Parse multipart form data
            content_type = self.headers.get('Content-Type', '')
            if not content_type.startswith('multipart/form-data'):
                self._send_error_response(400, 'Content-Type must be multipart/form-data')
                return

            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._send_error_response(400, 'No file uploaded')
                return

            # Read and parse multipart data
            body = self.rfile.read(content_length)
            boundary = content_type.split('boundary=')[1].encode()
            parts = body.split(b'--' + boundary)

            pdf_file_content = None
            pdf_filename = None

            for part in parts:
                if b'Content-Disposition' in part and b'filename=' in part:
                    lines = part.split(b'\r\n')
                    for line in lines:
                        if b'Content-Disposition' in line:
                            if b'filename=' in line:
                                filename_part = line.split(b'filename=')[1]
                                pdf_filename = filename_part.strip(b'"').decode('utf-8')
                                break
                    if b'\r\n\r\n' in part:
                        pdf_file_content = part.split(b'\r\n\r\n', 1)[1]
                        if pdf_file_content.endswith(b'\r\n'):
                            pdf_file_content = pdf_file_content[:-2]
                        break

            if not pdf_file_content or not pdf_filename:
                self._send_error_response(400, 'No valid PDF file found in request')
                return

            conversion_id = str(uuid.uuid4())
            pdf_temp_path = os.path.join(temp_dir, f"{conversion_id}_{pdf_filename}")
            with open(pdf_temp_path, 'wb') as f:
                f.write(pdf_file_content)

            conversion_storage[conversion_id] = {
                'conversion_id': conversion_id, 'success': False, 'status': 'processing',
                'filename': None, 'download_url': None, 'error': None, 'metadata': {},
                'method': 'pdf-to-word'
            }

            def convert_async():
                try:
                    result = convert_pdf_file(pdf_temp_path, temp_dir)
                    if result['success']:
                        base_name = os.path.splitext(pdf_filename)[0]
                        output_filename = f"{conversion_id}_{base_name}_converted.docx"
                        final_output_path = os.path.join(temp_dir, output_filename)
                        if os.path.exists(result['output_path']):
                            shutil.move(result['output_path'], final_output_path)
                            result['output_path'] = final_output_path
                            result['filename'] = output_filename
                        else:
                            result['filename'] = os.path.basename(result.get('output_path', 'unknown_output.docx'))
                    result['conversion_id'] = conversion_id
                    conversion_storage[conversion_id].update({
                        'success': True, 'status': 'completed', 'filename': result.get('filename'),
                        'download_url': f'/api/download/{conversion_id}/{result.get("filename", "")}' if result.get('success') and result.get('filename') else None,
                        'error': None, 'metadata': result.get('metadata', {}), 'method': result.get('method', 'pdf-to-word')
                    })
                    print(f"Updated result for {conversion_id} in conversion_storage")
                    try: os.remove(pdf_temp_path)
                    except: pass
                except Exception as e:
                    print(f"Async conversion error for {conversion_id}: {e}")
                    if conversion_id in conversion_storage:
                        conversion_storage[conversion_id].update({
                            'success': False, 'status': 'failed', 'filename': None,
                            'download_url': None, 'error': f'Conversion failed: {str(e)}',
                            'metadata': {}, 'method': 'pdf-to-word'
                        })
                    else:
                        conversion_storage[conversion_id] = {
                            'conversion_id': conversion_id, 'success': False, 'status': 'failed',
                            'filename': None, 'download_url': None, 'error': f'Conversion failed: {str(e)}',
                            'metadata': {}, 'method': 'pdf-to-word'
                        }
                    print(f"Updated error result for {conversion_id} in conversion_storage")

            thread = threading.Thread(target=convert_async)
            thread.daemon = True
            thread.start()

            self._send_json_response({
                'success': True, 'conversion_id': conversion_id, 'status': 'processing',
                'message': 'PDF to Word conversion started. Use the conversion ID to check status.'
            }, 202)

        except Exception as e:
            self.log_message(f"Error in PDF to Word conversion: {str(e)}")
            self._send_error_response(500, f'Internal server error: {str(e)}')

    def handle_pdf_to_powerpoint_conversion(self):
        """Handle PDF to PowerPoint conversion requests"""
        try:
            content_type = self.headers.get('Content-Type', '')
            if not content_type.startswith('multipart/form-data'):
                self._send_error_response(400, 'Content-Type must be multipart/form-data')
                return

            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._send_error_response(400, 'No file uploaded')
                return

            body = self.rfile.read(content_length)
            boundary = content_type.split('boundary=')[1].encode()
            parts = body.split(b'--' + boundary)

            pdf_file_content = None
            pdf_filename = None

            for part in parts:
                if b'Content-Disposition' in part and b'filename=' in part:
                    lines = part.split(b'\r\n')
                    for line in lines:
                        if b'Content-Disposition' in line:
                            if b'filename=' in line:
                                filename_part = line.split(b'filename=')[1]
                                pdf_filename = filename_part.strip(b'"').decode('utf-8')
                                break
                    if b'\r\n\r\n' in part:
                        pdf_file_content = part.split(b'\r\n\r\n', 1)[1]
                        if pdf_file_content.endswith(b'\r\n'):
                            pdf_file_content = pdf_file_content[:-2]
                        break

            if not pdf_file_content or not pdf_filename:
                self._send_error_response(400, 'No valid PDF file found in request')
                return

            conversion_id = str(uuid.uuid4())
            pdf_temp_path = os.path.join(temp_dir, f"{conversion_id}_{pdf_filename}")
            with open(pdf_temp_path, 'wb') as f:
                f.write(pdf_file_content)

            conversion_storage[conversion_id] = {
                'conversion_id': conversion_id, 'success': False, 'status': 'processing',
                'filename': None, 'download_url': None, 'error': None, 'metadata': {},
                'method': 'pdf-to-powerpoint'
            }

            def convert_async():
                try:
                    result = powerpoint_converter.convert_pdf_to_powerpoint(pdf_temp_path)
                    if result['success']:
                        base_name = os.path.splitext(pdf_filename)[0]
                        output_filename = f"{conversion_id}_{base_name}_converted.pptx"
                        final_output_path = os.path.join(temp_dir, output_filename)
                        if os.path.exists(result['output_path']):
                            shutil.move(result['output_path'], final_output_path)
                            result['output_path'] = final_output_path
                            result['filename'] = output_filename
                        else:
                            result['filename'] = os.path.basename(result.get('output_path', 'unknown_output.pptx'))
                    result['conversion_id'] = conversion_id
                    conversion_storage[conversion_id].update({
                        'success': True, 'status': 'completed', 'filename': result.get('filename'),
                        'download_url': f'/api/download/{conversion_id}/{result.get("filename", "")}' if result.get('success') and result.get('filename') else None,
                        'error': None, 'metadata': result.get('metadata', {}), 'method': result.get('method', 'pdf-to-powerpoint')
                    })
                    print(f"Updated result for {conversion_id} in conversion_storage")
                    try: os.remove(pdf_temp_path)
                    except: pass
                except Exception as e:
                    print(f"Async conversion error for {conversion_id}: {e}")
                    if conversion_id in conversion_storage:
                        conversion_storage[conversion_id].update({
                            'success': False, 'status': 'failed', 'filename': None,
                            'download_url': None, 'error': f'PowerPoint conversion failed: {str(e)}',
                            'metadata': {}, 'method': 'pdf-to-powerpoint'
                        })
                    else:
                        conversion_storage[conversion_id] = {
                            'conversion_id': conversion_id, 'success': False, 'status': 'failed',
                            'filename': None, 'download_url': None, 'error': f'PowerPoint conversion failed: {str(e)}',
                            'metadata': {}, 'method': 'pdf-to-powerpoint'
                        }
                    print(f"Updated error result for {conversion_id} in conversion_storage")

            thread = threading.Thread(target=convert_async)
            thread.daemon = True
            thread.start()

            self._send_json_response({
                'success': True, 'conversion_id': conversion_id,
                'message': 'PDF to PowerPoint conversion started',
                'status_url': f'/api/status/{conversion_id}'
            }, 202)

        except Exception as e:
            self.log_message(f"Error in PDF to PowerPoint conversion: {e}")
            self._send_error_response(500, f'Conversion failed: {str(e)}')

    def handle_pdf_to_excel_conversion(self):
        """Handle PDF to Excel conversion requests"""
        try:
            content_type = self.headers.get('Content-Type', '')
            if not content_type.startswith('multipart/form-data'):
                self._send_error_response(400, 'Content-Type must be multipart/form-data')
                return

            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._send_error_response(400, 'No file uploaded')
                return

            body = self.rfile.read(content_length)
            boundary = content_type.split('boundary=')[1].encode()
            parts = body.split(b'--' + boundary)

            pdf_file_content = None
            pdf_filename = None

            for part in parts:
                if b'Content-Disposition' in part and b'filename=' in part:
                    lines = part.split(b'\r\n')
                    for line in lines:
                        if b'Content-Disposition' in line:
                            if b'filename=' in line:
                                filename_part = line.split(b'filename=')[1]
                                pdf_filename = filename_part.strip(b'"').decode('utf-8')
                                break
                    if b'\r\n\r\n' in part:
                        pdf_file_content = part.split(b'\r\n\r\n', 1)[1]
                        if pdf_file_content.endswith(b'\r\n'):
                            pdf_file_content = pdf_file_content[:-2]
                        break

            if not pdf_file_content or not pdf_filename:
                self._send_error_response(400, 'No valid PDF file found in request')
                return

            conversion_id = str(uuid.uuid4())
            pdf_temp_path = os.path.join(temp_dir, f"{conversion_id}_{pdf_filename}")
            with open(pdf_temp_path, 'wb') as f:
                f.write(pdf_file_content)

            conversion_storage[conversion_id] = {
                'conversion_id': conversion_id, 'success': False, 'status': 'processing',
                'filename': None, 'download_url': None, 'error': None, 'metadata': {},
                'method': 'pdf-to-excel'
            }

            def convert_async():
                try:
                    result = excel_converter.convert_pdf_to_excel(pdf_temp_path)
                    if result['success']:
                        base_name = os.path.splitext(pdf_filename)[0]
                        output_filename = f"{conversion_id}_{base_name}_converted.xlsx"
                        final_output_path = os.path.join(temp_dir, output_filename)
                        if os.path.exists(result['output_path']):
                            shutil.move(result['output_path'], final_output_path)
                            result['output_path'] = final_output_path
                            result['filename'] = output_filename
                        else:
                            result['filename'] = os.path.basename(result.get('output_path', 'unknown_output.xlsx'))
                    result['conversion_id'] = conversion_id
                    conversion_storage[conversion_id].update({
                        'success': True, 'status': 'completed', 'filename': result.get('filename'),
                        'download_url': f'/api/download/{conversion_id}/{result.get("filename", "")}' if result.get('success') and result.get('filename') else None,
                        'error': None, 'metadata': result.get('metadata', {}), 'method': result.get('method', 'pdf-to-excel')
                    })
                    print(f"Updated result for {conversion_id} in conversion_storage")
                    try: os.remove(pdf_temp_path)
                    except: pass
                except Exception as e:
                    print(f"Async conversion error for {conversion_id}: {e}")
                    if conversion_id in conversion_storage:
                        conversion_storage[conversion_id].update({
                            'success': False, 'status': 'failed', 'filename': None,
                            'download_url': None, 'error': f'Excel conversion failed: {str(e)}',
                            'metadata': {}, 'method': 'pdf-to-excel'
                        })
                    else:
                        conversion_storage[conversion_id] = {
                            'conversion_id': conversion_id, 'success': False, 'status': 'failed',
                            'filename': None, 'download_url': None, 'error': f'Excel conversion failed: {str(e)}',
                            'metadata': {}, 'method': 'pdf-to-excel'
                        }
                    print(f"Updated error result for {conversion_id} in conversion_storage")

            thread = threading.Thread(target=convert_async)
            thread.daemon = True
            thread.start()

            self._send_json_response({
                'success': True, 'conversion_id': conversion_id,
                'message': 'PDF to Excel conversion started',
                'status_url': f'/api/status/{conversion_id}'
            }, 202)

        except Exception as e:
            self.log_message(f"Error in PDF to Excel conversion: {e}")
            self._send_error_response(500, f'Conversion failed: {str(e)}')

    def handle_pdf_to_jpg_conversion(self):
        """Handle PDF to JPG conversion requests"""
        try:
            content_type = self.headers.get('Content-Type', '')
            if not content_type.startswith('multipart/form-data'):
                self._send_error_response(400, 'Content-Type must be multipart/form-data')
                return

            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._send_error_response(400, 'No file uploaded')
                return

            body = self.rfile.read(content_length)
            boundary = content_type.split('boundary=')[1].encode()
            parts = body.split(b'--' + boundary)

            pdf_file_content = None
            pdf_filename = None
            conversion_options = {
                'output_format': 'jpg', 'dpi': 300, 'quality': 95, 'page_range': 'all'
            }

            for part in parts:
                if b'Content-Disposition' in part:
                    lines = part.split(b'\r\n')
                    for line in lines:
                        if b'Content-Disposition' in line:
                            if b'filename=' in line:
                                filename_part = line.split(b'filename=')[1]
                                pdf_filename = filename_part.strip(b'"').decode('utf-8')
                            elif b'name=' in line:
                                name_part = line.split(b'name=')[1].strip(b'"').decode('utf-8')
                                if name_part in ['format', 'quality', 'dpi', 'pageRange']:
                                    value = part.split(b'\r\n\r\n', 1)[1].strip(b'\r\n').decode('utf-8')
                                    if name_part == 'format': conversion_options['output_format'] = value
                                    elif name_part == 'quality': conversion_options['quality'] = int(value) if value.isdigit() else 95
                                    elif name_part == 'dpi': conversion_options['dpi'] = int(value) if value.isdigit() else 300
                                    elif name_part == 'pageRange': conversion_options['page_range'] = value
                    if b'filename=' in part and b'\r\n\r\n' in part:
                        pdf_file_content = part.split(b'\r\n\r\n', 1)[1]
                        if pdf_file_content.endswith(b'\r\n'):
                            pdf_file_content = pdf_file_content[:-2]

            if not pdf_file_content or not pdf_filename:
                self._send_error_response(400, 'No valid PDF file found in request')
                return

            conversion_id = str(uuid.uuid4())
            pdf_temp_path = os.path.join(temp_dir, f"{conversion_id}_{pdf_filename}")
            with open(pdf_temp_path, 'wb') as f:
                f.write(pdf_file_content)

            conversion_storage[conversion_id] = {
                'conversion_id': conversion_id, 'success': False, 'status': 'processing',
                'filename': None, 'download_url': None, 'error': None, 'metadata': {},
                'method': 'pdf-to-jpg'
            }

            def convert_async():
                try:
                    print(f"Starting background conversion for {conversion_id}")
                    result = jpg_converter.convert_pdf_to_jpg(
                        pdf_temp_path,
                        output_format=conversion_options['output_format'],
                        dpi=conversion_options['dpi'],
                        quality=conversion_options['quality'],
                        page_range=conversion_options['page_range']
                    )
                    print(f"Conversion result for {conversion_id}: {result}")
                    if result['success']:
                        base_name = os.path.splitext(pdf_filename)[0]
                        if result.get('pages_converted', 1) == 1:
                            output_filename = f"{conversion_id}_{base_name}_converted.{conversion_options['output_format']}"
                        else:
                            output_filename = f"{conversion_id}_{base_name}_converted_pages.zip"
                        final_output_path = os.path.join(temp_dir, output_filename)
                        if os.path.exists(result['output_path']):
                            shutil.move(result['output_path'], final_output_path)
                            result['output_path'] = final_output_path
                            result['filename'] = output_filename
                        else:
                            result['filename'] = os.path.basename(result.get('output_path', 'unknown_output.jpg'))
                    result['conversion_id'] = conversion_id
                    conversion_storage[conversion_id].update({
                        'success': True, 'status': 'completed', 'filename': result.get('filename'),
                        'download_url': f'/api/download/{conversion_id}/{result.get("filename", "")}' if result.get('success') and result.get('filename') else None,
                        'error': None, 'metadata': result.get('metadata', {}), 'method': result.get('method', 'pdf-to-jpg')
                    })
                    print(f"Stored conversion result for {conversion_id}")
                    try: os.remove(pdf_temp_path)
                    except: pass
                except Exception as e:
                    print(f"Conversion error for {conversion_id}: {str(e)}")
                    if conversion_id in conversion_storage:
                        conversion_storage[conversion_id].update({
                            'success': False, 'status': 'failed', 'filename': None,
                            'download_url': None, 'error': f'JPG conversion failed: {str(e)}',
                            'metadata': {}, 'method': 'pdf-to-jpg'
                        })
                    else:
                        conversion_storage[conversion_id] = {
                            'conversion_id': conversion_id, 'success': False, 'status': 'failed',
                            'filename': None, 'download_url': None, 'error': f'JPG conversion failed: {str(e)}',
                            'metadata': {}, 'method': 'pdf-to-jpg'
                        }
                    print(f"Stored conversion result for {conversion_id}")

            thread = threading.Thread(target=convert_async)
            thread.daemon = True
            thread.start()

            self._send_json_response({
                'success': True, 'conversion_id': conversion_id,
                'message': 'PDF to JPG conversion started',
                'status_url': f'/api/status/{conversion_id}'
            }, 202)

        except Exception as e:
            self.log_message(f"Error in PDF to JPG conversion: {e}")
            self._send_error_response(500, f'Conversion failed: {str(e)}')

    def handle_word_to_pdf_conversion(self):
        """Handle Word to PDF conversion requests"""
        try:
            content_type = self.headers.get('Content-Type', '')
            if not content_type.startswith('multipart/form-data'):
                self._send_error_response(400, 'Content-Type must be multipart/form-data')
                return

            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._send_error_response(400, 'No file uploaded')
                return

            body = self.rfile.read(content_length)
            boundary = content_type.split('boundary=')[1].encode()
            parts = body.split(b'--' + boundary)

            word_file_content = None
            word_filename = None

            for part in parts:
                if b'Content-Disposition' in part and b'filename=' in part:
                    lines = part.split(b'\r\n')
                    for line in lines:
                        if b'Content-Disposition' in line:
                            if b'filename=' in line:
                                filename_part = line.split(b'filename=')[1]
                                word_filename = filename_part.strip(b'"').decode('utf-8')
                                break
                    if b'\r\n\r\n' in part:
                        word_file_content = part.split(b'\r\n\r\n', 1)[1]
                        if word_file_content.endswith(b'\r\n'):
                            word_file_content = word_file_content[:-2]
                        break

            if not word_file_content or not word_filename:
                self._send_error_response(400, 'No valid Word file found in request')
                return

            conversion_id = str(uuid.uuid4())
            word_temp_path = os.path.join(temp_dir, f"{conversion_id}_{word_filename}")
            with open(word_temp_path, 'wb') as f:
                f.write(word_file_content)

            conversion_storage[conversion_id] = {
                'conversion_id': conversion_id, 'success': False, 'status': 'processing',
                'filename': None, 'download_url': None, 'error': None, 'metadata': {},
                'method': 'word-to-pdf'
            }

            def convert_async():
                try:
                    print(f"Starting async Word to PDF conversion for {conversion_id}")
                    result = word_to_pdf_converter.convert_word_to_pdf(word_temp_path)
                    print(f"Conversion result for {conversion_id}: {result}")
                    if result.get('success'):
                        base_name = os.path.splitext(word_filename)[0]
                        output_filename = f"{conversion_id}_{base_name}_converted.pdf"
                        final_output_path = os.path.join(temp_dir, output_filename)
                        try:
                            if os.path.exists(result['output_path']):
                                print(f"Moving file from {result['output_path']} to {final_output_path}")
                                shutil.move(result['output_path'], final_output_path)
                                result['output_path'] = final_output_path
                                result['filename'] = output_filename
                                print(f"File successfully moved to {final_output_path}")
                            else:
                                print(f"Warning: Output file {result['output_path']} does not exist")
                                result['filename'] = os.path.basename(result.get('output_path', 'unknown_output.pdf'))
                        except Exception as move_error:
                            print(f"Error moving file: {move_error}")
                            result['filename'] = os.path.basename(result.get('output_path', 'unknown_output.pdf'))
                    result['conversion_id'] = conversion_id
                    conversion_storage[conversion_id].update({
                        'success': result.get('success', True), 'status': 'completed', 'filename': result.get('filename'),
                        'output_path': result.get('output_path'),
                        'download_url': f'/api/download/{conversion_id}/{result.get("filename", "")}' if result.get('success') and result.get('filename') else None,
                        'error': None, 'metadata': result.get('metadata', {}), 'method': result.get('method', 'word-to-pdf')
                    })
                    print(f"Stored result for {conversion_id} in conversion_storage")
                    try:
                        os.remove(word_temp_path)
                        print(f"Cleaned up temp file {word_temp_path}")
                    except:
                        pass
                except Exception as e:
                    print(f"Exception in convert_async for {conversion_id}: {str(e)}")
                    if conversion_id in conversion_storage:
                        conversion_storage[conversion_id].update({
                            'success': False, 'status': 'failed', 'filename': None,
                            'download_url': None, 'error': f'Word to PDF conversion failed: {str(e)}',
                            'metadata': {}, 'method': 'word-to-pdf'
                        })
                    else:
                        conversion_storage[conversion_id] = {
                            'conversion_id': conversion_id, 'success': False, 'status': 'failed',
                            'filename': None, 'download_url': None, 'error': f'Word to PDF conversion failed: {str(e)}',
                            'metadata': {}, 'method': 'word-to-pdf'
                        }
                    print(f"Stored error result for {conversion_id}")
                print(f"Async conversion completed for {conversion_id}. Available conversions: {list(conversion_storage.keys())}")

            thread = threading.Thread(target=convert_async)
            thread.daemon = True
            thread.start()

            self._send_json_response({
                'success': True, 'conversion_id': conversion_id,
                'message': 'Word to PDF conversion started',
                'status_url': f'/api/status/{conversion_id}'
            }, 202)

        except Exception as e:
            self.log_message(f"Error in Word to PDF conversion: {e}")
            self._send_error_response(500, f'Conversion failed: {str(e)}')

    def handle_powerpoint_to_pdf_conversion(self):
        """Handle PowerPoint to PDF conversion requests"""
        try:
            content_type = self.headers.get('Content-Type', '')
            if not content_type.startswith('multipart/form-data'):
                self._send_error_response(400, 'Content-Type must be multipart/form-data')
                return

            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._send_error_response(400, 'No file uploaded')
                return

            body = self.rfile.read(content_length)
            boundary = content_type.split('boundary=')[1].encode()
            parts = body.split(b'--' + boundary)

            pptx_file_content = None
            pptx_filename = None

            for part in parts:
                if b'Content-Disposition' in part and b'filename=' in part:
                    lines = part.split(b'\r\n')
                    for line in lines:
                        if b'Content-Disposition' in line:
                            if b'filename=' in line:
                                filename_part = line.split(b'filename=')[1]
                                pptx_filename = filename_part.strip(b'"').decode('utf-8')
                                break
                    if b'\r\n\r\n' in part:
                        pptx_file_content = part.split(b'\r\n\r\n', 1)[1]
                        if pptx_file_content.endswith(b'\r\n'):
                            pptx_file_content = pptx_file_content[:-2]
                        break

            if not pptx_file_content or not pptx_filename:
                self._send_error_response(400, 'No valid PowerPoint file found in request')
                return

            conversion_id = str(uuid.uuid4())
            pptx_temp_path = os.path.join(temp_dir, f"{conversion_id}_{pptx_filename}")
            with open(pptx_temp_path, 'wb') as f:
                f.write(pptx_file_content)

            conversion_storage[conversion_id] = {
                'conversion_id': conversion_id, 'success': False, 'status': 'processing',
                'filename': None, 'download_url': None, 'error': None, 'metadata': {},
                'method': 'powerpoint-to-pdf'
            }

            def convert_async():
                try:
                    print(f"Starting async PowerPoint to PDF conversion for {conversion_id}")
                    result = powerpoint_to_pdf_converter.convert_powerpoint_to_pdf(pptx_temp_path)
                    print(f"Conversion result for {conversion_id}: {result}")
                    if result.get('success'):
                        base_name = os.path.splitext(pptx_filename)[0]
                        output_filename = f"{conversion_id}_{base_name}_converted.pdf"
                        final_output_path = os.path.join(temp_dir, output_filename)
                        try:
                            if os.path.exists(result['output_path']):
                                print(f"Moving file from {result['output_path']} to {final_output_path}")
                                shutil.move(result['output_path'], final_output_path)
                                result['output_path'] = final_output_path
                                result['filename'] = output_filename
                                print(f"File successfully moved to {final_output_path}")
                            else:
                                print(f"Warning: Output file {result['output_path']} does not exist")
                                result['filename'] = os.path.basename(result.get('output_path', 'unknown_output.pdf'))
                        except Exception as move_error:
                            print(f"Error moving file: {move_error}")
                            result['filename'] = os.path.basename(result.get('output_path', 'unknown_output.pdf'))
                    result['conversion_id'] = conversion_id
                    conversion_storage[conversion_id].update({
                        'success': result.get('success', True), 'status': 'completed', 'filename': result.get('filename'),
                        'output_path': result.get('output_path'),
                        'download_url': f'/api/download/{conversion_id}/{result.get("filename", "")}' if result.get('success') and result.get('filename') else None,
                        'error': None, 'metadata': result.get('metadata', {}), 'method': result.get('method', 'powerpoint-to-pdf')
                    })
                    print(f"Stored result for {conversion_id} in conversion_storage")
                    try:
                        os.remove(pptx_temp_path)
                        print(f"Cleaned up temp file {pptx_temp_path}")
                    except:
                        pass
                except Exception as e:
                    print(f"Exception in convert_async for {conversion_id}: {str(e)}")
                    if conversion_id in conversion_storage:
                        conversion_storage[conversion_id].update({
                            'success': False, 'status': 'failed', 'filename': None,
                            'download_url': None, 'error': f'PowerPoint to PDF conversion failed: {str(e)}',
                            'metadata': {}, 'method': 'powerpoint-to-pdf'
                        })
                    else:
                        conversion_storage[conversion_id] = {
                            'conversion_id': conversion_id, 'success': False, 'status': 'failed',
                            'filename': None, 'download_url': None, 'error': f'PowerPoint to PDF conversion failed: {str(e)}',
                            'metadata': {}, 'method': 'powerpoint-to-pdf'
                        }
                    print(f"Stored error result for {conversion_id}")
                print(f"Async conversion completed for {conversion_id}. Available conversions: {list(conversion_storage.keys())}")

            thread = threading.Thread(target=convert_async)
            thread.daemon = True
            thread.start()

            self._send_json_response({
                'success': True, 'conversion_id': conversion_id,
                'message': 'PowerPoint to PDF conversion started',
                'status_url': f'/api/status/{conversion_id}'
            }, 202)

        except Exception as e:
            self.log_message(f"Error in PowerPoint to PDF conversion: {e}")
            self._send_error_response(500, f'Conversion failed: {str(e)}')

    def handle_excel_to_pdf_conversion(self):
        """Handle Excel to PDF conversion requests"""
        try:
            content_type = self.headers.get('Content-Type', '')
            if not content_type.startswith('multipart/form-data'):
                self._send_error_response(400, 'Content-Type must be multipart/form-data')
                return

            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._send_error_response(400, 'No file uploaded')
                return

            body = self.rfile.read(content_length)
            boundary = content_type.split('boundary=')[1].encode()
            parts = body.split(b'--' + boundary)

            excel_file_content = None
            excel_filename = None

            for part in parts:
                if b'Content-Disposition' in part and b'filename=' in part:
                    lines = part.split(b'\r\n')
                    for line in lines:
                        if b'Content-Disposition' in line:
                            if b'filename=' in line:
                                filename_part = line.split(b'filename=')[1]
                                excel_filename = filename_part.strip(b'"').decode('utf-8')
                                break
                    if b'\r\n\r\n' in part:
                        excel_file_content = part.split(b'\r\n\r\n', 1)[1]
                        if excel_file_content.endswith(b'\r\n'):
                            excel_file_content = excel_file_content[:-2]
                        break

            if not excel_file_content or not excel_filename:
                self._send_error_response(400, 'No valid Excel file found in request')
                return

            conversion_id = str(uuid.uuid4())
            excel_temp_path = os.path.join(temp_dir, f"{conversion_id}_{excel_filename}")
            with open(excel_temp_path, 'wb') as f:
                f.write(excel_file_content)

            conversion_storage[conversion_id] = {
                'conversion_id': conversion_id, 'success': False, 'status': 'processing',
                'filename': None, 'download_url': None, 'error': None, 'metadata': {},
                'method': 'excel-to-pdf'
            }

            def convert_async():
                try:
                    print(f"Starting async Excel to PDF conversion for {conversion_id}")
                    result = excel_to_pdf_converter.convert_excel_to_pdf(excel_temp_path)
                    print(f"Conversion result for {conversion_id}: {result}")
                    if result.get('success'):
                        base_name = os.path.splitext(excel_filename)[0]
                        output_filename = f"{conversion_id}_{base_name}_converted.pdf"
                        final_output_path = os.path.join(temp_dir, output_filename)
                        try:
                            if os.path.exists(result['output_path']):
                                print(f"Moving file from {result['output_path']} to {final_output_path}")
                                shutil.move(result['output_path'], final_output_path)
                                result['output_path'] = final_output_path
                                result['filename'] = output_filename
                                print(f"File successfully moved to {final_output_path}")
                            else:
                                print(f"Warning: Output file {result['output_path']} does not exist")
                                result['filename'] = os.path.basename(result.get('output_path', 'unknown_output.pdf'))
                        except Exception as move_error:
                            print(f"Error moving file: {move_error}")
                            result['filename'] = os.path.basename(result.get('output_path', 'unknown_output.pdf'))
                    result['conversion_id'] = conversion_id
                    conversion_storage[conversion_id].update({
                        'success': result.get('success', True), 'status': 'completed', 'filename': result.get('filename'),
                        'output_path': result.get('output_path'),
                        'download_url': f'/api/download/{conversion_id}/{result.get("filename", "")}' if result.get('success') and result.get('filename') else None,
                        'error': None, 'metadata': result.get('metadata', {}), 'method': result.get('method', 'excel-to-pdf')
                    })
                    print(f"Stored result for {conversion_id} in conversion_storage")
                    try:
                        os.remove(excel_temp_path)
                        print(f"Cleaned up temp file {excel_temp_path}")
                    except:
                        pass
                except Exception as e:
                    print(f"Exception in convert_async for {conversion_id}: {str(e)}")
                    if conversion_id in conversion_storage:
                        conversion_storage[conversion_id].update({
                            'success': False, 'status': 'failed', 'filename': None,
                            'download_url': None, 'error': f'Excel to PDF conversion failed: {str(e)}',
                            'metadata': {}, 'method': 'excel-to-pdf'
                        })
                    else:
                        conversion_storage[conversion_id] = {
                            'conversion_id': conversion_id, 'success': False, 'status': 'failed',
                            'filename': None, 'download_url': None, 'error': f'Excel to PDF conversion failed: {str(e)}',
                            'metadata': {}, 'method': 'excel-to-pdf'
                        }
                    print(f"Stored error result for {conversion_id}")
                print(f"Async conversion completed for {conversion_id}. Available conversions: {list(conversion_storage.keys())}")

            thread = threading.Thread(target=convert_async)
            thread.daemon = True
            thread.start()

            self._send_json_response({
                'success': True, 'conversion_id': conversion_id,
                'message': 'Excel to PDF conversion started',
                'status_url': f'/api/status/{conversion_id}'
            }, 202)

        except Exception as e:
            self.log_message(f"Error in Excel to PDF conversion: {e}")
            self._send_error_response(500, f'Conversion failed: {str(e)}')

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
    print("  POST /api/convert/pdf-to-jpg - PDF to JPG conversion")
    print("  POST /api/convert/word-to-pdf - Word to PDF conversion")
    print("  POST /api/convert/powerpoint-to-pdf - PowerPoint to PDF conversion")
    print("  POST /api/convert/excel-to-pdf - Excel to PDF conversion")
    print("  POST /api/convert/html-to-pdf - HTML to PDF conversion")
    print("  GET /api/status/{id} - Check conversion status")
    print("  GET /api/download/{id}/{filename} - Download converted files")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.shutdown()

if __name__ == '__main__':
    run_server()