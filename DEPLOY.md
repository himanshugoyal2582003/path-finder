# Antigravity PathFinder — Deployment Guide

This project is split across **three separate deployments**:

| Service | Platform | URL Env Var |
|---|---|---|
| `frontend/` | Vercel | `NEXT_PUBLIC_API_URL` |
| `backend/` | Render (Web Service) | `AI_SERVICE_URL` |
| `ai-service/` | Render (Web Service) | — |

---

## Step 1 — Deploy AI Service on Render

> Deploy this **first** because the backend needs its URL.

1. Push the repo to GitHub (make sure `ai-service/` is included).
2. Go to [render.com](https://render.com) → **New → Web Service**.
3. Connect your GitHub repo, select the `ai-service/` sub-directory.
4. Fill in the settings:

| Field | Value |
|---|---|
| **Name** | `pathfinder-ai` |
| **Root Directory** | `ai-service` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | `Free` |

5. No environment variables required.
6. Click **Create Web Service**. Render will assign a URL like:
   `https://pathfinder-ai.onrender.com`

> ⚠️ Free Render instances **spin down after 15 min of inactivity** and take ~20 sec to wake up. The Express backend handles this gracefully with a fallback Jaccard scorer.

---

## Step 2 — Deploy Express Backend on Render

1. Create a **second** Render Web Service.
2. Connect the same repo, set **Root Directory** to `backend`.
3. Fill in the settings:

| Field | Value |
|---|---|
| **Name** | `pathfinder-backend` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node src/index.js` |
| **Instance Type** | `Free` |

4. Add **Environment Variables** in the Render dashboard:

| Key | Value |
|---|---|
| `PORT` | `10000` *(Render assigns this automatically)* |
| `JWT_SECRET` | *Generate a strong 32-char random string* |
| `AI_SERVICE_URL` | `https://pathfinder-ai.onrender.com` *(URL from Step 1)* |
| `NODE_ENV` | `production` |

5. Click **Create Web Service**. Render URL:
   `https://pathfinder-backend.onrender.com`

---

## Step 3 — Deploy Next.js Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**.
2. Import your GitHub repo.
3. Set the **Root Directory** to `frontend`.
4. Vercel auto-detects Next.js — no build changes needed.
5. Add **Environment Variables** in Vercel:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://pathfinder-backend.onrender.com` |

6. Click **Deploy**. Vercel URL:
   `https://pathfinder-frontend.vercel.app`

---

## Architecture Summary

```
User Browser
    │
    ▼
Vercel (Next.js) ──── /api/*  ──────► Render (Express.js) ──► Render (FastAPI)
    │                                       │                       │
    │                              JWT Auth & Store         TF-IDF Scoring
    │                              In-Memory Sessions       LangGraph Pipeline
    │                              Fallback Jaccard         (No ML model needed)
    ▼
Static Assets served by Vercel CDN
```

---

## Local Development

Run all three services in separate terminals:

```bash
# Terminal 1 — AI Service
cd ai-service
venv\Scripts\python.exe -m uvicorn main:app --port 8000 --reload

# Terminal 2 — Express Backend  
cd backend
npm run dev

# Terminal 3 — Next.js Frontend
cd frontend
npm run dev
```

Open: **http://localhost:3000**
