# Life Path Finder

## Team

GLA University

Team Members:
- Himanshu Goyal
  - himanshu.goyal.arain@gmail.com
- Ravindra Kumar Gautam
  - rajkgautam2007@gmail.com
- Harsh Kushwaha
  - harsh.kushwaha_cs24@gla.ac.in
- Animish Gupta
  - animishgupta4@gmail.com

Life Path Finder is a full-stack career guidance platform that helps users discover career paths, understand skill gaps, and generate personalized learning roadmaps. It combines:

- a Next.js frontend for onboarding and dashboard experience
- an Express.js backend for auth, profile storage, and API orchestration
- a FastAPI AI service for recommendation logic, skill matching, and roadmap generation
- optional LLM integrations with Gemini and xAI for dynamic roadmap generation
- SQL-backed persistence for user profiles, saved recommendations, and roadmap data

This project is designed to help students and professionals translate messy skills, interests, and constraints into a structured, real-world career plan.

---

## Project Architecture

The system works in layers:

1. Frontend collects profile input from the user.
2. Backend authenticates the user and stores their profile and generated recommendations.
3. Backend calls the AI service to score role fit and generate roadmaps.
4. AI service runs recommendation logic and can optionally call external LLM APIs for richer roadmap content.
5. Frontend displays the roadmap, recommendations, and progress view to the user.

Flow:

```text
Frontend (Next.js)
   -> Backend (Express.js)
      -> AI Service (FastAPI)
         -> Local model matching / TF-IDF fallback
         -> Optional Gemini API
         -> Optional xAI API
      -> Database / profile storage
   -> Frontend dashboard UI
```

---

## Repository Structure

```text
Career Path/
├── ai-service/
│   ├── main.py                    # FastAPI app and recommendation engine
│   ├── job_market.py              # job/skills extraction helper
│   ├── requirements.txt           # Python dependencies
│   ├── train_jd_model.py          # optional model training
│   ├── train_lightweight_resume_model.py
│   ├── train_resume_classifier.py
│   └── models/                    # trained model artifacts
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── .env.example               # example backend env config (if added)
├── frontend/
│   ├── app/
│   ├── public/
│   ├── package.json
│   └── .env.example
├── images/
├── app.js
├── render.yaml
├── antigravity-prd.md
├── PathFinder_design_spec.md
├── README.md
└── styles.css
```

---

## Tech Stack

### Frontend
- Next.js
- React
- Clerk authentication
- Tailwind-like custom CSS

### Backend
- Node.js
- Express.js
- PostgreSQL via Prisma
- JWT auth
- REST API layer

### AI Service
- Python
- FastAPI
- Uvicorn
- NumPy, Pandas, Joblib
- TF-IDF / logistic regression fallback
- Optional DistilBERT and transformer-based models
- Optional Gemini and xAI LLM API integrations

---

## How the Model and LLM APIs Work

### 1. Local Matching Engine
The AI service first tries a lightweight matching flow without requiring heavy ML dependencies at startup.

The app has a fallback matching engine based on:

- skill text normalization
- TF-IDF vector comparisons
- cosine similarity scoring
- role metadata / required-skill matching

This is used when model artifacts are unavailable or when the service is intentionally run in minimal mode.

If model files exist, the service can also load trained job classifiers and resume embeddings. These provide richer category matching when the model artifacts are present.

### 2. Dynamic Roadmap Generation with LLMs
When the service has Gemini or xAI credentials configured, it can generate stronger, more tailored roadmap content than the static templates alone.

This happens in the AI service in `main.py`:

- `call_llm_json(...)` decides which provider to use
- if Gemini is available, it uses the `google.generativeai` SDK
- if xAI is available, it sends a JSON request to the xAI chat completions endpoint
- the model is prompted with user profile details such as skills, interests, time budget, role goal, and preferred learning budget
- the result must be valid JSON, which is parsed and used as the roadmap structure

The LLM response is then used to create roadmap phases like:

- Phase 1: Foundations
- Phase 2: Core application
- Phase 3: Portfolio work
- Phase 4: Interview and job readiness

### 3. Why the backend is in the middle
The frontend does not talk directly to Gemini or xAI. Instead:

- frontend sends user profile data to the backend
- backend stores the data and calls the AI service API
- AI service decides whether to use local model logic or LLM-generated roadmap logic
- backend returns structured recommendation data to the frontend

This separation keeps credentials safe and gives the app a clean API boundary.

---

## Environment Variables

### AI Service (`ai-service/.env`)
Create a `.env` file in `ai-service/` with values like:

```env
DISABLE_ML_CLASSIFIERS=true
GEMINI_API_KEY=your_gemini_key_here
GEMINI_MODELS=gemini-1.5-flash,gemini-2.5-flash
XAI_API_KEY=your_xai_key_here
XAI_API_BASE=https://api.x.ai/v1
XAI_MODELS=grok-3-mini,grok-3
```

Notes:
- `DISABLE_ML_CLASSIFIERS=true` keeps the app lightweight and avoids hard model startup issues.
- If no LLM API key is set, the app falls back to static roadmap generation.
- xAI calls use HTTP requests directly to the xAI chat completions endpoint.

### Backend (`backend/.env`)
Create a `.env` file inside `backend/`:

```env
PORT=5000
JWT_SECRET=your_secure_jwt_secret
DATABASE_URL=postgresql://user:password@host:5432/pathfinder
AI_SERVICE_URL=http://localhost:8000
```

### Frontend (`frontend/.env.local`)
Create a `.env.local` file in `frontend/`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000
```

You can also copy the example values from `frontend/.env.example`.

---

## Complete Setup Guide

## 1. Clone and Install Dependencies

```bash
git clone <repo-url>
cd "Career Path"
```

### Install frontend dependencies

```bash
cd frontend
npm install
```

### Install backend dependencies

```bash
cd ../backend
npm install
```

### Install AI service dependencies

```bash
cd ../ai-service
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# macOS/Linux
source .venv/bin/activate
pip install -r requirements.txt
```

If you are starting from a minimal environment, use the package set from `ai-service/requirements.txt` and keep the service in a Python 3.10/3.11 environment.

---

## 2. Start the AI Service

From `ai-service/`:

```bash
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

You can verify it is working by visiting:

- http://127.0.0.1:8000/health
- http://127.0.0.1:8000/docs

Expected behavior:

- app loads successfully
- if no external API keys are configured, it falls back to local logic
- if API keys exist, Gemini/xAI roadmap calls become active

---

## 3. Start the Backend

From `backend/`:

```bash
npm run dev
```

This starts Express on port 5000 by default. The backend exposes endpoints like:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/ai/health`
- `POST /api/ai/classify`
- `POST /api/ai/job-description/skills`

The backend connects to the AI service at `AI_SERVICE_URL` and forwards the user profile / recommendation requests.

---

## 4. Start the Frontend

From `frontend/`:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The frontend is responsible for:

- Clerk sign-in and sign-up
- onboarding UI for skills, interests, hours, and goals
- sending profile data to the backend
- rendering recommendations, saved paths, and curriculum dashboard

---

## 5. End-to-End User Flow

A typical user journey looks like this:

1. User signs in on the Next.js app.
2. User enters skills, interests, timeline, and target role.
3. Frontend sends the onboarding profile to the backend.
4. Backend authenticates the user and stores their profile.
5. Backend calls the AI service pipeline endpoint.
6. AI service runs local matching or external LLM-generated roadmap reasoning.
7. Backend responds with role matches, gap analysis, and learning roadmap.
8. Frontend renders a dashboard with the recommended paths.
9. User can refine their path by chat or by editing onboarding inputs.

---

## LLM Provider Configuration Notes

### Gemini
The app uses the Python SDK:

```python
import google.generativeai as genai
```

This is used when a valid `GEMINI_API_KEY` exists. The service wraps the prompt and expects the model to return structured JSON.

### xAI
The service calls xAI through direct HTTP JSON API requests:

```python
requests.post(
    f"{XAI_API_BASE.rstrip('/')}/chat/completions",
    headers={
        "Authorization": f"Bearer {XAI_API_KEY}",
        "Content-Type": "application/json",
    },
    json={...}
)
```

This is a good fit for fast provider switching and keeps the app flexible without locking the system to a single backend.

---

## Recommended Local Development Workflow

For day-to-day work:

1. Start AI service first.
2. Start backend second.
3. Start frontend last.
4. Keep `.env` values local and do not commit secrets.
5. Test the flow from onboarding to generated roadmap.

If LLM API keys are not set, the app still works in fallback mode using local logic and static roadmap templates.

---

## Production Notes

For deployment:

- set real environment variables in each service
- use secure JWT secrets
- keep the AI service behind a trusted internal network or private deployment if needed
- configure PostgreSQL and Clerk for production use
- consider storing model artifacts in object storage or server-managed files if you use trained models in production

---

## Summary

Life Path Finder is a real-world AI career guidance app that brings together:

- frontend UX and onboarding
- backend auth and orchestrated API routing
- Python AI service with local recommendation logic
- optional LLM backend providers for richer roadmap generation

This architecture makes the system flexible, modular, and easy to extend as the product grows.
