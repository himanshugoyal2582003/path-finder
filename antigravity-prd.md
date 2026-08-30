# PRD: Antigravity — AI Career PathFinder

**Round:** PathFinder Prototype (Round 2)
**Window:** 14 Aug – 31 Aug 2026, 11:59 pm IST
**Author:** Himanshu (Arin) Goyal
**Status:** Draft v1

---

## 1. Problem Statement

Students and early-career professionals struggle to translate a messy mix of skills, interests, and half-formed goals into a concrete career direction and a learning plan that actually gets them there. Existing tools (LinkedIn Learning paths, generic quizzes) are either static questionnaires with canned outputs, or course catalogs with no personalization logic behind them.

**Antigravity** is an AI-powered SaaS that takes a user's skills, interests, constraints (time, budget, current level) and goals, and produces a personalized, explainable career path + learning roadmap — recommended roles, skill gaps, and an ordered curriculum — refreshed as the user's profile changes.

---

## 2. Goals & Success Metrics

Judged on: **product thinking, AI/ML quality, UX, feasibility.** Scope every decision below against these four.

| Goal | Metric for demo day |
|---|---|
| Product thinking | Clear narrow persona + one sharp end-to-end flow, not a feature dump |
| AI/ML quality | Multi-agent reasoning is visible and explainable (not a single black-box GPT call) |
| UX | 3-click path from "tell us about yourself" to a visual roadmap |
| Feasibility | Fully working hosted demo, no mocked screens, reproducible from repo |

**Non-goal for this round:** payments, multi-tenant orgs, admin dashboards, mobile app. Skip anything that doesn't serve the demo narrative.

---

## 3. Target User (single persona for the demo)

**"Confused Sophomore/Junior"** — a college student (2nd–3rd year), like Arin's own peer group at GLA University: has some skills (a language, maybe one framework), vague interests (e.g. "I like building things" / "I like data"), and 1–2 target outcomes in mind (an internship, a role type) but no clear roadmap of *what to learn in what order*.

Pick this persona explicitly in the demo narration — judges respond better to one crisp story than "for everyone."

---

## 4. Core User Flow (MVP)

1. **Onboarding** — user enters: current skills (free text + tag picker), interests (multi-select + free text), goal (role/company type, or "not sure yet"), constraints (hours/week, timeline, budget: free/paid).
2. **AI Analysis** — multi-agent pipeline processes input (see §6).
3. **Results Dashboard**:
   - Top 2–3 recommended career paths, each with a **fit score** and a plain-language "why" explanation.
   - For the selected path: a **skill gap map** (have vs. need).
   - An **ordered learning roadmap** (phases, not just a course list) with estimated timeline.
4. **Chat refinement** — user can ask "what if I only have 5 hrs/week" or "I don't want to do DevOps" and the plan re-generates (this doubles as a live AI-quality demo moment).
5. **Save / export** — roadmap persists to their account; can be viewed again later.

---

## 5. Feature Scope (MoSCoW)

**Must have (demo depends on it)**
- Onboarding form → structured profile
- Multi-agent recommendation pipeline (career match + skill gap + roadmap generation)
- Results dashboard with fit scores + explanations
- Roadmap visualization (phased, not a flat list)
- One round of conversational refinement

**Should have**
- Auth (simple email or magic link) so profile persists
- Progress tracking (mark roadmap items done)
- Resource links per roadmap item (curated or fetched)

**Could have (if time remains after Must+Should)**
- Resume/LinkedIn import to pre-fill skills
- Comparison view between two career paths
- Shareable public roadmap link

**Won't have this round**
- Payments/subscriptions
- Admin/org accounts
- Native mobile app
- Real-time job market scraping (use a static/curated dataset instead — feasibility over completeness)

---

## 6. AI/ML Architecture — Multi-Agent Pipeline

Reuse the LangGraph `StateGraph` pattern from your stock-prediction project (Technical/Sentiment/Risk agents) — same shape, new domain. This is your strongest differentiator vs. teams doing one prompt-and-display.

```
                    ┌─────────────────────┐
   User Profile ──▶ │   Orchestrator      │
                    │   (LangGraph        │
                    │   StateGraph)       │
                    └─────────┬───────────┘
                              │
        ┌─────────────┬───────┴────────┬──────────────┐
        ▼             ▼                ▼              ▼
  Skill Extraction  Career Match   Gap Analysis   Roadmap Builder
     Agent            Agent          Agent            Agent
        │             │                │              │
        └─────────────┴───────┬────────┴──────────────┘
                              ▼
                     Aggregated AgentState
                              │
                              ▼
                     Explanation Agent
                    (turns scores into
                     plain-language "why")
                              │
                              ▼
                        API Response
```

**Agent responsibilities:**
- **Skill Extraction Agent** — normalizes free-text skills/interests into a structured taxonomy (e.g. map "I like building things" → `builder`, `hands-on`, `engineering-inclined`). Use embeddings + a small curated taxonomy rather than trying to boil the ocean.
- **Career Match Agent** — scores the user profile against a curated set of role archetypes (10–20 roles is plenty for a prototype: SDE, Data Analyst, Backend Engineer, PM-track, UI/UX, etc.) using a weighted similarity/rules hybrid — keep this explainable, not a pure black box.
- **Gap Analysis Agent** — diffs user's current skills against the target role's required skill set, ranked by importance.
- **Roadmap Builder Agent** — sequences the gap into phases (Foundation → Core → Applied → Portfolio) respecting the user's stated hours/week and timeline constraint.
- **Explanation Agent** — converts scores/gaps into a short natural-language rationale per recommendation (this is what makes it feel "smart" in the demo instead of just a score badge).

**Model choice:** one LLM (Gemini or GPT-family via API) for the reasoning/explanation agents; keep Career Match scoring rule/embedding-based so it's fast, cheap, and deterministic enough to explain live to judges without hallucination risk.

**Why multi-agent over single-prompt:** judges scoring "AI/ML quality" want to see decomposition and reasoning, not a single mega-prompt. Each agent's output should be visible in the UI (e.g. an expandable "how we got this" panel) — this is a cheap, high-impact UX win.

### 6.1 ML Model — Career Match via Embedding Similarity

Replace the hand-tuned weighted-rules scoring in the Career Match Agent with an actual pretrained ML model: **sentence-transformers embeddings + cosine similarity**. No training loop needed (uses a pretrained model), but it's a real model in the pipeline, not just an LLM API call — this is what turns "AI/ML quality" from a claim into something judges can see working.

- Embed the user's profile text (skills + interests + goal) with a sentence-transformer model (e.g. `all-MiniLM-L6-v2`).
- Embed each `RoleArchetype`'s required-skills/description text the same way (precomputed once, cached in Postgres as a vector column or a simple `pgvector` extension).
- Rank roles by cosine similarity → this *is* the fit score, and it's explainable: "your profile vector is closest to these role vectors" is a legitimate line to say to judges live.
- Gap Analysis Agent then diffs the user's extracted skill tags against the matched role's required-skill tags (set difference, not ML — deterministic and explainable).

### 6.2 Data Sourcing — Automated Ingestion Pipeline

Antigravity should **not** hand-key its role/skill dataset — it should pull and refresh it automatically from multiple sources, similar to the news-scraper pattern from your stock prediction project (Moneycontrol/ET via BeautifulSoup). This is its own pipeline stage, separate from the recommendation agents, and doubles as a strong "feasibility + real data" story for judges.

```
        ┌──────────────────────────────────────────┐
        │        Data Ingestion Pipeline            │
        │        (scheduled job, FastAPI/cron)      │
        └──────────────────────────────────────────┘
                │              │              │
                ▼              ▼              ▼
        O*NET Bulk API   Naukri/Indeed    Stack Overflow
        (occupation →    job postings     Developer Survey
        skill/task data)  (scraper)        (yearly CSV)
                │              │              │
                └──────────────┴──────────────┘
                              ▼
                   Normalize + Dedupe + Tag
                              ▼
                   RoleArchetype table (Postgres)
                   + precomputed embeddings
```

| Source | What it gives | Fetch method |
|---|---|---|
| **O*NET Online** (onetonline.org) | Structured occupation ↔ required skills/knowledge/tasks; free bulk download | One-time script pulls the O*NET bulk `.txt`/database files, parses into `RoleArchetype` rows on first setup |
| **Naukri / Indeed job postings** | Real, India-specific, current skill requirements per role | Scheduled scraper (reuse your BeautifulSoup pattern) — run daily/weekly, extract skill keywords from posting text, merge into existing role rows |
| **Stack Overflow Developer Survey** | Tech-role skill & salary benchmarks (public yearly CSV) | Downloaded once at setup, used to sanity-check/enrich tech role rows |
| **Kaggle Resume Dataset** (optional/stretch) | Real resume skill phrasing per job category, for validating the embedding similarity thresholds | Downloaded once via `kagglehub`/API, used offline for evaluation, not live in the app |

**Implementation approach for the prototype:**
- A single ingestion service/script (Python, alongside the FastAPI AI service) runs on deploy and on a schedule (e.g. daily cron via Render/Railway scheduled job) to pull O*NET + scrape postings.
- Each fetch step writes to a `raw_ingest` staging table first, then a normalization step (dedupe skill names, map synonyms — e.g. "JS" → "JavaScript") promotes clean rows into `RoleArchetype`.
- Embeddings are recomputed only for new/changed roles (cache by content hash) so re-ingestion is cheap.
- For demo day: pre-run the ingestion once before recording, so the live demo isn't dependent on live scraping succeeding — but keep the scheduled job wired and show the ingestion logs/last-run timestamp in the repo/README as proof it's real and automatic, not hardcoded.

---

## 7. Tech Stack

Matches your current specialization — no new tech to learn under time pressure.

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js + React + Tailwind | Dashboard, onboarding form, roadmap visualization |
| Main API | Express.js + PostgreSQL (Prisma) | Auth, user profiles, roadmap persistence, orchestration trigger |
| AI Service | FastAPI + LangGraph (Python) | Multi-agent pipeline — same pattern as your stock predictor |
| DB | PostgreSQL | Users, profiles, roles taxonomy, roadmaps, progress |
| Auth | JWT (reuse your existing pattern from FNUW/Marketplace) | Keep simple — email/password is enough |
| Hosting | Vercel (frontend) + Render/Railway (NestJS + FastAPI) | Free tiers sufficient for a prototype demo |
| LLM | Gemini API or OpenAI API | Whichever you already have keys/credits for |

This is deliberately the **same shape** as your stock-prediction system (FastAPI + LangGraph AI service talking to a separate main backend) — you already know this integration pattern, so implementation risk is low. Express.js also matches what you used on FNUW and Marketplace, so auth/JWT/role-based access code is largely reusable as-is.

---

## 8. Data Model (sketch)

```
User            (id, email, password_hash, created_at)
Profile         (id, user_id, skills[], interests[], goal_text, hours_per_week, timeline_months, budget_pref)
RoleArchetype   (id, name, required_skills[jsonb], description, embedding[vector], source, updated_at)
RawIngest       (id, source, raw_payload[jsonb], fetched_at, processed boolean)   -- staging table for pipeline
Recommendation  (id, profile_id, role_id, fit_score, explanation, created_at)
RoadmapPhase    (id, recommendation_id, phase_name, order, items[jsonb])
RoadmapItem     (id, phase_id, title, resource_url, est_hours, done boolean)
```

`RoleArchetype` is populated automatically by the ingestion pipeline (§6.2) rather than hand-keyed — `source` tracks whether a row came from O*NET, a scraped posting, or manual seed, and `embedding` stores the precomputed sentence-transformer vector used for Career Match scoring. This curated, auto-refreshed dataset *is* a large chunk of your "product thinking" and "feasibility" score, so it's worth getting the ingestion pipeline working early (Day 1–2), not treating it as filler.

---

## 9. UX Principles

- **3 clicks to first insight**: onboarding → loading (show agent steps animating, e.g. "Matching your profile… Analyzing gaps… Building your roadmap…") → results. The animated agent-step loader doubles as an AI-quality signal.
- **Explainability over dashboards**: every score/recommendation has a one-line "why," expandable to the agent reasoning trail.
- **Roadmap as a visual, not a list**: phased horizontal/vertical timeline (like a product roadmap), each phase collapsible.
- **Conversational refinement box** at the bottom of results — treat it as a lightweight chat, not a full chatbot UI.

---

## 10. 10-Day Build Plan (14–31 Aug, buffer built in)

| Days | Focus |
|---|---|
| 1–2 | DB schema + project scaffolding (Next.js, Express.js, FastAPI skeletons); build the data ingestion pipeline (O*NET pull + Naukri/Indeed scraper) and populate `RoleArchetype` automatically |
| 3–4 | Skill Extraction Agent + Career Match Agent using embedding similarity (sentence-transformers) over the ingested `RoleArchetype` data |
| 5–6 | Gap Analysis + Roadmap Builder + Explanation agents, wire full pipeline end-to-end |
| 7 | Express.js ↔ FastAPI integration, persistence, auth |
| 8 | Frontend: onboarding form + results dashboard + roadmap visualization |
| 9 | Conversational refinement, polish UX, seed more role data, fix rough edges |
| 10 (buffer, before 31 Aug) | Deploy, record walkthrough video, write README/demo write-up, final QA |

---

## 11. Deliverables Checklist

- [ ] Hosted demo URL (Vercel + Render/Railway)
- [ ] GitHub repo (clean README, setup instructions, architecture diagram)
- [ ] Demo video / write-up covering: problem framing, AI/ML approach (multi-agent pipeline), UX decisions, feasibility notes
- [ ] Seed data for 10–20 role archetypes documented in repo

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| LLM costs/rate limits during demo | Cache agent outputs per profile hash; use cheaper model for non-reasoning agents |
| Scope creep (adding job-market scraping, payments, etc.) | Hard-freeze scope to §5 Must/Should after Day 2 |
| Two-service architecture (Express.js + FastAPI) adds deploy complexity | Deploy FastAPI as a single Render/Railway service early (Day 1) to catch issues before it's a bottleneck |
| Explanations feel generic/GPT-boilerplate | Ground explanation agent prompts in the actual gap/score data (few-shot with real numbers), not open-ended generation |
| Live scraping (Naukri/Indeed) fails or gets blocked during demo | Pre-run ingestion before recording/demo day; scraper failure should degrade gracefully to O*NET-only data, never crash the app |

---

## 13. Stretch Goals (only if Must+Should finish early)

- Resume upload → auto-fill skills (parse via existing doc-handling patterns)
- Shareable public roadmap page
- Simple analytics: how many users complete onboarding vs. drop off
