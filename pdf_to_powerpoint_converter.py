#!/usr/bin/env python3
"""
Advanced PDF to PowerPoint Converter
Converts PDF files to PowerPoint presentations while preserving layout, content, and formatting.
Uses multiple methods for optimal conversion quality.
"""

import os
import tempfile
import traceback
import shutil
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import uuid

try:
    from pptx import Presentation
    from pptx.util import Inches, Pt
    from pptx.dml.color import RGBColor
    from pptx.enum.text import PP_ALIGN
    print("python-pptx successfully imported")
except ImportError as e:
    print(f"Warning: python-pptx not available - {e}")
    Presentation = None

try:
    from pdf2image import convert_from_path
    print("pdf2image successfully imported")
except ImportError as e:
    print(f"Warning: pdf2image not available - {e}")
    convert_from_path = None

try:
    import pdfplumber
    print("pdfplumber successfully imported")
except ImportError as e:
    print(f"Warning: pdfplumber not available - {e}")
    pdfplumber = None

try:
    from PIL import Image
    print("Pillow successfully imported")
except ImportError as e:
    print(f"Warning: Pillow not available - {e}")
    Image = None

class PDFToPowerPointConverter:
    """Advanced PDF to PowerPoint converter with multiple conversion methods"""
    
    def __init__(self, temp_dir: str = None):
        self.temp_dir = temp_dir or tempfile.gettempdir()
        self.conversion_cache = {}
        
    def convert_pdf_to_powerpoint(self, pdf_path: str, output_path: str = None) -> Dict[str, Any]:
        """
        Convert PDF to PowerPoint with advanced formatting preservation
        
        Args:
            pdf_path: Path to input PDF file
            output_path: Path for output PowerPoint file (optional)
            
        Returns:
            Dictionary with conversion results
        """
        try:
            if not os.path.exists(pdf_path):
                return {"success": False, "error": f"PDF file not found: {pdf_path}"}
            
            # Generate output path if not provided
            if not output_path:
                base_name = os.path.splitext(os.path.basename(pdf_path))[0]
                output_path = os.path.join(self.temp_dir, f"{base_name}_converted.pptx")
            
            print(f"Starting PDF to PowerPoint conversion: {pdf_path} -> {output_path}")
            
            # Method 1: Advanced conversion with text extraction and images
            if self._convert_with_advanced_method(pdf_path, output_path):
                print("Advanced conversion method succeeded")
                return {
                    "success": True, 
                    "output_path": output_path,
                    "method": "advanced",
                    "message": "Conversion completed with text and image preservation"
                }
            
            # Method 2: Image-based conversion (fallback)
            if self._convert_with_image_method(pdf_path, output_path):
                print("Image-based conversion method succeeded")
                return {
                    "success": True, 
                    "output_path": output_path,
                    "method": "image_based",
                    "message": "Conversion completed using image-based method"
                }
            
            # Method 3: Basic text-only conversion (last resort)
            if self._convert_with_text_method(pdf_path, output_path):
                print("Text-based conversion method succeeded")
                return {
                    "success": True, 
                    "output_path": output_path,
                    "method": "text_only",
                    "message": "Conversion completed with text-only method"
                }
            
            return {"success": False, "error": "All conversion methods failed"}
            
        except Exception as e:
            error_msg = f"Error in convert_pdf_to_powerpoint: {str(e)}"
            print(f"Error in convert_pdf_to_powerpoint: {error_msg}")
            print(traceback.format_exc())
            return {"success": False, "error": error_msg}
    
    def _convert_with_advanced_method(self, pdf_path: str, output_path: str) -> bool:
        """Advanced conversion combining text extraction with image conversion"""
        try:
            if not (pdfplumber and convert_from_path and Presentation):
                return False
            
            # Create presentation
            prs = Presentation()
            
            # Convert PDF pages to images for background
            images = convert_from_path(pdf_path, dpi=150, fmt='PNG')
            
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, (page, page_image) in enumerate(zip(pdf.pages, images)):
                    print(f"Processing page {page_num + 1}")
                    
                    # Add slide
                    slide_layout = prs.slide_layouts[6]  # Blank layout
                    slide = prs.slides.add_slide(slide_layout)
                    
                    # Save page image temporarily
                    temp_image_path = os.path.join(self.temp_dir, f"page_{page_num}.png")
                    page_image.save(temp_image_path, 'PNG')
                    
                    # Add background image
                    slide.shapes.add_picture(
                        temp_image_path, 
                        Inches(0), Inches(0), 
                        Inches(10), Inches(7.5)
                    )
                    
                    # Extract and add text with positioning
                    text_elements = page.extract_text_lines()
                    if text_elements:
                        for text_line in text_elements[:10]:  # Limit to prevent overcrowding
                            if text_line.get('text', '').strip():
                                try:
                                    # Add text box
                                    textbox = slide.shapes.add_textbox(
                                        Inches(0.5), Inches(0.5 + page_num * 0.3), 
                                        Inches(9), Inches(0.5)
                                    )
                                    text_frame = textbox.text_frame
                                    text_frame.text = text_line['text'][:100]  # Limit text length
                                    
                                    # Format text
                                    paragraph = text_frame.paragraphs[0]
                                    paragraph.font.size = Pt(12)
                                    paragraph.font.name = 'Arial'
                                except:
                                    continue
                    
                    # Clean up temp image
                    try:
                        os.remove(temp_image_path)
                    except:
                        pass
            
            # Save presentation
            prs.save(output_path)
            return True
            
        except Exception as e:
            print(f"Advanced conversion method failed: {e}")
            return False
    
    def _convert_with_image_method(self, pdf_path: str, output_path: str) -> bool:
        """Convert PDF to PowerPoint using image-based method"""
        try:
            if not (convert_from_path and Presentation):
                return False
            
            # Convert PDF pages to images
            images = convert_from_path(pdf_path, dpi=200, fmt='PNG')
            
            # Create presentation
            prs = Presentation()
            
            for page_num, image in enumerate(images):
                print(f"Converting page {page_num + 1} to slide")
                
                # Add slide
                slide_layout = prs.slide_layouts[6]  # Blank layout
                slide = prs.slides.add_slide(slide_layout)
                
                # Save image temporarily
                temp_image_path = os.path.join(self.temp_dir, f"slide_{page_num}.png")
                
                # Resize image to fit slide dimensions
                slide_width, slide_height = 1920, 1080  # 16:9 aspect ratio
                image = image.resize((slide_width, slide_height), Image.Resampling.LANCZOS)
                image.save(temp_image_path, 'PNG')
                
                # Add image to slide
                slide.shapes.add_picture(
                    temp_image_path, 
                    Inches(0), Inches(0), 
                    Inches(10), Inches(7.5)
                )
                
                # Clean up temp image
                try:
                    os.remove(temp_image_path)
                except:
                    pass
            
            # Save presentation
            prs.save(output_path)
            return True
            
        except Exception as e:
            print(f"Image-based conversion method failed: {e}")
            return False
    
    def _convert_with_text_method(self, pdf_path: str, output_path: str) -> bool:
        """Convert PDF to PowerPoint using text-only method"""
        try:
            if not (pdfplumber and Presentation):
                return False
            
            # Create presentation
            prs = Presentation()
            
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    print(f"Extracting text from page {page_num + 1}")
                    
                    # Add slide
                    slide_layout = prs.slide_layouts[1]  # Title and Content layout
                    slide = prs.slides.add_slide(slide_layout)
                    
                    # Set title
                    title = slide.shapes.title
                    title.text = f"Page {page_num + 1}"
                    
                    # Extract text
                    text = page.extract_text()
                    if text and text.strip():
                        # Add content
                        content = slide.placeholders[1]
                        content.text = text[:1000]  # Limit text length
                        
                        # Format text
                        for paragraph in content.text_frame.paragraphs:
                            paragraph.font.size = Pt(14)
                            paragraph.font.name = 'Arial'
                    else:
                        # Add placeholder text
                        content = slide.placeholders[1]
                        content.text = "[Content could not be extracted from this page]"
            
            # Save presentation
            prs.save(output_path)
            return True
            
        except Exception as e:
            print(f"Text-based conversion method failed: {e}")
            return False
    
    def cleanup_temp_files(self, conversion_id: str):
        """Clean up temporary files for a conversion"""
        try:
            temp_pattern = os.path.join(self.temp_dir, f"*{conversion_id}*")
            import glob
            for file_path in glob.glob(temp_pattern):
                try:
                    os.remove(file_path)
                except:
                    pass
        except Exception as e:
            print(f"Error cleaning up temp files: {e}")

def test_converter():
    """Test function for the PDF to PowerPoint converter"""
    converter = PDFToPowerPointConverter()
    
    # Test with a sample PDF (create a simple one for testing)
    test_pdf = "test_sample.pdf"
    if not os.path.exists(test_pdf):
        print("No test PDF found, skipping test")
        return
    
    result = converter.convert_pdf_to_powerpoint(test_pdf)
    print(f"Test result: {result}")

if __name__ == "__main__":
    test_converter()