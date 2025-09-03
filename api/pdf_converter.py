
#!/usr/bin/env python3

import os
import tempfile
import uuid
import requests
import time
from pathlib import Path
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import traceback
import threading

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
ALLOWED_EXTENSIONS = {'pdf'}

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# Use absolute paths relative to project root
UPLOAD_FOLDER = os.path.join(PROJECT_ROOT, 'uploads')
OUTPUT_FOLDER = os.path.join(PROJECT_ROOT, 'outputs')

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# iLoveAPI.com configuration
ILOVEAPI_BASE_URL = "https://api.iloveapi.com"
ILOVEAPI_ENDPOINTS = {
    'pdf_to_word': '/api/ilovepdf/pdf-to-word',
    'task_status': '/api/ilovepdf/task',
    'download': '/api/ilovepdf/download'
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def cleanup_file(filepath):
    """Safely remove a file if it exists"""
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
    except Exception as e:
        print(f"Warning: Could not remove file {filepath}: {e}")

def convert_pdf_to_word_iloveapi(pdf_path: str, output_path: str) -> dict:
    """Convert PDF to Word using iLoveAPI.com"""
    try:
        # Step 1: Upload file and start conversion
        with open(pdf_path, 'rb') as pdf_file:
            files = {'file': pdf_file}
            
            upload_response = requests.post(
                f"{ILOVEAPI_BASE_URL}{ILOVEAPI_ENDPOINTS['pdf_to_word']}",
                files=files,
                timeout=60
            )
            
            if upload_response.status_code != 200:
                return {
                    'success': False,
                    'error': f'Upload failed: {upload_response.status_code}',
                    'details': upload_response.text
                }
            
            upload_result = upload_response.json()
            task_id = upload_result.get('taskId') or upload_result.get('task_id')
            
            if not task_id:
                return {
                    'success': False,
                    'error': 'No task ID received from API',
                    'details': upload_result
                }
        
        # Step 2: Poll for completion
        max_attempts = 60  # 5 minutes max
        attempt = 0
        
        while attempt < max_attempts:
            status_response = requests.get(
                f"{ILOVEAPI_BASE_URL}{ILOVEAPI_ENDPOINTS['task_status']}/{task_id}",
                timeout=30
            )
            
            if status_response.status_code != 200:
                return {
                    'success': False,
                    'error': f'Status check failed: {status_response.status_code}',
                    'details': status_response.text
                }
            
            status_result = status_response.json()
            status = status_result.get('status', '').lower()
            
            if status == 'completed' or status == 'success':
                download_url = status_result.get('downloadUrl') or status_result.get('download_url')
                if download_url:
                    # Step 3: Download the converted file
                    download_response = requests.get(download_url, timeout=120)
                    
                    if download_response.status_code == 200:
                        with open(output_path, 'wb') as output_file:
                            output_file.write(download_response.content)
                        
                        return {
                            'success': True,
                            'message': 'Conversion completed successfully',
                            'method': 'iLoveAPI.com'
                        }
                    else:
                        return {
                            'success': False,
                            'error': f'Download failed: {download_response.status_code}'
                        }
                else:
                    return {
                        'success': False,
                        'error': 'No download URL provided',
                        'details': status_result
                    }
            
            elif status == 'failed' or status == 'error':
                error_msg = status_result.get('error', 'Conversion failed')
                return {
                    'success': False,
                    'error': f'Conversion failed: {error_msg}',
                    'details': status_result
                }
            
            elif status == 'processing' or status == 'pending':
                # Continue polling
                time.sleep(5)
                attempt += 1
            else:
                return {
                    'success': False,
                    'error': f'Unknown status: {status}',
                    'details': status_result
                }
        
        return {
            'success': False,
            'error': 'Conversion timeout - took longer than 5 minutes'
        }
    
    except requests.exceptions.RequestException as e:
        return {
            'success': False,
            'error': f'API request failed: {str(e)}'
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Conversion error: {str(e)}'
        }

def batch_convert_pdfs_iloveapi(pdf_paths: list, output_dir: str) -> dict:
    """Convert multiple PDFs using iLoveAPI.com"""
    results = []
    
    for pdf_path in pdf_paths:
        try:
            filename = os.path.basename(pdf_path)
            name_without_ext = os.path.splitext(filename)[0]
            unique_id = str(uuid.uuid4())
            
            docx_filename = f"{name_without_ext}_{unique_id}.docx"
            docx_path = os.path.join(output_dir, docx_filename)
            
            # Convert using iLoveAPI
            conversion_result = convert_pdf_to_word_iloveapi(pdf_path, docx_path)
            
            results.append({
                'original_file': filename,
                'output_file': docx_filename if conversion_result['success'] else None,
                'download_id': unique_id if conversion_result['success'] else None,
                'success': conversion_result['success'],
                'error': conversion_result.get('error') if not conversion_result['success'] else None,
                'method': conversion_result.get('method', 'iLoveAPI.com')
            })
            
        except Exception as e:
            results.append({
                'original_file': os.path.basename(pdf_path),
                'success': False,
                'error': str(e),
                'method': 'iLoveAPI.com'
            })
    
    return {'results': results}

@app.route('/api/convert/pdf-to-word', methods=['POST'])
def convert_pdf_to_word():
    try:
        # Check if file is present in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        conversion_mode = request.form.get('mode', 'standard')  # For compatibility

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only PDF files are allowed.'}), 400

        # Generate unique filename to avoid conflicts
        unique_id = str(uuid.uuid4())
        original_filename = secure_filename(file.filename or 'uploaded_file.pdf')
        filename_without_ext = os.path.splitext(original_filename)[0]

        # Save uploaded file
        pdf_path = os.path.join(UPLOAD_FOLDER, f"{unique_id}_{original_filename}")
        file.save(pdf_path)

        # Generate output path
        docx_filename = f"{filename_without_ext}_{unique_id}.docx"
        docx_path = os.path.join(OUTPUT_FOLDER, docx_filename)

        # Convert PDF to Word using iLoveAPI.com
        try:
            conversion_result = convert_pdf_to_word_iloveapi(pdf_path, docx_path)
            
            # Cleanup input file
            cleanup_file(pdf_path)
            
            if not conversion_result['success']:
                return jsonify({
                    'error': f"Conversion failed: {conversion_result['error']}"
                }), 500
            
            # Check if output file was created
            if not os.path.exists(docx_path):
                return jsonify({'error': 'Conversion failed. Output file was not created.'}), 500

            return jsonify({
                'success': True,
                'message': conversion_result['message'],
                'download_id': unique_id,
                'filename': docx_filename,
                'conversion_method': conversion_result['method'],
                'file_size': os.path.getsize(docx_path)
            })

        except Exception as conv_error:
            # Cleanup files on conversion error
            cleanup_file(pdf_path)
            cleanup_file(docx_path)
            print(f"Conversion error: {conv_error}")
            print(traceback.format_exc())
            return jsonify({'error': f'Conversion failed: {str(conv_error)}'}), 500

    except Exception as e:
        print(f"General error: {e}")
        print(traceback.format_exc())
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/convert/pdf-to-word/batch', methods=['POST'])
def batch_convert_pdf_to_word():
    """Handle batch conversion of multiple PDFs"""
    try:
        files = request.files.getlist('files')
        conversion_mode = request.form.get('mode', 'standard')  # For compatibility

        if not files:
            return jsonify({'error': 'No files provided'}), 400

        pdf_paths = []
        file_info = []

        # Save all uploaded files
        for file in files:
            if file.filename and allowed_file(file.filename):
                unique_id = str(uuid.uuid4())
                original_filename = secure_filename(file.filename)
                pdf_path = os.path.join(UPLOAD_FOLDER, f"{unique_id}_{original_filename}")
                file.save(pdf_path)

                pdf_paths.append(pdf_path)
                file_info.append({
                    'original_name': original_filename,
                    'unique_id': unique_id,
                    'path': pdf_path
                })

        if not pdf_paths:
            return jsonify({'error': 'No valid PDF files found'}), 400

        # Process batch conversion
        results = batch_convert_pdfs_iloveapi(pdf_paths, OUTPUT_FOLDER)

        # Cleanup input files
        for pdf_path in pdf_paths:
            cleanup_file(pdf_path)

        successful_conversions = sum(1 for result in results['results'] if result['success'])
        
        return jsonify({
            'success': True,
            'message': f'Batch conversion completed. {successful_conversions}/{len(results["results"])} files processed successfully.',
            'results': results['results']
        })

    except Exception as e:
        print(f"Batch conversion error: {e}")
        print(traceback.format_exc())
        return jsonify({'error': f'Batch conversion failed: {str(e)}'}), 500

@app.route('/api/download/<download_id>/<filename>', methods=['GET'])
def download_file(download_id, filename):
    try:
        file_path = os.path.join(OUTPUT_FOLDER, filename)

        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404

        # Create response with the file
        response = send_file(
            file_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )

        # Schedule file cleanup after download
        def cleanup_after_download():
            def delayed_cleanup():
                time.sleep(30)  # Wait 30 seconds before cleanup
                cleanup_file(file_path)
            threading.Thread(target=delayed_cleanup).start()

        cleanup_after_download()

        return response

    except Exception as e:
        print(f"Download error: {e}")
        print(traceback.format_exc())
        return jsonify({'error': f'Download failed: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy', 
        'service': 'PDF to Word Converter (iLoveAPI.com)',
        'features': [
            'PDF to Word conversion via iLoveAPI.com',
            'Batch processing support',
            'High-quality conversion',
            'Cloud-based processing'
        ],
        'api_provider': 'iLoveAPI.com'
    })

@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File too large. Maximum size is 16MB.'}), 413

if __name__ == '__main__':
    # Set maximum file size to 16MB
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

    # Run the Flask app
    port = int(os.environ.get('PORT', os.environ.get('PYTHON_PORT', 8000)))
    app.run(host='0.0.0.0', port=port, debug=False)
