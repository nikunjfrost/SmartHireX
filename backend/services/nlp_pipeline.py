"""
nlp_pipeline.py
---------------
Dataset-driven NLP pipeline for skill extraction.

v2 improvements over the original hardcoded version:
- SKILLS_DB is now built from skills_list.csv + skills_database.json via
  dataset_loader, giving 400+ categorized skills instead of ~80 hardcoded ones.
- SKILL_CATEGORIES exposes skill -> category for downstream use.
- Multi-word skill matching supports spaces AND hyphens (e.g. 'react native'
  OR 'react-native').
- Auto-generated aliases for dot/hyphen/space variants from the dataset.
- Legacy hardcoded aliases kept and merged with dataset-derived aliases.
"""

import re
from services.dataset_loader import ALL_SKILLS, SKILL_CATEGORIES, DATASET_ALIASES

# ── Legacy aliases kept for backward compatibility ────────────────────────────
# Maps alias_lower -> canonical_lower that must already be in ALL_SKILLS.
_LEGACY_ALIASES = {
    "reactjs":           "react",
    "react.js":          "react",
    "nodejs":            "node.js",
    "node":              "node.js",
    "nextjs":            "next.js",
    "nuxtjs":            "nuxt.js",
    "csharp":            "c#",
    "cpp":               "c++",
    "js":                "javascript",
    "ts":                "typescript",
    "golang":            "go",
    "postgres":          "postgresql",
    "mongo":             "mongodb",
    "k8s":               "kubernetes",
    "sklearn":           "scikit-learn",
    "amazon web services": "aws",
    "google cloud":      "gcp",
    "microsoft azure":   "azure",
    "tensorflow":        "tensorflow",
    "shell scripting":   "shell scripting",
    "bash scripting":    "shell scripting",
}

# Merge: dataset-derived aliases first, then legacy overrides
SKILL_ALIASES: dict = {**DATASET_ALIASES, **_LEGACY_ALIASES}


def _make_pattern(term: str) -> str:
    """
    Build a word-boundary-aware regex for a skill/alias term.
    Spaces and hyphens are treated interchangeably so 'react native'
    also matches 'react-native' in the text.
    """
    escaped = re.escape(term)
    # allow space or hyphen between words
    flexible = escaped.replace(r"\ ", r"[\s\-]").replace(" ", r"[\s\-]")
    start = r"\b" if re.match(r"^\w", term) else r"(?<!\w)"
    end   = r"\b" if re.search(r"\w$", term)  else r"(?!\w)"
    return start + flexible + end


def extract_skills_and_keywords(text: str) -> list:
    """
    Extract skills from text using the dataset-loaded skill database.

    Parameters
    ----------
    text : str
        Raw text from a resume or job description.

    Returns
    -------
    list[str]
        Sorted list of canonical skill names (lower-case) found in the text.
    """
    if not text:
        return []

    text_lower = text.lower()
    found: set = set()

    # 1. Match every skill in the dataset
    for skill in ALL_SKILLS:
        pattern = _make_pattern(skill)
        if re.search(pattern, text_lower):
            found.add(skill)

    # 2. Match aliases → add the canonical form
    for alias, canonical in SKILL_ALIASES.items():
        if canonical not in ALL_SKILLS:
            continue  # don't add skills not in our DB
        # Special-case 'js' to avoid false positives inside '.js' filenames
        if alias == "js":
            pattern = r"(?<!\.)\bjs\b"
        else:
            pattern = _make_pattern(alias)
        if re.search(pattern, text_lower):
            found.add(canonical)

    return sorted(found)


def get_skill_category(skill: str) -> str:
    """Return the category of a skill, or 'General' if unknown."""
    return SKILL_CATEGORIES.get(skill.lower(), "General")


def group_skills_by_category(skills: list) -> dict:
    """
    Group a list of skill strings by their dataset category.
    Returns {category: [skills...]} sorted by category name.
    """
    grouped: dict = {}
    for skill in skills:
        cat = get_skill_category(skill)
        grouped.setdefault(cat, []).append(skill)
    return dict(sorted(grouped.items()))
