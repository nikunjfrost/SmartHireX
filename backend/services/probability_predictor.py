"""
probability_predictor.py
------------------------
Predict hiring probability for a candidate against a job description.

v2 improvements:
- Integrates job_roles.csv data: when the best role match is known,
  the candidate's experience years are compared against the role's
  required experience and an experience multiplier is applied.
- Falls back to the v1 formula when no role match is available.
"""

import re
from backend.services.matcher import calculate_match_score
from backend.services.ats_scorer import calculate_ats_score
from backend.services.nlp_pipeline import extract_skills_and_keywords
from backend.services.job_matcher import find_matching_roles
from backend.services.dataset_loader import JOB_ROLES


def _parse_experience_years(text: str) -> int:
    """Extract years of experience from resume text (heuristic)."""
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


def _experience_multiplier(candidate_years: int, required_years: int) -> float:
    """
    Returns a multiplier (0.7 – 1.0) based on how the candidate's experience
    compares to the role's requirement.
    """
    if required_years == 0:
        return 1.0
    if candidate_years == 0:
        return 0.85 # Slight penalty for unknown experience

    gap = required_years - candidate_years
    if gap <= 0:
        return 1.0
    elif gap == 1:
        return 0.95
    elif gap == 2:
        return 0.90
    elif gap == 3:
        return 0.85
    else:
        return 0.75


def predict_hiring_probability(resume_text: str, jd_text: str) -> dict:
    """
    Predict hiring probability as a 0-100 score.

    Formula (v2.1):
        base = (match_score × 0.70) + (ats_score × 0.30)
        final = base × experience_multiplier
    """
    if not resume_text or not jd_text:
        return {"probability": 0.0, "components": {}}

    # --- Core scores ---
    match_score = calculate_match_score(resume_text, jd_text)
    ats_result  = calculate_ats_score(resume_text, jd_text)
    ats_score   = ats_result.get("total_score", 0.0)

    # --- Experience factor ---
    candidate_years  = _parse_experience_years(resume_text)
    resume_skills    = extract_skills_and_keywords(resume_text)
    top_matches      = find_matching_roles(resume_skills, top_n=1)

    best_role_title  = "Unknown"
    required_years   = 0

    if top_matches:
        best = top_matches[0]
        best_role_title = best["title"]
        role_info = JOB_ROLES.get(best_role_title, {})
        required_years = role_info.get("experience_years", 0)

    exp_factor = _experience_multiplier(candidate_years, required_years)

    # --- Final weighted probability ---
    # We use 70% Match (Skills + Semantic) and 30% ATS (Structure + Diversity)
    base_probability  = (match_score * 0.70) + (ats_score * 0.30)
    final_probability = base_probability * exp_factor

    # Final Cap and Smoothing
    # If match score is very high (>90), we give a small boost
    if match_score > 90:
        final_probability += 5
        
    final_probability = min(max(final_probability, 0.0), 100.0)

    return {
        "probability": round(final_probability, 2),
        "components": {
            "match_score":         match_score,
            "ats_score":           ats_score,
            "experience_years":    candidate_years,
            "required_experience": required_years,
            "experience_factor":   exp_factor,
            "best_role_match":     best_role_title,
        }
    }
