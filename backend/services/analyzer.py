"""
analyzer.py
-----------
Resume analysis service.

v2 improvements:
- Integrates job_matcher to return real top-5 matched job roles instead of 0.
- Heuristically extracts education and experience years from the resume text.
- Groups extracted skills by category using the dataset skill categories.
"""

import re
from backend.services.extractor import extract_resume_text
from backend.services.nlp_pipeline import extract_skills_and_keywords, group_skills_by_category
from backend.services.job_matcher import find_matching_roles


# ── Small helpers for structured resume field extraction ──────────────────────

def _parse_experience_years(text: str) -> int:
    """
    Try to pull an experience year count out of the resume text.
    Handles patterns like:
      'Experience: 5 years'  /  '5+ years of experience'  /  '5 years experience'
    """
    patterns = [
        r"experience[:\s]+(\d+)\s*\+?\s*years?",
        r"(\d+)\s*\+?\s*years?\s+(?:of\s+)?experience",
        r"(\d+)\s*\+?\s*yrs?\s+(?:of\s+)?experience",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return int(m.group(1))
    return 0


def _parse_education(text: str) -> str:
    """
    Try to extract the education level from the resume text.
    Handles the training-data pattern 'Education: <value>' as well as
    common free-text mentions.
    """
    # Pattern used in the training dataset
    m = re.search(r"education[:\s]+([^\n,|]+)", text, re.IGNORECASE)
    if m:
        return m.group(1).strip()

    # Fallback: detect degree keywords
    degree_keywords = [
        "phd", "doctorate", "master", "mba", "bachelor", "associate",
        "diploma", "bootcamp", "certification", "high school",
    ]
    text_lower = text.lower()
    for kw in degree_keywords:
        if kw in text_lower:
            return kw.capitalize()

    return "Not specified"


# ── Main analysis function ────────────────────────────────────────────────────

def analyze_resume(filepath: str) -> dict:
    """
    Full resume analysis pipeline.

    Returns
    -------
    dict with keys:
        status          : 'success' | 'error'
        analysis        : dict (on success)
          skills              : list[str]  – all extracted skills
          skills_by_category  : dict       – {category: [skills]}
          name                : str
          education           : str
          experience_years    : int
          matched_jobs        : int        – count of roles matched
          top_job_matches     : list[dict] – top 5 role matches from dataset
    """
    try:
        text = extract_resume_text(filepath)

        # --- Skill extraction (dataset-driven) ---
        skills = extract_skills_and_keywords(text)
        skills_by_category = group_skills_by_category(skills)

        # --- Structured field parsing ---
        experience_years = _parse_experience_years(text)
        education = _parse_education(text)

        # --- Job role matching (dataset-driven) ---
        top_matches = find_matching_roles(skills, top_n=5)

        return {
            "status": "success",
            "analysis": {
                "skills": skills,
                "skills_by_category": skills_by_category,
                "name": "Extraction Pending",       # Would need NER for reliable extraction
                "education": education,
                "experience_years": experience_years,
                "matched_jobs": len(top_matches),
                "top_job_matches": top_matches,
            }
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
