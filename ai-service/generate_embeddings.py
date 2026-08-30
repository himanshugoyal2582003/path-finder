"""
generate_embeddings.py
-----------------------
Uses the fine-tuned DistilBERT model to generate prototype embeddings
for each of the 24 job categories by averaging CLS-token embeddings
from real resume samples of that category.

Must be run AFTER train_resume_classifier.py

Usage:
    python generate_embeddings.py

Outputs:
    - models/resume_embeddings.npy   (shape: [num_categories, hidden_size])
    - models/label_map.json          (already written by training script)
"""

import json
import re
import numpy as np
import pandas as pd
from pathlib import Path

import torch
from transformers import DistilBertTokenizer, DistilBertModel

# ─── Paths ────────────────────────────────────────────────────────────────────

BASE_DIR     = Path(__file__).parent
DATASET_PATH = BASE_DIR / "archive" / "Resume" / "Resume.csv"
MODEL_DIR    = BASE_DIR / "models" / "resume_classifier"
EMBEDDINGS_PATH = BASE_DIR / "models" / "resume_embeddings.npy"
LABEL_MAP_PATH  = BASE_DIR / "models" / "label_map.json"

MAX_LEN         = 256
SAMPLES_PER_CAT = 20   # how many resumes per category to average
BATCH_SIZE      = 8

# ─── Device ───────────────────────────────────────────────────────────────────

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"\n{'='*60}")
print(f"  Resume Embedding Generator")
print(f"{'='*60}")
print(f"  Device          : {device}")
print(f"  Model dir       : {MODEL_DIR}")
print(f"  Samples/category: {SAMPLES_PER_CAT}")
print(f"{'='*60}\n")

if not MODEL_DIR.exists():
    raise FileNotFoundError(
        f"Model not found at {MODEL_DIR}. "
        "Please run train_resume_classifier.py first."
    )
if not LABEL_MAP_PATH.exists():
    raise FileNotFoundError(
        f"Label map not found at {LABEL_MAP_PATH}. "
        "Please run train_resume_classifier.py first."
    )

# ─── Text Cleaning ────────────────────────────────────────────────────────────

def clean_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"http\S+|www\.\S+", " ", text)
    text = re.sub(r"[^\w\s\.\,\-]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

# ─── Load Dataset ─────────────────────────────────────────────────────────────

print("Loading dataset...")
df = pd.read_csv(DATASET_PATH)
if "Resume_str" in df.columns:
    df["text"] = df["Resume_str"].apply(clean_text)
else:
    df["text"] = df["Resume_html"].apply(clean_text)
df = df[df["text"].str.len() > 50].reset_index(drop=True)
with open(LABEL_MAP_PATH, "r") as f:
    label_map = json.load(f)
categories = [label_map[str(i)] for i in range(len(label_map))]
missing_categories = sorted(set(categories) - set(df["Category"].unique()))
if missing_categories:
    raise ValueError(f"Label map categories missing from dataset: {missing_categories}")
print(f"  Found {len(categories)} categories, {len(df)} total resumes")

# ─── Load Model ───────────────────────────────────────────────────────────────

print(f"\nLoading fine-tuned DistilBERT from {MODEL_DIR}...")
tokenizer = DistilBertTokenizer.from_pretrained(MODEL_DIR)
# Load base DistilBERT (without classification head) for embeddings
bert_model = DistilBertModel.from_pretrained(MODEL_DIR, ignore_mismatched_sizes=True)
bert_model.to(device)
bert_model.eval()
print("Model loaded.")

# ─── Embedding Helpers ────────────────────────────────────────────────────────

def get_cls_embeddings(texts: list) -> np.ndarray:
    """Tokenize a batch of texts and return CLS token embeddings."""
    all_embeddings = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch_texts = texts[i:i+BATCH_SIZE]
        encoding = tokenizer(
            batch_texts,
            max_length=MAX_LEN,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        input_ids      = encoding["input_ids"].to(device)
        attention_mask = encoding["attention_mask"].to(device)

        with torch.no_grad():
            outputs = bert_model(input_ids=input_ids, attention_mask=attention_mask)
            # CLS token is the first token of the last hidden state
            cls_embeddings = outputs.last_hidden_state[:, 0, :]
            all_embeddings.append(cls_embeddings.cpu().numpy())

    return np.vstack(all_embeddings)

# ─── Generate Category Prototype Embeddings ───────────────────────────────────

print(f"\nGenerating prototype embeddings for {len(categories)} categories...")
print(f"(averaging top {SAMPLES_PER_CAT} resumes per category)\n")

category_embeddings = []

for cat in categories:
    cat_df = df[df["Category"] == cat].head(SAMPLES_PER_CAT)
    texts  = cat_df["text"].tolist()

    if not texts:
        print(f"  [WARN] No samples for category: {cat} — using zero vector")
        # We'll determine dim from first successful category
        embedding_dim = category_embeddings[0].shape[0] if category_embeddings else 768
        prototype = np.zeros(embedding_dim)
    else:
        embeddings = get_cls_embeddings(texts)
        prototype  = embeddings.mean(axis=0)   # average = category centroid

    category_embeddings.append(prototype)
    print(f"  [{categories.index(cat)+1:>2}/{len(categories)}] {cat:<30} | "
          f"samples={len(texts):>2} | embedding_norm={np.linalg.norm(prototype):.3f}")

category_embeddings = np.array(category_embeddings)  # shape: [24, 768]

# ─── Save Outputs ─────────────────────────────────────────────────────────────

np.save(EMBEDDINGS_PATH, category_embeddings)
print(f"\n  Embeddings saved to : {EMBEDDINGS_PATH}")
print(f"  Shape               : {category_embeddings.shape}")

print(f"  Label map verified  : {LABEL_MAP_PATH}")

print(f"\n{'='*60}")
print(f"  Embedding generation complete!")
print(f"  Next step: restart the FastAPI server")
print(f"  uvicorn main:app --reload --port 8000")
print(f"{'='*60}\n")
