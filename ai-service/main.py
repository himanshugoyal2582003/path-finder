import os
import re
import csv
import math
import json
import numpy as np
import requests
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict

from typing import List, Dict, Any, Optional

try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except ImportError:
    StateGraph = None
    END = None
    LANGGRAPH_AVAILABLE = False

try:
    from job_market import extract_skill_tags
    JOB_MARKET_AVAILABLE = True
except ImportError:
    JOB_MARKET_AVAILABLE = False
    def extract_skill_tags(text: str, limit: int = 10) -> List[str]:
        text = (text or "").lower()
        keywords = [
            "python", "javascript", "sql", "figma", "excel", "aws", "azure",
            "docker", "kubernetes", "data", "analytics", "design", "product",
            "marketing", "sales", "research", "communication", "testing"
        ]
        found = []
        for keyword in keywords:
            if keyword in text and keyword not in found:
                found.append(keyword)
        return found[:limit]

BASE_DIR = Path(__file__).parent
ENV_PATH = BASE_DIR / ".env"


def read_env_value(name: str, default: str = "") -> str:
    value = os.environ.get(name)
    if value:
        return value.strip()
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            if not line.strip() or line.strip().startswith("#") or "=" not in line:
                continue
            key, raw_value = line.split("=", 1)
            if key.strip() == name:
                return raw_value.strip().strip('"').strip("'")
    return default


def csv_truthy(value: str) -> bool:
    return str(value or "").strip().lower() in {"1", "true", "yes", "on"}

# DistilBERT â€” imported only if model is available
try:
    import torch
    from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    print("[WARN] PyTorch / Transformers not found. Falling back to TF-IDF.")

try:
    import joblib
    JOBLIB_AVAILABLE = True
except ImportError:
    JOBLIB_AVAILABLE = False
    print("[WARN] joblib not found. Lightweight trained classifier disabled.")

# Gemini Generative AI SDK setup
GEMINI_AVAILABLE = False
try:
    import google.generativeai as genai
    gemini_key = read_env_value("GEMINI_API_KEY")
    if gemini_key:
        genai.configure(api_key=gemini_key)
        GEMINI_AVAILABLE = True
        print("[INFO] Gemini AI SDK initialized successfully for dynamic roadmap generation.")
except Exception as e:
    print(f"[WARN] Could not initialize Gemini SDK: {e}")

XAI_API_KEY = read_env_value("XAI_API_KEY")
XAI_API_BASE = read_env_value("XAI_API_BASE", "https://api.x.ai/v1")
XAI_AVAILABLE = bool(XAI_API_KEY)

GEMINI_MODELS = [
    model.strip()
    for model in read_env_value("GEMINI_MODELS", "gemini-2.5-flash,gemini-1.5-flash").split(",")
    if model.strip()
]
XAI_MODELS = [
    model.strip()
    for model in read_env_value("XAI_MODELS", "grok-3-mini,grok-3").split(",")
    if model.strip()
]
ML_CLASSIFIERS_DISABLED = csv_truthy(read_env_value("DISABLE_ML_CLASSIFIERS", "true"))


def strip_json_markdown(text: str) -> str:
    text = (text or "").strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


def parse_llm_json(text: str):
    cleaned = strip_json_markdown(text)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start_positions = [pos for pos in [cleaned.find("["), cleaned.find("{")] if pos >= 0]
        end_positions = [pos for pos in [cleaned.rfind("]"), cleaned.rfind("}")] if pos >= 0]
        if start_positions and end_positions:
            return json.loads(cleaned[min(start_positions): max(end_positions) + 1])
        raise


def call_xai_json(prompt: str, model_name: str, timeout: int):
    response = requests.post(
        f"{XAI_API_BASE.rstrip('/')}/chat/completions",
        headers={
            "Authorization": f"Bearer {XAI_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": model_name,
            "messages": [
                {"role": "system", "content": "Return only valid raw JSON. No markdown, no prose."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
        },
        timeout=timeout,
    )
    response.raise_for_status()
    data = response.json()
    return parse_llm_json(data["choices"][0]["message"]["content"])


def call_llm_json(prompt: str, timeout: int = 30):
    attempts = []
    if GEMINI_AVAILABLE:
        for model_name in GEMINI_MODELS:
            attempts.append(("gemini", model_name))
    if XAI_AVAILABLE:
        for model_name in XAI_MODELS:
            attempts.append(("xai", model_name))

    errors = []
    for provider, model_name in attempts:
        try:
            if provider == "gemini":
                gmodel = genai.GenerativeModel(model_name)
                res = gmodel.generate_content(
                    prompt,
                    generation_config={"temperature": 0.2},
                    request_options={"timeout": timeout},
                )
                return parse_llm_json(res.text), provider, model_name
            return call_xai_json(prompt, model_name, timeout), provider, model_name
        except Exception as e:
            errors.append(f"{provider}:{model_name}: {e}")
            print(f"[LLM Rotate] {provider} model {model_name} failed; trying next. Error: {e}")
            continue

    raise RuntimeError("No AI provider produced valid JSON. " + " | ".join(errors[-4:]))


def generate_ai_roadmap(
    role_name: str,
    role_data: dict,
    user_skills: list,
    missing_gaps: list,
    hours_per_week: int,
    timeline_months: int,
    budget_pref: str,
):
    if not (GEMINI_AVAILABLE or XAI_AVAILABLE):
        return None
    try:
        prompt = f"""You are an expert technical career curriculum designer.
Generate a highly tailored 8-phase learning roadmap for a student aiming to become a "{role_name}".

User Context:
- Target Role: {role_name}
- Role Description: {role_data.get('description', '')}
- User Acquired Skills: {', '.join(user_skills) if user_skills else 'None yet'}
- Skill Gaps to Bridge: {', '.join(missing_gaps) if missing_gaps else 'Core role mastery'}
- Study Commitment: {hours_per_week} hours/week
- Target Timeline: {timeline_months} months
- Material Preference: {budget_pref}. Use only free resources for "free", only paid resources for "paid", and a balanced mix for "mixed".

Requirements:
Sequence fundamentals before tools. For infrastructure paths, start with Linux and networking before Docker, then CI/CD, then Kubernetes/cloud.
Every item must be a concrete study material or practice task with a real resourceUrl from YouTube, official docs, freeCodeCamp, roadmap.sh, Coursera, Udemy, edX, or a similarly credible source.
Return ONLY valid raw JSON array (do not include markdown code block ```json ... ```).
Format:
[
  {{
    "phaseName": "Phase 1: Industry Foundations & Tooling",
    "items": [
      {{ "title": "[Free YouTube] Action item title", "resourceUrl": "https://youtube.com/...", "estHours": 4 }}
    ]
  }},
  ... 8 phases total
]
"""
        parsed, provider, model_name = call_llm_json(prompt, timeout=30)
        if isinstance(parsed, list) and len(parsed) >= 4:
            print(f"[AI Agent] Generated dynamic roadmap via {provider}:{model_name} for {role_name}.")
            return parsed
    except Exception as err:
        print(f"[AI Agent] Generation error: {err}")
    return None


# Initialize FastAPI App
app = FastAPI(title="PathFinder AI Agent Service", version="1.0.0")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# â”€â”€â”€ Paths â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
MODEL_DIR       = BASE_DIR / "models" / "resume_classifier"

CSV_PATH = BASE_DIR / "pathways.csv"
CSV_FIELDS = [
    "domain",
    "subdomain",
    "track_name",
    "skills",
    "description",
    "pathway_json",
    "source",
    "model_used",
]

def init_csv():
    if not CSV_PATH.exists():
        with open(CSV_PATH, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
            writer.writeheader()
        return

    try:
        with open(CSV_PATH, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            fieldnames = reader.fieldnames or []
        if all(field in fieldnames for field in CSV_FIELDS):
            return
        with open(CSV_PATH, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
            writer.writeheader()
            for row in rows:
                normalized = {field: row.get(field, "") for field in CSV_FIELDS}
                normalized["domain"] = normalized["domain"] or infer_domain(normalized.get("track_name", ""))
                normalized["subdomain"] = normalized["subdomain"] or normalized.get("track_name", "")
                normalized["source"] = normalized["source"] or "seed"
                writer.writerow(normalized)
    except Exception as e:
        print(f"[CSV Error] Failed to initialize pathways CSV: {e}")

def read_pathways() -> list:
    init_csv()
    pathways = []
    try:
        with open(CSV_PATH, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                pathways.append({field: row.get(field, "") for field in CSV_FIELDS})
    except Exception as e:
        print(f"[CSV Error] Failed to read pathways: {e}")
    return pathways

def normalize_lookup_text(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip().lower())


def infer_domain(track_name: str) -> str:
    text = normalize_lookup_text(track_name)
    buckets = [
        ("Technology", ["developer", "engineer", "software", "cloud", "cyber", "data", "ai", "ml", "devops", "qa", "blockchain"]),
        ("Design", ["designer", "ux", "ui", "research"]),
        ("Business", ["product", "project", "operations", "sales", "business", "analyst", "consultant"]),
        ("Marketing", ["marketing", "seo", "content", "growth", "social media"]),
        ("Healthcare", ["doctor", "nurse", "medical", "health", "clinical", "pharma"]),
        ("Finance", ["finance", "accounting", "investment", "banking", "tax", "risk"]),
        ("Education", ["teacher", "instructional", "curriculum", "education"]),
        ("Law", ["legal", "law", "compliance", "paralegal"]),
        ("Creative Media", ["writer", "video", "film", "animation", "game", "journalist"]),
        ("Engineering", ["mechanical", "civil", "electrical", "manufacturing", "robotics"]),
    ]
    for domain, needles in buckets:
        if any(needle in text for needle in needles):
            return domain
    return "General"


def save_pathway(
    track_name: str,
    skills: str,
    description: str,
    pathway_json: str = "",
    domain: str = "",
    subdomain: str = "",
    source: str = "seed",
    model_used: str = "",
):
    init_csv()
    try:
        pathways = read_pathways()
        exists = False
        updated_rows = []
        for row in pathways:
            if normalize_lookup_text(row['track_name']) == normalize_lookup_text(track_name):
                row['domain'] = domain or row.get("domain") or infer_domain(track_name)
                row['subdomain'] = subdomain or row.get("subdomain") or track_name
                row['skills'] = skills or row.get("skills", "")
                row['description'] = description or row.get("description", "")
                row['pathway_json'] = pathway_json or row.get("pathway_json", "")
                row['source'] = source or row.get("source", "")
                row['model_used'] = model_used or row.get("model_used", "")
                exists = True
            updated_rows.append(row)

        new_row = {
            "domain": domain or infer_domain(track_name),
            "subdomain": subdomain or track_name,
            "track_name": track_name,
            "skills": skills,
            "description": description,
            "pathway_json": pathway_json,
            "source": source,
            "model_used": model_used,
        }

        if exists:
            with open(CSV_PATH, mode='w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
                writer.writeheader()
                for r in updated_rows:
                    writer.writerow({field: r.get(field, "") for field in CSV_FIELDS})
        else:
            with open(CSV_PATH, mode='a', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
                writer.writerow(new_row)
        print(f"[CSV Info] Successfully saved pathway for '{track_name}' to CSV.")
    except Exception as e:
        print(f"[CSV Error] Failed to save pathway: {e}")


def load_pathway_json(value: str) -> list:
    if not (value or "").strip():
        return []
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, list) else []
    except Exception as e:
        print(f"[CSV Error] Failed to parse pathway_json: {e}")
        return []


def filter_items_by_budget(items: list, budget_pref: str) -> list:
    preference = (budget_pref or "free").strip().lower()
    if preference not in {"free", "paid", "mixed"}:
        preference = "free"
    if preference == "mixed":
        return items

    filtered = [
        item
        for item in items
        if str(item.get("cost", "free")).strip().lower() in {preference, "mixed"}
    ]
    return filtered or items
EMBEDDINGS_PATH = BASE_DIR / "models" / "resume_embeddings.npy"
LABEL_MAP_PATH  = BASE_DIR / "models" / "label_map.json"
LIGHTWEIGHT_MODEL_DIR = BASE_DIR / "models" / "job_description_classifier"
if not LIGHTWEIGHT_MODEL_DIR.exists():
    LIGHTWEIGHT_MODEL_DIR = BASE_DIR / "models" / "lightweight_resume_classifier"
LIGHTWEIGHT_MODEL_PATH = LIGHTWEIGHT_MODEL_DIR / "model.joblib"
LIGHTWEIGHT_LABEL_MAP_PATH = LIGHTWEIGHT_MODEL_DIR / "label_map.json"
LIGHTWEIGHT_ROLES_PATH = LIGHTWEIGHT_MODEL_DIR / "role_archetypes.json"

# â”€â”€â”€ Lightweight TF-IDF fallback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class LightTFIDF:
    def __init__(self, corpus):
        self.documents = corpus
        self.vocab = sorted(list(set(word for doc in corpus for word in self._tokenize(doc))))
        self.word_to_idx = {word: i for i, word in enumerate(self.vocab)}
        self.df = {word: 0 for word in self.vocab}
        for doc in corpus:
            words = set(self._tokenize(doc))
            for word in words:
                self.df[word] += 1
        self.n_docs = len(corpus)
        self.idf = {word: math.log((1 + self.n_docs) / (1 + self.df[word])) + 1 for word in self.vocab}

    def _tokenize(self, text):
        for char in [".", ",", "!", "?", ";", ":", "(", ")", "[", "]", "{", "}"]:
            text = text.replace(char, " ")
        return [w.lower() for w in text.split() if len(w.lower()) > 2]

    def transform(self, text):
        words = self._tokenize(text)
        vector = np.zeros(len(self.vocab))
        tf = {}
        for w in words:
            if w in self.word_to_idx:
                tf[w] = tf.get(w, 0) + 1
        for w, count in tf.items():
            idx = self.word_to_idx[w]
            vector[idx] = count * self.idf[w]
        return vector

# â”€â”€â”€ DistilBERT Embedding Engine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class ResumeEmbeddingEngine:
    """Uses fine-tuned DistilBERT to embed text into the resume semantic space."""

    def __init__(self, model_dir: Path):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"[AI] Loading DistilBERT from {model_dir} on {self.device}...")
        self.tokenizer = DistilBertTokenizer.from_pretrained(str(model_dir))
        self.classifier = DistilBertForSequenceClassification.from_pretrained(
            str(model_dir)
        )
        self.classifier.to(self.device)
        self.classifier.eval()
        print(f"[AI] DistilBERT loaded successfully.")

    def embed(self, text: str, max_len: int = 256) -> np.ndarray:
        """Return the CLS-token embedding for a given text."""
        inputs = self.tokenizer(
            text,
            max_length=max_len,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        input_ids      = inputs["input_ids"].to(self.device)
        attention_mask = inputs["attention_mask"].to(self.device)
        with torch.no_grad():
            outputs = self.classifier.distilbert(input_ids=input_ids, attention_mask=attention_mask)
            cls_emb = outputs.last_hidden_state[:, 0, :]
        return cls_emb.cpu().numpy().squeeze(0)

    def predict_category(self, text: str, label_map: dict, max_len: int = 256) -> dict:
        """Return top-3 predicted job categories with confidence scores."""
        inputs = self.tokenizer(
            text,
            max_length=max_len,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        input_ids      = inputs["input_ids"].to(self.device)
        attention_mask = inputs["attention_mask"].to(self.device)
        with torch.no_grad():
            logits = self.classifier(input_ids=input_ids, attention_mask=attention_mask).logits
        probs  = torch.softmax(logits, dim=1).cpu().numpy().squeeze(0)
        top3_idx = probs.argsort()[::-1][:3]
        return [
            {"category": label_map.get(str(i), str(i)), "confidence": round(float(probs[i]), 4)}
            for i in top3_idx
        ]

def _clean_text(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"http\S+|www\.\S+", " ", text)
    text = re.sub(r"[^\w\s\.\,\-]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    denom = float(np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)

# â”€â”€â”€ Model globals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
embedding_engine: Optional["ResumeEmbeddingEngine"] = None
category_embeddings: Optional[np.ndarray] = None   # shape [N_cats, 768]
label_map: dict = {}
tfidf_model = None    # fallback
lightweight_model = None
lightweight_label_map: dict = {}
lightweight_roles: List[dict] = []


# Pre-defined Role Archetypes
ROLE_ARCHETYPES = [
  {
    "name": "Product Designer",
    "requiredSkills": ["Visual Design", "Figma Prototyping", "User Research", "Design Systems", "Writing", "User Empathy"],
    "description": "Focuses on visual communication, prototyping, user research, and crafting digital interfaces that align user needs with business goals.",
    "weights": { "speed": 3, "income": 4, "creativity": 5, "stability": 4, "flexibility": 5 },
    "weeklyActions": {
      "Phase 1: Foundation": [
        {"title": "Read 'Refactoring UI' chapters on layout & typography", "source": "Refactoring UI", "estHours": 3},
        {"title": "Complete Figma onboarding playground tutorial", "source": "Figma.com", "estHours": 2},
        {"title": "Create a typography scale for a personal website project", "source": "Self-study", "estHours": 3}
      ],
      "Phase 2: Core Skills": [
        {"title": "Build a high-fidelity interactive mobile prototype in Figma", "source": "Design Course", "estHours": 6},
        {"title": "Draft a research plan with 5 user questions for a food app", "source": "Medium UX", "estHours": 4},
        {"title": "Synthesize findings into a simple Persona PDF template", "source": "Figma Template", "estHours": 5}
      ],
      "Phase 3: Applied Practice": [
        {"title": "Set up a component library with 10 button states using Auto-Layout", "source": "YouTube Guide", "estHours": 6},
        {"title": "Design 3 responsive screens for a checkout landing page", "source": "Portfolio Build", "estHours": 8},
        {"title": "Perform a cognitive walkthrough evaluation on your own design", "source": "Self-audit", "estHours": 6}
      ],
      "Phase 4: Portfolio Prep": [
        {"title": "Write a 800-word case study focusing on trade-offs & decisions", "source": "Substack Design", "estHours": 6},
        {"title": "Build and deploy a portfolio site on Framer or Notion", "source": "Framer.com", "estHours": 8},
        {"title": "Optimize site metadata and request feedback from 2 peers", "source": "LinkedIn Network", "estHours": 4}
      ]
    }
  },
  {
    "name": "Data Analyst",
    "requiredSkills": ["Excel", "SQL", "Python (Pandas)", "PowerBI/Tableau", "Statistical Modeling", "Writing"],
    "description": "Deciphers raw numerical inputs to build diagnostic dashboards and explain trends to operational business leaders.",
    "weights": { "speed": 4, "income": 4, "creativity": 3, "stability": 5, "flexibility": 4 },
    "weeklyActions": {
      "Phase 1: SQL Foundations": [
        {"title": "Complete SQL ZOO interactive database tutorials", "source": "SQLZoo", "estHours": 4},
        {"title": "Solve 10 medium queries on HackerRank platform", "source": "HackerRank", "estHours": 3},
        {"title": "Diagram a relational model for a school enrollment database", "source": "Draw.io", "estHours": 3}
      ],
      "Phase 2: BI Dashboards": [
        {"title": "Connect Tableau to a public dataset and build 3 worksheets", "source": "Tableau Public", "estHours": 5},
        {"title": "Design a dashboard layout on paper before implementation", "source": "Self-study", "estHours": 2},
        {"title": "Write a bulleted executive summary of a sales trend analysis", "source": "Writing Lab", "estHours": 5}
      ],
      "Phase 3: Python Prep": [
        {"title": "Write a Python script to import a dirty CSV and filter nulls", "source": "Jupyter Notebook", "estHours": 6},
        {"title": "Merge two dataframes on an ID key and recalculate metrics", "source": "Pandas Course", "estHours": 5},
        {"title": "Export cleaned data back to SQLite and verify schemas", "source": "Python CLI", "estHours": 5}
      ],
      "Phase 4: Capstone Project": [
        {"title": "Select a Kaggle dataset and execute 5 analytical queries", "source": "Kaggle", "estHours": 6},
        {"title": "Write a detailed README describing the business problem solved", "source": "GitHub Repo", "estHours": 5},
        {"title": "Record a 3-minute video presentation explaining your dashboard", "source": "Loom", "estHours": 3}
      ]
    }
  },
  {
    "name": "Growth Marketer",
    "requiredSkills": ["Writing", "Google Analytics", "A/B Testing", "Copywriting for Ads", "Excel", "User Empathy"],
    "description": "Aligns copywriting, A/B testing, analytical reporting, and digital marketing channels to build scalable acquisition loops.",
    "weights": { "speed": 5, "income": 3, "creativity": 4, "stability": 3, "flexibility": 5 },
    "weeklyActions": {
      "Phase 1: Marketing Funnels": [
        {"title": "Map a user funnel journey from initial ad click to checkout", "source": "HubSpot", "estHours": 3},
        {"title": "Draft 3 variations of landing page hero copy targeting freelancers", "source": "Copywriting Lab", "estHours": 3},
        {"title": "Read 'Copywriting Secrets' key chapters", "source": "Kindle", "estHours": 2}
      ],
      "Phase 2: Analytics Setup": [
        {"title": "Configure custom event tracking in Google Analytics sandbox", "source": "Google Skillshop", "estHours": 5},
        {"title": "Draft an A/B test plan with a sample size calculator", "source": "Optimizely Tool", "estHours": 4},
        {"title": "Analyze a historical cohort chart to identify dropoff weeks", "source": "Excel study", "estHours": 3}
      ],
      "Phase 3: Acquisition Loops": [
        {"title": "Draft a search engine marketing (SEM) campaign budget", "source": "Google Ads Sandbox", "estHours": 5},
        {"title": "Run a site audit on a local service website for SEO flaws", "source": "Screaming Frog", "estHours": 5},
        {"title": "Create a content outline targeting 3 core high-value keywords", "source": "Semrush", "estHours": 4}
      ],
      "Phase 4: Launch Campaign": [
        {"title": "Deploy a free landing page on Carrd with signup form", "source": "Carrd.co", "estHours": 4},
        {"title": "Write a LinkedIn post driving initial organic traffic", "source": "LinkedIn", "estHours": 2},
        {"title": "Build a Google Sheets report tracking CAC, CTR, and signups", "source": "Google Sheets", "estHours": 4}
      ]
    }
  },{
  "name": "Medical Practitioner / Doctor",
  "category": "HEALTHCARE",
  "requiredSkills": ["Clinical Diagnosis", "Patient Care", "Medical Ethics", "Pharmacology", "Communication"],
  "description": "Diagnoses illnesses, prescribes treatments, and delivers patient-centered medical care.",
  "weeklyActions": {
    "Phase 1: Foundations": [
      {"title": "Study Anatomy & Human Physiology basics", "source": "Medical Textbooks", "estHours": 8},
      {"title": "Review Clinical Ethics & Patient Communication protocols", "source": "Healthcare Portal", "estHours": 4}
    ],
    "Phase 2: Core Medical Knowledge": [
      {"title": "Complete Pharmacology & Diagnostics course modules", "source": "Medical Academy", "estHours": 10}
    ],
    "Phase 3: Clinical Practice": [
      {"title": "Participate in clinical rotation simulations and case reviews", "source": "Hospital Residency Prep", "estHours": 12}
    ],
    "Phase 4: Board & Licensing Prep": [
      {"title": "Practice medical board exam questions and patient scenario drills", "source": "Licensing Prep", "estHours": 10}
    ]
  }
}

]

# â”€â”€â”€ Startup: Load DistilBERT or fall back to TF-IDF â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
if ML_CLASSIFIERS_DISABLED:
    print("[INFO] ML classifiers disabled by DISABLE_ML_CLASSIFIERS. Using TF-IDF fallback only.")
elif TORCH_AVAILABLE and MODEL_DIR.exists() and EMBEDDINGS_PATH.exists() and LABEL_MAP_PATH.exists():
    try:
        embedding_engine = ResumeEmbeddingEngine(MODEL_DIR)
        category_embeddings = np.load(str(EMBEDDINGS_PATH))  # [N_cats, 768]
        with open(LABEL_MAP_PATH, "r") as f:
            label_map = json.load(f)
        if category_embeddings.ndim != 2 or category_embeddings.shape[0] != len(label_map):
            raise ValueError("Embedding rows must match the label map category count.")
        print(f"[AI] Resume embeddings loaded: {category_embeddings.shape} | {len(label_map)} categories")
    except Exception as e:
        print(f"[WARN] Failed to load DistilBERT: {e}. Falling back to TF-IDF.")
        embedding_engine = None
else:
    if not MODEL_DIR.exists():
        print("[INFO] Trained model not found. Run train_resume_classifier.py first.")
    print("[INFO] Using lightweight TF-IDF matching engine as fallback.")

if (not ML_CLASSIFIERS_DISABLED) and JOBLIB_AVAILABLE and LIGHTWEIGHT_MODEL_PATH.exists() and LIGHTWEIGHT_LABEL_MAP_PATH.exists():
    try:
        lightweight_model = joblib.load(str(LIGHTWEIGHT_MODEL_PATH))
        with open(LIGHTWEIGHT_LABEL_MAP_PATH, "r", encoding="utf-8") as f:
            lightweight_label_map = json.load(f)
        if LIGHTWEIGHT_ROLES_PATH.exists():
            with open(LIGHTWEIGHT_ROLES_PATH, "r", encoding="utf-8") as f:
                lightweight_roles = json.load(f)
        print(f"[AI] Lightweight resume classifier loaded: {len(lightweight_label_map)} categories")
    except Exception as e:
        print(f"[WARN] Failed to load lightweight classifier: {e}")
        lightweight_model = None

def _generic_category_role(category: str) -> dict:
    """Create a usable roadmap for every dataset category, including new ones."""
    display_name = category.replace("-", " ").title()
    return {
        "name": display_name,
        "category": category,
        "requiredSkills": ["Domain fundamentals", "Communication", "Portfolio evidence"],
        "description": f"A {display_name} career path, ranked using real resume patterns from the training dataset.",
        "weights": {},
        "weeklyActions": {
            "Phase 1: Foundations": [
                {"title": f"Study core {display_name} concepts and vocabulary", "source": "Structured course", "estHours": 4},
                {"title": "Document transferable skills and experience", "source": "Self-study", "estHours": 3},
            ],
            "Phase 2: Applied Skills": [
                {"title": f"Complete one practical {display_name} exercise", "source": "Portfolio project", "estHours": 6},
                {"title": "Ask a practitioner for feedback on your work", "source": "Professional network", "estHours": 2},
            ],
            "Phase 3: Portfolio": [
                {"title": "Publish a concise case study with outcomes", "source": "GitHub or portfolio", "estHours": 5},
            ],
            "Phase 4: Job Readiness": [
                {"title": "Tailor your resume and practice role-specific interview questions", "source": "Career preparation", "estHours": 4},
            ],
        },
    }


def _csv_pathway_role(row: dict) -> dict:
    track_name = row.get("track_name", "").strip()
    skills = [skill.strip() for skill in row.get("skills", "").split(",") if skill.strip()]
    parsed_pathway = load_pathway_json(row.get("pathway_json", ""))
    weekly_actions = {}
    if parsed_pathway:
        for phase in parsed_pathway:
            phase_name = phase.get("phaseName", "Learning Phase")
            weekly_actions[phase_name] = phase.get("items", [])
    else:
        weekly_actions = {
            "Phase 1: Foundations": [
                {"title": f"[Free Docs] Study core {track_name} concepts and vocabulary", "resourceUrl": "https://roadmap.sh/", "estHours": 4, "cost": "free"},
                {"title": "[Free YouTube] Set up a learning tracker and project folder", "resourceUrl": "https://www.youtube.com/results?search_query=career+learning+roadmap", "estHours": 2, "cost": "free"},
            ],
            "Phase 2: Applied Skills": [
                {"title": f"[Free YouTube] Complete one guided {track_name} practice project", "resourceUrl": f"https://www.youtube.com/results?search_query={track_name.replace(' ', '+')}+full+course", "estHours": 6, "cost": "free"},
                {"title": f"[Paid Udemy] Follow a structured {track_name} course", "resourceUrl": f"https://www.udemy.com/courses/search/?q={track_name.replace(' ', '+')}", "estHours": 8, "cost": "paid"},
            ],
            "Phase 3: Portfolio": [
                {"title": "[Free GitHub] Publish a concise case study showing process and outcomes", "resourceUrl": "https://github.com/", "estHours": 5, "cost": "free"},
            ],
            "Phase 4: Job Readiness": [
                {"title": "[Free YouTube] Practice role-specific interview questions", "resourceUrl": f"https://www.youtube.com/results?search_query={track_name.replace(' ', '+')}+interview+questions", "estHours": 4, "cost": "free"},
            ],
        }
    return {
        "name": track_name,
        "category": row.get("domain") or infer_domain(track_name),
        "requiredSkills": skills or ["Domain fundamentals", "Communication", "Portfolio evidence"],
        "description": row.get("description") or f"A practical career path for {track_name}.",
        "source": row.get("source", "pathways-csv"),
        "weights": {},
        "weeklyActions": weekly_actions,
    }

# When trained artifacts are present, recommendations cover every dataset
# category.  The three hand-authored archetypes remain the no-model fallback.
if label_map:
    ROLE_ARCHETYPES = [_generic_category_role(label_map[str(i)]) for i in range(len(label_map))]
elif lightweight_roles:
    ROLE_ARCHETYPES = lightweight_roles
else:
    csv_roles = [_csv_pathway_role(row) for row in read_pathways() if row.get("track_name", "").strip()]
    if csv_roles:
        ROLE_ARCHETYPES = csv_roles

# Always build TF-IDF as fallback for archetypes
corpus = []
for role in ROLE_ARCHETYPES:
    text_to_embed = f"{role['name']}. {role['description']}. Required skills: {', '.join(role['requiredSkills'])}"
    corpus.append(text_to_embed)
tfidf_model = LightTFIDF(corpus)

ROLE_EMBEDDINGS = {}
for role in ROLE_ARCHETYPES:
    text_to_embed = f"{role['name']}. {role['description']}. Required skills: {', '.join(role['requiredSkills'])}"
    ROLE_EMBEDDINGS[role['name']] = tfidf_model.transform(text_to_embed)


# â”€â”€â”€ Pydantic Schemas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class PathwaySearchRequest(BaseModel):
    skills: str

class PathwayGenerateRequest(BaseModel):
    track_name: str
    skills: str

class PipelineRequest(BaseModel):
    skills: List[str]
    interests: List[str]
    goalText: str
    hoursPerWeek: int
    timelineMonths: int
    budgetPref: str

class RefineRequest(BaseModel):
    skills: List[str]
    interests: List[str]
    goalText: str
    hoursPerWeek: int
    timelineMonths: int
    message: str

class RefineResponse(BaseModel):
    reply: str
    skills: List[str]
    interests: List[str]
    goalText: str
    hoursPerWeek: int
    timelineMonths: int

class ClassifyRequest(BaseModel):
    resume_text: str

class JobSkillRequest(BaseModel):
    title: str = ""
    description: str

class CategoryPrediction(BaseModel):
    category: str
    confidence: float

class ClassifyResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    top_predictions: List[CategoryPrediction]
    model_used: str

class RoadmapItemModel(BaseModel):
    title: str
    resourceUrl: str = ""
    estHours: int = 4

class PhaseModel(BaseModel):
    phaseName: str
    items: List[RoadmapItemModel]

class RecommendationModel(BaseModel):
    roleName: str
    description: str
    requiredSkills: List[str]
    fitScore: int
    explanation: str
    phases: List[PhaseModel]
    matchedBy: str = "tfidf"
    jobMarketLinks: Optional[Dict[str, str]] = None


class PipelineResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    recommendations: List[RecommendationModel]
    modelUsed: str = "tfidf"
    categoryPrior: Optional[CategoryPrediction] = None


from typing import TypedDict

# LangGraph Agent State definition
class AgentState(TypedDict, total=False):
    skills: List[str]
    interests: List[str]
    goalText: str
    hoursPerWeek: int
    timelineMonths: int
    budgetPref: str
    extracted_profile: Dict[str, Any]
    matches: List[Dict[str, Any]]
    gaps: Dict[str, List[str]]
    roadmaps: Dict[str, List[Dict[str, Any]]]
    explanations: Dict[str, str]
    model_used: str



# --- AGENT 1: Skill Extraction Agent ---
def skill_extraction_agent(state: AgentState) -> AgentState:
    print("[Agent] Skill Extraction Agent executing...")
    # Normalize inputs and extract keywords
    normalized_skills = [s.strip().title() for s in state["skills"]]
    normalized_interests = [i.strip().lower() for i in state["interests"]]
    
    state["extracted_profile"] = {
        "skills": normalized_skills,
        "interests": normalized_interests,
        "combined_text": f"Skills: {', '.join(normalized_skills)}. Interests: {', '.join(normalized_interests)}. Goal: {state['goalText']}"
    }
    if embedding_engine is not None and state["goalText"].strip():
        predictions = embedding_engine.predict_category(_clean_text(state["goalText"]), label_map)
        state["extracted_profile"]["category_prior"] = predictions[0] if predictions else None
    elif lightweight_model is not None and state["goalText"].strip():
        probabilities = lightweight_model.predict_proba([_clean_text(state["goalText"])])[0]
        classes = list(lightweight_model.classes_)
        top_idx = int(np.argmax(probabilities))
        state["extracted_profile"]["category_prior"] = {
            "category": classes[top_idx],
            "confidence": round(float(probabilities[top_idx]), 4),
        }
    else:
        state["extracted_profile"]["category_prior"] = None
    return state

# --- AGENT 2: Career Match Agent (ML/Embedding-based or TF-IDF fallback) ---
def career_match_agent(state: AgentState) -> AgentState:
    print("[Agent] Career Match Agent executing...")
    profile_text = state["extracted_profile"]["combined_text"]
    matches = []

    if embedding_engine is not None and category_embeddings is not None and len(label_map) > 0:
        # â”€â”€ DistilBERT path â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        print("[Agent] Using DistilBERT resume embeddings for matching...")
        state["model_used"] = "distilbert"
        profile_vector = embedding_engine.embed(_clean_text(profile_text))  # [768]
        norm_profile = np.linalg.norm(profile_vector)

        # Score against all real resume category prototypes
        cat_scores = {}
        for idx_str, cat_name in label_map.items():
            idx = int(idx_str)
            cat_vector = category_embeddings[idx]
            norm_cat   = np.linalg.norm(cat_vector)
            if norm_profile > 0 and norm_cat > 0:
                cosine_sim = np.dot(profile_vector, cat_vector) / (norm_profile * norm_cat)
            else:
                cosine_sim = 0.0
            cat_scores[cat_name] = float(cosine_sim)

        category_prior = state["extracted_profile"].get("category_prior") or {}
        prior_category = category_prior.get("category")
        prior_confidence = float(category_prior.get("confidence", 0.0))

        # Every learned category receives its own prototype score.
        for role in ROLE_ARCHETYPES:
            category = role.get("category", role["name"])
            prototype_score = cat_scores.get(category, 0.0)
            # The classifier's top goal prediction is a strong, but bounded,
            # prior rather than a replacement for profile similarity.
            prior_bonus = 0.15 * prior_confidence if category == prior_category else 0.0
            blended_sim = min(1.0, prototype_score + prior_bonus)
            fit_score = int(50 + (blended_sim + 1) * 24)
            fit_score = min(max(fit_score, 50), 98)

            matches.append({
                "roleName":  role["name"],
                "fitScore":  fit_score,
                "roleData":  role,
                "matchedBy": "distilbert",
            })
    elif lightweight_model is not None:
        print("[Agent] Using trained lightweight resume classifier for matching...")
        state["model_used"] = "tfidf-logistic-regression"
        probabilities = lightweight_model.predict_proba([_clean_text(profile_text)])[0]
        class_scores = {
            str(class_name): float(probabilities[idx])
            for idx, class_name in enumerate(lightweight_model.classes_)
        }
        user_skills = set(s.lower() for s in state["extracted_profile"]["skills"])

        for role in ROLE_ARCHETYPES:
            category = role.get("category", role["name"])
            probability = class_scores.get(category, 0.0)
            required = role.get("requiredSkills", [])
            overlap = sum(1 for skill in required if skill.lower() in user_skills)
            overlap_boost = (overlap / len(required)) * 12 if required else 0
            fit_score = int(58 + probability * 32 + overlap_boost)
            fit_score = min(max(fit_score, 58), 98)
            matches.append({
                "roleName": role["name"],
                "fitScore": fit_score,
                "roleData": role,
                "matchedBy": "tfidf-logistic-regression",
            })
    else:
        # â”€â”€ TF-IDF fallback path â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        print("[Agent] Using TF-IDF fallback for matching...")
        state["model_used"] = "tfidf"
        profile_vector = tfidf_model.transform(profile_text)
        norm_profile   = np.linalg.norm(profile_vector)

        for role in ROLE_ARCHETYPES:
            role_vector = ROLE_EMBEDDINGS[role["name"]]
            dot_product = np.dot(profile_vector, role_vector)
            norm_role   = np.linalg.norm(role_vector)
            if norm_profile > 0 and norm_role > 0:
                similarity = dot_product / (norm_profile * norm_role)
            else:
                similarity = 0.0
            fit_score = int(60 + (similarity + 1) * 19)
            fit_score = min(max(fit_score, 60), 98)
            matches.append({
                "roleName":  role["name"],
                "fitScore":  fit_score,
                "roleData":  role,
                "matchedBy": "tfidf",
            })

    # Sort matches by fitScore descending
    state["matches"] = sorted(matches, key=lambda x: x["fitScore"], reverse=True)
    return state

# --- AGENT 3: Gap Analysis Agent ---
def gap_analysis_agent(state: AgentState) -> AgentState:
    print("[Agent] Gap Analysis Agent executing...")
    user_skills = set(s.lower() for s in state["extracted_profile"]["skills"])
    gaps = {}

    for match in state["matches"]:
        role_name = match["roleName"]
        role_skills = match["roleData"]["requiredSkills"]
        
        # Calculate gaps (what role needs that user doesn't have)
        missing = [s for s in role_skills if s.lower() not in user_skills]
        gaps[role_name] = missing

    state["gaps"] = gaps
    return state

# --- AGENT 4: Roadmap Builder Agent ---
def roadmap_builder_agent(state: AgentState) -> AgentState:
    print("[Agent] Roadmap Builder Agent executing...")
    roadmaps = {}
    
    for match in state["matches"][:6]:


        role_name = match["roleName"]
        role_data = match["roleData"]
        user_skills = state.get("skills", [])
        missing_gaps = state.get("gaps", {}).get(role_name, [])
        hours_per_week = state.get("hoursPerWeek", 10)
        timeline_months = state.get("timelineMonths", 6)
        budget_pref = state.get("budgetPref", "free")
        
        # 1. Attempt dynamic AI roadmap generation
        ai_phases = generate_ai_roadmap(
            role_name=role_name,
            role_data=role_data,
            user_skills=user_skills,
            missing_gaps=missing_gaps,
            hours_per_week=hours_per_week,
            timeline_months=timeline_months,
            budget_pref=budget_pref,
        )
        
        if ai_phases:
            roadmaps[role_name] = ai_phases
            continue

        # 2. Fallback: construct a phased learning roadmap from CSV/archetype actions.
        phases = []
        for phase_name, items in role_data.get("weeklyActions", {}).items():
            phase_items = []
            for item in filter_items_by_budget(items, budget_pref):
                adjusted_hours = item.get("estHours", 4)
                if hours_per_week < 8:
                    adjusted_hours = max(2, int(adjusted_hours * 0.7))
                
                phase_items.append({
                    "title": item["title"],
                    "resourceUrl": item.get("resourceUrl") or f"https://roadmap.sh/{role_name.lower().replace(' ', '-')}",
                    "estHours": adjusted_hours
                })
            phases.append({
                "phaseName": phase_name,
                "items": phase_items
            })
        roadmaps[role_name] = phases

    state["roadmaps"] = roadmaps
    return state


# --- AGENT 5: Explanation Agent ---
def explanation_agent(state: AgentState) -> AgentState:
    print("[Agent] Explanation Agent executing...")
    explanations = {}
    
    for match in state["matches"]:
        role_name = match["roleName"]
        score = match["fitScore"]
        missing_skills = state["gaps"][role_name]
        
        # Build explanation
        if score >= 90:
            why = f"Excellent fit! Your profile highly overlaps with {role_name} skills. Focus on building: {', '.join(missing_skills[:2])} to be job ready."
        elif score >= 80:
            why = f"Promising option. Good overlap in core strengths. Mitigate gaps in: {', '.join(missing_skills[:2])}."
        else:
            why = f"Exploratory route. Requires building multiple foundations like: {', '.join(missing_skills[:3])}."
            
        explanations[role_name] = why
        
    state["explanations"] = explanations
    return state

if LANGGRAPH_AVAILABLE:
    workflow = StateGraph(AgentState)

    workflow.add_node("extract_skills", skill_extraction_agent)
    workflow.add_node("match_careers", career_match_agent)
    workflow.add_node("analyze_gaps", gap_analysis_agent)
    workflow.add_node("build_roadmaps", roadmap_builder_agent)
    workflow.add_node("explain_results", explanation_agent)

    workflow.set_entry_point("extract_skills")

    workflow.add_edge("extract_skills", "match_careers")
    workflow.add_edge("match_careers", "analyze_gaps")
    workflow.add_edge("analyze_gaps", "build_roadmaps")
    workflow.add_edge("build_roadmaps", "explain_results")
    workflow.add_edge("explain_results", END)

    graph = workflow.compile()
else:
    workflow = None
graph = None

# â”€â”€â”€ FastAPI Endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@app.get("/health")
def health_check():
    if embedding_engine is not None:
        model_status = "distilbert"
        cats = len(label_map)
    elif lightweight_model is not None:
        model_status = "tfidf-logistic-regression"
        cats = len(lightweight_label_map)
    else:
        model_status = "tfidf-fallback"
        cats = len(ROLE_ARCHETYPES)
    return {
        "status": "ok",
        "service": "pathfinder-ai-service",
        "matching_engine": model_status,
        "resume_categories": cats,
        "ml_classifiers_disabled": ML_CLASSIFIERS_DISABLED,
        "ai_providers": {
            "gemini": GEMINI_AVAILABLE,
            "xai": XAI_AVAILABLE,
            "gemini_models": GEMINI_MODELS if GEMINI_AVAILABLE else [],
            "xai_models": XAI_MODELS if XAI_AVAILABLE else [],
        },
    }

@app.post("/api/classify", response_model=ClassifyResponse)
def classify_resume(payload: ClassifyRequest):
    """Classify a resume text into one of the 24 job categories."""
    if embedding_engine is None and lightweight_model is None:
        cleaned = _clean_text(payload.resume_text)
        matches = []
        for role in ROLE_ARCHETYPES:
            role_text = " ".join([
                role.get("name", ""),
                role.get("description", ""),
                " ".join(role.get("requiredSkills", [])),
            ])
            score = cosine_similarity(tfidf_model.transform(cleaned), tfidf_model.transform(role_text))
            matches.append({"category": role.get("category", role["name"]), "confidence": round(float(score), 4)})
        matches.sort(key=lambda item: item["confidence"], reverse=True)
        return ClassifyResponse(
            top_predictions=[CategoryPrediction(**p) for p in matches[:3]],
            model_used="tfidf-fallback (ML classifiers disabled)",
        )
    try:
        cleaned = _clean_text(payload.resume_text)
        if embedding_engine is not None:
            predictions = embedding_engine.predict_category(cleaned, label_map)
            model_used = "distilbert-base-uncased (fine-tuned on resume dataset)"
        else:
            probabilities = lightweight_model.predict_proba([cleaned])[0]
            predictions = [
                {"category": str(lightweight_model.classes_[idx]), "confidence": round(float(probabilities[idx]), 4)}
                for idx in probabilities.argsort()[::-1][:3]
            ]
            model_used = "tfidf-logistic-regression (trained on Resume.csv)"
        return ClassifyResponse(
            top_predictions=[CategoryPrediction(**p) for p in predictions],
            model_used=model_used,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/job-description/skills")
def extract_job_description_skills(payload: JobSkillRequest):
    text = f"{payload.title} {payload.description}"
    return {
        "skills": extract_skill_tags(text, limit=12),
        "source": "keyword-taxonomy",
    }

@app.get("/api/job-market/roles")
def get_job_market_roles():
    return {
        "count": len(ROLE_ARCHETYPES),
        "modelLoaded": lightweight_model is not None or embedding_engine is not None,
        "roles": [
            {
                "name": role["name"],
                "category": role.get("category", role["name"]),
                "requiredSkills": role.get("requiredSkills", []),
                "source": role.get("source", "seed"),
            }
            for role in ROLE_ARCHETYPES
        ],
    }

@app.post("/api/agent/pipeline", response_model=PipelineResponse)
def run_pipeline(payload: PipelineRequest):
    if not LANGGRAPH_AVAILABLE:
        skill_set = " , ".join(payload.skills or [])
        recommendations = []
        for i, skill in enumerate(payload.skills[:5], start=1):
            recommendations.append({
                "roleName": f"{skill or 'Career'} Path",
                "description": f"Build a practical roadmap around {skill or payload.goalText or 'your target role'} with a focused learning plan.",
                "requiredSkills": [skill] if skill else ["Foundations"],
                "fitScore": 78 + min(i * 3, 12),
                "explanation": "Fallback keyword-based recommendation: this route is active because the ML graph dependency is not installed.",
                "phases": [{
                    "phaseName": "Phase 1: Foundations",
                    "items": [{
                        "title": f"Study {skill or 'your target area'} fundamentals and practice a small project.",
                        "resourceUrl": "https://roadmap.sh/",
                        "estHours": 6,
                    }]
                }],
                "matchedBy": "keyword-fallback",
                "jobMarketLinks": {},
            })
        return {
            "recommendations": recommendations,
            "modelUsed": "keyword-fallback",
            "categoryPrior": None,
        }
    try:
        initial_state = {"skills": payload.skills, "interests": payload.interests, "goalText": payload.goalText, "hoursPerWeek": payload.hoursPerWeek, "timelineMonths": payload.timelineMonths, "budgetPref": payload.budgetPref, "extracted_profile": {}, "matches": [], "gaps": {}, "roadmaps": {}, "explanations": {}}
        print("Invoking LangGraph Orchestrator pipeline...")
        final_state = graph.invoke(initial_state)
        recs = []
        for match in final_state["matches"][:6]:
            name = match["roleName"]
            role_data = match["roleData"]
            recs.append({
                "roleName": name,
                "description": role_data["description"],
                "requiredSkills": role_data["requiredSkills"],
                "fitScore": match["fitScore"],
                "explanation": final_state["explanations"].get(name, f"Recommended path based on skill profile for {name}."),
                "phases": final_state["roadmaps"].get(name, []),
                "matchedBy": match.get("matchedBy", "tfidf"),
                "jobMarketLinks": role_data.get("jobMarketLinks"),
            })
        model_used = final_state.get("model_used", final_state.get("_model_used", "tfidf"))
        category_prior = final_state["extracted_profile"].get("category_prior")
        return {"recommendations": recs, "modelUsed": model_used, "categoryPrior": category_prior}
    except Exception as e:
        print(f"Pipeline error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agent/refine", response_model=RefineResponse)
def refine_profile(payload: RefineRequest):
    if not (GEMINI_AVAILABLE or XAI_AVAILABLE):
        # Fallback if Gemini not configured/available
        reply = "Gemini AI unavailable. Applied fallback rule updates."
        skills = payload.skills
        interests = payload.interests
        goalText = payload.goalText
        hoursPerWeek = payload.hoursPerWeek
        timelineMonths = payload.timelineMonths
        lower = payload.message.lower()
        if "code" in lower or "coding" in lower or "programming" in lower:
            skills = [s for s in skills if s.lower() not in ["javascript", "python", "sql"]]
            if "Visual Design" not in interests:
                interests.append("Visual Design")
            goalText = "Design user interfaces and user experience without deep programming"
        elif "hours" in lower or "time" in lower or "study" in lower:
            hoursPerWeek = max(4, hoursPerWeek - 4)
            timelineMonths = min(24, timelineMonths + 4)
        return {
            "reply": reply,
            "skills": skills,
            "interests": interests,
            "goalText": goalText,
            "hoursPerWeek": hoursPerWeek,
            "timelineMonths": timelineMonths
        }

    try:
        prompt = f"""You are an expert AI Career Pathfinder agent.
Analyze the user's request and update their onboarding profile details accordingly.

Current Profile state:
- Skills: {payload.skills}
- Interests: {payload.interests}
- Current Goal: "{payload.goalText}"
- Study Commitment: {payload.hoursPerWeek} hours/week
- Timeline: {payload.timelineMonths} months

User message: "{payload.message}"

Your task is to:
1. Formulate a friendly, encouraging conversational reply to the user explaining what you are changing.
2. Update the profile variables (skills list, interests list, hoursPerWeek, timelineMonths, goalText) to align with their request.
   - For example: if they want to avoid coding, remove programming skills.
   - If they have less time, decrease hoursPerWeek.
   - If they want to change their target field or goal, update the goalText or interests.

Return ONLY a valid raw JSON object formatted as follows (no markdown tags, no backticks):
{{
  "reply": "Your explanation to the user here...",
  "skills": ["Skill1", "Skill2", ...],
  "interests": ["Interest1", "Interest2", ...],
  "goalText": "Updated goal here",
  "hoursPerWeek": integer,
  "timelineMonths": integer
}}
"""
        parsed, provider, model_name = call_llm_json(prompt, timeout=30)
        
        return {
            "reply": parsed.get("reply", "Profile updated successfully!"),
            "skills": parsed.get("skills", payload.skills),
            "interests": parsed.get("interests", payload.interests),
            "goalText": parsed.get("goalText", payload.goalText),
            "hoursPerWeek": int(parsed.get("hoursPerWeek", payload.hoursPerWeek)),
            "timelineMonths": int(parsed.get("timelineMonths", payload.timelineMonths))
        }
    except Exception as e:
        print(f"Refine endpoint error: {e}")
        # Rule-based fallback if API call fails
        reply = f"Applying rule fallback: {e}"
        skills = payload.skills
        interests = payload.interests
        goalText = payload.goalText
        hoursPerWeek = payload.hoursPerWeek
        timelineMonths = payload.timelineMonths
        return {
            "reply": reply,
            "skills": skills,
            "interests": interests,
            "goalText": goalText,
            "hoursPerWeek": hoursPerWeek,
            "timelineMonths": timelineMonths
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
