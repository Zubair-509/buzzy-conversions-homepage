#!/usr/bin/env python3
"""
Advanced PDF to Word Converter
Handles complex documents with images, tables, and formatting preservation
"""

import os
import io
import uuid
import tempfile
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import cv2
from PIL import Image

import fitz  # PyMuPDF
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.shared import OxmlElement, qn


class AdvancedPDFConverter:
    """Advanced PDF to Word converter with layout preservation"""
    
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
        self.image_counter = 0
        
    def extract_text_with_formatting(self, page: fitz.Page) -> List[Dict]:
        """Extract text with formatting information"""
        text_dict = page.get_text("dict")
        formatted_blocks = []
        
        for block in text_dict["blocks"]:
            if "lines" in block:  # Text block
                block_info = {
                    "type": "text",
                    "bbox": block["bbox"],
                    "lines": []
                }
                
                for line in block["lines"]:
                    line_info = {
                        "bbox": line["bbox"],
                        "spans": []
                    }
                    
                    for span in line["spans"]:
                        span_info = {
                            "text": span["text"],
                            "font": span["font"],
                            "size": span["size"],
                            "flags": span["flags"],  # Bold, italic, etc.
                            "color": span["color"],
                            "bbox": span["bbox"]
                        }
                        line_info["spans"].append(span_info)
                    
                    block_info["lines"].append(line_info)
                formatted_blocks.append(block_info)
                
        return formatted_blocks
    
    def extract_images(self, page: fitz.Page, doc: Document) -> List[Dict]:
        """Extract and save images from page"""
        image_list = page.get_images()
        extracted_images = []
        
        for img_index, img in enumerate(image_list):
            try:
                xref = img[0]
                pix = fitz.Pixmap(page.parent, xref)
                
                if pix.n - pix.alpha < 4:  # GRAY or RGB
                    # Convert to PIL Image
                    img_data = pix.tobytes("ppm")
                    pil_img = Image.open(io.BytesIO(img_data))
                    
                    # Save image temporarily
                    img_filename = f"image_{self.image_counter}.png"
                    img_path = os.path.join(self.temp_dir, img_filename)
                    pil_img.save(img_path, "PNG")
                    
                    # Get image position and size
                    img_rect = page.get_image_rects(xref)[0] if page.get_image_rects(xref) else None
                    
                    extracted_images.append({
                        "path": img_path,
                        "filename": img_filename,
                        "rect": img_rect,
                        "size": pil_img.size
                    })
                    
                    self.image_counter += 1
                
                pix = None  # Free memory
                
            except Exception as e:
                print(f"Error extracting image {img_index}: {e}")
                continue
                
        return extracted_images
    
    def detect_tables(self, page: fitz.Page) -> List[Dict]:
        """Detect and extract table data from page"""
        tables = []
        
        try:
            # Use PyMuPDF's table detection
            page_tables = page.find_tables()
            
            for table in page_tables:
                table_data = table.extract()
                if table_data:
                    tables.append({
                        "bbox": table.bbox,
                        "data": table_data,
                        "rows": len(table_data),
                        "cols": len(table_data[0]) if table_data else 0
                    })
                    
        except Exception as e:
            print(f"Error detecting tables: {e}")
            
        return tables
    
    def add_text_to_doc(self, doc: Document, formatted_blocks: List[Dict]):
        """Add formatted text to Word document"""
        for block in formatted_blocks:
            if block["type"] == "text":
                paragraph = doc.add_paragraph()
                
                for line in block["lines"]:
                    for span in line["spans"]:
                        if span["text"].strip():
                            run = paragraph.add_run(span["text"])
                            
                            # Apply formatting
                            font = run.font
                            font.size = Pt(span["size"])
                            font.name = span["font"]
                            
                            # Handle text formatting flags
                            if span["flags"] & 2**4:  # Bold
                                font.bold = True
                            if span["flags"] & 2**1:  # Italic
                                font.italic = True
                            if span["flags"] & 2**2:  # Superscript
                                font.superscript = True
                            if span["flags"] & 2**0:  # Subscript
                                font.subscript = True
                                
                            # Apply color if not black
                            if span["color"] != 0:
                                color_int = span["color"]
                                r = (color_int >> 16) & 255
                                g = (color_int >> 8) & 255
                                b = color_int & 255
                                font.color.rgb = RGBColor(r, g, b)
    
    def add_images_to_doc(self, doc: Document, images: List[Dict]):
        """Add images to Word document"""
        for img_info in images:
            try:
                # Calculate appropriate size (max width 6 inches)
                width, height = img_info["size"]
                max_width = Inches(6)
                
                if width > max_width.emu:
                    ratio = height / width
                    width = max_width
                    height = Inches(max_width.inches * ratio)
                else:
                    width = Inches(width / 96)  # Convert pixels to inches
                    height = Inches(height / 96)
                
                paragraph = doc.add_paragraph()
                run = paragraph.add_run()
                run.add_picture(img_info["path"], width=width, height=height)
                paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
                
            except Exception as e:
                print(f"Error adding image {img_info['filename']}: {e}")
    
    def add_tables_to_doc(self, doc: Document, tables: List[Dict]):
        """Add tables to Word document with formatting"""
        for table_info in tables:
            try:
                table_data = table_info["data"]
                if not table_data:
                    continue
                    
                # Create table in Word
                rows = len(table_data)
                cols = len(table_data[0]) if table_data else 0
                
                if rows > 0 and cols > 0:
                    table = doc.add_table(rows=rows, cols=cols)
                    table.alignment = WD_TABLE_ALIGNMENT.CENTER
                    
                    # Fill table data
                    for row_idx, row_data in enumerate(table_data):
                        for col_idx, cell_data in enumerate(row_data):
                            if col_idx < len(table.rows[row_idx].cells):
                                cell = table.rows[row_idx].cells[col_idx]
                                cell.text = str(cell_data) if cell_data else ""
                    
                    # Add spacing after table
                    doc.add_paragraph()
                    
            except Exception as e:
                print(f"Error adding table: {e}")
    
    def convert_pdf_to_word(self, pdf_path: str, output_path: str) -> Dict[str, Any]:
        """Convert PDF to Word with advanced formatting preservation"""
        try:
            # Open PDF
            pdf_doc = fitz.open(pdf_path)
            
            # Create Word document
            word_doc = Document()
            
            # Process each page
            for page_num in range(len(pdf_doc)):
                page = pdf_doc[page_num]
                
                # Add page break if not first page
                if page_num > 0:
                    word_doc.add_page_break()
                
                # Extract formatted text
                formatted_blocks = self.extract_text_with_formatting(page)
                
                # Extract images
                images = self.extract_images(page, word_doc)
                
                # Detect tables
                tables = self.detect_tables(page)
                
                # Add content to Word document in order
                # First add text blocks
                self.add_text_to_doc(word_doc, formatted_blocks)
                
                # Then add images
                if images:
                    self.add_images_to_doc(word_doc, images)
                
                # Finally add tables
                if tables:
                    self.add_tables_to_doc(word_doc, tables)
            
            # Save Word document
            word_doc.save(output_path)
            
            # Close PDF
            pdf_doc.close()
            
            # Cleanup temp files
            self._cleanup_temp_files()
            
            return {
                "success": True,
                "message": "PDF converted to Word successfully",
                "pages_processed": len(pdf_doc),
                "output_file": output_path
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Conversion failed: {str(e)}"
            }
    
    def _cleanup_temp_files(self):
        """Clean up temporary files"""
        try:
            import shutil
            shutil.rmtree(self.temp_dir, ignore_errors=True)
        except Exception:
            pass


def convert_pdf_to_word_advanced(pdf_path: str, output_path: str) -> Dict[str, Any]:
    """Main function to convert PDF to Word"""
    converter = AdvancedPDFConverter()
    return converter.convert_pdf_to_word(pdf_path, output_path)


if __name__ == "__main__":
    # Test the converter
    import sys
    if len(sys.argv) > 2:
        pdf_file = sys.argv[1]
        word_file = sys.argv[2]
        result = convert_pdf_to_word_advanced(pdf_file, word_file)
        print(result)