import os
import logging
import PyPDF2
import docx

def parse_file(file_path):
    _, ext = os.path.splitext(file_path)

    ext = ext.lower()
    if ext == ".txt":
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()

    elif ext == ".pdf":
        with open(file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            return '\n'.join(page.extract_text() or '' for page in reader.pages)

    elif ext in [".doc", ".docx"]:
        doc = docx.Document(file_path)
        return '\n'.join(p.text for p in doc.paragraphs)

    else:
        raise ValueError("Unsupported file type")
