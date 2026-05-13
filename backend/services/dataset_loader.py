"""
dataset_loader.py
-----------------
Centralized loader for all dataset files under practicum/dataset/.
All data is parsed once at import time and cached as module-level constants.

Exposed symbols
---------------
ALL_SKILLS          : set[str]          – lower-cased deduplicated skill names
SKILL_CATEGORIES    : dict[str, str]    – skill (lower) -> category name
JOB_ROLES           : dict[str, dict]   – job title -> {category, education, experience_years,
                                           required_skills (list[str]), salary_range}
JOB_ROLE_SKILLS     : dict[str, list]   – job title -> required_skills (list, lower-cased)
"""

import os
import csv
import json
import re

# ── locate the dataset folder relative to THIS file ──────────────────────────
_THIS_DIR   = os.path.dirname(os.path.abspath(__file__))   # backend/services/
_BACKEND    = os.path.dirname(_THIS_DIR)                    # backend/
_PROJECT    = os.path.dirname(_BACKEND)                     # practicum/
_DATASET    = os.path.join(_PROJECT, "dataset")


def _load_skills_csv() -> dict:
    """
    Parse dataset/skills_list.csv.
    Returns {skill_lower: category}.
    """
    result = {}
    path = os.path.join(_DATASET, "skills_list.csv")
    if not os.path.exists(path):
        return result
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            skill = row.get("Skill Name", "").strip()
            category = row.get("Category", "").strip()
            if skill:
                result[skill.lower()] = category
    return result


def _load_skills_json() -> dict:
    """
    Parse dataset/skills_database.json  (category -> [skill, ...]).
    Returns {skill_lower: category}.
    """
    result = {}
    path = os.path.join(_DATASET, "skills_database.json")
    if not os.path.exists(path):
        return result
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    for category, skills in data.items():
        for skill in skills:
            if isinstance(skill, str) and skill.strip():
                result[skill.strip().lower()] = category
    return result


def _load_job_roles_csv() -> tuple[dict, dict]:
    """
    Parse dataset/job_roles.csv.
    Returns (job_roles_dict, skill_to_category_dict).
    """
    result = {}
    extra_skills = {}
    path = os.path.join(_DATASET, "job_roles.csv")
    if not os.path.exists(path):
        return result, extra_skills
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            title = row.get("Job Title", "").strip()
            category = row.get("Category", "").strip()
            if not title:
                continue

            # Experience – strip non-numeric chars
            exp_raw = row.get("Experience Years", "0").strip()
            try:
                exp_years = int(re.sub(r"[^\d]", "", exp_raw) or "0")
            except ValueError:
                exp_years = 0

            # Required skills – pipe-separated
            skills_raw = row.get("Required Skills", "")
            skills = [s.strip() for s in skills_raw.split("|") if s.strip()]

            # Track skills found in roles that might not be in the master skills list
            for s in skills:
                s_lower = s.lower()
                if s_lower not in extra_skills:
                    extra_skills[s_lower] = category

            # Education – pipe-separated list
            edu_raw = row.get("Education Requirement", "")
            education = [e.strip() for e in edu_raw.split("|") if e.strip()]

            result[title] = {
                "category": category,
                "education": education,
                "experience_years": exp_years,
                "required_skills": skills,
                "required_skills_lower": [s.lower() for s in skills],
                "salary_range": row.get("Salary Range", "").strip(),
            }
    return result, extra_skills


# ── Build all constants on import ─────────────────────────────────────────────

_csv_skills   = _load_skills_csv()     # {lower: category}
_json_skills  = _load_skills_json()    # {lower: category}
_roles, _role_skills = _load_job_roles_csv()

# Merge – CSV/JSON takes priority for category label, then role categories
SKILL_CATEGORIES: dict = {**_role_skills, **_json_skills, **_csv_skills}

# Flat set of all known skill strings (lower-cased)
ALL_SKILLS: set = set(SKILL_CATEGORIES.keys())

# Job roles lookup
JOB_ROLES: dict = _roles

# Convenience: job title -> lower-cased required skills list
JOB_ROLE_SKILLS: dict = {
    title: info["required_skills_lower"]
    for title, info in JOB_ROLES.items()
}


# ── Helper: get skill aliases derived from dataset ────────────────────────────
def build_dataset_aliases() -> dict:
    """
    Build common aliases for skills found in the dataset that differ from
    the hardcoded alias table (e.g. 'scikit-learn' -> 'scikit-learn',
    'react native' -> 'react native').
    Returns {alias_lower: canonical_lower}.
    """
    aliases = {}
    for skill_lower in ALL_SKILLS:
        # hyphenated  <-> space  variants
        if "-" in skill_lower:
            aliases[skill_lower.replace("-", " ")] = skill_lower
        if " " in skill_lower:
            aliases[skill_lower.replace(" ", "-")] = skill_lower
        # dot variants  node.js -> nodejs
        if "." in skill_lower:
            aliases[skill_lower.replace(".", "")] = skill_lower
    return aliases


DATASET_ALIASES: dict = build_dataset_aliases()
