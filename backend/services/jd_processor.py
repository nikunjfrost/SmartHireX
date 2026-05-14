from services.nlp_pipeline import extract_skills_and_keywords

def process_job_description(jd_text):
    """
    Process job description text to extract keywords and important skills.
    Applies the same NLP pipeline as resume processing for consistency.
    """
    if not jd_text or not isinstance(jd_text, str):
        raise ValueError("Valid JD text input is required.")
        
    skills = extract_skills_and_keywords(jd_text)
    
    return {
        "status": "success",
        "extracted_data": {
            "skills": skills,
            "keywords": skills  # They can be expanded later if keywords differ from skills
        }
    }
