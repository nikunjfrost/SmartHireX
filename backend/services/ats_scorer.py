import re
from backend.services.matcher import calculate_match_score

def calculate_ats_score(resume_text, jd_text=""):
    """
    Calculate an ATS score (0-100) based on:
    - Keyword match (30%)
    - Section presence (30%)
    - Formatting & Length (20%)
    - Skill Diversity/Categories (10%)
    - Readability (10%)
    """
    if not resume_text:
        return {"total_score": 0, "breakdown": {}}

    from backend.services.nlp_pipeline import extract_skills_and_keywords, group_skills_by_category

    total_score = 0.0
    breakdown = {}
    
    # 1. Keyword match (30%)
    keyword_score = 0.0
    if jd_text:
        match_percentage = calculate_match_score(resume_text, jd_text)
        keyword_score = match_percentage * 0.30
    total_score += keyword_score
    breakdown['keyword_match'] = round(keyword_score, 2)

    # 2. Section presence (30%)
    sections_found = 0
    text_lower = resume_text.lower()
    
    # Standard ATS headers
    headers = [
        r'\beducation\b|\bacademic\b',
        r'\bexperience\b|\bwork history\b|\bemployment\b',
        r'\bskills\b|\btechnologies\b',
        r'\bprojects\b|\bportfolio\b',
        r'\bsummary\b|\bobjective\b'
    ]
    
    for h in headers:
        if re.search(h, text_lower):
            sections_found += 1

    section_score = (sections_found / len(headers)) * 30.0
    total_score += section_score
    breakdown['section_presence'] = round(section_score, 2)

    # 3. Formatting & Length (20%)
    words = resume_text.split()
    word_count = len(words)
    
    if 400 <= word_count <= 800:
        formatting_score = 20.0
    elif 200 <= word_count < 400 or 800 < word_count <= 1200:
        formatting_score = 15.0
    else:
        formatting_score = 5.0

    total_score += formatting_score
    breakdown['formatting'] = round(formatting_score, 2)

    # 4. Skill Diversity (10%)
    # Check if the resume covers multiple categories (well-roundedness)
    skills = extract_skills_and_keywords(resume_text)
    grouped = group_skills_by_category(skills)
    diversity_score = min(len(grouped) * 2.0, 10.0) # 2 points per category, max 10
    
    total_score += diversity_score
    breakdown['skill_diversity'] = round(diversity_score, 2)

    # 5. Readability (10%)
    readability_score = 0.0
    if word_count > 0:
        avg_word_length = sum(len(w) for w in words) / word_count
        if 4.8 <= avg_word_length <= 6.5:
            readability_score = 10.0
        elif 4.0 <= avg_word_length < 4.8 or 6.5 < avg_word_length <= 8.5:
            readability_score = 6.0
        else:
            readability_score = 2.0
            
    total_score += readability_score
    breakdown['readability'] = round(readability_score, 2)

    return {
        "total_score": round(total_score, 2),
        "breakdown": breakdown
    }
