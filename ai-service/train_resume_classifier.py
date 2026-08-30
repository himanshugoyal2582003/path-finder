"""
train_resume_classifier.py
--------------------------
Fine-tunes distilbert-base-uncased on the Kaggle Resume Dataset
for 24-category job classification.

Usage:
    python train_resume_classifier.py

Outputs (saved to ai-service/models/resume_classifier/):
    - Fine-tuned DistilBERT model + tokenizer
    - label_map.json (int -> category name)
"""

import os
import re
import json
import time
import numpy as np
import pandas as pd
from pathlib import Path

import torch
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
from transformers import (
    DistilBertTokenizer,
    DistilBertForSequenceClassification,
    get_linear_schedule_with_warmup,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score, f1_score

# ─── Configuration ────────────────────────────────────────────────────────────

DATASET_PATH = Path(__file__).parent / "archive" / "Resume" / "Resume.csv"
MODEL_DIR    = Path(__file__).parent / "models" / "resume_classifier"
MODEL_NAME   = "distilbert-base-uncased"

MAX_LEN      = 256      # token length (resumes can be long; 256 is a good balance)
BATCH_SIZE   = 8        # reduce to 4 if you run out of memory
EPOCHS       = 3
LR           = 2e-5
WARMUP_RATIO = 0.1
SEED         = 42

# ─── Device ───────────────────────────────────────────────────────────────────

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"\n{'='*60}")
print(f"  Resume Classifier Training")
print(f"{'='*60}")
print(f"  Device   : {device}")
if device.type == "cuda":
    print(f"  GPU      : {torch.cuda.get_device_name(0)}")
    print(f"  VRAM     : {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
else:
    print("  Note     : CUDA was not detected; training on CPU can take 30–60 minutes.")
print(f"  Model    : {MODEL_NAME}")
print(f"  Max Len  : {MAX_LEN} tokens")
print(f"  Epochs   : {EPOCHS}")
print(f"  Batch    : {BATCH_SIZE}")
print(f"{'='*60}\n")

torch.manual_seed(SEED)
np.random.seed(SEED)

# ─── Text Cleaning ────────────────────────────────────────────────────────────

def clean_text(text: str) -> str:
    """Strip HTML tags, collapse whitespace, remove special chars."""
    if not isinstance(text, str):
        return ""
    # Remove HTML tags
    text = re.sub(r"<[^>]+>", " ", text)
    # Remove URLs
    text = re.sub(r"http\S+|www\.\S+", " ", text)
    # Remove excessive punctuation / special chars
    text = re.sub(r"[^\w\s\.\,\-]", " ", text)
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text

# ─── Load & Preprocess Dataset ────────────────────────────────────────────────

print("Loading dataset...")
df = pd.read_csv(DATASET_PATH)
print(f"  Loaded {len(df)} rows with columns: {list(df.columns)}")

# Use Resume_str (plain text) — fall back to Resume_html if missing
if "Resume_str" in df.columns:
    df["text"] = df["Resume_str"].apply(clean_text)
elif "Resume_html" in df.columns:
    df["text"] = df["Resume_html"].apply(clean_text)
else:
    raise ValueError("Dataset must contain 'Resume_str' or 'Resume_html' column.")

df = df[df["text"].str.len() > 50].reset_index(drop=True)

print(f"\nCategory distribution:")
print(df["Category"].value_counts().to_string())
print(f"\nTotal samples after cleaning: {len(df)}")

# Encode labels
le = LabelEncoder()
df["label"] = le.fit_transform(df["Category"])
num_classes = len(le.classes_)
print(f"\nNumber of categories: {num_classes}")
print(f"Categories: {list(le.classes_)}")

# Save label map
MODEL_DIR.mkdir(parents=True, exist_ok=True)
label_map = {str(i): cls for i, cls in enumerate(le.classes_)}
label_map_path = Path(__file__).parent / "models" / "label_map.json"
label_map_path.parent.mkdir(parents=True, exist_ok=True)
with open(label_map_path, "w") as f:
    json.dump(label_map, f, indent=2)
# Keep a copy with the Hugging Face artifacts so the model is self-contained.
with open(MODEL_DIR / "label_map.json", "w") as f:
    json.dump(label_map, f, indent=2)
print(f"Label map saved to: {label_map_path}")

# Train / Val / Test split (80 / 10 / 10)
train_texts, temp_texts, train_labels, temp_labels = train_test_split(
    df["text"].tolist(), df["label"].tolist(),
    test_size=0.2, random_state=SEED, stratify=df["label"]
)
val_texts, test_texts, val_labels, test_labels = train_test_split(
    temp_texts, temp_labels,
    test_size=0.5, random_state=SEED, stratify=temp_labels
)

print(f"\nSplit: Train={len(train_texts)} | Val={len(val_texts)} | Test={len(test_texts)}")

# ─── Dataset Class ────────────────────────────────────────────────────────────

class ResumeDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_len):
        self.texts     = texts
        self.labels    = labels
        self.tokenizer = tokenizer
        self.max_len   = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        encoding = self.tokenizer(
            self.texts[idx],
            max_length=self.max_len,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        return {
            "input_ids":      encoding["input_ids"].squeeze(0),
            "attention_mask": encoding["attention_mask"].squeeze(0),
            "label":          torch.tensor(self.labels[idx], dtype=torch.long),
        }

# ─── Load Tokenizer & Model ───────────────────────────────────────────────────

print(f"\nLoading tokenizer and model ({MODEL_NAME})...")
tokenizer = DistilBertTokenizer.from_pretrained(MODEL_NAME)
model = DistilBertForSequenceClassification.from_pretrained(
    MODEL_NAME,
    num_labels=num_classes,
    ignore_mismatched_sizes=True,
)
model.to(device)
print(f"Model loaded. Parameters: {sum(p.numel() for p in model.parameters()):,}")

# ─── DataLoaders ─────────────────────────────────────────────────────────────

train_dataset = ResumeDataset(train_texts, train_labels, tokenizer, MAX_LEN)
val_dataset   = ResumeDataset(val_texts,   val_labels,   tokenizer, MAX_LEN)
test_dataset  = ResumeDataset(test_texts,  test_labels,  tokenizer, MAX_LEN)

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True,  num_workers=0)
val_loader   = DataLoader(val_dataset,   batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
test_loader  = DataLoader(test_dataset,  batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

# ─── Optimizer & Scheduler ────────────────────────────────────────────────────

optimizer = AdamW(model.parameters(), lr=LR, weight_decay=0.01)
total_steps = len(train_loader) * EPOCHS
warmup_steps = int(total_steps * WARMUP_RATIO)

scheduler = get_linear_schedule_with_warmup(
    optimizer,
    num_warmup_steps=warmup_steps,
    num_training_steps=total_steps,
)

# ─── Training Loop ────────────────────────────────────────────────────────────

def evaluate(loader, model, device):
    """Run evaluation and return accuracy, F1, and loss."""
    model.eval()
    all_preds, all_labels = [], []
    total_loss = 0.0

    with torch.no_grad():
        for batch in loader:
            input_ids      = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels         = batch["label"].to(device)

            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels,
            )
            total_loss += outputs.loss.item()
            preds = torch.argmax(outputs.logits, dim=1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    acc = accuracy_score(all_labels, all_preds)
    f1  = f1_score(all_labels, all_preds, average="macro", zero_division=0)
    avg_loss = total_loss / len(loader)
    return acc, f1, avg_loss, all_preds, all_labels


print(f"\n{'='*60}")
print(f"  Starting Training ({EPOCHS} epochs)")
print(f"{'='*60}")

best_val_f1 = 0.0

for epoch in range(1, EPOCHS + 1):
    model.train()
    total_train_loss = 0.0
    start_time = time.time()

    for step, batch in enumerate(train_loader, 1):
        input_ids      = batch["input_ids"].to(device)
        attention_mask = batch["attention_mask"].to(device)
        labels         = batch["label"].to(device)

        optimizer.zero_grad()
        outputs = model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            labels=labels,
        )
        loss = outputs.loss
        loss.backward()

        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        scheduler.step()

        total_train_loss += loss.item()

        if step % 20 == 0 or step == len(train_loader):
            elapsed = time.time() - start_time
            avg_loss = total_train_loss / step
            pct = step / len(train_loader) * 100
            print(f"  Epoch {epoch}/{EPOCHS} | Step {step:>3}/{len(train_loader)} "
                  f"({pct:5.1f}%) | Loss: {avg_loss:.4f} | Elapsed: {elapsed:.0f}s")

    # Validate
    val_acc, val_f1, val_loss, _, _ = evaluate(val_loader, model, device)
    elapsed_epoch = time.time() - start_time
    print(f"\n  -- Epoch {epoch} Summary --")
    print(f"     Train Loss  : {total_train_loss / len(train_loader):.4f}")
    print(f"     Val Loss    : {val_loss:.4f}")
    print(f"     Val Acc     : {val_acc*100:.2f}%")
    print(f"     Val Macro F1: {val_f1:.4f}")
    print(f"     Time        : {elapsed_epoch:.0f}s\n")

    # Save best model
    if val_f1 > best_val_f1:
        best_val_f1 = val_f1
        model.save_pretrained(MODEL_DIR)
        tokenizer.save_pretrained(MODEL_DIR)
        print(f"  [SAVED] Best model (Val F1: {val_f1:.4f})")

# ─── Final Test Evaluation ────────────────────────────────────────────────────

print(f"\n{'='*60}")
print(f"  Loading best model for final test evaluation...")
print(f"{'='*60}")

best_model = DistilBertForSequenceClassification.from_pretrained(MODEL_DIR)
best_model.to(device)

test_acc, test_f1, test_loss, test_preds, test_true = evaluate(test_loader, best_model, device)

print(f"\n  Final Test Results:")
print(f"  ------------------------------------------")
print(f"  Accuracy    : {test_acc*100:.2f}%")
print(f"  Macro F1    : {test_f1:.4f}")
print(f"  Test Loss   : {test_loss:.4f}")
print(f"\n  Per-class Report:")
print(classification_report(test_true, test_preds, target_names=le.classes_, zero_division=0))

# ─── Save Training Summary ────────────────────────────────────────────────────

summary = {
    "model": MODEL_NAME,
    "num_classes": num_classes,
    "categories": list(le.classes_),
    "epochs": EPOCHS,
    "max_len": MAX_LEN,
    "batch_size": BATCH_SIZE,
    "test_accuracy": round(test_acc * 100, 2),
    "test_macro_f1": round(test_f1, 4),
    "device": str(device),
}

summary_path = MODEL_DIR / "training_summary.json"
with open(summary_path, "w") as f:
    json.dump(summary, f, indent=2)

print(f"\n{'='*60}")
print(f"  Training Complete!")
print(f"  Model saved to : {MODEL_DIR}")
print(f"  Label map      : {label_map_path}")
print(f"  Summary        : {summary_path}")
print(f"{'='*60}\n")
print("Next step: run  python generate_embeddings.py")
