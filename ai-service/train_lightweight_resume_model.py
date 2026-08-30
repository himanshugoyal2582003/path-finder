"""
Train a deployable lightweight resume classifier from archive/Resume/Resume.csv.

This complements the heavier DistilBERT script with a no-GPU path that is fast
enough for local demos and Render free-tier style deployments.
"""

import csv
import json
import os
import random
from collections import defaultdict
from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from job_market import build_role_archetypes, clean_text, collect_job_market_records


BASE_DIR = Path(__file__).parent
DATASET_PATH = BASE_DIR / "archive" / "Resume" / "Resume.csv"
MODEL_DIR = BASE_DIR / "models" / "lightweight_resume_classifier"
MODEL_PATH = MODEL_DIR / "model.joblib"
LABEL_MAP_PATH = MODEL_DIR / "label_map.json"
ROLE_ARCHETYPES_PATH = MODEL_DIR / "role_archetypes.json"
SUMMARY_PATH = MODEL_DIR / "training_summary.json"
SEED = 42


def load_resume_rows():
    rows = []
    with DATASET_PATH.open("r", encoding="utf-8", errors="replace", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            category = (row.get("Category") or "").strip()
            raw_text = row.get("Resume_str") or row.get("Resume_html") or ""
            text = clean_text(raw_text)
            if category and len(text) > 50:
                rows.append((text, category))
    return rows


def main():
    random.seed(SEED)
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Resume dataset not found: {DATASET_PATH}")

    print(f"[TRAIN] Loading dataset from {DATASET_PATH}")
    rows = load_resume_rows()
    print(f"[TRAIN] Loaded {len(rows)} usable resumes")
    if len(rows) < 50:
        raise ValueError("Not enough resume rows to train a model.")

    texts = [row[0] for row in rows]
    labels = [row[1] for row in rows]
    label_names = sorted(set(labels))
    label_map = {str(i): label for i, label in enumerate(label_names)}

    train_texts, test_texts, train_labels, test_labels = train_test_split(
        texts,
        labels,
        test_size=0.2,
        random_state=SEED,
        stratify=labels,
    )

    model = Pipeline([
        ("tfidf", TfidfVectorizer(
            lowercase=True,
            stop_words="english",
            ngram_range=(1, 2),
            min_df=2,
            max_features=60000,
            sublinear_tf=True,
        )),
        ("clf", LogisticRegression(
            max_iter=1200,
            class_weight="balanced",
            n_jobs=1,
            random_state=SEED,
        )),
    ])

    print("[TRAIN] Fitting TF-IDF + LogisticRegression classifier")
    model.fit(train_texts, train_labels)
    predictions = model.predict(test_texts)
    accuracy = accuracy_score(test_labels, predictions)
    macro_f1 = f1_score(test_labels, predictions, average="macro", zero_division=0)
    print(f"[TRAIN] Test accuracy: {accuracy:.4f}")
    print(f"[TRAIN] Test macro F1: {macro_f1:.4f}")
    print(classification_report(test_labels, predictions, zero_division=0))

    resume_texts_by_label = defaultdict(list)
    for text, label in rows:
        resume_texts_by_label[label].append(text)

    fetch_live_jobs = os.getenv("FETCH_JOB_MARKET", "0").lower() in {"1", "true", "yes"}
    job_records = collect_job_market_records(label_names, fetch_live=fetch_live_jobs)
    print(f"[TRAIN] Job-market records used: {len(job_records)}")
    role_archetypes = build_role_archetypes(label_names, resume_texts_by_label, job_records)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    LABEL_MAP_PATH.write_text(json.dumps(label_map, indent=2), encoding="utf-8")
    ROLE_ARCHETYPES_PATH.write_text(json.dumps(role_archetypes, indent=2), encoding="utf-8")
    SUMMARY_PATH.write_text(json.dumps({
        "model": "tfidf-logistic-regression",
        "dataset": str(DATASET_PATH),
        "samples": len(rows),
        "num_classes": len(label_names),
        "categories": label_names,
        "test_accuracy": round(float(accuracy), 4),
        "test_macro_f1": round(float(macro_f1), 4),
        "job_market_records": len(job_records),
        "live_job_fetch_enabled": fetch_live_jobs,
    }, indent=2), encoding="utf-8")

    print(f"[TRAIN] Saved model: {MODEL_PATH}")
    print(f"[TRAIN] Saved roles: {ROLE_ARCHETYPES_PATH}")
    print(f"[TRAIN] Saved summary: {SUMMARY_PATH}")


if __name__ == "__main__":
    main()
