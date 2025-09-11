
#!/usr/bin/env python3
"""
Enhanced HTML to PDF Converter
Converts HTML files to PDF while preserving formatting, layout, images, and content.
Uses multiple methods for optimal conversion quality with advanced formatting preservation.
"""

import os
import tempfile
import traceback
import shutil
from pathlib import Path
from typing import Dict, Any, Optional, List
import uuid
import subprocess
import re
from urllib.parse import urljoin, urlparse
import base64

try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    from reportlab.pdfgen import canvas
    print("reportlab successfully imported")
except ImportError as e:
    print(f"Warning: reportlab not available - {e}")
    SimpleDocTemplate = None

try:
    from weasyprint import HTML, CSS
    print("weasyprint successfully imported")
except ImportError as e:
    print(f"Warning: weasyprint not available - {e}")
    HTML = None

try:
    from bs4 import BeautifulSoup
    print("BeautifulSoup successfully imported")
except ImportError as e:
    print(f"Warning: BeautifulSoup not available - {e}")
    BeautifulSoup = None

try:
    import requests
    print("requests successfully imported")
except ImportError as e:
    print(f"Warning: requests not available - {e}")
    requests = None

try:
    from PIL import Image
    print("Pillow successfully imported")
except ImportError as e:
    print(f"Warning: Pillow not available - {e}")
    Image = None

class HTMLToPDFConverter:
    """Advanced HTML to PDF converter with comprehensive formatting preservation"""
    
    def __init__(self, output_dir: str = None):
        self.output_dir = output_dir or tempfile.mkdtemp()
        Path(self.output_dir).mkdir(parents=True, exist_ok=True)
        
    def convert_html_to_pdf(self, html_path: str, output_filename: str = None) -> Dict[str, Any]:
        """
        Convert HTML to PDF with enhanced formatting preservation and multiple fallback methods
        """
        try:
            print(f"Starting enhanced HTML to PDF conversion: {html_path}")
            
            # Validate input file
            if not os.path.exists(html_path):
                return {"success": False, "error": "HTML file not found"}
                
            if not (html_path.lower().endswith('.html') or html_path.lower().endswith('.htm')):
                return {"success": False, "error": "File must be an HTML file (.html or .htm)"}
            
            # Generate output filename
            if not output_filename:
                base_name = Path(html_path).stem
                output_filename = f"{base_name}_converted.pdf"
            elif not output_filename.endswith('.pdf'):
                output_filename += '.pdf'
                
            output_path = os.path.join(self.output_dir, output_filename)
            
            # Try multiple conversion methods in order of effectiveness
            methods = [
                ("WeasyPrint conversion", self._convert_with_weasyprint),
                ("ReportLab conversion", self._convert_with_reportlab),
                ("wkhtmltopdf conversion", self._convert_with_wkhtmltopdf),
                ("Chromium headless conversion", self._convert_with_chromium)
            ]
            
            for method_name, method_func in methods:
                try:
                    print(f"Attempting {method_name}...")
                    
                    # Set a timeout for each conversion method
                    import signal
                    
                    def timeout_handler(signum, frame):
                        raise TimeoutError(f"{method_name} timed out after 30 seconds")
                    
                    # Set alarm for 30 seconds
                    signal.signal(signal.SIGALRM, timeout_handler)
                    signal.alarm(30)
                    
                    try:
                        success = method_func(html_path, output_path)
                        signal.alarm(0)  # Cancel the alarm
                        
                        if success:
                            print(f"{method_name} succeeded")
                            
                            # Get file metadata
                            metadata = self._get_file_metadata(output_path, html_path)
                            
                            return {
                                "success": True, 
                                "output_path": output_path,
                                "filename": output_filename,
                                "method": method_name.lower().replace(" ", "_"),
                                "message": f"Conversion completed using {method_name}",
                                "metadata": metadata
                            }
                        else:
                            print(f"{method_name} returned False")
                            
                    except TimeoutError as te:
                        signal.alarm(0)  # Cancel the alarm
                        print(f"{method_name} timed out: {te}")
                        continue
                        
                except Exception as e:
                    signal.alarm(0)  # Cancel the alarm if set
                    print(f"{method_name} failed with exception: {e}")
                    import traceback
                    print(f"Traceback: {traceback.format_exc()}")
                    continue
            
            return {"success": False, "error": "All conversion methods failed"}
            
        except Exception as e:
            error_msg = f"Error in convert_html_to_pdf: {str(e)}"
            print(f"Error in convert_html_to_pdf: {error_msg}")
            print(traceback.format_exc())
            return {"success": False, "error": error_msg}

    def _convert_with_weasyprint(self, html_path: str, output_path: str) -> bool:
        """Convert HTML to PDF using WeasyPrint (best quality)"""
        try:
            if not HTML:
                print("WeasyPrint not available")
                return False
                
            print("Attempting WeasyPrint conversion...")
            
            # Read HTML content
            with open(html_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            print(f"HTML content length: {len(html_content)} characters")
            
            # Process images to handle relative paths
            html_content = self._process_html_images(html_content, html_path)
            
            # Create WeasyPrint HTML object with timeout handling
            try:
                print("Creating HTML document...")
                html_doc = HTML(string=html_content, base_url=Path(html_path).parent.as_uri())
                
                print("Writing PDF...")
                # Generate PDF with CSS optimizations for better performance
                html_doc.write_pdf(
                    output_path,
                    stylesheets=[CSS(string='''
                        @page {
                            size: A4;
                            margin: 1cm;
                        }
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.4;
                        }
                        img {
                            max-width: 100%;
                            height: auto;
                        }
                    ''')]
                )
                print("PDF writing completed")
                
            except Exception as pdf_error:
                print(f"PDF generation error: {pdf_error}")
                return False
            
            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                print(f"WeasyPrint conversion successful - output size: {os.path.getsize(output_path)} bytes")
                return True
            else:
                print("WeasyPrint conversion failed - no output file or empty file")
                return False
                
        except Exception as e:
            print(f"WeasyPrint conversion error: {e}")
            import traceback
            print(f"Full traceback: {traceback.format_exc()}")
            return False

    def _convert_with_wkhtmltopdf(self, html_path: str, output_path: str) -> bool:
        """Convert HTML to PDF using wkhtmltopdf"""
        try:
            print("Attempting wkhtmltopdf conversion...")
            
            cmd = [
                'wkhtmltopdf',
                '--page-size', 'A4',
                '--orientation', 'Portrait',
                '--margin-top', '0.75in',
                '--margin-right', '0.75in',
                '--margin-bottom', '0.75in',
                '--margin-left', '0.75in',
                '--encoding', 'UTF-8',
                '--enable-local-file-access',
                '--load-error-handling', 'ignore',
                '--load-media-error-handling', 'ignore',
                html_path,
                output_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            
            if result.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                print("wkhtmltopdf conversion successful")
                return True
                
            return False
            
        except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.CalledProcessError):
            return False
        except Exception as e:
            print(f"wkhtmltopdf conversion error: {e}")
            return False

    def _convert_with_chromium(self, html_path: str, output_path: str) -> bool:
        """Convert HTML to PDF using Chromium headless"""
        try:
            print("Attempting Chromium headless conversion...")
            
            # Try different possible Chromium/Chrome executables
            chrome_executables = [
                'chromium-browser',
                'chromium',
                'google-chrome',
                'google-chrome-stable',
                'chrome'
            ]
            
            for chrome_exe in chrome_executables:
                try:
                    cmd = [
                        chrome_exe,
                        '--headless',
                        '--disable-gpu',
                        '--no-sandbox',
                        '--disable-dev-shm-usage',
                        '--print-to-pdf=' + output_path,
                        '--print-to-pdf-no-header',
                        'file://' + os.path.abspath(html_path)
                    ]
                    
                    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                    
                    if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                        print(f"Chromium conversion successful using {chrome_exe}")
                        return True
                        
                except (FileNotFoundError, subprocess.TimeoutExpired):
                    continue
            
            return False
            
        except Exception as e:
            print(f"Chromium conversion error: {e}")
            return False

    def _convert_with_reportlab(self, html_path: str, output_path: str) -> bool:
        """Convert HTML to PDF using ReportLab (basic conversion)"""
        try:
            if not SimpleDocTemplate or not BeautifulSoup:
                print("ReportLab or BeautifulSoup not available")
                return False
                
            print("Attempting ReportLab conversion...")
            
            # Read and parse HTML
            with open(html_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            print(f"Parsing HTML content with BeautifulSoup...")
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Create PDF document
            print("Creating PDF document...")
            doc = SimpleDocTemplate(output_path, pagesize=A4, topMargin=72, bottomMargin=72)
            styles = getSampleStyleSheet()
            story = []
            
            # Add title if present
            title = soup.find('title')
            if title and title.get_text().strip():
                title_para = Paragraph(title.get_text().strip(), styles['Title'])
                story.append(title_para)
                story.append(Spacer(1, 24))
            
            # Extract text content and basic formatting
            print("Extracting content...")
            elements_found = 0
            for element in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'li']):
                text = element.get_text().strip()
                if text and len(text) > 1:  # Skip very short text
                    elements_found += 1
                    try:
                        if element.name.startswith('h'):
                            level = int(element.name[1])
                            if level == 1:
                                para = Paragraph(text, styles['Title'])
                            elif level == 2:
                                para = Paragraph(text, styles['Heading1'])
                            else:
                                para = Paragraph(text, styles['Heading2'])
                        else:
                            para = Paragraph(text, styles['Normal'])
                        
                        story.append(para)
                        story.append(Spacer(1, 12))
                    except Exception as para_error:
                        print(f"Error creating paragraph: {para_error}")
                        # Create simple paragraph as fallback
                        try:
                            simple_para = Paragraph(text[:500], styles['Normal'])  # Limit length
                            story.append(simple_para)
                            story.append(Spacer(1, 12))
                        except:
                            continue
            
            print(f"Found {elements_found} elements")
            
            if not story:
                # If no structured content found, extract all text
                print("No structured elements found, extracting all text...")
                text = soup.get_text()
                paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
                
                for para_text in paragraphs[:50]:  # Limit to first 50 paragraphs
                    if para_text and len(para_text) > 1:
                        try:
                            para = Paragraph(para_text[:1000], styles['Normal'])  # Limit length
                            story.append(para)
                            story.append(Spacer(1, 6))
                        except Exception as para_error:
                            print(f"Error with paragraph: {para_error}")
                            continue
            
            if not story:
                # Last resort - add some content
                story.append(Paragraph("HTML content converted to PDF", styles['Normal']))
            
            # Build PDF
            print("Building PDF...")
            doc.build(story)
            
            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                print(f"ReportLab conversion successful - output size: {os.path.getsize(output_path)} bytes")
                return True
            else:
                print("ReportLab conversion failed - no output or empty file")
                return False
                
        except Exception as e:
            print(f"ReportLab conversion error: {e}")
            import traceback
            print(f"Full traceback: {traceback.format_exc()}")
            return False

    def _process_html_images(self, html_content: str, html_path: str) -> str:
        """Process HTML content to handle images properly"""
        try:
            if not BeautifulSoup:
                return html_content
                
            soup = BeautifulSoup(html_content, 'html.parser')
            html_dir = Path(html_path).parent
            
            # Process img tags
            for img in soup.find_all('img'):
                src = img.get('src')
                if src:
                    # Handle relative paths
                    if not src.startswith(('http://', 'https://', 'data:')):
                        img_path = html_dir / src
                        if img_path.exists():
                            # Convert to absolute file URL
                            img['src'] = img_path.as_uri()
            
            return str(soup)
            
        except Exception as e:
            print(f"Error processing HTML images: {e}")
            return html_content

    def _get_file_metadata(self, output_path: str, input_path: str) -> Dict[str, Any]:
        """Get metadata about the converted file"""
        try:
            metadata = {
                "file_size": os.path.getsize(output_path),
                "input_file_size": os.path.getsize(input_path)
            }
            
            # Try to get HTML metadata
            try:
                with open(input_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                if BeautifulSoup:
                    soup = BeautifulSoup(content, 'html.parser')
                    
                    # Count elements
                    metadata["total_elements"] = len(soup.find_all())
                    metadata["images"] = len(soup.find_all('img'))
                    metadata["links"] = len(soup.find_all('a'))
                    metadata["tables"] = len(soup.find_all('table'))
                    
                    # Get title if available
                    title = soup.find('title')
                    if title:
                        metadata["title"] = title.get_text().strip()
                        
            except Exception:
                pass
                
            return metadata
            
        except Exception as e:
            print(f"Error getting metadata: {e}")
            return {"file_size": 0}

def convert_html_file(html_path: str, output_dir: str = None) -> Dict[str, Any]:
    """
    Main function to convert HTML to PDF
    
    Args:
        html_path: Path to HTML file
        output_dir: Directory to save converted file
        
    Returns:
        Conversion result dictionary
    """
    converter = HTMLToPDFConverter(output_dir)
    return converter.convert_html_to_pdf(html_path)

if __name__ == "__main__":
    # Test the converter
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python html_to_pdf_converter.py <html_file>")
        sys.exit(1)
        
    html_file = sys.argv[1]
    result = convert_html_file(html_file)
    
    if result["success"]:
        print(f"Conversion successful: {result['filename']}")
        print(f"Method: {result['method']}")
        print(f"Output: {result['output_path']}")
    else:
        print(f"Conversion failed: {result['error']}")
