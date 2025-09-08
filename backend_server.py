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

# Global storage for conversion results
conversion_storage = {}
temp_dir = tempfile.mkdtemp()

# Initialize converters
powerpoint_converter = PDFToPowerPointConverter(temp_dir)
excel_converter = PDFToExcelConverter(temp_dir)
jpg_converter = PDFToJPGConverter(temp_dir)
word_to_pdf_converter = WordToPDFConverter(temp_dir) # Initialize the new converter

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
                'features': ['pdf-to-word-conversion', 'pdf-to-powerpoint-conversion', 'pdf-to-excel-conversion', 'pdf-to-jpg-conversion', 'word-to-pdf-conversion', 'advanced-formatting', 'image-preservation']
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

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)

        if parsed_path.path == '/api/convert/pdf-to-word':
            self.handle_pdf_to_word_conversion()
        elif parsed_path.path == '/api/convert/pdf-to-powerpoint':
            self.handle_pdf_to_powerpoint_conversion()
        elif parsed_path.path == '/api/convert/pdf-to-excel':
            self.handle_pdf_to_excel_conversion()
        elif parsed_path.path == '/api/convert/pdf-to-jpg':
            self.handle_pdf_to_jpg_conversion()
        elif parsed_path.path == '/api/convert/word-to-pdf': # Added handler for Word to PDF
            self.handle_word_to_pdf_conversion()
        else:
            # Handle other POST requests
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            response = {'error': 'Endpoint not found'}
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

            # Initialize conversion storage entry
            conversion_storage[conversion_id] = {
                'conversion_id': conversion_id,
                'success': False,
                'status': 'processing',
                'filename': None,
                'download_url': None,
                'error': None,
                'metadata': {},
                'method': 'pdf-to-word'
            }

            # Start conversion in a background thread
            def convert_async():
                try:
                    result = convert_pdf_file(pdf_temp_path, temp_dir)
                    result['conversion_id'] = conversion_id

                    if result.get('success'):
                        base_name = os.path.splitext(pdf_filename)[0]
                        output_filename = f"{conversion_id}_{base_name}_converted.docx"
                        final_output_path = os.path.join(temp_dir, output_filename)

                        if os.path.exists(result['output_path']):
                            shutil.move(result['output_path'], final_output_path)
                            result['output_path'] = final_output_path
                            result['filename'] = output_filename
                        else:
                            # Handle case where output path is not as expected
                            result['filename'] = os.path.basename(result.get('output_path', 'unknown_output.docx'))

                    # Update with successful result
                    conversion_storage[conversion_id].update({
                        'success': True,
                        'status': 'completed',
                        'filename': result.get('filename'),
                        'download_url': f'/api/download/{conversion_id}/{result.get("filename", "")}' if result.get('success') and result.get('filename') else None,
                        'error': None,
                        'metadata': result.get('metadata', {}),
                        'method': result.get('method', 'pdf-to-word')
                    })
                    print(f"Updated result for {conversion_id} in conversion_storage")

                    # Clean up input file
                    try:
                        os.remove(pdf_temp_path)
                    except:
                        pass

                except Exception as e:
                    print(f"Async conversion error for {conversion_id}: {e}")
                    # Update with error result
                    if conversion_id in conversion_storage:
                        conversion_storage[conversion_id].update({
                            'success': False,
                            'status': 'failed',
                            'filename': None,
                            'download_url': None,
                            'error': f'Conversion failed: {str(e)}',
                            'metadata': {},
                            'method': 'pdf-to-word'
                        })
                    else:
                        # Store error result if not already in storage
                        conversion_storage[conversion_id] = {
                            'conversion_id': conversion_id,
                            'success': False,
                            'status': 'failed',
                            'filename': None,
                            'download_url': None,
                            'error': f'Conversion failed: {str(e)}',
                            'metadata': {},
                            'method': 'pdf-to-word'
                        }
                    print(f"Updated error result for {conversion_id} in conversion_storage")

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

            # Initialize conversion storage entry
            conversion_storage[conversion_id] = {
                'conversion_id': conversion_id,
                'success': False,
                'status': 'processing',
                'filename': None,
                'download_url': None,
                'error': None,
                'metadata': {},
                'method': 'pdf-to-powerpoint'
            }

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
                        else:
                            result['filename'] = os.path.basename(result.get('output_path', 'unknown_output.pptx'))

                    result['conversion_id'] = conversion_id

                    # Update with successful result
                    conversion_storage[conversion_id].update({
                        'success': True,
                        'status': 'completed',
                        'filename': result.get('filename'),
                        'download_url': f'/api/download/{conversion_id}/{result.get("filename", "")}' if result.get('success') and result.get('filename') else None,
                        'error': None,
                        'metadata': result.get('metadata', {}),
                        'method': result.get('method', 'pdf-to-powerpoint')
                    })
                    print(f"Updated result for {conversion_id} in conversion_storage")

                    # Clean up input file
                    try:
                        os.remove(pdf_temp_path)
                    except:
                        pass

                except Exception as e:
                    print(f"Async conversion error for {conversion_id}: {e}")
                    # Update with error result
                    if conversion_id in conversion_storage:
                        conversion_storage[conversion_id].update({
                            'success': False,
                            'status': 'failed',
                            'filename': None,
                            'download_url': None,
                            'error': f'PowerPoint conversion failed: {str(e)}',
                            'metadata': {},
                            'method': 'pdf-to-powerpoint'
                        })
                    else:
                        # Store error result if not already in storage
                        conversion_storage[conversion_id] = {
                            'conversion_id': conversion_id,
                            'success': False,
                            'status': 'failed',
                            'filename': None,
                            'download_url': None,
                            'error': f'PowerPoint conversion failed: {str(e)}',
                            'metadata': {},
                            'method': 'pdf-to-powerpoint'
                        }
                    print(f"Updated error result for {conversion_id} in conversion_storage")

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

            # Initialize conversion storage entry
            conversion_storage[conversion_id] = {
                'conversion_id': conversion_id,
                'success': False,
                'status': 'processing',
                'filename': None,
                'download_url': None,
                'error': None,
                'metadata': {},
                'method': 'pdf-to-excel'
            }

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
                        else:
                            result['filename'] = os.path.basename(result.get('output_path', 'unknown_output.xlsx'))

                    result['conversion_id'] = conversion_id

                    # Update with successful result
                    conversion_storage[conversion_id].update({
                        'success': True,
                        'status': 'completed',
                        'filename': result.get('filename'),
                        'download_url': f'/api/download/{conversion_id}/{result.get("filename", "")}' if result.get('success') and result.get('filename') else None,
                        'error': None,
                        'metadata': result.get('metadata', {}),
                        'method': result.get('method', 'pdf-to-excel')
                    })
                    print(f"Updated result for {conversion_id} in conversion_storage")

                    # Clean up input file
                    try:
                        os.remove(pdf_temp_path)
                    except:
                        pass

                except Exception as e:
                    print(f"Async conversion error for {conversion_id}: {e}")
                    # Update with error result
                    if conversion_id in conversion_storage:
                        conversion_storage[conversion_id].update({
                            'success': False,
                            'status': 'failed',
                            'filename': None,
                            'download_url': None,
                            'error': f'Excel conversion failed: {str(e)}',
                            'metadata': {},
                            'method': 'pdf-to-excel'
                        })
                    else:
                        # Store error result if not already in storage
                        conversion_storage[conversion_id] = {
                            'conversion_id': conversion_id,
                            'success': False,
                            'status': 'failed',
                            'filename': None,
                            'download_url': None,
                            'error': f'Excel conversion failed: {str(e)}',
                            'metadata': {},
                            'method': 'pdf-to-excel'
                        }
                    print(f"Updated error result for {conversion_id} in conversion_storage")

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

    def handle_pdf_to_jpg_conversion(self):
        """Handle PDF to JPG conversion requests"""
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
            conversion_options = {
                'output_format': 'jpg',
                'dpi': 300,
                'quality': 95,
                'page_range': 'all'
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
                                # Parse form fields for conversion options
                                name_part = line.split(b'name=')[1].strip(b'"').decode('utf-8')
                                if name_part in ['format', 'quality', 'dpi', 'pageRange']:
                                    value = part.split(b'\r\n\r\n', 1)[1].strip(b'\r\n').decode('utf-8')
                                    if name_part == 'format':
                                        conversion_options['output_format'] = value
                                    elif name_part == 'quality':
                                        conversion_options['quality'] = int(value) if value.isdigit() else 95
                                    elif name_part == 'dpi':
                                        conversion_options['dpi'] = int(value) if value.isdigit() else 300
                                    elif name_part == 'pageRange':
                                        conversion_options['page_range'] = value

                    # Extract file content
                    if b'filename=' in part and b'\r\n\r\n' in part:
                        pdf_file_content = part.split(b'\r\n\r\n', 1)[1]
                        if pdf_file_content.endswith(b'\r\n'):
                            pdf_file_content = pdf_file_content[:-2]

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

            # Initialize conversion storage entry immediately
            conversion_storage[conversion_id] = {
                'conversion_id': conversion_id,
                'success': False,
                'status': 'processing',
                'filename': None,
                'download_url': None,
                'error': None,
                'metadata': {},
                'method': 'pdf-to-jpg'
            }

            # Start conversion in a background thread
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
                        # Generate output filename
                        base_name = os.path.splitext(pdf_filename)[0]
                        if result.get('pages_converted', 1) == 1:
                            output_filename = f"{conversion_id}_{base_name}_converted.{conversion_options['output_format']}"
                        else:
                            output_filename = f"{conversion_id}_{base_name}_converted_pages.zip"

                        final_output_path = os.path.join(temp_dir, output_filename)

                        # Move converted file to final location
                        if os.path.exists(result['output_path']):
                            shutil.move(result['output_path'], final_output_path)
                            result['output_path'] = final_output_path
                            result['filename'] = output_filename
                        else:
                            result['filename'] = os.path.basename(result.get('output_path', 'unknown_output.jpg'))

                    result['conversion_id'] = conversion_id

                    # Update with successful result
                    conversion_storage[conversion_id].update({
                        'success': True,
                        'status': 'completed',
                        'filename': result.get('filename'),
                        'download_url': f'/api/download/{conversion_id}/{result.get("filename", "")}' if result.get('success') and result.get('filename') else None,
                        'error': None,
                        'metadata': result.get('metadata', {}),
                        'method': result.get('method', 'pdf-to-jpg')
                    })
                    print(f"Stored conversion result for {conversion_id}")

                    # Clean up input file
                    try:
                        os.remove(pdf_temp_path)
                    except:
                        pass

                except Exception as e:
                    print(f"Conversion error for {conversion_id}: {str(e)}")
                    # Update with error result
                    if conversion_id in conversion_storage:
                        conversion_storage[conversion_id].update({
                            'success': False,
                            'status': 'failed',
                            'filename': None,
                            'download_url': None,
                            'error': f'JPG conversion failed: {str(e)}',
                            'metadata': {},
                            'method': 'pdf-to-jpg'
                        })
                    else:
                        # Store error result if not already in storage
                        conversion_storage[conversion_id] = {
                            'conversion_id': conversion_id,
                            'success': False,
                            'status': 'failed',
                            'filename': None,
                            'download_url': None,
                            'error': f'JPG conversion failed: {str(e)}',
                            'metadata': {},
                            'method': 'pdf-to-jpg'
                        }
                    print(f"Stored conversion result for {conversion_id}")

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
                'message': 'PDF to JPG conversion started',
                'status_url': f'/api/status/{conversion_id}'
            }
            self.wfile.write(json.dumps(response).encode())

        except Exception as e:
            print(f"Error in PDF to JPG conversion: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            response = {'error': f'Conversion failed: {str(e)}'}
            self.wfile.write(json.dumps(response).encode())

    def handle_word_to_pdf_conversion(self):
        """Handle Word to PDF conversion requests"""
        try:
            content_type = self.headers.get('Content-Type', '')
            if not content_type.startswith('multipart/form-data'):
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {'error': 'Content-Type must be multipart/form-data'}
                self.wfile.write(json.dumps(response).encode())
                return

            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {'error': 'No file uploaded'}
                self.wfile.write(json.dumps(response).encode())
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
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {'error': 'No valid Word file found in request'}
                self.wfile.write(json.dumps(response).encode())
                return

            conversion_id = str(uuid.uuid4())
            word_temp_path = os.path.join(temp_dir, f"{conversion_id}_{word_filename}")
            with open(word_temp_path, 'wb') as f:
                f.write(word_file_content)

            # Initialize conversion storage entry
            conversion_storage[conversion_id] = {
                'conversion_id': conversion_id,
                'success': False,
                'status': 'processing',
                'filename': None,
                'download_url': None,
                'error': None,
                'metadata': {},
                'method': 'word-to-pdf'
            }

            def convert_async():
                try:
                    print(f"Starting async conversion for {conversion_id}")
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

                    # Update with successful result
                    conversion_storage[conversion_id].update({
                        'success': True,
                        'status': 'completed',
                        'filename': result.get('filename'),
                        'download_url': f'/api/download/{conversion_id}/{result.get("filename", "")}' if result.get('success') and result.get('filename') else None,
                        'error': None,
                        'metadata': result.get('metadata', {}),
                        'method': result.get('method', 'word-to-pdf')
                    })
                    print(f"Stored result for {conversion_id} in conversion_storage")

                    # Clean up input file
                    try:
                        os.remove(word_temp_path)
                        print(f"Cleaned up temp file {word_temp_path}")
                    except:
                        pass

                except Exception as e:
                    print(f"Exception in convert_async for {conversion_id}: {str(e)}")
                    # Update with error result
                    if conversion_id in conversion_storage:
                        conversion_storage[conversion_id].update({
                            'success': False,
                            'status': 'failed',
                            'filename': None,
                            'download_url': None,
                            'error': f'Word to PDF conversion failed: {str(e)}',
                            'metadata': {},
                            'method': 'word-to-pdf'
                        })
                    else:
                        # Store error result if not already in storage
                        conversion_storage[conversion_id] = {
                            'conversion_id': conversion_id,
                            'success': False,
                            'status': 'failed',
                            'filename': None,
                            'download_url': None,
                            'error': f'Word to PDF conversion failed: {str(e)}',
                            'metadata': {},
                            'method': 'word-to-pdf'
                        }
                    print(f"Stored error result for {conversion_id}")

                print(f"Async conversion completed for {conversion_id}. Available conversions: {list(conversion_storage.keys())}")

            thread = threading.Thread(target=convert_async)
            thread.daemon = True
            thread.start()

            self.send_response(202)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {
                'success': True,
                'conversion_id': conversion_id,
                'message': 'Word to PDF conversion started',
                'status_url': f'/api/status/{conversion_id}'
            }
            self.wfile.write(json.dumps(response).encode())

        except Exception as e:
            print(f"Error in Word to PDF conversion: {e}")
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
    print("  POST /api/convert/pdf-to-jpg - PDF to JPG conversion")
    print("  POST /api/convert/word-to-pdf - Word to PDF conversion") # Added endpoint
    print("  GET /api/status/{id} - Check conversion status")
    print("  GET /api/download/{id}/{filename} - Download converted files")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.shutdown()

if __name__ == '__main__':
    run_server()