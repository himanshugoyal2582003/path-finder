import os
import re
from collections import Counter, defaultdict
from html import unescape
from typing import Dict, Iterable, List

import requests

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None


SKILL_KEYWORDS = {
    "Python": ["python", "pandas", "numpy", "scipy", "jupyter"],
    "JavaScript": ["javascript", "typescript", "react", "node.js", "nodejs", "next.js"],
    "Java": ["java", "spring", "hibernate"],
    "SQL": ["sql", "postgres", "mysql", "sqlite", "database"],
    "Excel": ["excel", "spreadsheet", "pivot table"],
    "PowerBI/Tableau": ["power bi", "powerbi", "tableau", "dashboard"],
    "Machine Learning": ["machine learning", "ml", "sklearn", "scikit", "model training"],
    "Data Analysis": ["data analysis", "analytics", "eda", "business intelligence"],
    "Statistics": ["statistics", "statistical", "probability", "hypothesis"],
    "Deep Learning": ["deep learning", "neural", "pytorch", "tensorflow", "transformer"],
    "NLP": ["nlp", "natural language", "text classification", "bert"],
    "Cloud": ["aws", "azure", "gcp", "cloud", "serverless"],
    "DevOps": ["docker", "kubernetes", "ci/cd", "jenkins", "terraform"],
    "API Design": ["api", "rest", "graphql", "fastapi", "express"],
    "Frontend": ["html", "css", "tailwind", "ui", "frontend"],
    "Backend": ["backend", "microservice", "server", "node", "express"],
    "Figma Prototyping": ["figma", "prototype", "wireframe"],
    "Visual Design": ["visual design", "typography", "layout", "color theory"],
    "User Research": ["user research", "interview", "usability", "persona"],
    "Design Systems": ["design system", "component library", "tokens"],
    "Writing": ["writing", "copywriting", "documentation", "storytelling"],
    "User Empathy": ["empathy", "user needs", "customer", "stakeholder"],
    "Google Analytics": ["google analytics", "ga4", "analytics"],
    "A/B Testing": ["a/b", "ab testing", "experimentation", "conversion"],
    "SEO": ["seo", "search engine", "keyword"],
    "Marketing": ["marketing", "campaign", "growth", "acquisition"],
    "Finance": ["finance", "accounting", "budget", "forecast"],
    "Sales": ["sales", "crm", "lead generation", "pipeline"],
    "Communication": ["communication", "presentation", "collaboration"],
    "Project Management": ["project management", "planning", "agile", "scrum"],
    "Healthcare & Medical": ["doctor", "medicine", "clinical", "patient care", "diagnosis", "pharmacology", "surgery", "healthcare"],

}


def clean_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    cleaned = unescape(text)
    if BeautifulSoup is not None:
        cleaned = BeautifulSoup(cleaned, "html.parser").get_text(" ")
    else:
        cleaned = re.sub(r"<[^>]+>", " ", cleaned)
    cleaned = re.sub(r"http\S+|www\.\S+", " ", cleaned)
    cleaned = re.sub(r"[^\w\s\.\,\-\+\/\#]", " ", cleaned)
    return re.sub(r"\s+", " ", cleaned).strip()


def extract_skill_tags(text: str, limit: int = 10) -> List[str]:
    haystack = f" {clean_text(text).lower()} "
    scores = Counter()
    for skill, aliases in SKILL_KEYWORDS.items():
      for alias in aliases:
          if alias in haystack:
              scores[skill] += 1
    return [skill for skill, _ in scores.most_common(limit)]


def get_job_market_links(role_name: str) -> Dict[str, str]:
    slug = role_name.lower().replace(" ", "-").replace("/", "-")
    query = role_name.replace(" ", "+")
    return {
        "naukri": f"https://www.naukri.com/{slug}-jobs",
        "linkedin": f"https://www.linkedin.com/jobs/search/?keywords={query}",
        "remoteok": f"https://remoteok.com/remote-{slug}-jobs",
    }


def generic_weekly_actions(role_name: str, skills: Iterable[str]) -> Dict[str, List[dict]]:
    """Build a complete 8-phase comprehensive career roadmap."""
    skill_list = list(skills) or ["Domain Fundamentals", "Communication", "Technical Operations", "Problem Solving"]
    s1 = skill_list[0] if len(skill_list) > 0 else "Core Fundamentals"
    s2 = skill_list[1] if len(skill_list) > 1 else "Domain Tools"
    s3 = skill_list[2] if len(skill_list) > 2 else "Advanced Practice"
    s4 = skill_list[3] if len(skill_list) > 3 else "System Operations"

    return {
        "Phase 1: Industry Foundations & Tooling": [
            {"title": f"Study core {role_name} responsibilities, industry standards, and vocabulary", "source": "Role research & documentation", "estHours": 4},
            {"title": f"Set up working environment, IDEs, and essential toolchains for {role_name}", "source": "Setup guide", "estHours": 3},
            {"title": f"Complete introductory training module on {s1} principles", "source": "Structured course", "estHours": 5},
        ],
        f"Phase 2: {s1} Mastery": [
            {"title": f"Deep dive into core architecture and workflow patterns of {s1}", "source": "Official documentation", "estHours": 6},
            {"title": f"Complete 5 hands-on practical exercises focusing on {s1}", "source": "Practice lab", "estHours": 6},
            {"title": f"Build a standalone module demonstrating proficiency in {s1}", "source": "Mini project", "estHours": 8},
        ],
        f"Phase 3: {s2} Advanced Practice": [
            {"title": f"Learn industry best practices and design patterns for {s2}", "source": "Advanced course", "estHours": 6},
            {"title": f"Integrate {s2} with {s1} in a multi-component practice scenario", "source": "Lab scenario", "estHours": 7},
            {"title": f"Refactor code and optimize efficiency using {s2} guidelines", "source": "Self-audit", "estHours": 4},
        ],
        f"Phase 4: {s3} Integration & Workflows": [
            {"title": f"Master core frameworks and operational paradigms of {s3}", "source": "Technical workshop", "estHours": 6},
            {"title": f"Build automated pipelines and tests involving {s3}", "source": "Project build", "estHours": 8},
            {"title": f"Document system workflow architecture and trade-offs", "source": "Technical writing", "estHours": 4},
        ],
        f"Phase 5: {s4} & Specialty Skills": [
            {"title": f"Explore advanced topics, security, and scalability in {s4}", "source": "Specialty guide", "estHours": 6},
            {"title": f"Perform diagnostics, edge-case handling, and performance tuning", "source": "Optimization lab", "estHours": 5},
        ],
        "Phase 6: Industry Capstone Project": [
            {"title": f"Scope a real-world end-to-end {role_name} capstone project addressing market needs", "source": "Capstone brief", "estHours": 4},
            {"title": f"Implement full solution using {s1}, {s2}, and {s3}", "source": "Full stack build", "estHours": 12},
            {"title": "Perform peer review, stress testing, and code quality verification", "source": "Code review", "estHours": 5},
        ],
        "Phase 7: Portfolio Case Study & Public Deployment": [
            {"title": f"Write an 800-word comprehensive technical case study describing your capstone", "source": "Case study publication", "estHours": 6},
            {"title": f"Publish project repository on GitHub with detailed README and architecture diagrams", "source": "GitHub / Portfolio", "estHours": 5},
            {"title": "Deploy live demonstration app/dashboard on Vercel, Render, or cloud provider", "source": "Cloud deployment", "estHours": 4},
        ],
        "Phase 8: Career Readiness & Naukri Applications": [
            {"title": f"Tailor your resume and LinkedIn profile specifically for {role_name} job postings", "source": "Career optimization", "estHours": 4},
            {"title": f"Apply to live {role_name} roles on Naukri.com, LinkedIn, and RemoteOK", "source": "Naukri Job Portal", "estHours": 4},
            {"title": f"Practice 10 technical and behavioral interview scenarios tailored to {role_name}", "source": "Mock interview prep", "estHours": 5},
        ],
    }



def fetch_remoteok_jobs(tags: Iterable[str], timeout: int = 12) -> List[dict]:
    jobs = []
    for tag in tags:
        url = f"https://remoteok.com/api?tag={tag}"
        response = requests.get(url, timeout=timeout, headers={"User-Agent": "PathFinderAI/1.0"})
        response.raise_for_status()
        payload = response.json()
        for item in payload[1:] if isinstance(payload, list) else []:
            jobs.append({
                "source": "remoteok",
                "title": item.get("position") or item.get("title") or "",
                "description": item.get("description") or "",
                "skills": item.get("tags") or [],
                "url": item.get("url") or item.get("apply_url") or "",
            })
    return jobs


def fetch_adzuna_jobs(queries: Iterable[str], country: str = "in", timeout: int = 12) -> List[dict]:
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")
    if not app_id or not app_key:
        return []
    jobs = []
    for query in queries:
        url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
        response = requests.get(
            url,
            params={"app_id": app_id, "app_key": app_key, "what": query, "results_per_page": 20},
            timeout=timeout,
        )
        response.raise_for_status()
        for item in response.json().get("results", []):
            jobs.append({
                "source": "adzuna",
                "title": item.get("title") or "",
                "description": item.get("description") or "",
                "skills": extract_skill_tags(item.get("description") or ""),
                "url": item.get("redirect_url") or "",
            })
    return jobs


def fetch_configured_json_jobs(timeout: int = 12) -> List[dict]:
    """Accepts comma-separated URLs for Naukri-like private feeds or other APIs."""
    urls = [u.strip() for u in os.getenv("JOB_API_URLS", "").split(",") if u.strip()]
    jobs = []
    for url in urls:
        response = requests.get(url, timeout=timeout, headers={"User-Agent": "PathFinderAI/1.0"})
        response.raise_for_status()
        payload = response.json()
        records = payload.get("jobs", payload.get("results", payload if isinstance(payload, list) else []))
        for item in records:
            jobs.append({
                "source": item.get("source", "configured-api"),
                "title": item.get("title", item.get("position", "")),
                "description": item.get("description", item.get("job_description", "")),
                "skills": item.get("skills", item.get("tags", [])),
                "url": item.get("url", item.get("apply_url", "")),
            })
    return jobs


def collect_job_market_records(queries: Iterable[str], fetch_live: bool = False) -> List[dict]:
    if not fetch_live:
        return []
    records = []
    for loader in (
        lambda: fetch_remoteok_jobs(["python", "react", "data", "marketing", "design"]),
        lambda: fetch_adzuna_jobs(queries),
        fetch_configured_json_jobs,
    ):
        try:
            records.extend(loader())
        except Exception as exc:
            print(f"[WARN] Job market fetch skipped: {exc}")
    return records


def build_role_archetypes(label_names: Iterable[str], resume_texts_by_label: Dict[str, List[str]], job_records: List[dict]) -> List[dict]:
    job_text_by_role = defaultdict(list)
    for job in job_records:
        title = clean_text(job.get("title", ""))
        text = clean_text(f"{title} {job.get('description', '')} {' '.join(job.get('skills') or [])}")
        if not text:
            continue
        title_lower = title.lower()
        for label in label_names:
            label_words = label.replace("-", " ").lower().split()
            if any(word in title_lower for word in label_words):
                job_text_by_role[label].append(text)

    roles = []
    for label in label_names:
        role_name = label.replace("-", " ").title()
        source_text = " ".join(resume_texts_by_label.get(label, [])[:80] + job_text_by_role.get(label, [])[:40])
        skills = extract_skill_tags(source_text, limit=8)
        if not skills:
            skills = ["Domain fundamentals", "Communication", "Portfolio evidence"]
        source = "resume-csv+job-api" if job_text_by_role.get(label) else "resume-csv"
        roles.append({
            "name": role_name,
            "category": label,
            "requiredSkills": skills,
            "description": f"A {role_name} path derived from job market demand signals and skill taxonomies.",
            "weights": {},
            "source": source,
            "jobMarketLinks": get_job_market_links(role_name),
            "weeklyActions": generic_weekly_actions(role_name, skills),
        })
    return roles

