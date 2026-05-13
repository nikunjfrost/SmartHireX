ALLOWED_EXTENSIONS = {'pdf', 'docx'}

def allowed_file(filename):
    """
    Check if the uploaded file has an allowed extension.
    Currently supports pdf and docx files.
    """
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
