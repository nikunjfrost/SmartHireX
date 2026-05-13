import fitz
import docx  # type: ignore
import re
import os

def extract_resume_text(file_path):
    """
    Extract full text from a PDF or DOCX resume using PyMuPDF (fitz) or python-docx
    and clean unwanted characters.
    """
    try:
        text = ""
        _, ext = os.path.splitext(file_path)
        ext = ext.lower()
        
        if ext == '.pdf':
            doc = fitz.open(file_path)
            for page in doc:
                text += page.get_text()
            doc.close()
        elif ext == '.docx':
            doc = docx.Document(file_path)
            for paragraph in doc.paragraphs:
                text += paragraph.text + " "
        else:
            raise ValueError("Unsupported file format for extraction.")
            
        # Clean unwanted characters
        text = text.replace('\x00', '')
        # Replace multiple spaces, newlines, and tabs with a single space
        text = re.sub(r'\s+', ' ', text)
        # Strip leading and trailing whitespace
        text = text.strip()
        
        return text
    except Exception as e:
        raise Exception(f"Failed to extract text from file: {str(e)}")
