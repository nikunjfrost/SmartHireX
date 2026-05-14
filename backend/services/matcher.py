from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from services.nlp_pipeline import extract_skills_and_keywords

def find_keyword_gaps(resume_text, jd_text):
    """
    Compare JD keywords against Resume keywords.
    Returns a dictionary featuring 'missing_keywords' and 'matched_keywords' lists.
    """
    if not jd_text:
        return {"missing_keywords": [], "matched_keywords": []}
    
    resume_keywords = set(extract_skills_and_keywords(resume_text)) if resume_text else set()
    jd_keywords = set(extract_skills_and_keywords(jd_text))
    
    matched_keywords = list(jd_keywords.intersection(resume_keywords))
    missing_keywords = list(jd_keywords.difference(resume_keywords))
    
    return {
        "missing_keywords": sorted(missing_keywords),
        "matched_keywords": sorted(matched_keywords)
    }

def calculate_match_score(resume_text, jd_text):
    """
    Calculate the match score between a resume and a job description.
    
    Hybrid Approach:
    - 70% Skill Overlap: Based on exact skill extraction from both texts.
    - 30% Semantic Similarity: Based on TF-IDF cosine similarity of raw text.
    
    Returns the match score as a percentage (0.0 to 100.0).
    """
    if not resume_text or not jd_text:
        return 0.0
        
    resume_text = str(resume_text)
    jd_text = str(jd_text)
    
    # 1. Skill Overlap (70%)
    resume_skills = set(extract_skills_and_keywords(resume_text))
    jd_skills = set(extract_skills_and_keywords(jd_text))
    
    if not jd_skills:
        skill_score = 100.0  # No specific skills required in JD
    else:
        matched = jd_skills.intersection(resume_skills)
        skill_score = (len(matched) / len(jd_skills)) * 100.0

    # 2. Semantic Similarity (30%)
    try:
        documents = [resume_text, jd_text]
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(documents)
        similarity_matrix = cosine_similarity(tfidf_matrix[0], tfidf_matrix[1])
        semantic_score = similarity_matrix[0][0] * 100.0
    except (ValueError, ZeroDivisionError):
        semantic_score = 0.0

    # 3. Combined Score
    final_score = (skill_score * 0.70) + (semantic_score * 0.30)
    
    return float(round(final_score, 2))
