"""
job_matcher.py
--------------
Uses job_roles.csv (via dataset_loader) to match a candidate's skills
against 325 job roles and return ranked matches.
"""

from backend.services.dataset_loader import JOB_ROLES, JOB_ROLE_SKILLS


def find_matching_roles(resume_skills: list, top_n: int = 5) -> list:
    """
    Given a list of extracted resume skills (any case), score every job
    role in the dataset and return the top-N ranked matches.

    Scoring formula:
        score = (matched_required / total_required) * 100
        tiebreaker: roles with more matched skills rank higher

    Returns
    -------
    list of dict, each containing:
        {
            "title": str,
            "category": str,
            "match_score": float,          # 0-100
            "matched_skills": list[str],   # skills the candidate has
            "missing_skills": list[str],   # required skills they lack
            "experience_required": int,
            "salary_range": str,
        }
    """
    if not resume_skills or not JOB_ROLES:
        return []

    resume_lower = {s.lower() for s in resume_skills}
    scored = []

    for title, skills_lower in JOB_ROLE_SKILLS.items():
        if not skills_lower:
            continue

        role_info = JOB_ROLES[title]
        required_orig = role_info["required_skills"]        # original case list
        required_lower = skills_lower                       # lower list (same order)

        matched = [
            required_orig[i]
            for i, s in enumerate(required_lower)
            if s in resume_lower
        ]
        missing = [
            required_orig[i]
            for i, s in enumerate(required_lower)
            if s not in resume_lower
        ]

        score = (len(matched) / len(required_lower)) * 100

        scored.append({
            "title": title,
            "category": role_info["category"],
            "match_score": round(score, 2),
            "matched_skills": sorted(matched),
            "missing_skills": sorted(missing),
            "experience_required": role_info["experience_years"],
            "salary_range": role_info["salary_range"],
        })

    # Sort by score desc, then by number of matched skills desc
    scored.sort(key=lambda x: (x["match_score"], len(x["matched_skills"])), reverse=True)
    return scored[:top_n]


def get_best_role_match(resume_skills: list) -> dict | None:
    """
    Return the single best-matching job role, or None if no skills provided.
    """
    matches = find_matching_roles(resume_skills, top_n=1)
    return matches[0] if matches else None


def get_required_skills_for_role(role_title: str) -> list:
    """
    Return the required skills (original case) for a given job role title.
    Returns empty list if the role is not found.
    """
    info = JOB_ROLES.get(role_title)
    if not info:
        return []
    return info["required_skills"]
