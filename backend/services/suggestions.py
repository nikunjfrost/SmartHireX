"""
suggestions.py
--------------
Resume improvement suggestions service.

v2 improvements over the original:
- Category-aware: flags entire skill categories missing from the resume.
- Role-specific: if a top job-role match is identified, surfaces required skills
  for that specific role (from job_roles.csv) rather than only generic JD gaps.
- Still backward-compatible: all v1 suggestion types are preserved.
"""

import re
from services.matcher import find_keyword_gaps
from services.nlp_pipeline import extract_skills_and_keywords, group_skills_by_category, get_skill_category
from services.job_matcher import find_matching_roles, get_required_skills_for_role

# Core categories expected in a well-rounded tech resume
_TECH_CATEGORIES = {
    "Programming",
    "Web Development",
    "Cloud & DevOps",
    "Database",
    "Data Science & Analytics",
}

# Action verbs for v1 language check (preserved)
_ACTION_VERBS = [
    "developed", "managed", "created", "implemented", "led", "designed",
    "improved", "increased", "decreased", "negotiated", "collaborated",
    "architected", "optimized", "delivered", "built", "launched",
]


def generate_suggestions(resume_text: str, jd_text: str = "") -> dict:
    """
    Generate actionable, prioritised suggestions for resume improvement.

    Parameters
    ----------
    resume_text : str
        Raw text extracted from the candidate's resume.
    jd_text : str, optional
        Raw text of the job description (for targeted gap analysis).

    Returns
    -------
    dict with key 'suggestions': list[str]
    """
    suggestions: list = []

    if not resume_text:
        return {"suggestions": ["Your resume text couldn't be evaluated. Please upload a readable PDF."]}

    text_lower = resume_text.lower()

    # ── 1. Section presence check (v1, preserved) ──────────────────────────
    missing_sections = []
    if not re.search(r"\beducation\b|\bacademic\b|\bcoursework\b", text_lower):
        missing_sections.append("Education")
    if not re.search(r"\bexperience\b|\bwork history\b|\bemployment\b", text_lower):
        missing_sections.append("Experience")
    if not re.search(r"\bskills\b|\btechnologies\b|\bcertifications\b|\btooling\b", text_lower):
        missing_sections.append("Skills")

    if missing_sections:
        suggestions.append(
            f"Section Improvement: Consider adding distinct headers for missing sections: "
            f"{', '.join(missing_sections)}. ATS parsers rely on standard headers to categorise your information."
        )
    else:
        suggestions.append(
            "Section Improvement: Great job! Your resume contains all fundamental sections "
            "(Education, Experience, Skills)."
        )

    # ── 2. JD keyword gap analysis (v1, enhanced) ──────────────────────────
    if jd_text:
        keyword_gaps = find_keyword_gaps(resume_text, jd_text)
        missing_keywords = keyword_gaps.get("missing_keywords", [])
        matched_keywords = keyword_gaps.get("matched_keywords", [])

        if missing_keywords:
            suggestions.append(
                f"Missing Skills (JD match): The job description emphasises skills you haven't "
                f"explicitly mentioned: {', '.join(missing_keywords)}."
            )
            if len(missing_keywords) > 3:
                suggestions.append(
                    "Keyword Optimisation: Your resume is missing multiple core requirements. "
                    "Try to naturally weave these keywords into your work experience bullet points."
                )
            else:
                suggestions.append(
                    "Keyword Optimisation: You have a strong match! Sprinkle the few missing keywords "
                    "into your relevant experience sections to pass ATS filters seamlessly."
                )
        else:
            suggestions.append(
                "Keyword Optimisation: Excellent! You've matched all the tracked technical keywords "
                "found in the job description."
            )
    else:
        suggestions.append(
            "Keyword Optimisation: Provide a Job Description (JD) to receive targeted keyword "
            "and missing skills suggestions."
        )

    # ── 3. Role-specific gap analysis (NEW — uses job_roles.csv) ───────────
    resume_skills = extract_skills_and_keywords(resume_text)
    top_matches   = find_matching_roles(resume_skills, top_n=1)

    if top_matches:
        best = top_matches[0]
        role_title = best["title"]
        role_score = best["match_score"]
        role_missing = best["missing_skills"]

        suggestions.append(
            f"Best Role Match: Your skills align most closely with '{role_title}' "
            f"({best['category']}) — {role_score:.0f}% skill match "
            f"(Salary range: {best['salary_range']})."
        )

        if role_missing:
            top_missing = role_missing[:5]  # surface up to 5 critical gaps
            suggestions.append(
                f"Role-specific Gaps: To strengthen your candidacy for '{role_title}', "
                f"consider adding: {', '.join(top_missing)}."
            )
        else:
            suggestions.append(
                f"Role-specific Coverage: You cover 100% of the required skills for "
                f"'{role_title}'. Consider highlighting this in your summary."
            )

    # ── 4. Category coverage (NEW — uses dataset skill categories) ──────────
    if resume_skills:
        skills_by_cat = group_skills_by_category(resume_skills)
        covered_cats  = set(skills_by_cat.keys())
        gap_cats      = _TECH_CATEGORIES - covered_cats

        if gap_cats:
            suggestions.append(
                f"Skill Category Gaps: Your resume appears to lack skills in: "
                f"{', '.join(sorted(gap_cats))}. Adding at least one skill from each "
                f"category can make your profile more versatile."
            )

    # ── 5. Resume length / formatting check (v1, preserved) ────────────────
    word_count = len(resume_text.split())
    if word_count < 150:
        suggestions.append(
            "Formatting: Your resume is extremely brief. High-impact resumes usually have "
            "300–600 words. Expand on your responsibilities and achievements."
        )
    elif word_count < 300:
        suggestions.append(
            "Formatting: Your resume is on the shorter side. Consider adding more detail "
            "about projects or specific accomplishments."
        )
    elif word_count > 1200:
        suggestions.append(
            "Formatting: Your resume exceeds the ideal length. Aim for a concise 1–2 page "
            "format (approx. 400–800 words) to keep the recruiter's attention."
        )

    # ── 6. Action verb check (v1, enhanced list) ───────────────────────────
    found_verbs = [v for v in _ACTION_VERBS if re.search(r"\b" + v + r"\b", text_lower)]
    if len(found_verbs) < 3:
        suggestions.append(
            "Language: Use more action verbs (e.g. Developed, Managed, Integrated, Optimised) "
            "to describe your experience. It makes your contributions sound more impactful."
        )

    return {"suggestions": suggestions}
