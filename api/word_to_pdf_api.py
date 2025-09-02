
#!/usr/bin/env python3

import os
import tempfile
import uuid
import threading
import time
from pathlib import Path
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import traceback

# Import our Word to PDF converter
from word_to_pdf_converter import convert_single_file, convert_batch, check_dependencies

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
ALLOWED_EXTENSIONS = {'docx'}

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# Use absolute paths relative to project root
UPLOAD_FOLDER = os.path.join(PROJECT_ROOT, 'uploads')
OUTPUT_FOLDER = os.path.join(PROJECT_ROOT, 'outputs')

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def cleanup_file(filepath):
    """Safely remove a file if it exists"""
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
    except Exception as e:
        print(f"Warning: Could not remove file {filepath}: {e}")

@app.route('/api/convert/word-to-pdf', methods=['POST'])
def convert_word_to_pdf():
    try:
        # Check if file is present in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only DOCX files are allowed.'}), 400

        # Generate unique filename to avoid conflicts
        unique_id = str(uuid.uuid4())
        original_filename = secure_filename(file.filename or 'uploaded_file.docx')
        filename_without_ext = os.path.splitext(original_filename)[0]

        # Save uploaded file
        docx_path = os.path.join(UPLOAD_FOLDER, f"{unique_id}_{original_filename}")
        file.save(docx_path)

        try:
            # Convert DOCX to PDF
            result = convert_single_file(docx_path, OUTPUT_FOLDER)
            
            # Cleanup input file
            cleanup_file(docx_path)

            if not result['success']:
                return jsonify({'error': f"Conversion failed: {result['error']}"}), 500

            # Check if conversion was successful
            if not os.path.exists(result['output_path']):
                return jsonify({'error': 'Conversion failed. Output file was not created.'}), 500

            return jsonify({
                'success': True,
                'message': f'Word document converted to PDF successfully using {result["method"]}',
                'download_id': unique_id,
                'filename': result['output_file'],
                'conversion_method': result['method'],
                'file_size': result['file_size']
            })

        except Exception as conv_error:
            # Cleanup files on conversion error
            cleanup_file(docx_path)
            print(f"Conversion error: {conv_error}")
            print(traceback.format_exc())
            return jsonify({'error': f'Conversion failed: {str(conv_error)}'}), 500

    except Exception as e:
        print(f"General error: {e}")
        print(traceback.format_exc())
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/convert/word-to-pdf/batch', methods=['POST'])
def batch_convert_word_to_pdf():
    """Handle batch conversion of multiple DOCX files"""
    try:
        files = request.files.getlist('files')
        
        if not files:
            return jsonify({'error': 'No files provided'}), 400
        
        docx_paths = []
        file_info = []
        
        # Save all uploaded files
        for file in files:
            if file.filename and allowed_file(file.filename):
                unique_id = str(uuid.uuid4())
                original_filename = secure_filename(file.filename)
                docx_path = os.path.join(UPLOAD_FOLDER, f"{unique_id}_{original_filename}")
                file.save(docx_path)
                
                docx_paths.append(docx_path)
                file_info.append({
                    'original_name': original_filename,
                    'unique_id': unique_id,
                    'path': docx_path
                })
        
        if not docx_paths:
            return jsonify({'error': 'No valid DOCX files found'}), 400
        
        # Process batch conversion
        results = []
        successful_conversions = 0
        
        for info in file_info:
            try:
                result = convert_single_file(info['path'], OUTPUT_FOLDER)
                
                if result['success']:
                    successful_conversions += 1
                    results.append({
                        'original_file': info['original_name'],
                        'output_file': result['output_file'],
                        'download_id': info['unique_id'],
                        'success': True,
                        'method': result['method'],
                        'file_size': result['file_size']
                    })
                else:
                    results.append({
                        'original_file': info['original_name'],
                        'success': False,
                        'error': result['error']
                    })
                    
            except Exception as e:
                results.append({
                    'original_file': info['original_name'],
                    'success': False,
                    'error': str(e)
                })
        
        # Cleanup input files
        for docx_path in docx_paths:
            cleanup_file(docx_path)
        
        return jsonify({
            'success': True,
            'message': f'Batch conversion completed. {successful_conversions}/{len(results)} files converted successfully.',
            'total_files': len(results),
            'successful_conversions': successful_conversions,
            'results': results
        })
        
    except Exception as e:
        print(f"Batch conversion error: {e}")
        print(traceback.format_exc())
        return jsonify({'error': f'Batch conversion failed: {str(e)}'}), 500

@app.route('/api/download/<download_id>/<filename>', methods=['GET'])
def download_pdf_file(download_id, filename):
    try:
        file_path = os.path.join(OUTPUT_FOLDER, filename)

        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404

        # Create response with the file
        response = send_file(
            file_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
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

@app.route('/api/word-to-pdf/health', methods=['GET'])
def health_check():
    # Check which conversion methods are available
    from word_to_pdf_converter import DOCX2PDF_AVAILABLE, FALLBACK_AVAILABLE
    
    methods = []
    if DOCX2PDF_AVAILABLE:
        methods.append('docx2pdf (primary)')
    if FALLBACK_AVAILABLE:
        methods.append('python-docx + reportlab (fallback)')
    
    return jsonify({
        'status': 'healthy', 
        'service': 'Word to PDF Converter',
        'available_methods': methods,
        'features': [
            'High-accuracy formatting preservation',
            'Hybrid conversion strategy',
            'Batch processing support',
            'Cross-platform compatibility',
            'Automatic method selection'
        ]
    })

@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File too large. Maximum size is 16MB.'}), 413

if __name__ == '__main__':
    # Check dependencies on startup
    print("🚀 Starting Word to PDF Converter API...")
    if not check_dependencies():
        print("❌ Critical dependencies missing. Please install required packages.")
        exit(1)
    
    # Set maximum file size to 16MB
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

    # Run the Flask app
    port = int(os.environ.get('PORT', os.environ.get('PYTHON_PORT', 8001)))
    app.run(host='0.0.0.0', port=port, debug=False)
