#!/usr/bin/env python3

import os
import tempfile
import uuid
from pathlib import Path
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pdf2docx import Converter
from werkzeug.utils import secure_filename
import traceback

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

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def cleanup_file(filepath):
    """Safely remove a file if it exists"""
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
    except Exception as e:
        print(f"Warning: Could not remove file {filepath}: {e}")

@app.route('/api/convert/pdf-to-word', methods=['POST'])
def convert_pdf_to_word():
    try:
        # Check if file is present in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']

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

        # Convert PDF to Word
        try:
            cv = Converter(pdf_path)
            cv.convert(docx_path, start=0)
            cv.close()

            # Cleanup input file
            cleanup_file(pdf_path)

            # Check if conversion was successful
            if not os.path.exists(docx_path):
                return jsonify({'error': 'Conversion failed. Output file was not created.'}), 500

            return jsonify({
                'success': True,
                'message': 'PDF converted to Word successfully',
                'download_id': unique_id,
                'filename': docx_filename
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
        # Note: In production, you might want to implement a cleanup job
        def cleanup_after_download():
            import threading
            import time
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
    return jsonify({'status': 'healthy', 'service': 'PDF to Word Converter'})

@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File too large. Maximum size is 16MB.'}), 413

if __name__ == '__main__':
    # Set maximum file size to 16MB
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

    # Run the Flask app
    port = int(os.environ.get('PORT', os.environ.get('PYTHON_PORT', 8001)))
    app.run(host='127.0.0.1', port=port, debug=True)