# 🤖 PathFinder AI Service

FastAPI-powered microservice for **PathFinder** providing multi-agent career path recommendations, resume & goal classification, skill gap analysis, and personalized learning roadmaps.

Powered by **LangGraph**, **Scikit-Learn (TF-IDF + Logistic Regression)**, and optional **DistilBERT / Transformer** embeddings.

---

## 📋 Prerequisites & Setup

### 1. Create & Activate Virtual Environment
```bash
# Navigate to ai-service directory
cd ai-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# On macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

---

## 🏋️ Model Training

The AI service classifies user goals and resumes into 21+ industry sectors (Healthcare/Doctor, Software Engineering, Data Science, Product Design, Finance, Legal, etc.) using market-aligned Job Description (JD) patterns.

### Train Job Description (JD) Classifier
```bash
python train_jd_model.py
```

- **Output Artifacts**: Saved to `models/job_description_classifier/`:
  - `model.joblib` — Trained TF-IDF + Logistic Regression model pipeline
  - `label_map.json` — Category index mapping
  - `role_archetypes.json` — Extracted role archetypes, required skills, and 4-phase learning roadmaps
  - `training_summary.json` — Training metrics and sample statistics

### (Optional) Train with Live Job APIs Enabled
You can enable live job fetching from remote job platforms during training:
```bash
# Set environment variables
export FETCH_JOB_MARKET=1
export JOB_API_URLS="https://your-custom-job-api-feed.com/jobs"

# Run training script
python train_jd_model.py
```

---

## 🚀 Starting the Service

### Run Development Server
```bash
# Run FastAPI server on port 8000
uvicorn main:app --reload --host 127.0.0.1 --port 8000  
```

Once running, interactive API docs will be available at:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🔌 API Endpoints & Examples

### 1. Health Check
`GET /health`

```bash
curl http://127.0.0.1:8000/health
```

**Response**:
```json
{
  "status": "ok",
  "service": "pathfinder-ai-service",
  "matching_engine": "tfidf-logistic-regression",
  "resume_categories": 21
}
```

---

### 2. Classify Goal / Resume Text
`POST /api/classify`

```bash
curl -X POST http://127.0.0.1:8000/api/classify \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "Medical doctor examining patients, diagnosing acute conditions, prescribing medications in a hospital"
  }'
```

**Response**:
```json
{
  "top_predictions": [
    { "category": "HEALTHCARE", "confidence": 0.9998 }
  ],
  "model_used": "tfidf-logistic-regression (trained on Job Descriptions)"
}
```

---

### 3. Run Multi-Agent Recommendation Pipeline
`POST /api/agent/pipeline`

Runs the 5-agent LangGraph workflow (`Skill Extraction` $\rightarrow$ `Career Match` $\rightarrow$ `Gap Analysis` $\rightarrow$ `Roadmap Builder` $\rightarrow$ `Explanation`).

```bash
curl -X POST http://127.0.0.1:8000/api/agent/pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "skills": ["Patient Care", "Clinical Diagnosis"],
    "interests": ["user-empathy"],
    "goalText": "Become a medical practitioner doctor",
    "hoursPerWeek": 15,
    "timelineMonths": 6,
    "budgetPref": "free"
  }'
```

**Response**:
```json
{
  "recommendations": [
    {
      "roleName": "Healthcare",
      "description": "A Healthcare path derived from job market skill signals.",
      "requiredSkills": ["Clinical Diagnosis", "Patient Care", "Pharmacology"],
      "fitScore": 95,
      "explanation": "Excellent fit! Your profile highly overlaps with Healthcare skills.",
      "phases": [ ... 4-phase structured roadmap ... ],
      "matchedBy": "tfidf-logistic-regression"
    }
  ],
  "modelUsed": "tfidf-logistic-regression",
  "categoryPrior": { "category": "HEALTHCARE", "confidence": 0.9998 }
}
```

---

## 🧱 Architecture Overview

```
                        ┌───────────────────────────────┐
   User Intake Form ──> │   LangGraph StateGraph        │
                        └──────────────┬────────────────┘
                                       │
         ┌───────────────┬─────────────┼───────────────┬──────────────┐
         ▼               ▼             ▼               ▼              ▼
   Skill Extraction  Career Match  Gap Analysis  Roadmap Builder  Explanation
        Agent          Agent          Agent           Agent          Agent
```

- **Skill Extraction Agent**: Normalizes user profile & extracts category prior.
- **Career Match Agent**: Scores similarity against JD prototypes.
- **Gap Analysis Agent**: Identifies missing skills (Have vs. Need).
- **Roadmap Builder Agent**: Generates 4-phase action plan scaled to user hours/week.
- **Explanation Agent**: Generates natural language rationale for recommendations.











run codex resume, then select Continue (01a05360-4754-7220-b494-fe06f7a2fc45)
