import requests
import concurrent.futures
import re
import os
import json
from dotenv import load_dotenv

load_dotenv(override=True)


def strip_html(text):
    if not text:
        return ""
    clean = re.compile('<.*?>')
    return re.sub(clean, '', text).strip()


def fetch_jobo_world(query=""):
    """
    Jobo.world: Enterprise ATS aggregator (Greenhouse, Lever, Workday, etc.)
    PRIORITY SOURCE — fetches the most & shown first in interleave.
    """
    api_key = os.getenv("JOBO_WORLD_API_KEY", "")
    if not api_key:
        return []

    headers = {"X-Api-Key": api_key, "User-Agent": "Mozilla/5.0"}
    all_jobs = []

    # Fetch up to 3 pages (100 jobs each) from Jobo for maximum coverage
    for page in range(1, 4):
        params = {"q": query or "software", "page_size": 100, "page": page}
        try:
            response = requests.get(
                "https://connect.jobo.world/api/jobs",
                params=params, headers=headers, timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                items = data.get("jobs", [])
                if not items:
                    break
                for item in items:
                    comp = item.get("compensation") or {}
                    salary_min = comp.get("min")
                    salary_max = comp.get("max")
                    currency = comp.get("currency", "USD")
                    if salary_min and salary_max:
                        salary = f"{currency} {int(salary_min/1000)}k - {int(salary_max/1000)}k"
                    else:
                        salary = "Not specified"

                    locs = item.get("locations") or []
                    if locs:
                        loc = locs[0]
                        location_str = ", ".join(
                            filter(None, [loc.get("city"), loc.get("region"), loc.get("country")])
                        )
                    else:
                        location_str = "Remote" if item.get("is_remote") else "Unknown"

                    company = item.get("company") or {}
                    all_jobs.append({
                        "id": f"jobo_{item.get('id', '')}",
                        "title": item.get("title", "Unknown Title"),
                        "company": company.get("name", "Unknown Company"),
                        "location": location_str,
                        "type": "Remote" if item.get("is_remote") else "On-site",
                        "salary": salary,
                        "salary_raw": salary_max or 0,
                        "posted": (item.get("date_posted") or "").split("T")[0],
                        "description": strip_html(item.get("description", ""))[:300] + "...",
                        "apply_link": item.get("apply_url", "#"),
                        "logo": company.get("logo_url", ""),
                        "source": "Jobo (ATS)",
                    })
            else:
                break
        except Exception as e:
            print(f"Jobo.world page {page} error: {e}")
            break

    return all_jobs


def fetch_jooble(query=""):
    """Jooble: aggregates Naukri, Shine, TimesJobs, company sites (India+global)."""
    api_key = os.getenv("JOOBLE_API_KEY", "")
    if not api_key:
        return []

    url = f"https://jooble.org/api/{api_key}"
    jobs = []
    for page in range(1, 4):  # 3 pages
        payload = {"keywords": query or "software", "location": "", "page": str(page)}
        headers = {"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
        try:
            response = requests.post(url, data=json.dumps(payload), headers=headers, timeout=8)
            if response.status_code == 200:
                data = response.json()
                items = data.get("jobs", [])
                if not items:
                    break
                for item in items:
                    jobs.append({
                        "id": f"jooble_{hash(item.get('link','') + item.get('title',''))}",
                        "title": item.get("title", "Unknown Title"),
                        "company": item.get("company", "Unknown Company"),
                        "location": item.get("location", "Unknown Location"),
                        "type": item.get("type", "Full-time"),
                        "salary": item.get("salary", "Not specified") or "Not specified",
                        "salary_raw": 0,
                        "posted": (item.get("updated") or "").split("T")[0],
                        "description": strip_html(item.get("snippet", ""))[:300] + "...",
                        "apply_link": item.get("link", "#"),
                        "logo": "",
                        "source": "Jooble",
                    })
            else:
                break
        except Exception as e:
            print(f"Jooble page {page} error: {e}")
            break
    return jobs


def fetch_remotive(query=""):
    """Remotive: remote tech & startup jobs."""
    url = f"https://remotive.com/api/remote-jobs?limit=50"
    if query:
        url += f"&search={query}"
    try:
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=8)
        if response.status_code == 200:
            data = response.json()
            jobs = []
            for item in data.get("jobs", []):
                jobs.append({
                    "id": f"remotive_{item.get('id')}",
                    "title": item.get("title", "Unknown Title"),
                    "company": item.get("company_name", "Unknown Company"),
                    "location": item.get("candidate_required_location", "Remote"),
                    "type": item.get("job_type", "Full-time"),
                    "salary": item.get("salary", "Not specified") or "Not specified",
                    "salary_raw": 0,
                    "posted": (item.get("publication_date") or "").split("T")[0],
                    "description": strip_html(item.get("description", ""))[:300] + "...",
                    "apply_link": item.get("url", "#"),
                    "logo": item.get("company_logo", ""),
                    "source": "Remotive",
                })
            return jobs
    except Exception as e:
        print(f"Remotive error: {e}")
    return []


def fetch_arbeitnow(query=""):
    """Arbeitnow: international & remote tech jobs."""
    url = "https://www.arbeitnow.com/api/job-board-api"
    try:
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=8)
        if response.status_code == 200:
            data = response.json()
            jobs = []
            for item in data.get("data", []):  # All available
                title = item.get("title", "")
                if query and query.lower() not in title.lower() and query.lower() not in item.get("company_name", "").lower():
                    continue
                jobs.append({
                    "id": f"arbeitnow_{item.get('slug')}",
                    "title": title,
                    "company": item.get("company_name", "Unknown Company"),
                    "location": item.get("location", "Remote"),
                    "type": "Full-time",
                    "salary": "Not specified",
                    "salary_raw": 0,
                    "posted": "",
                    "description": strip_html(item.get("description", ""))[:300] + "...",
                    "apply_link": item.get("url", "#"),
                    "logo": "",
                    "source": "Arbeitnow",
                })
            return jobs
    except Exception as e:
        print(f"Arbeitnow error: {e}")
    return []


def fetch_themuse(query=""):
    """The Muse: enterprise & corporate company jobs — fetches 3 pages."""
    jobs = []
    for page in range(1, 4):
        try:
            url = f"https://www.themuse.com/api/public/jobs?page={page}"
            response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=5)
            if response.status_code == 200:
                data = response.json()
                items = data.get("results", [])
                if not items:
                    break
                for item in items:
                    title = item.get("name", "")
                    if query and query.lower() not in title.lower():
                        continue
                    location = (item.get("locations") or [{"name": "Unknown"}])[0].get("name")
                    company = item.get("company", {}).get("name", "Unknown Company")
                    jobs.append({
                        "id": f"themuse_{item.get('id')}",
                        "title": title,
                        "company": company,
                        "location": location,
                        "type": item.get("type", "Full-time"),
                        "salary": "Not specified",
                        "salary_raw": 0,
                        "posted": (item.get("publication_date") or "").split("T")[0],
                        "description": strip_html(item.get("contents", ""))[:300] + "...",
                        "apply_link": item.get("refs", {}).get("landing_page", "#"),
                        "logo": "",
                        "source": "The Muse",
                    })
            else:
                break
        except Exception as e:
            print(f"TheMuse page {page} error: {e}")
            break
    return jobs


def interleave(priority_list, *other_lists):
    """
    Interleave jobs so results are mixed across sources.
    Priority list contributes 2 jobs for every 1 from other sources.
    """
    result = []
    priority = list(priority_list)
    others = [list(lst) for lst in other_lists]
    # Flatten others into a single round-robin pool
    other_pool = []
    max_len = max((len(l) for l in others), default=0)
    for i in range(max_len):
        for lst in others:
            if i < len(lst):
                other_pool.append(lst[i])

    p_idx, o_idx = 0, 0
    while p_idx < len(priority) or o_idx < len(other_pool):
        # 2 from priority, 1 from others
        for _ in range(2):
            if p_idx < len(priority):
                result.append(priority[p_idx])
                p_idx += 1
        if o_idx < len(other_pool):
            result.append(other_pool[o_idx])
            o_idx += 1

    return result


def aggregate_jobs(query=""):
    jobo_jobs = []
    jooble_jobs = []
    remotive_jobs = []
    arbeitnow_jobs = []
    themuse_jobs = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_map = {
            executor.submit(fetch_jobo_world, query): "jobo",
            executor.submit(fetch_jooble, query): "jooble",
            executor.submit(fetch_remotive, query): "remotive",
            executor.submit(fetch_arbeitnow, query): "arbeitnow",
            executor.submit(fetch_themuse, query): "themuse",
        }
        for future in concurrent.futures.as_completed(future_map):
            source = future_map[future]
            try:
                jobs = future.result()
                if source == "jobo":
                    jobo_jobs = jobs
                elif source == "jooble":
                    jooble_jobs = jobs
                elif source == "remotive":
                    remotive_jobs = jobs
                elif source == "arbeitnow":
                    arbeitnow_jobs = jobs
                elif source == "themuse":
                    themuse_jobs = jobs
            except Exception as e:
                print(f"Error fetching from {source}: {e}")

    # Jobo.world is priority (2:1 ratio), everything else round-robins
    return interleave(jobo_jobs, jooble_jobs, remotive_jobs, arbeitnow_jobs, themuse_jobs)
