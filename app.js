// PathFinder Application State and Logic

// 1. Data Definitions for Mock Career Paths
const CAREER_PATHS_DATA = {
  "product-designer": {
    id: "product-designer",
    name: "Product Designer",
    summary: "Focuses on visual communication, prototyping, user research, and crafting digital interfaces that align user needs with business goals.",
    fitEstimate: "Strong Match",
    fitClass: "badge-strong",
    fitScore: 92,
    baseScore: 92,
    whyFits: "This path leverages your strengths in Visual Design and User Empathy, and aligns with your creative goals and remote work preference.",
    tradeoffs: [
      "<strong>Pros:</strong> High creative autonomy, remote-friendly, strong design-led product cultures pay premium rates.",
      "<strong>Cons:</strong> Requires self-directed portfolio building; subjective feedback rounds can be mentally draining."
    ],
    overlapSkills: ["Visual Design", "Writing", "User Empathy"],
    gapSkills: ["Figma Prototyping", "User Research", "Design Systems"],
    weights: { speed: 3, income: 4, creativity: 5, stability: 4, flexibility: 5 },
    phases: [
      {
        name: "Phase 1: Foundation",
        hoursEst: "8 hours total",
        nodes: [
          { x: 15, y: 50, label: "Design Basics", icon: "🎨", details: "Learn typography, grids, layout hierarchies and color theory foundations." },
          { x: 22, y: 35, label: "Figma Setup", icon: "🛠️", details: "Install Figma, learn keyboard shortcuts, frames, and layers." }
        ],
        actions: [
          { id: "pd-p1-a1", label: "Read 'Refactoring UI' chapters on layout & typography", source: "Refactoring UI", duration: "3 hrs" },
          { id: "pd-p1-a2", label: "Complete Figma onboarding playground tutorial", source: "Figma.com", duration: "2 hrs" },
          { id: "pd-p1-a3", label: "Create a typography scale for a personal website project", source: "Self-study", duration: "3 hrs" }
        ]
      },
      {
        name: "Phase 2: Core Skills",
        hoursEst: "15 hours total",
        nodes: [
          { x: 40, y: 30, label: "UX Prototyping", icon: "📱", details: "Create interactive user flows, transitions, and component variants." },
          { x: 48, y: 55, label: "User Research", icon: "👥", details: "Conduct mock user interviews, synthesize feedback into affinity maps." }
        ],
        actions: [
          { id: "pd-p2-a1", label: "Build a high-fidelity interactive mobile prototype in Figma", source: "Design Course", duration: "6 hrs" },
          { id: "pd-p2-a2", label: "Draft a research plan with 5 user questions for a food app", source: "Medium UX", duration: "4 hrs" },
          { id: "pd-p2-a3", label: "Synthesize findings into a simple Persona PDF template", source: "Figma Template", duration: "5 hrs" }
        ]
      },
      {
        name: "Phase 3: Applied Practice",
        hoursEst: "20 hours total",
        nodes: [
          { x: 65, y: 70, label: "Design Systems", icon: "⚙️", details: "Construct reusable master components with autolayout and token colors." },
          { x: 72, y: 45, label: "Mock Project", icon: "💼", details: "Design a complete end-to-end checkout flow resolving standard cart friction." }
        ],
        actions: [
          { id: "pd-p3-a1", label: "Set up a component library with 10 button states using Auto-Layout", source: "YouTube Guide", duration: "6 hrs" },
          { id: "pd-p3-a2", label: "Design 3 responsive screens for a checkout landing page", source: "Portfolio Build", duration: "8 hrs" },
          { id: "pd-p3-a3", label: "Perform a cognitive walkthrough evaluation on your own design", source: "Self-audit", duration: "6 hrs" }
        ]
      },
      {
        name: "Phase 4: Portfolio Prep",
        hoursEst: "18 hours total",
        nodes: [
          { x: 88, y: 45, label: "Case Study Writing", icon: "✍️", details: "Write problem statements, user metrics, and design iterations clearly." },
          { x: 94, y: 65, label: "Portfolio Build", icon: "🚀", details: "Deploy a clean website showcasing your two best UX/UI case studies." }
        ],
        actions: [
          { id: "pd-p4-a1", label: "Write a 800-word case study focusing on trade-offs & decisions", source: "Substack Design", duration: "6 hrs" },
          { id: "pd-p4-a2", label: "Build and deploy a portfolio site on Framer or Notion", source: "Framer.com", duration: "8 hrs" },
          { id: "pd-p4-a3", label: "Optimize site metadata and request feedback from 2 peers", source: "LinkedIn Network", duration: "4 hrs" }
        ]
      }
    ]
  },

  "data-analyst": {
    id: "data-analyst",
    name: "Data Analyst",
    summary: "Deciphers raw numerical inputs to build diagnostic dashboards and explain trends to operational business leaders.",
    fitEstimate: "Promising Match",
    fitClass: "badge-promising",
    fitScore: 84,
    baseScore: 84,
    whyFits: "Strong match for your analytical tendencies, Excel exposure, and structured communication skills.",
    tradeoffs: [
      "<strong>Pros:</strong> High starting salaries, direct business impact visible, clear objective success criteria.",
      "<strong>Cons:</strong> Repetitive data cleaning tasks; requires strong stakeholder management skills."
    ],
    overlapSkills: ["Writing", "SQL", "Excel"],
    gapSkills: ["Python (Pandas)", "PowerBI/Tableau", "Statistical Modeling"],
    weights: { speed: 4, income: 4, creativity: 3, stability: 5, flexibility: 4 },
    phases: [
      {
        name: "Phase 1: SQL Foundations",
        hoursEst: "10 hours total",
        nodes: [
          { x: 15, y: 50, label: "SQL Queries", icon: "🔍", details: "Learn SELECT, WHERE, JOIN, and basic SQL aggregations." },
          { x: 22, y: 35, label: "DB Schemas", icon: "🗄️", details: "Understand relational databases, primary keys, and table links." }
        ],
        actions: [
          { id: "da-p1-a1", label: "Complete SQL ZOO interactive database tutorials", source: "SQLZoo", duration: "4 hrs" },
          { id: "da-p1-a2", label: "Solve 10 medium queries on HackerRank platform", source: "HackerRank", duration: "3 hrs" },
          { id: "da-p1-a3", label: "Diagram a relational model for a school enrollment database", source: "Draw.io", duration: "3 hrs" }
        ]
      },
      {
        name: "Phase 2: BI Dashboards",
        hoursEst: "12 hours total",
        nodes: [
          { x: 40, y: 30, label: "Tableau Setup", icon: "📊", details: "Install Tableau, connect datasets, and construct bar/line charts." },
          { x: 48, y: 55, label: "Storytelling", icon: "📈", details: "Synthesize dashboard outputs into clear executive summaries." }
        ],
        actions: [
          { id: "da-p2-a1", label: "Connect Tableau to a public dataset and build 3 worksheets", source: "Tableau Public", duration: "5 hrs" },
          { id: "da-p2-a2", label: "Design a dashboard layout on paper before implementation", source: "Self-study", duration: "2 hrs" },
          { id: "da-p2-a3", label: "Write a bulleted executive summary of a sales trend analysis", source: "Writing Lab", duration: "5 hrs" }
        ]
      },
      {
        name: "Phase 3: Python Prep",
        hoursEst: "16 hours total",
        nodes: [
          { x: 65, y: 70, label: "Pandas Intro", icon: "🐍", details: "Learn Jupyter Notebooks, importing pandas, and cleaning missing data." },
          { x: 72, y: 45, label: "Data Cleaning", icon: "🧹", details: "Handle duplicates, convert column datatypes, and filter datasets." }
        ],
        actions: [
          { id: "da-p3-a1", label: "Write a Python script to import a dirty CSV and filter nulls", source: "Jupyter Notebook", duration: "6 hrs" },
          { id: "da-p3-a2", label: "Merge two dataframes on an ID key and recalculate metrics", source: "Pandas Course", duration: "5 hrs" },
          { id: "da-p3-a3", label: "Export cleaned data back to SQLite and verify schemas", source: "Python CLI", duration: "5 hrs" }
        ]
      },
      {
        name: "Phase 4: Capstone Project",
        hoursEst: "14 hours total",
        nodes: [
          { x: 88, y: 45, label: "Dataset Analysis", icon: "🔬", details: "Perform a full exploratory data analysis (EDA) project on Kaggle." },
          { x: 94, y: 65, label: "GitHub Upload", icon: "🐙", details: "Write a README summarizing your business insights and code flow." }
        ],
        actions: [
          { id: "da-p4-a1", label: "Select a Kaggle dataset and execute 5 analytical queries", source: "Kaggle", duration: "6 hrs" },
          { id: "da-p4-a2", label: "Write a detailed README describing the business problem solved", source: "GitHub Repo", duration: "5 hrs" },
          { id: "da-p4-a3", label: "Record a 3-minute video presentation explaining your dashboard", source: "Loom", duration: "3 hrs" }
        ]
      }
    ]
  },

  "growth-marketer": {
    id: "growth-marketer",
    name: "Growth Marketer",
    summary: "Aligns copywriting, A/B testing, analytical reporting, and digital marketing channels to build scalable acquisition loops.",
    fitEstimate: "Exploratory Match",
    fitClass: "badge-exploratory",
    fitScore: 78,
    baseScore: 78,
    whyFits: "Good path if you want to combine copywriting, quick experimentation, and high business strategy.",
    tradeoffs: [
      "<strong>Pros:</strong> Highly dynamic, directly linked to revenue, low barrier to entry for switchers.",
      "<strong>Cons:</strong> High pressure on performance metrics; digital ad channels change rules rapidly."
    ],
    overlapSkills: ["Writing", "Excel", "User Empathy"],
    gapSkills: ["Google Analytics", "A/B Testing", "Copywriting for Ads"],
    weights: { speed: 5, income: 3, creativity: 4, stability: 3, flexibility: 5 },
    phases: [
      {
        name: "Phase 1: Marketing Funnels",
        hoursEst: "8 hours total",
        nodes: [
          { x: 15, y: 50, label: "Funnel Metrics", icon: "🌪️", details: "Understand AARRR framework (Acquisition, Activation, Retention)." },
          { x: 22, y: 35, label: "Copywriting", icon: "✍️", details: "Write high-converting headlines and landing page copy." }
        ],
        actions: [
          { id: "gm-p1-a1", label: "Map a user funnel journey from initial ad click to checkout", source: "HubSpot", duration: "3 hrs" },
          { id: "gm-p1-a2", label: "Draft 3 variations of landing page hero copy targeting freelancers", source: "Copywriting Lab", duration: "3 hrs" },
          { id: "gm-p1-a3", label: "Read 'Copywriting Secrets' key chapters", source: "Kindle", duration: "2 hrs" }
        ]
      },
      {
        name: "Phase 2: Analytics Setup",
        hoursEst: "12 hours total",
        nodes: [
          { x: 40, y: 30, label: "GA4 Config", icon: "📊", details: "Install Google Analytics, track custom events, set up conversions." },
          { x: 48, y: 55, label: "A/B Test Design", icon: "🧪", details: "Define hypothesis, select variables, calculate statistical significance." }
        ],
        actions: [
          { id: "gm-p2-a1", label: "Configure custom event tracking in Google Analytics sandbox", source: "Google Skillshop", duration: "5 hrs" },
          { id: "gm-p2-a2", label: "Draft an A/B test plan with a sample size calculator", source: "Optimizely Tool", duration: "4 hrs" },
          { id: "gm-p2-a3", label: "Analyze a historical cohort chart to identify dropoff weeks", source: "Excel study", duration: "3 hrs" }
        ]
      },
      {
        name: "Phase 3: Acquisition Loops",
        hoursEst: "14 hours total",
        nodes: [
          { x: 65, y: 70, label: "Paid Search/Ads", icon: "🎯", details: "Set up Facebook/Google Ad campaign structures and budgets." },
          { x: 72, y: 45, label: "SEO Audits", icon: "🔍", details: "Perform keyword research, optimize meta titles/descriptions." }
        ],
        actions: [
          { id: "gm-p3-a1", label: "Draft a search engine marketing (SEM) campaign budget", source: "Google Ads Sandbox", duration: "5 hrs" },
          { id: "gm-p3-a2", label: "Run a site audit on a local service website for SEO flaws", source: "Screaming Frog", duration: "5 hrs" },
          { id: "gm-p3-a3", label: "Create a content outline targeting 3 core high-value keywords", source: "Semrush", duration: "4 hrs" }
        ]
      },
      {
        name: "Phase 4: Launch Campaign",
        hoursEst: "10 hours total",
        nodes: [
          { x: 88, y: 45, label: "Live Launch", icon: "🚀", details: "Build and drive organic/paid traffic to a landing page." },
          { x: 94, y: 65, label: "Reporting", icon: "📑", details: "Compile performance metrics, customer cost (CAC) and value (LTV)." }
        ],
        actions: [
          { id: "gm-p4-a1", label: "Deploy a free landing page on Carrd with signup form", source: "Carrd.co", duration: "4 hrs" },
          { id: "gm-p4-a2", label: "Write a LinkedIn post driving initial organic traffic", source: "LinkedIn", duration: "2 hrs" },
          { id: "gm-p4-a3", label: "Build a Google Sheets report tracking CAC, CTR, and signups", source: "Google Sheets", duration: "4 hrs" }
        ]
      }
    ]
  }
};

// 2. Global State Variable
let appState = {
  currentView: "landing",
  intakeStep: 1,
  // Form input answers
  roleInput: "",
  experienceLevel: "student",
  locationPreference: "remote",
  selectedInterests: [],
  skillsList: ["HTML/CSS", "Excel"], // Pre-populated defaults
  weeklyHours: 10,
  learningMode: "self-paced",
  careerGoal: "",

  // Dashboard state
  activePathId: "product-designer",
  activePhaseIndex: 0,
  savedPaths: {}, // pathId -> boolean
  completedActions: {}, // actionId -> boolean

  // Priority Weights (defaults)
  weights: { speed: 3, income: 4, creativity: 4, stability: 3, flexibility: 5 }
};

// 3. Initialization on DOM Load
document.addEventListener("DOMContentLoaded", () => {
  setupNavigationHandlers();
  setupIntakeFormHandlers();
  setupCheckpointReviewHandlers();
  setupDashboardHandlers();
  setupCompareModalHandlers();
  setupChatWidget();
  
  // Set initial screen state
  switchView("landing");
});

// 4. View Switching Helper
function switchView(viewName) {
  appState.currentView = viewName;
  
  // Hide all sections
  document.querySelectorAll(".view-section").forEach(sec => {
    sec.classList.remove("active");
    sec.style.display = "none";
  });
  
  // Show target section
  const targetSec = document.getElementById(`view-${viewName}`);
  if (targetSec) {
    targetSec.style.display = "flex";
    // Trigger layout paint before opacity
    setTimeout(() => {
      targetSec.classList.add("active");
    }, 20);
  }
  
  // Perform view-specific initializations
  if (viewName === "profile-review") {
    renderCheckpointReview();
  } else if (viewName === "dashboard") {
    renderDashboard();
  }
}

// 5. Navigation Handlers (Landing Screen, logo links etc)
function setupNavigationHandlers() {
  // Start Intake flow buttons
  document.querySelectorAll(".start-intake-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      resetIntakeForm();
      switchView("intake");
    });
  });

  // Exit Intake flow
  document.querySelectorAll(".exit-intake-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (confirm("Are you sure you want to exit? Your progress will be lost.")) {
        switchView("landing");
      }
    });
  });

  // Example path shortcut
  const seeExampleBtn = document.getElementById("btn-see-example");
  if (seeExampleBtn) {
    seeExampleBtn.addEventListener("click", () => {
      loadExampleData();
      triggerLoadingAnimation(() => {
        switchView("profile-review");
      });
    });
  }

  const landingNavExample = document.getElementById("btn-example-landing-nav");
  if (landingNavExample) {
    landingNavExample.addEventListener("click", (e) => {
      e.preventDefault();
      loadExampleData();
      triggerLoadingAnimation(() => {
        switchView("profile-review");
      });
    });
  }
}

// Loads prefilled sample data to view paths immediately
function loadExampleData() {
  appState.roleInput = "Information Tech Student";
  appState.experienceLevel = "student";
  appState.locationPreference = "remote";
  appState.selectedInterests = ["visual-design", "problem-solving", "user-empathy"];
  appState.skillsList = ["HTML/CSS", "Excel", "Figma", "Writing"];
  appState.weeklyHours = 12;
  appState.learningMode = "self-paced";
  appState.careerGoal = "Work as a remote Designer in tech";
}

// 6. Onboarding Form Logic (Stage 1-4)
function setupIntakeFormHandlers() {
  const prevBtn = document.getElementById("btn-intake-prev");
  const nextBtn = document.getElementById("btn-intake-next");
  const hoursSlider = document.getElementById("range-hours");
  const hoursDisplay = document.getElementById("hours-display-val");

  // Multi-select Interest Cards
  document.querySelectorAll(".interest-chip-card").forEach(card => {
    card.addEventListener("click", () => {
      const interest = card.getAttribute("data-interest");
      if (appState.selectedInterests.includes(interest)) {
        appState.selectedInterests = appState.selectedInterests.filter(i => i !== interest);
        card.classList.remove("selected");
      } else {
        appState.selectedInterests.push(interest);
        card.classList.add("selected");
      }
    });
  });

  // Skill Tags Adding
  const skillInput = document.getElementById("input-skills");
  if (skillInput) {
    skillInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        const skill = skillInput.value.trim().replace(/,/g, "");
        if (skill && !appState.skillsList.includes(skill)) {
          addSkillTag(skill);
          skillInput.value = "";
        }
      }
    });
  }

  // Suggestion Skill Chips click
  document.querySelectorAll(".btn-suggest-skill").forEach(btn => {
    btn.addEventListener("click", () => {
      const skill = btn.textContent;
      if (!appState.skillsList.includes(skill)) {
        addSkillTag(skill);
      }
    });
  });

  // Availability Slider
  if (hoursSlider && hoursDisplay) {
    hoursSlider.addEventListener("input", (e) => {
      const hrs = e.target.value;
      appState.weeklyHours = parseInt(hrs);
      hoursDisplay.textContent = `${hrs} hrs/week`;
    });
  }

  // Next Step Action
  nextBtn.addEventListener("click", () => {
    if (appState.intakeStep < 4) {
      if (validateCurrentStep()) {
        appState.intakeStep++;
        updateIntakeStepView();
      }
    } else {
      // Stage 4 submit
      saveIntakeFormAnswers();
      triggerLoadingAnimation(() => {
        switchView("profile-review");
      });
    }
  });

  // Prev Step Action
  prevBtn.addEventListener("click", () => {
    if (appState.intakeStep > 1) {
      appState.intakeStep--;
      updateIntakeStepView();
    }
  });
}

function resetIntakeForm() {
  appState.intakeStep = 1;
  appState.selectedInterests = [];
  appState.skillsList = ["HTML/CSS", "Excel"];
  appState.weeklyHours = 10;
  
  // Clear HTML states
  document.getElementById("input-role").value = "";
  document.getElementById("input-career-goal").value = "";
  document.querySelectorAll(".interest-chip-card").forEach(c => c.classList.remove("selected"));
  document.getElementById("skills-tags-list").innerHTML = "";
  
  // Reload starting skills tags
  appState.skillsList.forEach(s => renderSkillTagHtml(s));
  
  updateIntakeStepView();
}

function addSkillTag(skill) {
  appState.skillsList.push(skill);
  renderSkillTagHtml(skill);
}

function renderSkillTagHtml(skill) {
  const list = document.getElementById("skills-tags-list");
  if (!list) return;
  
  const tag = document.createElement("div");
  tag.className = "skill-tag";
  tag.innerHTML = `
    <span>${skill}</span>
    <span class="skill-tag-remove" data-skill="${skill}">&times;</span>
  `;
  
  tag.querySelector(".skill-tag-remove").addEventListener("click", (e) => {
    const sName = e.target.getAttribute("data-skill");
    appState.skillsList = appState.skillsList.filter(s => s !== sName);
    tag.remove();
  });
  
  list.appendChild(tag);
}

function validateCurrentStep() {
  if (appState.intakeStep === 1) {
    const roleVal = document.getElementById("input-role").value.trim();
    if (!roleVal) {
      alert("Please specify your current status / role.");
      return false;
    }
  } else if (appState.intakeStep === 2) {
    if (appState.selectedInterests.length < 2) {
      alert("Please select at least 2 interests to help shape recommendations.");
      return false;
    }
  }
  return true;
}

function updateIntakeStepView() {
  // Toggle forms active step
  document.querySelectorAll(".intake-step").forEach(step => {
    step.classList.remove("active");
  });
  const currentStepEl = document.querySelector(`.intake-step[data-step="${appState.intakeStep}"]`);
  if (currentStepEl) currentStepEl.classList.add("active");

  // Indicator
  document.getElementById("step-number-label").textContent = `Stage ${appState.intakeStep} of 4`;
  document.getElementById("intake-progress-indicator").style.width = `${appState.intakeStep * 25}%`;

  // Buttons state
  const prevBtn = document.getElementById("btn-intake-prev");
  const nextBtn = document.getElementById("btn-intake-next");
  
  prevBtn.disabled = appState.intakeStep === 1;
  nextBtn.textContent = appState.intakeStep === 4 ? "Build Path" : "Next";
}

function saveIntakeFormAnswers() {
  appState.roleInput = document.getElementById("input-role").value.trim();
  appState.experienceLevel = document.querySelector('input[name="experience-level"]:checked').value;
  appState.locationPreference = document.getElementById("input-location").value;
  appState.learningMode = document.getElementById("select-learning").value;
  appState.careerGoal = document.getElementById("input-career-goal").value.trim() || "Land a job matching my skills";
}

// 7. Simulating Multi-Agent pipeline
function triggerLoadingAnimation(callback) {
  switchView("loading-pipeline");
  
  const pipelineSteps = [
    { title: "Extracting profile skills...", desc: "Reading onboarding forms and mapping vocabulary", dot: 1 },
    { title: "Finding career paths...", desc: "Running similarity matches on O*NET role archetypes", dot: 2 },
    { title: "Running skill gap analysis...", desc: "Identifying delta in tool experience levels", dot: 3 },
    { title: "Building learning roadmaps...", desc: "Structuring week-by-week phases and resources", dot: 4 },
    { title: "Synthesizing explanations...", desc: "Compiling trade-offs, pros/cons, and fit criteria", dot: 5 }
  ];

  let currentIdx = 0;
  
  const interval = setInterval(() => {
    if (currentIdx >= pipelineSteps.length) {
      clearInterval(interval);
      if (callback) callback();
      return;
    }

    // Update Text
    document.getElementById("pipeline-loading-title").textContent = pipelineSteps[currentIdx].title;
    document.getElementById("pipeline-loading-desc").textContent = pipelineSteps[currentIdx].desc;
    
    // Update Dots
    document.querySelectorAll(".pipeline-step-dot").forEach(d => d.classList.remove("active"));
    const activeDot = document.getElementById(`dot-step-${pipelineSteps[currentIdx].dot}`);
    if (activeDot) activeDot.classList.add("active");
    
    currentIdx++;
  }, 1000);
}

// 8. Trust Checkpoint review
function setupCheckpointReviewHandlers() {
  document.getElementById("btn-add-skill-review").addEventListener("click", () => {
    const sName = prompt("Enter skill name:");
    if (sName) {
      if (!appState.skillsList.includes(sName)) {
        appState.skillsList.push(sName);
        renderCheckpointReview();
      }
    }
  });

  document.getElementById("btn-generate-roadmaps").addEventListener("click", () => {
    switchView("dashboard");
  });
}

function renderCheckpointReview() {
  const container = document.getElementById("review-skills-sliders-container");
  if (!container) return;
  container.innerHTML = "";

  // Render a detailed list of skills with confidence sliders
  appState.skillsList.forEach((skill, idx) => {
    // Arbitrary default confidence score to start with
    const defaultVals = [70, 45, 90, 60, 50];
    const initialVal = defaultVals[idx % defaultVals.length];
    
    const item = document.createElement("div");
    item.className = "confidence-slider-item";
    
    // Calculate level details
    let lvlLabel = "Capable";
    let lvlClass = "lvl-capable";
    if (initialVal < 40) {
      lvlLabel = "Emerging";
      lvlClass = "lvl-emerging";
    } else if (initialVal > 75) {
      lvlLabel = "Strong";
      lvlClass = "lvl-strong";
    }

    item.innerHTML = `
      <div class="confidence-slider-info">
        <span class="review-skill-name">${skill}</span>
        <span class="review-skill-lvl-badge ${lvlClass}" id="badge-lbl-${idx}">${lvlLabel}</span>
      </div>
      <input type="range" class="review-skill-slider" data-idx="${idx}" min="10" max="100" value="${initialVal}" style="width: 100%;">
      <div class="confidence-labels-row">
        <span>Emerging (Novice)</span>
        <span>Capable</span>
        <span>Strong (Expert)</span>
      </div>
    `;

    // Sliders event listener
    const slider = item.querySelector(".review-skill-slider");
    const badge = item.querySelector(`#badge-lbl-${idx}`);
    
    slider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      if (val < 40) {
        badge.textContent = "Emerging";
        badge.className = "review-skill-lvl-badge lvl-emerging";
      } else if (val > 75) {
        badge.textContent = "Strong";
        badge.className = "review-skill-lvl-badge lvl-strong";
      } else {
        badge.textContent = "Capable";
        badge.className = "review-skill-lvl-badge lvl-capable";
      }
    });

    container.appendChild(item);
  });

  // Synthesize custom dynamic summary text based on inputs
  const interestsListText = appState.selectedInterests.map(i => i.replace("-", " ")).join(", ");
  document.getElementById("inferred-summary-text").textContent = `
    A ${appState.experienceLevel} showing competency in ${appState.skillsList.slice(0, 3).join(", ")} and expressing interest in: ${interestsListText}. Target career speed is calibrated to fits matching your preferred location: ${appState.locationPreference}.
  `;

  document.getElementById("review-hours-val").textContent = `${appState.weeklyHours} hours/wk`;
  document.getElementById("review-style-val").textContent = appState.learningMode.replace("-", " ");
}

// 9. Dashboard Logic
function setupDashboardHandlers() {
  // Navigation tabs inside dashboard
  document.getElementById("nav-btn-mypath").addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".dashboard-nav a").forEach(l => l.classList.remove("active"));
    e.target.classList.add("active");
  });

  document.getElementById("nav-btn-explore").addEventListener("click", (e) => {
    e.preventDefault();
    openCompareModal();
  });

  document.getElementById("nav-btn-profile-re").addEventListener("click", (e) => {
    e.preventDefault();
    if (confirm("Go back to setup form? Your settings will remain, but you can adjust them.")) {
      appState.intakeStep = 1;
      updateIntakeStepView();
      switchView("intake");
    }
  });

  // Graph vs Timeline view toggles
  document.getElementById("btn-view-graph").addEventListener("click", () => {
    document.getElementById("btn-view-graph").classList.add("active");
    document.getElementById("btn-view-timeline").classList.remove("active");
    
    document.getElementById("graph-view-container").classList.remove("hidden");
    document.getElementById("timeline-view-container").classList.add("hidden");
  });

  document.getElementById("btn-view-timeline").addEventListener("click", () => {
    document.getElementById("btn-view-graph").classList.remove("active");
    document.getElementById("btn-view-timeline").classList.add("active");
    
    document.getElementById("graph-view-container").classList.add("hidden");
    document.getElementById("timeline-view-container").classList.remove("hidden");
    renderTimelineView();
  });

  // Save Path Bookmark click
  document.getElementById("btn-save-active-path").addEventListener("click", () => {
    const btn = document.getElementById("btn-save-active-path");
    const activeId = appState.activePathId;
    if (appState.savedPaths[activeId]) {
      appState.savedPaths[activeId] = false;
      btn.classList.remove("saved");
    } else {
      appState.savedPaths[activeId] = true;
      btn.classList.add("saved");
    }
  });

  // Tune weights trigger
  document.getElementById("btn-open-priority-tuner").addEventListener("click", () => {
    openCompareModal();
  });

  // Start Path Action
  document.getElementById("btn-start-path").addEventListener("click", () => {
    alert(`Congratulations! You've started the ${CAREER_PATHS_DATA[appState.activePathId].name} roadmap. Complete action items below to track progress.`);
  });

  // Compare button in Inspector
  document.getElementById("btn-compare-inspector").addEventListener("click", () => {
    openCompareModal();
  });

  // Resize listener to redraw SVG paths on screen change
  window.addEventListener("resize", () => {
    if (appState.currentView === "dashboard" && !document.getElementById("graph-view-container").classList.contains("hidden")) {
      redrawGraphLines();
    }
  });
}

function renderDashboard() {
  renderPathsMenu();
  renderActivePathDetails();
  updateProgressRing();
}

// Render recommended list in left rail
function renderPathsMenu() {
  const list = document.getElementById("dashboard-paths-menu-list");
  if (!list) return;
  list.innerHTML = "";

  Object.values(CAREER_PATHS_DATA).forEach(path => {
    // Fit score dynamic calculation from weights
    const score = recalculateFitScore(path);
    
    const card = document.createElement("button");
    card.className = `path-select-item ${path.id === appState.activePathId ? "active" : ""}`;
    card.innerHTML = `
      <div class="path-select-info">
        <span class="path-select-title">${path.name}</span>
        <span class="path-select-badge">${getFitEstimateFromScore(score)}</span>
      </div>
      <div class="fit-score-bubble">${score}%</div>
    `;

    card.addEventListener("click", () => {
      appState.activePathId = path.id;
      appState.activePhaseIndex = 0;
      renderDashboard();
    });

    list.appendChild(card);
  });
}

// Render active details
function renderActivePathDetails() {
  const path = CAREER_PATHS_DATA[appState.activePathId];
  if (!path) return;

  // Title & Header
  document.getElementById("center-path-title").textContent = path.name;
  
  const score = recalculateFitScore(path);
  const fitEst = getFitEstimateFromScore(score);
  
  const badge = document.getElementById("inspector-fit-estimate");
  badge.textContent = fitEst;
  badge.className = `fit-badge ${getFitBadgeClass(fitEst)}`;

  // Save Bookmark state
  const saveBtn = document.getElementById("btn-save-active-path");
  if (appState.savedPaths[path.id]) {
    saveBtn.classList.add("saved");
  } else {
    saveBtn.classList.remove("saved");
  }

  // Summary and details
  document.getElementById("inspector-role-name").textContent = path.name;
  document.getElementById("inspector-role-summary").textContent = path.summary;
  document.getElementById("inspector-fit-why").textContent = path.whyFits;

  // Overlap and Gaps
  const overlapContainer = document.getElementById("inspector-overlap-skills");
  overlapContainer.innerHTML = "";
  path.overlapSkills.forEach(s => {
    const p = document.createElement("span");
    p.className = "skill-pill pill-overlap";
    p.textContent = s;
    overlapContainer.appendChild(p);
  });

  const gapContainer = document.getElementById("inspector-gap-skills");
  gapContainer.innerHTML = "";
  path.gapSkills.forEach(s => {
    const p = document.createElement("span");
    p.className = "skill-pill pill-gap";
    p.textContent = s;
    gapContainer.appendChild(p);
  });

  // Trade-offs list
  const tradeoffsList = document.getElementById("inspector-tradeoffs-list");
  tradeoffsList.innerHTML = "";
  path.tradeoffs.forEach(t => {
    const li = document.createElement("li");
    li.innerHTML = t;
    tradeoffsList.appendChild(li);
  });

  // Accordion Expand/Collapse Action
  document.querySelectorAll(".accordion-trigger").forEach(trig => {
    // Remove previous listeners to avoid stack pileup
    const newTrig = trig.cloneNode(true);
    trig.parentNode.replaceChild(newTrig, trig);

    newTrig.addEventListener("click", () => {
      newTrig.parentNode.classList.toggle("active");
    });
  });

  // Render Active Graph
  renderGraphNodes();
  
  // Render Bottom action strip
  renderBottomActionStrip();
}

// Render Graph Nodes on center SVG canvas
function renderGraphNodes() {
  const container = document.getElementById("graph-nodes-container");
  if (!container) return;
  container.innerHTML = "";

  const path = CAREER_PATHS_DATA[appState.activePathId];
  let allNodes = [];
  
  // Flatten nodes from phases
  path.phases.forEach((phase, phaseIdx) => {
    phase.nodes.forEach(node => {
      allNodes.push({
        ...node,
        phaseIdx: phaseIdx,
        phaseName: phase.name
      });
    });
  });

  // Render Node elements
  allNodes.forEach((node, nodeIdx) => {
    const div = document.createElement("div");
    div.className = "graph-node";
    div.style.left = `${node.x}%`;
    div.style.top = `${node.y}%`;
    
    // Check states: completed vs active vs idle
    const isCompleted = isPhaseCompleted(node.phaseIdx);
    const isActivePhase = appState.activePhaseIndex === node.phaseIdx;
    
    if (isCompleted) div.classList.add("completed");
    if (isActivePhase) div.classList.add("active");

    div.innerHTML = `
      <div class="node-marker" title="${node.details}">
        <span>${node.icon}</span>
      </div>
      <div class="node-title">${node.label}</div>
    `;

    // Click triggers selection of active phase on bottom strip
    div.addEventListener("click", () => {
      appState.activePhaseIndex = node.phaseIdx;
      // Re-render
      document.querySelectorAll(".graph-node").forEach(n => n.classList.remove("active"));
      div.classList.add("active");
      renderBottomActionStrip();
    });

    container.appendChild(div);
  });

  // Delay line drawing until after DOM update
  setTimeout(() => {
    redrawGraphLines(allNodes);
  }, 50);
}

// Draw linking curves in SVG
function redrawGraphLines(nodesList) {
  const svg = document.getElementById("graph-svg-lines");
  if (!svg) return;
  svg.innerHTML = "";

  const path = CAREER_PATHS_DATA[appState.activePathId];
  let nodes = nodesList || [];
  
  if (nodes.length === 0) {
    path.phases.forEach((phase, phaseIdx) => {
      phase.nodes.forEach(node => {
        nodes.push({ ...node, phaseIdx });
      });
    });
  }

  const containerRect = svg.getBoundingClientRect();
  const w = containerRect.width;
  const h = containerRect.height;

  // Create connecting path lines
  for (let i = 0; i < nodes.length - 1; i++) {
    const startX = (nodes[i].x / 100) * w;
    const startY = (nodes[i].y / 100) * h;
    const endX = (nodes[i + 1].x / 100) * w;
    const endY = (nodes[i + 1].y / 100) * h;

    // Curved Bezier calculation
    const cpX1 = startX + (endX - startX) / 2;
    const cpY1 = startY;
    const cpX2 = startX + (endX - startX) / 2;
    const cpY2 = endY;

    const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const dAttr = `M ${startX} ${startY} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${endX} ${endY}`;
    
    pathEl.setAttribute("d", dAttr);
    pathEl.setAttribute("fill", "none");
    
    // Line coloring based on progression status
    const startCompleted = isPhaseCompleted(nodes[i].phaseIdx);
    const endCompleted = isPhaseCompleted(nodes[i + 1].phaseIdx);
    
    if (startCompleted && endCompleted) {
      pathEl.setAttribute("stroke", "var(--growth-lime)");
      pathEl.setAttribute("stroke-width", "4");
    } else {
      pathEl.setAttribute("stroke", "rgba(148, 163, 184, 0.25)");
      pathEl.setAttribute("stroke-width", "2.5");
      pathEl.setAttribute("stroke-dasharray", "4 4");
    }
    
    svg.appendChild(pathEl);
  }
}

// Render bottom strip action items for selected phase
function renderBottomActionStrip() {
  const path = CAREER_PATHS_DATA[appState.activePathId];
  const phase = path.phases[appState.activePhaseIndex];
  if (!phase) return;

  document.getElementById("weekly-strip-eyebrow").textContent = phase.name;
  document.getElementById("weekly-hours-est").textContent = `Estimated: ${phase.hoursEst}`;

  const container = document.getElementById("weekly-actions-container");
  container.innerHTML = "";

  phase.actions.forEach(act => {
    const card = document.createElement("div");
    card.className = `action-checkbox-card ${appState.completedActions[act.id] ? "completed" : ""}`;
    
    card.innerHTML = `
      <div class="custom-chk-box"></div>
      <div class="action-card-text">
        <span class="action-title-label">${act.label}</span>
        <div class="action-link-res">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          <span>Resource: ${act.source}</span>
          <span class="action-est-tag">• ${act.duration}</span>
        </div>
      </div>
    `;

    card.addEventListener("click", () => {
      if (appState.completedActions[act.id]) {
        appState.completedActions[act.id] = false;
        card.classList.remove("completed");
      } else {
        appState.completedActions[act.id] = true;
        card.classList.add("completed");
      }
      
      // Update states
      updateProgressRing();
      
      // Re-render nodes to update completion highlights
      renderGraphNodes();
    });

    container.appendChild(card);
  });
}

// Check if all action items in a phase are complete
function isPhaseCompleted(phaseIdx) {
  const path = CAREER_PATHS_DATA[appState.activePathId];
  const phase = path.phases[phaseIdx];
  if (!phase) return false;

  return phase.actions.every(act => appState.completedActions[act.id] === true);
}

// Render Timeline View
function renderTimelineView() {
  const container = document.getElementById("timeline-view-container");
  if (!container) return;
  container.innerHTML = "";

  const path = CAREER_PATHS_DATA[appState.activePathId];
  path.phases.forEach((phase, phaseIdx) => {
    const isCompleted = isPhaseCompleted(phaseIdx);
    const isActive = appState.activePhaseIndex === phaseIdx;
    
    let stateClass = "";
    let indicatorText = phaseIdx + 1;
    if (isCompleted) {
      stateClass = "completed";
      indicatorText = "✓";
    } else if (isActive) {
      stateClass = "active";
    }

    const row = document.createElement("div");
    row.className = `timeline-phase-row ${stateClass}`;
    
    row.innerHTML = `
      <div class="timeline-phase-marker">
        <div class="timeline-dot">${indicatorText}</div>
        ${phaseIdx < path.phases.length - 1 ? '<div class="timeline-connector"></div>' : ''}
      </div>
      <div class="timeline-phase-card">
        <h3>${phase.name}</h3>
        <p>${phase.nodes.map(n => n.label).join(" • ")}</p>
        <span style="font-size: 0.75rem; color: var(--slate-400); display: block; margin-top: 6px;">${phase.hoursEst}</span>
      </div>
    `;

    row.querySelector(".timeline-phase-card").addEventListener("click", () => {
      appState.activePhaseIndex = phaseIdx;
      document.querySelectorAll(".timeline-phase-row").forEach(r => r.classList.remove("active"));
      row.classList.add("active");
      renderBottomActionStrip();
    });

    container.appendChild(row);
  });
}

// Recalculate radial progress ring values
function updateProgressRing() {
  const path = CAREER_PATHS_DATA[appState.activePathId];
  if (!path) return;

  // Flatten all action item IDs in active path
  let allActionIds = [];
  path.phases.forEach(p => {
    p.actions.forEach(a => {
      allActionIds.push(a.id);
    });
  });

  const total = allActionIds.length;
  const completed = allActionIds.filter(id => appState.completedActions[id] === true).length;
  
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Update texts
  document.getElementById("dashboard-progress-percent").textContent = `${percent}%`;
  document.getElementById("progress-complete-count").textContent = `${completed} of ${total} items`;
  
  // Set next milestone text
  let nextMilestone = "Foundation Phase";
  for (let idx = 0; idx < path.phases.length; idx++) {
    if (!isPhaseCompleted(idx)) {
      nextMilestone = `Next: ${path.phases[idx].name.replace("Phase ", "")}`;
      break;
    }
  }
  document.getElementById("progress-next-milestone").textContent = nextMilestone;

  // SVG ring stroke offset math
  // Circle circumference is 2 * PI * r = 2 * 3.1415 * 50 = 314.15
  const circle = document.getElementById("dashboard-progress-circle");
  if (circle) {
    const offset = 314.15 - (percent / 100) * 314.15;
    circle.style.strokeDashoffset = offset;
  }
}


// 10. Compare Paths Modal & Weight Tuner
function setupCompareModalHandlers() {
  document.getElementById("btn-close-compare-modal").addEventListener("click", () => {
    document.getElementById("modal-compare-paths").classList.remove("active");
  });

  // Slider inputs weighting list
  const sliders = [
    { id: "speed", el: document.getElementById("slider-p-speed"), lbl: document.getElementById("val-p-speed") },
    { id: "income", el: document.getElementById("slider-p-income"), lbl: document.getElementById("val-p-income") },
    { id: "creativity", el: document.getElementById("slider-p-creativity"), lbl: document.getElementById("val-p-creativity") },
    { id: "stability", el: document.getElementById("slider-p-stability"), lbl: document.getElementById("val-p-stability") },
    { id: "flexibility", el: document.getElementById("slider-p-flexibility"), lbl: document.getElementById("val-p-flexibility") }
  ];

  sliders.forEach(slider => {
    if (slider.el) {
      slider.el.addEventListener("input", (e) => {
        const val = parseInt(e.target.value);
        slider.lbl.textContent = `${val}/5`;
        
        // Update state weights
        appState.weights[slider.id] = val;
        
        // Live update compare screen scores
        renderCompareCards();
        // Update dashboard rail scores too
        renderPathsMenu();
      });
    }
  });

  // Reset Weights
  document.getElementById("btn-tuner-reset").addEventListener("click", () => {
    appState.weights = { speed: 3, income: 4, creativity: 4, stability: 3, flexibility: 5 };
    sliders.forEach(slider => {
      const defaultVal = appState.weights[slider.id];
      if (slider.el) {
        slider.el.value = defaultVal;
        slider.lbl.textContent = `${defaultVal}/5`;
      }
    });
    renderCompareCards();
    renderPathsMenu();
  });
}

function openCompareModal() {
  document.getElementById("modal-compare-paths").classList.add("active");
  renderCompareCards();
}

// Compute fit score based on tuner weight matching profile vectors
function recalculateFitScore(path) {
  let scoreSum = 0;
  let weightSum = 0;

  // Loop weights and average differences
  Object.keys(appState.weights).forEach(key => {
    const userW = appState.weights[key]; // 1-5
    const pathW = path.weights[key]; // 1-5
    
    // Difference penalty: the closer user weight matches role attribute weight, the higher score
    const diff = Math.abs(userW - pathW);
    const scoreVal = 100 - (diff * 12); // Max penalty 48% per category
    
    scoreSum += scoreVal * userW; // weighted contribution
    weightSum += userW;
  });

  let computed = Math.round(scoreSum / weightSum);
  // Cap between 60% and 98% for realistic AI fit range
  return Math.min(Math.max(computed, 60), 98);
}

function getFitEstimateFromScore(score) {
  if (score >= 90) return "Strong Match";
  if (score >= 80) return "Promising Match";
  return "Exploratory Match";
}

function getFitBadgeClass(estimateText) {
  if (estimateText === "Strong Match") return "badge-strong";
  if (estimateText === "Promising Match") return "badge-promising";
  return "badge-exploratory";
}

function renderCompareCards() {
  const container = document.getElementById("compare-cards-grid");
  if (!container) return;
  container.innerHTML = "";

  Object.values(CAREER_PATHS_DATA).forEach(path => {
    const score = recalculateFitScore(path);
    const est = getFitEstimateFromScore(score);
    const badgeClass = getFitBadgeClass(est);

    const isSelected = path.id === appState.activePathId;

    const col = document.createElement("div");
    col.className = `compare-column-card ${isSelected ? "active-selected" : ""}`;
    col.innerHTML = `
      <div class="compare-card-header">
        <h4 class="compare-card-title">${path.name}</h4>
        <p class="compare-card-summary">${path.summary}</p>
      </div>

      <div class="compare-field">
        <span class="compare-field-label">Fit Score</span>
        <span class="compare-field-val fit-est" style="color: var(--path-indigo);">${score}% (${est})</span>
        <div class="compare-bar-bg">
          <div class="compare-bar-fill" style="width: ${score}%;"></div>
        </div>
      </div>

      <div class="compare-field">
        <span class="compare-field-label">Timeline Speed</span>
        <span class="compare-field-val">${path.weights.speed}/5</span>
      </div>

      <div class="compare-field">
        <span class="compare-field-label">Starting Income</span>
        <span class="compare-field-val">${path.weights.income}/5</span>
      </div>

      <div class="compare-field">
        <span class="compare-field-label">Match Explanation</span>
        <p style="font-size: 0.75rem; color: var(--slate-500); line-height: 1.4;">${path.whyFits}</p>
      </div>

      <div class="compare-field">
        <span class="compare-field-label">Transferable Skills</span>
        <div class="compare-chips-list">
          ${path.overlapSkills.map(s => `<span class="compare-chip pill-overlap" style="background: rgba(183, 243, 107, 0.15); color: #4b780e;">${s}</span>`).join("")}
        </div>
      </div>

      <div class="compare-field">
        <span class="compare-field-label">Gaps to Build</span>
        <div class="compare-chips-list">
          ${path.gapSkills.map(s => `<span class="compare-chip pill-gap" style="background: rgba(251, 113, 133, 0.1); color: var(--warm-coral);">${s}</span>`).join("")}
        </div>
      </div>

      <div class="compare-card-actions">
        ${isSelected 
          ? '<button class="btn btn-secondary btn-full-width" disabled>Currently Selected</button>' 
          : `<button class="btn btn-primary btn-full-width btn-select-path-modal" data-id="${path.id}">Select Path</button>`}
      </div>
    `;

    // Modal Button Selection
    const btn = col.querySelector(".btn-select-path-modal");
    if (btn) {
      btn.addEventListener("click", () => {
        appState.activePathId = path.id;
        appState.activePhaseIndex = 0;
        document.getElementById("modal-compare-paths").classList.remove("active");
        renderDashboard();
      });
    }

    container.appendChild(col);
  });
}


// 11. Conversational Chat Refinement Widget
function setupChatWidget() {
  const widget = document.getElementById("chat-refinement-widget");
  const header = document.getElementById("chat-header-toggle");
  const body = document.getElementById("chat-widget-body");
  const form = document.getElementById("chat-refinement-form");
  const input = document.getElementById("chat-input-text");
  const msgContainer = document.getElementById("chat-messages-container");

  // Toggle Minimize/Expand
  header.addEventListener("click", () => {
    widget.classList.toggle("open-chat");
    body.classList.toggle("hidden");
    widget.classList.toggle("expanded");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    // Append User Message
    appendChatMessage("user-msg", query);
    input.value = "";

    // Scroll to bottom
    msgContainer.scrollTop = msgContainer.scrollHeight;

    // Simulate AI response logic
    setTimeout(() => {
      const response = processChatQuery(query);
      appendChatMessage("ai-msg", response);
      msgContainer.scrollTop = msgContainer.scrollHeight;
    }, 750);
  });
}

function appendChatMessage(type, text) {
  const container = document.getElementById("chat-messages-container");
  const div = document.createElement("div");
  div.className = `chat-msg ${type}`;
  div.innerHTML = `<p>${text}</p>`;
  container.appendChild(div);
}

// Processing queries to dynamically alter state
function processChatQuery(query) {
  const lower = query.toLowerCase();

  // Match 1: "5 hours a week" or availability changes
  if (lower.includes("5 hours") || lower.includes("five hours") || lower.includes("less time") || lower.includes("fewer hours")) {
    appState.weeklyHours = 5;
    
    // Modify active path values dynamically to reflect shorter weeks
    const active = CAREER_PATHS_DATA[appState.activePathId];
    active.phases.forEach((p, idx) => {
      p.hoursEst = "4 hours total";
    });
    
    // Update review / dashboard display elements
    document.getElementById("review-hours-val").textContent = "5 hours/wk";
    document.getElementById("weekly-hours-est").textContent = "Estimated: 4 hours total";
    
    // Recalculate
    renderDashboard();

    return `I've updated your path roadmap milestones. Weekly hours have been adjusted to <strong>5 hours/week</strong>. The learning phases are now shorter and more modular.`;
  }

  // Match 2: "don't want to do coding" or removing skills
  if (lower.includes("no coding") || lower.includes("don't want to code") || lower.includes("remove coding") || lower.includes("without coding")) {
    // Drop Coding interest
    appState.selectedInterests = appState.selectedInterests.filter(i => i !== "problem-solving");
    
    // Penalty on Data Analyst (which uses python/sql coding)
    CAREER_PATHS_DATA["data-analyst"].weights.creativity = 2; // reduce score
    CAREER_PATHS_DATA["data-analyst"].fitScore = 68;
    CAREER_PATHS_DATA["product-designer"].fitScore = 95; // boost designer

    renderDashboard();

    return `Understood. I have lowered the fit score for <strong>Data Analyst</strong> due to its technical scripting requirements. Your recommendation matches have shifted to favor <strong>Product Designer</strong> (95% fit).`;
  }

  // Match 3: Add new skills dynamically
  if (lower.includes("add python") || lower.includes("add sql") || lower.includes("learned python")) {
    if (!appState.skillsList.includes("Python")) {
      appState.skillsList.push("Python");
      appState.skillsList.push("SQL");
    }

    // Boost Data Analyst
    CAREER_PATHS_DATA["data-analyst"].overlapSkills.push("Python", "SQL");
    CAREER_PATHS_DATA["data-analyst"].gapSkills = CAREER_PATHS_DATA["data-analyst"].gapSkills.filter(s => s !== "Python (Pandas)");
    CAREER_PATHS_DATA["data-analyst"].fitScore = 96;

    renderDashboard();

    return `Awesome! I've added <strong>Python & SQL</strong> to your active skill profile. The skill bridge has recalculated. Your fit for <strong>Data Analyst</strong> has jumped to <strong>96% (Strong Match)</strong>.`;
  }

  // Default response
  return `I've analyzed your request: "${query}". Our agents are monitoring your profile inputs and have tuned your alignment vectors accordingly.`;
}
