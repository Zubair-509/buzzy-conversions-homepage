
#!/usr/bin/env python3
"""
HTML to PDF Converter
Converts HTML content to PDF using multiple methods for optimal quality.
Supports HTML code input, URL conversion, and file upload.
"""

import os
import re
import tempfile
import traceback
import requests
import uuid
from pathlib import Path
from typing import Dict, Any, Optional, TYPE_CHECKING
from urllib.parse import urlparse, urljoin
from datetime import datetime

if TYPE_CHECKING:
    from weasyprint import HTML

try:
    import weasyprint
    from weasyprint import HTML, CSS
    print("WeasyPrint successfully imported")
except ImportError as e:
    print(f"Warning: WeasyPrint not available - {e}")
    weasyprint = None
    HTML = None  # type: ignore

try:
    from bs4 import BeautifulSoup
    print("BeautifulSoup successfully imported")
except ImportError as e:
    print(f"Warning: BeautifulSoup not available - {e}")
    BeautifulSoup = None

try:
    import subprocess
    print("subprocess available")
except ImportError as e:
    print(f"Warning: subprocess not available - {e}")
    subprocess = None

class HTMLToPDFConverter:
    """Advanced HTML to PDF converter supporting multiple input methods"""
    
    def __init__(self, output_dir: Optional[str] = None):
        self.output_dir = output_dir or tempfile.mkdtemp()
        Path(self.output_dir).mkdir(parents=True, exist_ok=True)
    
    def _sanitize_filename(self, filename: Optional[str]) -> str:
        """Sanitize filename to prevent path traversal and argument injection attacks"""
        if not filename:
            return f"html_code_converted_{uuid.uuid4().hex[:8]}.pdf"
        
        # Remove path separators and dangerous characters
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
        filename = re.sub(r'\.\.', '_', filename)  # Remove path traversal
        filename = filename.strip()
        
        # Prevent filenames starting with dashes (argument injection)
        if filename.startswith('-'):
            filename = 'file_' + filename[1:]
        
        # Ensure filename is not empty after sanitization
        if not filename or filename in ['.', '..']:
            filename = f"html_code_converted_{uuid.uuid4().hex[:8]}.pdf"
        
        # Ensure .pdf extension
        if not filename.lower().endswith('.pdf'):
            filename += '.pdf'
        
        # Limit filename length
        if len(filename) > 255:
            name_part = filename[:250]
            filename = name_part + '.pdf'
        
        return filename
        
    def convert_html_code_to_pdf(self, html_code: str, output_filename: Optional[str] = None) -> Dict[str, Any]:
        """Convert HTML code string directly to PDF"""
        try:
            print("Starting HTML code to PDF conversion")
            
            if not html_code or not html_code.strip():
                return {"success": False, "error": "HTML code cannot be empty"}
            
            # Sanitize output filename for security
            output_filename = self._sanitize_filename(output_filename)
            output_path = os.path.join(self.output_dir, output_filename)
            
            # Try conversion methods
            methods = [
                ("WeasyPrint conversion", self._convert_code_with_weasyprint),
                ("wkhtmltopdf conversion", self._convert_code_with_wkhtmltopdf),
            ]
            
            for method_name, method_func in methods:
                try:
                    print(f"Attempting {method_name}...")
                    if method_func(html_code, output_path):
                        print(f"{method_name} succeeded")
                        
                        # Get metadata
                        metadata = self._get_html_metadata(html_code)
                        metadata['file_size'] = os.path.getsize(output_path) if os.path.exists(output_path) else 0
                        metadata['method'] = 'html_code_input'
                        
                        return {
                            "success": True,
                            "output_path": output_path,
                            "filename": output_filename,
                            "method": method_name.lower().replace(" ", "_"),
                            "message": f"HTML code converted successfully using {method_name}",
                            "metadata": metadata
                        }
                except Exception as e:
                    print(f"{method_name} failed: {e}")
                    continue
            
            return {"success": False, "error": "All HTML code conversion methods failed"}
            
        except Exception as e:
            error_msg = f"Error in convert_html_code_to_pdf: {str(e)}"
            print(error_msg)
            return {"success": False, "error": error_msg}
    
    def convert_url_to_pdf(self, url: str, output_filename: Optional[str] = None) -> Dict[str, Any]:
        """Convert HTML from URL to PDF"""
        try:
            print(f"Starting URL to PDF conversion: {url}")
            
            if not url or not url.strip():
                return {"success": False, "error": "URL cannot be empty"}
            
            # Validate and normalize URL
            if not url.startswith(('http://', 'https://')):
                url = 'https://' + url
            
            # Generate output filename
            if not output_filename:
                domain = urlparse(url).netloc.replace('.', '_')
                output_filename = f"url_{domain}_{uuid.uuid4().hex[:8]}.pdf"
            elif not output_filename.endswith('.pdf'):
                output_filename += '.pdf'
                
            output_path = os.path.join(self.output_dir, output_filename)
            
            # Fetch HTML content
            try:
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
                response = requests.get(url, headers=headers, timeout=30)
                response.raise_for_status()
                html_content = response.text
                
                # Get base URL for relative links
                base_url = urljoin(url, '/')
                
            except Exception as e:
                return {"success": False, "error": f"Failed to fetch URL content: {str(e)}"}
            
            # Try conversion methods
            methods = [
                ("WeasyPrint URL conversion", self._convert_url_with_weasyprint),
                ("wkhtmltopdf URL conversion", self._convert_url_with_wkhtmltopdf),
            ]
            
            for method_name, method_func in methods:
                try:
                    print(f"Attempting {method_name}...")
                    if method_func(url, html_content, base_url, output_path):
                        print(f"{method_name} succeeded")
                        
                        # Get metadata
                        metadata = self._get_html_metadata(html_content)
                        metadata['file_size'] = os.path.getsize(output_path) if os.path.exists(output_path) else 0
                        metadata['method'] = 'url_input'
                        metadata['source_url'] = url
                        
                        return {
                            "success": True,
                            "output_path": output_path,
                            "filename": output_filename,
                            "method": method_name.lower().replace(" ", "_"),
                            "message": f"URL converted successfully using {method_name}",
                            "metadata": metadata
                        }
                except Exception as e:
                    print(f"{method_name} failed: {e}")
                    continue
            
            return {"success": False, "error": "All URL conversion methods failed"}
            
        except Exception as e:
            error_msg = f"Error in convert_url_to_pdf: {str(e)}"
            print(error_msg)
            return {"success": False, "error": error_msg}
    
    def convert_html_file_to_pdf(self, html_file_path: str, output_filename: Optional[str] = None) -> Dict[str, Any]:
        """Convert HTML file to PDF"""
        try:
            print(f"Starting HTML file to PDF conversion: {html_file_path}")
            
            if not os.path.exists(html_file_path):
                return {"success": False, "error": "HTML file not found"}
            
            # Read HTML content
            try:
                with open(html_file_path, 'r', encoding='utf-8') as f:
                    html_content = f.read()
            except Exception as e:
                try:
                    with open(html_file_path, 'r', encoding='latin-1') as f:
                        html_content = f.read()
                except Exception as e2:
                    return {"success": False, "error": f"Failed to read HTML file: {str(e2)}"}
            
            # Generate output filename
            if not output_filename:
                base_name = Path(html_file_path).stem
                output_filename = f"{base_name}_converted.pdf"
            elif not output_filename.endswith('.pdf'):
                output_filename += '.pdf'
                
            output_path = os.path.join(self.output_dir, output_filename)
            
            # Get base path for relative resources
            base_path = os.path.dirname(os.path.abspath(html_file_path))
            
            # Try conversion methods
            methods = [
                ("WeasyPrint file conversion", self._convert_file_with_weasyprint),
                ("wkhtmltopdf file conversion", self._convert_file_with_wkhtmltopdf),
            ]
            
            for method_name, method_func in methods:
                try:
                    print(f"Attempting {method_name}...")
                    if method_func(html_file_path, html_content, base_path, output_path):
                        print(f"{method_name} succeeded")
                        
                        # Get metadata
                        metadata = self._get_html_metadata(html_content)
                        metadata['file_size'] = os.path.getsize(output_path) if os.path.exists(output_path) else 0
                        metadata['input_file_size'] = os.path.getsize(html_file_path)
                        metadata['method'] = 'file_upload'
                        
                        return {
                            "success": True,
                            "output_path": output_path,
                            "filename": output_filename,
                            "method": method_name.lower().replace(" ", "_"),
                            "message": f"HTML file converted successfully using {method_name}",
                            "metadata": metadata
                        }
                except Exception as e:
                    print(f"{method_name} failed: {e}")
                    continue
            
            return {"success": False, "error": "All HTML file conversion methods failed"}
            
        except Exception as e:
            error_msg = f"Error in convert_html_file_to_pdf: {str(e)}"
            print(error_msg)
            return {"success": False, "error": error_msg}
    
    def _convert_code_with_weasyprint(self, html_code: str, output_path: str) -> bool:
        """Convert HTML code using WeasyPrint"""
        try:
            if not weasyprint or HTML is None:
                return False
            
            # Create HTML document
            html_doc = HTML(string=html_code)
            html_doc.write_pdf(output_path)
            
            return os.path.exists(output_path) and os.path.getsize(output_path) > 0
            
        except Exception as e:
            print(f"WeasyPrint code conversion error: {e}")
            return False
    
    def _convert_code_with_wkhtmltopdf(self, html_code: str, output_path: str) -> bool:
        """Convert HTML code using wkhtmltopdf"""
        try:
            if not subprocess:
                return False
            
            # Save HTML to temp file
            temp_html = os.path.join(self.output_dir, f"temp_{uuid.uuid4().hex}.html")
            with open(temp_html, 'w', encoding='utf-8') as f:
                f.write(html_code)
            
            # Run wkhtmltopdf
            cmd = [
                'wkhtmltopdf',
                '--page-size', 'A4',
                '--margin-top', '0.75in',
                '--margin-right', '0.75in',
                '--margin-bottom', '0.75in',
                '--margin-left', '0.75in',
                '--enable-local-file-access',
                temp_html,
                output_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            
            # Cleanup
            if os.path.exists(temp_html):
                os.remove(temp_html)
            
            return result.returncode == 0 and os.path.exists(output_path)
            
        except Exception as e:
            print(f"wkhtmltopdf code conversion error: {e}")
            return False
    
    def _convert_url_with_weasyprint(self, url: str, html_content: str, base_url: str, output_path: str) -> bool:
        """Convert URL using WeasyPrint"""
        try:
            if not weasyprint or HTML is None:
                return False
            
            # Create HTML document with base URL
            html_doc = HTML(string=html_content, base_url=base_url)
            html_doc.write_pdf(output_path)
            
            return os.path.exists(output_path) and os.path.getsize(output_path) > 0
            
        except Exception as e:
            print(f"WeasyPrint URL conversion error: {e}")
            return False
    
    def _convert_url_with_wkhtmltopdf(self, url: str, html_content: str, base_url: str, output_path: str) -> bool:
        """Convert URL using wkhtmltopdf directly"""
        try:
            if not subprocess:
                return False
            
            # Run wkhtmltopdf directly on URL
            cmd = [
                'wkhtmltopdf',
                '--page-size', 'A4',
                '--margin-top', '0.75in',
                '--margin-right', '0.75in',
                '--margin-bottom', '0.75in',
                '--margin-left', '0.75in',
                '--enable-javascript',
                '--javascript-delay', '1000',
                '--load-error-handling', 'ignore',
                '--load-media-error-handling', 'ignore',
                url,
                output_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            
            return result.returncode == 0 and os.path.exists(output_path)
            
        except Exception as e:
            print(f"wkhtmltopdf URL conversion error: {e}")
            return False
    
    def _convert_file_with_weasyprint(self, html_file_path: str, html_content: str, base_path: str, output_path: str) -> bool:
        """Convert HTML file using WeasyPrint"""
        try:
            if not weasyprint or HTML is None:
                return False
            
            # Create HTML document with base URL for relative paths
            base_url = f"file://{base_path}/"
            html_doc = HTML(string=html_content, base_url=base_url)
            html_doc.write_pdf(output_path)
            
            return os.path.exists(output_path) and os.path.getsize(output_path) > 0
            
        except Exception as e:
            print(f"WeasyPrint file conversion error: {e}")
            return False
    
    def _convert_file_with_wkhtmltopdf(self, html_file_path: str, html_content: str, base_path: str, output_path: str) -> bool:
        """Convert HTML file using wkhtmltopdf"""
        try:
            if not subprocess:
                return False
            
            # Run wkhtmltopdf on file
            cmd = [
                'wkhtmltopdf',
                '--page-size', 'A4',
                '--margin-top', '0.75in',
                '--margin-right', '0.75in',
                '--margin-bottom', '0.75in',
                '--margin-left', '0.75in',
                '--enable-local-file-access',
                html_file_path,
                output_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            
            return result.returncode == 0 and os.path.exists(output_path)
            
        except Exception as e:
            print(f"wkhtmltopdf file conversion error: {e}")
            return False
    
    def _get_html_metadata(self, html_content: str) -> Dict[str, Any]:
        """Extract metadata from HTML content"""
        metadata = {
            'total_elements': 0,
            'images': 0,
            'links': 0,
            'tables': 0,
            'title': 'Untitled Document'
        }
        
        try:
            if BeautifulSoup:
                soup = BeautifulSoup(html_content, 'html.parser')
                
                # Get title
                title_tag = soup.find('title')
                if title_tag and hasattr(title_tag, 'string'):
                    title_text = getattr(title_tag, 'string', None)
                    if title_text:
                        metadata['title'] = str(title_text).strip()
                
                # Count elements
                metadata['total_elements'] = len(soup.find_all())
                metadata['images'] = len(soup.find_all(['img']))
                metadata['links'] = len(soup.find_all(['a']))
                metadata['tables'] = len(soup.find_all(['table']))
            
        except Exception as e:
            print(f"Error extracting HTML metadata: {e}")
        
        return metadata

# Convenience functions for backward compatibility
def convert_html_code(html_code: str, output_dir: Optional[str] = None) -> Dict[str, Any]:
    """Convert HTML code to PDF"""
    converter = HTMLToPDFConverter(output_dir)
    return converter.convert_html_code_to_pdf(html_code)

def convert_html_url(url: str, output_dir: Optional[str] = None) -> Dict[str, Any]:
    """Convert HTML from URL to PDF"""
    converter = HTMLToPDFConverter(output_dir)
    return converter.convert_url_to_pdf(url)

def convert_html_file(html_file_path: str, output_dir: Optional[str] = None) -> Dict[str, Any]:
    """Convert HTML file to PDF"""
    converter = HTMLToPDFConverter(output_dir)
    return converter.convert_html_file_to_pdf(html_file_path)
