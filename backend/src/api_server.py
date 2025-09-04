#!/usr/bin/env python3
"""
Flask API Server for PDF to Word Conversion
High-performance backend with advanced conversion capabilities
"""

import os
import uuid
import tempfile
import traceback
import threading
import time
from pathlib import Path
from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

from pdf_converter import convert_pdf_to_word_enhanced, convert_pdf_to_word_advanced

app = Flask(__name__)
CORS(app, origins=["*"], allow_headers=["*"], methods=["*"])

# Configuration
UPLOAD_FOLDER = '../uploads'
OUTPUT_FOLDER = '../outputs'
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# Setup directories
script_dir = Path(__file__).parent
upload_dir = script_dir / UPLOAD_FOLDER
output_dir = script_dir / OUTPUT_FOLDER

upload_dir.mkdir(parents=True, exist_ok=True)
output_dir.mkdir(parents=True, exist_ok=True)


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def cleanup_file(filepath, delay=30):
    """Schedule file cleanup after delay"""
    def delayed_cleanup():
        try:
            time.sleep(delay)
            if os.path.exists(filepath):
                os.remove(filepath)
                print(f"Cleaned up file: {filepath}")
        except Exception as e:
            print(f"Error cleaning up {filepath}: {e}")
    
    threading.Thread(target=delayed_cleanup, daemon=True).start()


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Enhanced PDF to Word Converter',
        'version': '3.0',
        'features': [
            'Multiple conversion modes (Auto, Fast, Accurate, Hybrid)',
            'Auto-detection of scanned vs digital PDFs',
            'OCR support for scanned documents',
            'High-quality PDF to Word conversion',
            'Image preservation and embedding',
            'Table detection and conversion',
            'Font and formatting preservation',
            'Complex layout handling',
            'Fast processing with PyMuPDF'
        ],
        'conversion_modes': {
            'auto': 'Automatically chooses the best method',
            'fast': 'Quick conversion using pdf2docx',
            'accurate': 'Best formatting preservation using PyMuPDF',
            'hybrid': 'Page images with overlaid text',
            'ocr': 'OCR for scanned PDFs'
        }
    })


@app.route('/api/convert/pdf-to-word', methods=['POST'])
def convert_single_pdf():
    """Convert single PDF to Word"""
    try:
        # Validate request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        # Get conversion mode from form data (default to 'auto')
        mode = request.form.get('mode', 'auto').lower().strip()
        
        # Validate mode
        valid_modes = ['auto', 'fast', 'accurate', 'hybrid', 'ocr']
        if mode not in valid_modes:
            return jsonify({
                'error': f'Invalid conversion mode: {mode}. Valid modes are: {", ".join(valid_modes)}'
            }), 400
        
        # Initialize variables to avoid unbound errors
        pdf_path = None
        docx_path = None
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only PDF files are allowed.'}), 400
        
        # Generate unique identifiers
        unique_id = str(uuid.uuid4())
        original_filename = secure_filename(file.filename or 'document.pdf')
        filename_without_ext = Path(original_filename).stem
        
        # Save uploaded file
        pdf_filename = f"{unique_id}_{original_filename}"
        pdf_path = upload_dir / pdf_filename
        file.save(str(pdf_path))
        
        # Generate output path
        docx_filename = f"{filename_without_ext}_{unique_id}.docx"
        docx_path = output_dir / docx_filename
        
        print(f"Converting {pdf_path} to {docx_path} using {mode} mode")
        
        # Perform conversion with selected mode
        conversion_result = convert_pdf_to_word_enhanced(str(pdf_path), str(docx_path), mode)
        
        # Schedule cleanup of input file
        cleanup_file(str(pdf_path), delay=5)
        
        if not conversion_result['success']:
            return jsonify({
                'error': f"Conversion failed: {conversion_result.get('error', 'Unknown error')}"
            }), 500
        
        # Verify output file exists
        if not docx_path.exists():
            return jsonify({'error': 'Conversion completed but output file was not created'}), 500
        
        # Get file size
        file_size = docx_path.stat().st_size
        
        return jsonify({
            'success': True,
            'message': conversion_result.get('message', 'PDF converted to Word successfully'),
            'download_id': unique_id,
            'filename': docx_filename,
            'original_filename': original_filename,
            'file_size': file_size,
            'pages_processed': conversion_result.get('pages_processed', 0),
            'conversion_mode': mode,
            'conversion_method': conversion_result.get('mode', mode),
            'auto_choice': conversion_result.get('auto_choice'),
            'pdf_type': conversion_result.get('pdf_type')
        })
        
    except Exception as e:
        print(f"Conversion error: {e}")
        print(traceback.format_exc())
        
        # Cleanup on error
        try:
            if 'pdf_path' in locals() and pdf_path and Path(pdf_path).exists():
                cleanup_file(str(pdf_path), delay=1)
        except:
            pass
        try:
            if 'docx_path' in locals() and docx_path and Path(docx_path).exists():
                cleanup_file(str(docx_path), delay=1)
        except:
            pass
            
        return jsonify({'error': f'Server error during conversion: {str(e)}'}), 500


@app.route('/api/convert/pdf-to-word/batch', methods=['POST'])
def convert_batch_pdfs():
    """Convert multiple PDFs to Word"""
    try:
        files = request.files.getlist('files')
        
        if not files:
            return jsonify({'error': 'No files provided'}), 400
        
        # Get conversion mode from form data (default to 'auto')
        mode = request.form.get('mode', 'auto').lower().strip()
        
        # Validate mode
        valid_modes = ['auto', 'fast', 'accurate', 'hybrid', 'ocr']
        if mode not in valid_modes:
            return jsonify({
                'error': f'Invalid conversion mode: {mode}. Valid modes are: {", ".join(valid_modes)}'
            }), 400
        
        results = []
        successful_conversions = 0
        
        for file in files:
            if file.filename and allowed_file(file.filename):
                try:
                    # Generate unique identifiers
                    unique_id = str(uuid.uuid4())
                    original_filename = secure_filename(file.filename)
                    filename_without_ext = Path(original_filename).stem
                    
                    # Save uploaded file
                    pdf_filename = f"{unique_id}_{original_filename}"
                    pdf_path = upload_dir / pdf_filename
                    file.save(str(pdf_path))
                    
                    # Generate output path
                    docx_filename = f"{filename_without_ext}_{unique_id}.docx"
                    docx_path = output_dir / docx_filename
                    
                    # Perform conversion with selected mode
                    conversion_result = convert_pdf_to_word_enhanced(str(pdf_path), str(docx_path), mode)
                    
                    # Schedule cleanup of input file
                    cleanup_file(str(pdf_path), delay=5)
                    
                    if conversion_result['success'] and docx_path.exists():
                        successful_conversions += 1
                        results.append({
                            'original_file': original_filename,
                            'output_file': docx_filename,
                            'download_id': unique_id,
                            'success': True,
                            'file_size': docx_path.stat().st_size,
                            'pages_processed': conversion_result.get('pages_processed', 0),
                            'conversion_mode': mode,
                            'conversion_method': conversion_result.get('mode', mode),
                            'auto_choice': conversion_result.get('auto_choice'),
                            'pdf_type': conversion_result.get('pdf_type')
                        })
                    else:
                        results.append({
                            'original_file': original_filename,
                            'success': False,
                            'error': conversion_result.get('error', 'Unknown conversion error')
                        })
                        
                except Exception as e:
                    results.append({
                        'original_file': file.filename,
                        'success': False,
                        'error': f'Processing error: {str(e)}'
                    })
        
        return jsonify({
            'success': True,
            'message': f'Batch conversion completed. {successful_conversions}/{len(results)} files processed successfully.',
            'total_files': len(results),
            'successful_conversions': successful_conversions,
            'results': results
        })
        
    except Exception as e:
        print(f"Batch conversion error: {e}")
        print(traceback.format_exc())
        return jsonify({'error': f'Batch conversion failed: {str(e)}'}), 500


@app.route('/api/download/<download_id>/<filename>', methods=['GET'])
def download_file(download_id, filename):
    """Download converted file"""
    try:
        file_path = output_dir / filename
        
        if not file_path.exists():
            return jsonify({'error': 'File not found or has expired'}), 404
        
        # Schedule cleanup after download
        cleanup_file(str(file_path), delay=60)  # Give 1 minute after download
        
        return send_file(
            str(file_path),
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        
    except Exception as e:
        print(f"Download error: {e}")
        print(traceback.format_exc())
        return jsonify({'error': f'Download failed: {str(e)}'}), 500


@app.errorhandler(413)
def too_large(e):
    """Handle file too large error"""
    return jsonify({'error': f'File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB.'}), 413


@app.errorhandler(500)
def internal_error(e):
    """Handle internal server errors"""
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    # Configure Flask app
    app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE
    
    # Run server
    port = int(os.environ.get('PORT', 8000))
    debug = os.environ.get('DEBUG', 'false').lower() == 'true'
    
    print(f"Starting Advanced PDF to Word Converter API on port {port}")
    print(f"Upload directory: {upload_dir.absolute()}")
    print(f"Output directory: {output_dir.absolute()}")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug,
        threaded=True
    )