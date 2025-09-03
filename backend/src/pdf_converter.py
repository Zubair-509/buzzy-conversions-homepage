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
from docx.oxml.parser import OxmlElement
from docx.oxml.ns import qn


class AdvancedPDFConverter:
    """Advanced PDF to Word converter with layout preservation"""
    
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
        self.image_counter = 0
        
    def extract_text_with_formatting(self, page: fitz.Page) -> List[Dict]:
        """Extract text with formatting information"""
        text_dict = page.get_text("dict", flags=11)
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
    
    def extract_images(self, page: fitz.Page, doc) -> List[Dict]:
        """Extract and save images from page"""
        extracted_images = []
        
        try:
            image_list = page.get_images()
            
            for img_index, img in enumerate(image_list):
                try:
                    xref = img[0]
                    
                    # Check if document is still valid
                    if not page.parent or page.parent.is_closed:
                        print("Document closed, skipping image extraction")
                        break
                    
                    pix = fitz.Pixmap(page.parent, xref)
                    
                    if pix.n - pix.alpha < 4:  # GRAY or RGB
                        # Convert to PIL Image
                        img_data = pix.tobytes("ppm")
                        pil_img = Image.open(io.BytesIO(img_data))
                        
                        # Save image temporarily
                        img_filename = f"image_{self.image_counter}.png"
                        img_path = os.path.join(self.temp_dir, img_filename)
                        pil_img.save(img_path, "PNG")
                        
                        extracted_images.append({
                            "path": img_path,
                            "filename": img_filename,
                            "rect": None,
                            "size": pil_img.size
                        })
                        
                        self.image_counter += 1
                        pil_img.close()  # Close PIL image
                    
                    # Free pixmap memory
                    if pix:
                        pix = None
                    
                except Exception as e:
                    print(f"Error extracting image {img_index}: {e}")
                    continue
                    
        except Exception as e:
            print(f"Error in image extraction: {e}")
            
        return extracted_images
    
    def detect_tables(self, page: fitz.Page) -> List[Dict]:
        """Detect and extract table data from page"""
        tables = []
        
        try:
            # Use PyMuPDF's table detection (available in newer versions)
            if hasattr(page, 'find_tables'):
                page_tables = page.find_tables()
            else:
                # Fallback if find_tables is not available
                return tables
            
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
    
    def add_text_to_doc(self, doc, formatted_blocks: List[Dict]):
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
    
    def add_images_to_doc(self, doc, images: List[Dict]):
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
    
    def add_tables_to_doc(self, doc, tables: List[Dict]):
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
        pdf_doc = None
        try:
            # Validate input file
            if not os.path.exists(pdf_path):
                return {
                    "success": False,
                    "error": "Input PDF file not found"
                }
            
            # Open PDF with error handling
            try:
                pdf_doc = fitz.open(pdf_path)
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Failed to open PDF: {str(e)}"
                }
            
            # Check if PDF is valid and not empty
            if pdf_doc.page_count == 0:
                pdf_doc.close()
                return {
                    "success": False,
                    "error": "PDF file is empty or corrupted"
                }
            
            # Create Word document
            word_doc = Document()
            pages_processed = 0
            
            # Process each page with individual error handling
            for page_num in range(pdf_doc.page_count):
                try:
                    page = pdf_doc[page_num]
                    
                    # Add page break if not first page
                    if page_num > 0:
                        word_doc.add_page_break()
                    
                    # Extract text with basic method if advanced fails
                    try:
                        formatted_blocks = self.extract_text_with_formatting(page)
                        self.add_text_to_doc(word_doc, formatted_blocks)
                    except Exception as e:
                        print(f"Advanced text extraction failed for page {page_num + 1}, using basic method: {e}")
                        # Fallback to basic text extraction
                        text = page.get_text()
                        if text.strip():
                            p = word_doc.add_paragraph(text)
                    
                    # Extract images with error handling
                    try:
                        images = self.extract_images(page, word_doc)
                        if images:
                            self.add_images_to_doc(word_doc, images)
                    except Exception as e:
                        print(f"Image extraction failed for page {page_num + 1}: {e}")
                    
                    # Detect tables with error handling
                    try:
                        tables = self.detect_tables(page)
                        if tables:
                            self.add_tables_to_doc(word_doc, tables)
                    except Exception as e:
                        print(f"Table detection failed for page {page_num + 1}: {e}")
                    
                    pages_processed += 1
                    
                except Exception as e:
                    print(f"Error processing page {page_num + 1}: {e}")
                    # Continue with next page
                    continue
            
            # Save Word document
            try:
                word_doc.save(output_path)
            except Exception as e:
                if pdf_doc:
                    pdf_doc.close()
                return {
                    "success": False,
                    "error": f"Failed to save Word document: {str(e)}"
                }
            
            # Close PDF safely
            if pdf_doc:
                pdf_doc.close()
            
            # Cleanup temp files
            try:
                self._cleanup_temp_files()
            except Exception as e:
                print(f"Warning: Failed to cleanup temp files: {e}")
            
            # Verify output file was created
            if not os.path.exists(output_path):
                return {
                    "success": False,
                    "error": "Output file was not created successfully"
                }
            
            return {
                "success": True,
                "message": "PDF converted to Word successfully",
                "pages_processed": pages_processed,
                "output_file": output_path
            }
            
        except Exception as e:
            # Ensure PDF is closed on any error
            if pdf_doc:
                try:
                    pdf_doc.close()
                except:
                    pass
            
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