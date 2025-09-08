
#!/usr/bin/env python3
"""
Enhanced PDF to JPG Converter
Converts PDF files to high-quality JPG images while maintaining resolution and accuracy.
Uses multiple methods for optimal conversion quality with advanced image processing.
"""

import os
import tempfile
import traceback
import shutil
import io
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
import uuid
import zipfile

try:
    from pdf2image import convert_from_path, convert_from_bytes
    print("pdf2image successfully imported")
except ImportError as e:
    print(f"Warning: pdf2image not available - {e}")
    convert_from_path = None
    convert_from_bytes = None

try:
    from PIL import Image, ImageEnhance, ImageFilter
    print("Pillow successfully imported")
except ImportError as e:
    print(f"Warning: Pillow not available - {e}")
    Image = None

try:
    import fitz  # PyMuPDF
    print("PyMuPDF successfully imported")
except ImportError as e:
    print(f"Warning: PyMuPDF not available - {e}")
    fitz = None

class PDFToJPGConverter:
    """Advanced PDF to JPG converter with high-quality image output"""
    
    def __init__(self, output_dir: str = None):
        self.output_dir = output_dir or tempfile.mkdtemp()
        Path(self.output_dir).mkdir(parents=True, exist_ok=True)
        self.supported_formats = ['jpg', 'jpeg', 'png']
        
    def convert_pdf_to_jpg(self, pdf_path: str, output_format: str = 'jpg', 
                          dpi: int = 300, quality: int = 95, 
                          page_range: str = 'all') -> Dict[str, Any]:
        """
        Convert PDF to JPG images with enhanced quality and options
        
        Args:
            pdf_path: Path to the PDF file
            output_format: Output format ('jpg', 'png')
            dpi: Resolution in DPI (72, 150, 300)
            quality: JPEG quality (1-100)
            page_range: 'all', 'first', or 'custom' (for future expansion)
        """
        try:
            print(f"Starting PDF to JPG conversion: {pdf_path}")
            
            # Validate input file
            if not os.path.exists(pdf_path):
                return {"success": False, "error": "PDF file not found"}
                
            if not pdf_path.lower().endswith('.pdf'):
                return {"success": False, "error": "File must be a PDF"}
            
            # Validate parameters
            if output_format.lower() not in self.supported_formats:
                output_format = 'jpg'
            
            if dpi not in [72, 150, 300]:
                dpi = 300  # Default to high quality
                
            if not (1 <= quality <= 100):
                quality = 95  # Default to high quality
            
            base_name = Path(pdf_path).stem
            conversion_id = str(uuid.uuid4())[:8]
            
            # Try multiple conversion methods in order of quality
            methods = [
                ("pdf2image_enhanced", self._convert_with_pdf2image_enhanced),
                ("pymupdf_enhanced", self._convert_with_pymupdf_enhanced),
                ("pdf2image_basic", self._convert_with_pdf2image_basic),
                ("pymupdf_basic", self._convert_with_pymupdf_basic)
            ]
            
            for method_name, method_func in methods:
                try:
                    print(f"Attempting {method_name}...")
                    result = method_func(pdf_path, base_name, conversion_id, 
                                       output_format, dpi, quality, page_range)
                    
                    if result["success"]:
                        print(f"{method_name} succeeded")
                        result["method"] = method_name
                        return result
                        
                except Exception as e:
                    print(f"{method_name} failed: {e}")
                    continue
            
            return {"success": False, "error": "All conversion methods failed"}
            
        except Exception as e:
            error_msg = f"Error in convert_pdf_to_jpg: {str(e)}"
            print(f"Error in convert_pdf_to_jpg: {error_msg}")
            print(traceback.format_exc())
            return {"success": False, "error": error_msg}
    
    def _convert_with_pdf2image_enhanced(self, pdf_path: str, base_name: str, 
                                       conversion_id: str, output_format: str, 
                                       dpi: int, quality: int, page_range: str) -> Dict[str, Any]:
        """Enhanced conversion using pdf2image with quality optimization"""
        try:
            if not convert_from_path:
                return {"success": False, "error": "pdf2image not available"}
            
            print(f"Converting with pdf2image at {dpi} DPI...")
            
            # Convert PDF to images with high quality settings
            images = convert_from_path(
                pdf_path,
                dpi=dpi,
                fmt='RGB',  # Ensure RGB color space
                thread_count=4,  # Use multiple threads for faster conversion
                use_cropbox=True,  # Use crop box for better accuracy
                strict=True  # Strict mode for better quality
            )
            
            if not images:
                return {"success": False, "error": "No images generated from PDF"}
            
            # Process page range
            if page_range == 'first' and len(images) > 1:
                images = [images[0]]
            
            converted_files = []
            temp_dir = os.path.join(self.output_dir, f"conversion_{conversion_id}")
            os.makedirs(temp_dir, exist_ok=True)
            
            for i, image in enumerate(images):
                page_num = i + 1
                
                # Enhance image quality
                enhanced_image = self._enhance_image_quality(image, dpi)
                
                # Generate filename
                if len(images) == 1:
                    filename = f"{base_name}_converted.{output_format.lower()}"
                else:
                    filename = f"{base_name}_page_{page_num:03d}.{output_format.lower()}"
                
                output_path = os.path.join(temp_dir, filename)
                
                # Save with optimal settings
                save_kwargs = {
                    'optimize': True,
                    'progressive': True if output_format.lower() == 'jpg' else False
                }
                
                if output_format.lower() in ['jpg', 'jpeg']:
                    save_kwargs['quality'] = quality
                    save_kwargs['subsampling'] = 0  # No subsampling for better quality
                elif output_format.lower() == 'png':
                    save_kwargs['compress_level'] = 1  # Minimal compression for PNG
                
                enhanced_image.save(output_path, output_format.upper(), **save_kwargs)
                converted_files.append({
                    'filename': filename,
                    'path': output_path,
                    'page': page_num,
                    'size_mb': round(os.path.getsize(output_path) / (1024 * 1024), 2)
                })
                
                print(f"Converted page {page_num} to {filename}")
            
            # Create ZIP file if multiple pages
            final_output_path = None
            final_filename = None
            
            if len(converted_files) == 1:
                # Single file
                final_output_path = converted_files[0]['path']
                final_filename = converted_files[0]['filename']
            else:
                # Multiple files - create ZIP
                zip_filename = f"{base_name}_converted_pages.zip"
                zip_path = os.path.join(self.output_dir, zip_filename)
                
                with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for file_info in converted_files:
                        zipf.write(file_info['path'], file_info['filename'])
                
                final_output_path = zip_path
                final_filename = zip_filename
                
                # Clean up individual files
                shutil.rmtree(temp_dir, ignore_errors=True)
            
            return {
                "success": True,
                "output_path": final_output_path,
                "filename": final_filename,
                "pages_converted": len(converted_files),
                "total_size_mb": sum(f['size_mb'] for f in converted_files),
                "files": converted_files,
                "settings": {
                    "dpi": dpi,
                    "format": output_format,
                    "quality": quality if output_format.lower() in ['jpg', 'jpeg'] else None
                }
            }
            
        except Exception as e:
            print(f"pdf2image enhanced conversion failed: {e}")
            return {"success": False, "error": str(e)}
    
    def _convert_with_pymupdf_enhanced(self, pdf_path: str, base_name: str, 
                                     conversion_id: str, output_format: str, 
                                     dpi: int, quality: int, page_range: str) -> Dict[str, Any]:
        """Enhanced conversion using PyMuPDF with quality optimization"""
        try:
            if not fitz:
                return {"success": False, "error": "PyMuPDF not available"}
            
            print(f"Converting with PyMuPDF at {dpi} DPI...")
            
            doc = fitz.open(pdf_path)
            converted_files = []
            temp_dir = os.path.join(self.output_dir, f"conversion_{conversion_id}")
            os.makedirs(temp_dir, exist_ok=True)
            
            # Calculate matrix for DPI scaling
            zoom = dpi / 72.0  # 72 DPI is the default
            mat = fitz.Matrix(zoom, zoom)
            
            pages_to_convert = range(len(doc))
            if page_range == 'first':
                pages_to_convert = [0]
            
            for page_num in pages_to_convert:
                page = doc.load_page(page_num)
                
                # Render page as pixmap with high quality
                pix = page.get_pixmap(matrix=mat, alpha=False)
                
                # Convert to PIL Image for enhancement
                img_data = pix.tobytes("png")
                pil_image = Image.open(io.BytesIO(img_data))
                
                # Enhance image quality
                enhanced_image = self._enhance_image_quality(pil_image, dpi)
                
                # Generate filename
                if len(pages_to_convert) == 1:
                    filename = f"{base_name}_converted.{output_format.lower()}"
                else:
                    filename = f"{base_name}_page_{page_num + 1:03d}.{output_format.lower()}"
                
                output_path = os.path.join(temp_dir, filename)
                
                # Save with optimal settings
                save_kwargs = {
                    'optimize': True,
                    'progressive': True if output_format.lower() == 'jpg' else False
                }
                
                if output_format.lower() in ['jpg', 'jpeg']:
                    save_kwargs['quality'] = quality
                    save_kwargs['subsampling'] = 0
                elif output_format.lower() == 'png':
                    save_kwargs['compress_level'] = 1
                
                enhanced_image.save(output_path, output_format.upper(), **save_kwargs)
                converted_files.append({
                    'filename': filename,
                    'path': output_path,
                    'page': page_num + 1,
                    'size_mb': round(os.path.getsize(output_path) / (1024 * 1024), 2)
                })
                
                print(f"Converted page {page_num + 1} to {filename}")
            
            doc.close()
            
            # Handle output (single file or ZIP)
            if len(converted_files) == 1:
                final_output_path = converted_files[0]['path']
                final_filename = converted_files[0]['filename']
            else:
                zip_filename = f"{base_name}_converted_pages.zip"
                zip_path = os.path.join(self.output_dir, zip_filename)
                
                with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for file_info in converted_files:
                        zipf.write(file_info['path'], file_info['filename'])
                
                final_output_path = zip_path
                final_filename = zip_filename
                shutil.rmtree(temp_dir, ignore_errors=True)
            
            return {
                "success": True,
                "output_path": final_output_path,
                "filename": final_filename,
                "pages_converted": len(converted_files),
                "total_size_mb": sum(f['size_mb'] for f in converted_files),
                "files": converted_files,
                "settings": {
                    "dpi": dpi,
                    "format": output_format,
                    "quality": quality if output_format.lower() in ['jpg', 'jpeg'] else None
                }
            }
            
        except Exception as e:
            print(f"PyMuPDF enhanced conversion failed: {e}")
            return {"success": False, "error": str(e)}
    
    def _convert_with_pdf2image_basic(self, pdf_path: str, base_name: str, 
                                    conversion_id: str, output_format: str, 
                                    dpi: int, quality: int, page_range: str) -> Dict[str, Any]:
        """Basic conversion using pdf2image"""
        try:
            if not convert_from_path:
                return {"success": False, "error": "pdf2image not available"}
            
            images = convert_from_path(pdf_path, dpi=dpi)
            if not images:
                return {"success": False, "error": "No images generated"}
            
            if page_range == 'first':
                images = [images[0]]
            
            if len(images) == 1:
                filename = f"{base_name}_converted.{output_format.lower()}"
                output_path = os.path.join(self.output_dir, filename)
                images[0].save(output_path, output_format.upper(), quality=quality)
                
                return {
                    "success": True,
                    "output_path": output_path,
                    "filename": filename,
                    "pages_converted": 1
                }
            
            return {"success": False, "error": "Multiple pages not handled in basic mode"}
            
        except Exception as e:
            print(f"pdf2image basic conversion failed: {e}")
            return {"success": False, "error": str(e)}
    
    def _convert_with_pymupdf_basic(self, pdf_path: str, base_name: str, 
                                  conversion_id: str, output_format: str, 
                                  dpi: int, quality: int, page_range: str) -> Dict[str, Any]:
        """Basic conversion using PyMuPDF"""
        try:
            if not fitz:
                return {"success": False, "error": "PyMuPDF not available"}
            
            doc = fitz.open(pdf_path)
            if len(doc) == 0:
                return {"success": False, "error": "PDF has no pages"}
            
            page = doc.load_page(0)  # Only first page in basic mode
            zoom = dpi / 72.0
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)
            
            filename = f"{base_name}_converted.{output_format.lower()}"
            output_path = os.path.join(self.output_dir, filename)
            
            pix.save(output_path)
            doc.close()
            
            return {
                "success": True,
                "output_path": output_path,
                "filename": filename,
                "pages_converted": 1
            }
            
        except Exception as e:
            print(f"PyMuPDF basic conversion failed: {e}")
            return {"success": False, "error": str(e)}
    
    def _enhance_image_quality(self, image: Image.Image, dpi: int) -> Image.Image:
        """Enhance image quality with various filters and adjustments"""
        try:
            # Convert to RGB if not already
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Apply enhancements based on DPI
            if dpi >= 300:  # High DPI - apply advanced enhancements
                # Slight sharpening
                enhancer = ImageEnhance.Sharpness(image)
                image = enhancer.enhance(1.1)
                
                # Contrast enhancement
                enhancer = ImageEnhance.Contrast(image)
                image = enhancer.enhance(1.05)
                
                # Color enhancement
                enhancer = ImageEnhance.Color(image)
                image = enhancer.enhance(1.02)
                
            elif dpi >= 150:  # Medium DPI - moderate enhancements
                enhancer = ImageEnhance.Sharpness(image)
                image = enhancer.enhance(1.05)
                
                enhancer = ImageEnhance.Contrast(image)
                image = enhancer.enhance(1.02)
            
            # For low DPI (72), minimal processing to avoid artifacts
            
            return image
            
        except Exception as e:
            print(f"Error enhancing image quality: {e}")
            return image  # Return original if enhancement fails

def convert_pdf_to_jpg(pdf_path: str, output_dir: str = None, **kwargs) -> Dict[str, Any]:
    """
    Main function to convert PDF to JPG with enhanced capabilities
    """
    converter = PDFToJPGConverter(output_dir)
    return converter.convert_pdf_to_jpg(pdf_path, **kwargs)

def test_converter():
    """Test function for the PDF to JPG converter"""
    converter = PDFToJPGConverter()
    
    test_pdf = "test_sample.pdf"
    if not os.path.exists(test_pdf):
        print("No test PDF found, skipping test")
        return
    
    result = converter.convert_pdf_to_jpg(test_pdf, dpi=300, quality=95)
    print(f"Converter test result: {result}")

if __name__ == "__main__":
    test_converter()
