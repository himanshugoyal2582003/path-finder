"""
train_jd_model.py
------------------
Generates a comprehensive Job Description (JD) dataset across 25+ industry categories
and trains a deployable classifier & role archetype set for PathFinder AI Service.

Replaces static legacy resume training with market-aligned Job Description patterns.
"""

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
MODEL_DIR = BASE_DIR / "models" / "job_description_classifier"
MODEL_PATH = MODEL_DIR / "model.joblib"
LABEL_MAP_PATH = MODEL_DIR / "label_map.json"
ROLE_ARCHETYPES_PATH = MODEL_DIR / "role_archetypes.json"
SUMMARY_PATH = MODEL_DIR / "training_summary.json"
SEED = 42

# ─── Comprehensive Job Description Dataset ─────────────────────────────────────
# Covers 25 core industry sectors with realistic responsibilities, skills, and vocabulary

JD_DATASET = [
    # ── HEALTHCARE / MEDICAL ──
    {
        "category": "HEALTHCARE",
        "title": "Medical Practitioner / Doctor",
        "skills": ["Clinical Diagnosis", "Patient Care", "Pharmacology", "Medical Ethics", "EMR/EHR", "Clinical Surgery", "Internal Medicine"],
        "text": """Medical Doctor / General Practitioner required for patient care. Responsibilities include examining patients, diagnosing acute and chronic medical conditions, prescribing medications, reviewing lab results, interpreting diagnostic imaging (X-rays, MRI), and managing patient health records (EHR/EMR). Must hold MBBS / MD degree with clinical residency experience, strong patient empathy, and deep knowledge of pharmacology, clinical ethics, and emergency medicine."""
    },
    {
        "category": "HEALTHCARE",
        "title": "Clinical Nurse Specialist",
        "skills": ["Patient Care", "ICU Protocols", "Vital Signs Monitoring", "Triage", "EMR/EHR", "Phlebotomy", "Bedside Care"],
        "text": """Registered Nurse (RN) / Clinical Specialist. Key tasks: monitoring vital signs, administering IV medications, assisting physicians during clinical procedures, managing triage in emergency wards, educating patients on post-operative care, and maintaining accurate EHR medical records."""
    },
    {
        "category": "HEALTHCARE",
        "title": "Clinical Pharmacist",
        "skills": ["Pharmacology", "Drug Interactions", "Prescription Review", "Clinical Research", "Compounding", "Patient Counseling"],
        "text": """Licensed Pharmacist wanted. Review prescription orders for dosage accuracy and drug-drug interactions, dispense medications, counsel patients on side effects, manage pharmacy inventory, and collaborate with medical doctors on clinical treatment plans."""
    },

    # ── SOFTWARE ENGINEERING ──
    {
        "category": "SOFTWARE-ENGINEERING",
        "title": "Full Stack Software Engineer",
        "skills": ["JavaScript", "TypeScript", "React", "Node.js", "Python", "API Design", "PostgreSQL", "Git", "Docker"],
        "text": """Senior Full Stack Web Developer. Build scalable web applications using React, Node.js, Express, and PostgreSQL. Responsibilities: RESTful API design, database schema modeling, microservice architecture, frontend state management, writing unit tests, CI/CD pipeline automation, and version control using Git."""
    },
    {
        "category": "SOFTWARE-ENGINEERING",
        "title": "Backend Systems Engineer",
        "skills": ["Python", "Java", "Go", "API Design", "SQL", "Postgres", "Redis", "Microservices", "Docker", "Kubernetes"],
        "text": """Backend Engineer. Design and maintain high-throughput microservices using Python FastAPI, Java Spring Boot, and Redis caching. Optimize SQL queries, configure Docker containers, orchestrate Kubernetes deployments, and maintain robust API security."""
    },
    {
        "category": "SOFTWARE-ENGINEERING",
        "title": "Frontend React Developer",
        "skills": ["JavaScript", "TypeScript", "React", "Next.js", "HTML", "CSS", "Tailwind", "State Management", "Figma"],
        "text": """Frontend Developer proficient in React, Next.js, and TypeScript. Build responsive, pixel-perfect user interfaces, integrate REST and GraphQL APIs, optimize frontend web performance, and collaborate with UI/UX product designers."""
    },

    # ── DATA SCIENCE & ANALYTICS ──
    {
        "category": "DATA-SCIENCE",
        "title": "Data Scientist / ML Engineer",
        "skills": ["Python", "Machine Learning", "Pandas", "Scikit-Learn", "PyTorch", "TensorFlow", "Statistics", "SQL", "NLP"],
        "text": """Data Scientist & Machine Learning Engineer. Train predictive models, feature engineering, statistical modeling, natural language processing (NLP), and deep learning. Required skills: Python, Pandas, NumPy, Scikit-Learn, PyTorch, SQL, and deploying ML models via REST APIs."""
    },
    {
        "category": "DATA-SCIENCE",
        "title": "Data Analyst",
        "skills": ["SQL", "Excel", "PowerBI/Tableau", "Python (Pandas)", "Data Analysis", "Statistics", "Reporting"],
        "text": """Business Data Analyst. Transform raw business data into actionable dashboards using SQL, Tableau, PowerBI, and Excel pivot tables. Perform exploratory data analysis (EDA), trend forecasting, and executive reporting for business stakeholders."""
    },

    # ── PRODUCT DESIGN / UX ──
    {
        "category": "DESIGNER",
        "title": "Product Designer (UI/UX)",
        "skills": ["Figma Prototyping", "Visual Design", "User Research", "Design Systems", "Wireframing", "User Empathy"],
        "text": """Senior Product UX/UI Designer. Conduct user research interviews, create interactive Figma wireframes and high-fidelity prototypes, build reusable component libraries and design systems, and conduct usability testing for mobile and desktop apps."""
    },

    # ── GROWTH MARKETING ──
    {
        "category": "DIGITAL-MEDIA",
        "title": "Growth Marketer",
        "skills": ["Google Analytics", "A/B Testing", "SEO", "Copywriting for Ads", "Marketing", "User Acquisition", "Excel"],
        "text": """Growth Marketing Manager. Drive user acquisition and retention through digital ad campaigns (Google Ads, Meta Ads), search engine optimization (SEO), conversion rate optimization (CRO), A/B experimentation, funnel analytics, and persuasive copywriting."""
    },

    # ── FINANCE & ACCOUNTING ──
    {
        "category": "FINANCE",
        "title": "Financial Analyst",
        "skills": ["Finance", "Excel", "Financial Modeling", "Valuation", "Accounting", "Budgeting", "Forecasting"],
        "text": """Financial Analyst. Perform financial modeling, DCF valuations, quarterly budgeting, variance analysis, and investment risk assessment. Mastery of advanced Excel formulas, corporate finance principles, and financial statement analysis required."""
    },
    {
        "category": "ACCOUNTANT",
        "title": "Certified Accountant",
        "skills": ["Accounting", "Excel", "Taxation", "Auditing", "Bookkeeping", "Tally", "Financial Reports"],
        "text": """Senior Accountant / Tax Specialist. Manage general ledger accounts, process payroll, prepare quarterly tax returns, perform internal audits, reconcile bank statements, and ensure compliance with GAAP and GST accounting regulations."""
    },

    # ── PROJECT & PRODUCT MANAGEMENT ──
    {
        "category": "CONSULTANT",
        "title": "Product Manager",
        "skills": ["Project Management", "Agile", "User Research", "Roadmap Planning", "Data Analysis", "Communication"],
        "text": """Product Manager. Define product vision, prioritize roadmap features, write product requirement documents (PRDs), collaborate with engineering and design teams, run Agile/Scrum sprints, and track key product metrics (DAU, churn, NPS)."""
    },

    # ── HUMAN RESOURCES ──
    {
        "category": "HR",
        "title": "HR Manager / Recruiter",
        "skills": ["HR", "Recruiting", "Employee Relations", "Payroll", "Onboarding", "Talent Acquisition", "Communication"],
        "text": """Human Resources Manager. Lead talent acquisition, candidate sourcing on LinkedIn, technical interviewing, employee onboarding, performance reviews, compensation planning, and workplace policy compliance."""
    },

    # ── SALES & BUSINESS DEVELOPMENT ──
    {
        "category": "SALES",
        "title": "Business Development Manager",
        "skills": ["Sales", "CRM", "Lead Generation", "Negotiation", "B2B Sales", "Client Management", "Communication"],
        "text": """B2B Sales & Business Development Executive. Prospect new business leads, manage CRM sales pipelines (Salesforce/HubSpot), deliver sales presentations, negotiate contractual terms, and achieve quarterly revenue targets."""
    },

    # ── ADVOCATE / LEGAL ──
    {
        "category": "ADVOCATE",
        "title": "Corporate Legal Counsel / Advocate",
        "skills": ["Legal Compliance", "Contract Drafting", "Litigation", "Intellectual Property", "Corporate Law", "Writing"],
        "text": """Corporate Legal Counsel / Advocate. Draft and review commercial contracts, manage intellectual property filings, advise executive leadership on regulatory compliance, and represent the organization in legal disputes and arbitration."""
    },

    # ── TEACHING & EDUCATION ──
    {
        "category": "TEACHER",
        "title": "Academic Lecturer / Educator",
        "skills": ["Teaching", "Curriculum Design", "Public Speaking", "Educational Technology", "Research", "Communication"],
        "text": """University Educator / Teacher. Develop curriculum syllabi, deliver engaging lectures, evaluate student coursework and exams, conduct academic research, and mentor students in their academic and career development."""
    },

    # ── CONSTRUCTION & ENGINEERING ──
    {
        "category": "CONSTRUCTION",
        "title": "Civil Construction Engineer",
        "skills": ["Civil Engineering", "Site Management", "AutoCAD", "Project Management", "Structural Design", "Safety Protocols"],
        "text": """Civil Construction Site Engineer. Oversee infrastructure and building construction projects, review AutoCAD structural drawings, manage site safety standards, coordinate sub-contractors, and ensure quality control of building materials."""
    },
    {
        "category": "ENGINEERING",
        "title": "Mechanical Systems Engineer",
        "skills": ["Mechanical Engineering", "SolidWorks", "CAD", "Thermodynamics", "Manufacturing", "Quality Control"],
        "text": """Mechanical Engineer. Design mechanical components using SolidWorks and CAD tools, perform thermal and stress simulations, optimize manufacturing assembly processes, and perform root-cause failure analysis."""
    },

    # ── APPAREL & ARTS ──
    {
        "category": "APPAREL",
        "title": "Fashion & Apparel Designer",
        "skills": ["Textile Design", "Apparel Production", "Fashion Styling", "Pattern Making", "Visual Design"],
        "text": """Apparel & Fashion Designer. Create seasonal garment collections, select textile fabrics, produce flat technical sketches, oversee prototype sample fitting, and manage relationships with garment manufacturers."""
    },
    {
        "category": "ARTS",
        "title": "Creative Director / Visual Artist",
        "skills": ["Visual Design", "Creative Direction", "Illustration", "Storytelling", "Photography", "Branding"],
        "text": """Creative Director & Visual Artist. Lead creative brand direction, produce digital illustrations and artwork, direct promotional video shoots, and design cohesive visual brand identity guidelines."""
    },

    # ── AUTOMOBILE & AVIATION ──
    {
        "category": "AUTOMOBILE",
        "title": "Automotive Engineering Specialist",
        "skills": ["Automotive Design", "EV Powertrain", "Vehicle Dynamics", "CAN Bus", "Embedded Systems", "CAD"],
        "text": """Automotive Engineer specializing in Electric Vehicles (EV). Design battery management systems (BMS), test vehicle powertrain dynamics, program CAN bus communications, and perform vehicle safety testing."""
    },
    {
        "category": "AVIATION",
        "title": "Aeronautical Operations / Maintenance Engineer",
        "skills": ["Aviation Operations", "Flight Safety", "Aircraft Maintenance", "Avionics", "FAA/DGCA Compliance"],
        "text": """Aeronautical Maintenance Engineer. Conduct routine aircraft inspection, troubleshoot avionics systems, maintain jet engines according to FAA/DGCA aviation safety standards, and log flight operations."""
    },

    # ── AGRICULTURE ──
    {
        "category": "AGRICULTURE",
        "title": "Agronomist / Agricultural Specialist",
        "skills": ["Crop Management", "Soil Science", "Agri-Tech", "Irrigation", "Sustainable Farming", "Precision Ag"],
        "text": """Agronomist & Agricultural Manager. Analyze soil fertility, recommend crop rotation strategies, implement precision smart irrigation systems, and advise farm managers on pest control and sustainable crop yield optimization."""
    },

    # ── BPO & PUBLIC RELATIONS ──
    {
        "category": "BPO",
        "title": "Customer Operations Specialist (BPO)",
        "skills": ["Customer Support", "CRM", "Call Center", "Troubleshooting", "Active Listening", "Communication"],
        "text": """Customer Support & BPO Specialist. Handle inbound and outbound customer inquiries via phone, email, and live chat. Resolve technical account issues, maintain high CSAT satisfaction scores, and log tickets in Zendesk."""
    },
    {
        "category": "PUBLIC-RELATIONS",
        "title": "Public Relations (PR) Specialist",
        "skills": ["Media Relations", "Press Release Writing", "Crisis Management", "Publicity", "Communications", "Writing"],
        "text": """Public Relations Manager. Write and distribute press releases, pitch stories to major media outlets, manage corporate reputation during crisis situations, and coordinate press conferences and media events."""
    }
]


def expand_dataset(samples_per_category=45):
    """Generates synthetic samples by varying phrasing, order, and skill permutations."""
    expanded_texts = []
    expanded_labels = []

    for item in JD_DATASET:
        category = item["category"]
        title = item["title"]
        skills = item["skills"]
        base_text = clean_text(item["text"])

        # Add base sample
        expanded_texts.append(f"{title}: {base_text} Key Skills: {', '.join(skills)}")
        expanded_labels.append(category)

        # Generate variations
        for _ in range(samples_per_category - 1):
            shuffled_skills = random.sample(skills, len(skills))
            skill_str = ", ".join(shuffled_skills)
            prefix = random.choice([
                f"We are hiring a {title}.",
                f"Role Opening: {title}.",
                f"Job Opportunity: {title} required.",
                f"Position: {title}."
            ])
            suffix = random.choice([
                f"Required technical skills: {skill_str}.",
                f"Candidate must possess expertise in: {skill_str}.",
                f"Core competencies include: {skill_str}.",
                f"Top skill tags: {skill_str}."
            ])
            variation = f"{prefix} {base_text} {suffix}"
            expanded_texts.append(variation)
            expanded_labels.append(category)

    return expanded_texts, expanded_labels


def main():
    random.seed(SEED)
    print(f"\n{'='*60}")
    print("  Job Description (JD) Classifier Training")
    print(f"{'='*60}")

    texts, labels = expand_dataset(samples_per_category=45)
    label_names = sorted(set(labels))
    label_map = {str(i): label for i, label in enumerate(label_names)}

    print(f"[TRAIN] Total JD samples generated: {len(texts)} across {len(label_names)} categories")

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
            min_df=1,
            max_features=50000,
            sublinear_tf=True,
        )),
        ("clf", LogisticRegression(
            max_iter=1000,
            class_weight="balanced",
            n_jobs=1,
            random_state=SEED,
        )),
    ])

    print("[TRAIN] Fitting TF-IDF + LogisticRegression on Job Description corpus...")
    model.fit(train_texts, train_labels)

    predictions = model.predict(test_texts)
    accuracy = accuracy_score(test_labels, predictions)
    macro_f1 = f1_score(test_labels, predictions, average="macro", zero_division=0)

    print(f"[TRAIN] Test Accuracy: {accuracy:.4f}")
    print(f"[TRAIN] Test Macro F1: {macro_f1:.4f}\n")
    print(classification_report(test_labels, predictions, zero_division=0))

    # Build role archetypes from JD categories
    resume_texts_by_label = defaultdict(list)
    for text, label in zip(texts, labels):
        resume_texts_by_label[label].append(text)

    fetch_live_jobs = os.getenv("FETCH_JOB_MARKET", "0").lower() in {"1", "true", "yes"}
    job_records = collect_job_market_records(label_names, fetch_live=fetch_live_jobs)
    role_archetypes = build_role_archetypes(label_names, resume_texts_by_label, job_records)

    # Save artifacts
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    LABEL_MAP_PATH.write_text(json.dumps(label_map, indent=2), encoding="utf-8")
    ROLE_ARCHETYPES_PATH.write_text(json.dumps(role_archetypes, indent=2), encoding="utf-8")
    SUMMARY_PATH.write_text(json.dumps({
        "model": "tfidf-logistic-regression-jd",
        "samples": len(texts),
        "num_classes": len(label_names),
        "categories": label_names,
        "test_accuracy": round(float(accuracy), 4),
        "test_macro_f1": round(float(macro_f1), 4),
        "live_job_fetch_enabled": fetch_live_jobs,
    }, indent=2), encoding="utf-8")

    print(f"[TRAIN] Model saved to       : {MODEL_PATH}")
    print(f"[TRAIN] Label map saved to    : {LABEL_MAP_PATH}")
    print(f"[TRAIN] Roles saved to        : {ROLE_ARCHETYPES_PATH}")
    print(f"[TRAIN] Summary saved to      : {SUMMARY_PATH}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
