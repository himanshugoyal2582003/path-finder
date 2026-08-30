'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUser, UserButton, SignInButton, SignUpButton } from '@clerk/nextjs';

// Recommended Skills options
const SUGGESTED_SKILLS = [
  'HTML/CSS', 'JavaScript', 'Python', 'SQL', 'Figma', 'Visual Design', 
  'React', 'Node.js', 'Excel', 'Writing', 'Data Structures', 'Google Analytics'
];

const SUGGESTED_INTERESTS = [
  { label: 'Visual Design', sub: 'Crafting user interfaces and aesthetic experiences', icon: 'ðŸŽ¨' },
  { label: 'Data Analysis', sub: 'Finding patterns and building diagnostic charts', icon: 'ðŸ“Š' },
  { label: 'Problem Solving', sub: 'Coding logic, algorithms, and infrastructure', icon: 'âš™ï¸' },
  { label: 'User Empathy', sub: 'Understanding people, user research, and behavior', icon: 'ðŸ‘¥' },
  { label: 'Writing', sub: 'Copywriting, drafting case studies, and storytelling', icon: 'ðŸ“' },
  { label: 'Experimentation', sub: 'A/B testing, growth loops, and marketing metrics', icon: 'ðŸš€' }
];

export default function PathFinderApp() {
  const { isSignedIn, user, isLoaded } = useUser();

  // Navigation & Views: 'landing' | 'auth' | 'onboarding' | 'loading' | 'checkpoint' | 'dashboard'
  const [currentView, setCurrentView] = useState('landing');
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  
  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Onboarding Form State
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [skills, setSkills] = useState(['HTML/CSS', 'Writing']);
  const [skillInput, setSkillInput] = useState('');
  const [selectedInterests, setSelectedInterests] = useState(['Writing']);
  const [goalText, setGoalText] = useState('Build a personal portfolio website and start freelance work');
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [timelineMonths, setTimelineMonths] = useState(6);
  const [budgetPref, setBudgetPref] = useState('free');

  // Loading pipeline animation state
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const loadingStepsText = [
    'Parsing profile and normalising skills...',
    'Matching skills profile against career archetypes via embeddings...',
    'Performing gap analysis and mapping missing criteria...',
    'Building structured weekly roadmap and sourcing learning materials...',
    'Finalising explainability notes and fit statistics...'
  ];

  // Checkpoint Inferred Skills
  const [inferredSkills, setInferredSkills] = useState([]);
  const [inferredConfidence, setInferredConfidence] = useState({});

  // Dashboard Data
  const [recommendations, setRecommendations] = useState([]);
  const [activeRecId, setActiveRecId] = useState(null);
  const [canvasView, setCanvasView] = useState('graph'); // 'graph' | 'timeline'
  const [savedPaths, setSavedPaths] = useState({});
  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState(0);
  const [expandedSections, setExpandedSections] = useState({ description: true, tradeoffs: true });


  // Comparison Modal
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [tunerWeights, setTunerWeights] = useState({ speed: 4, income: 3, creativity: 5, stability: 4, flexibility: 5 });

  // Conversational Refinement
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: "Welcome to PathFinder Refinement. Tell me if you want to tweak your roadmap, e.g. 'I don't want to code' or 'Reduce study hours'." }
  ]);

  // API base URL
  const API_BASE = 'http://localhost:5000/api';

  const handleLogout = () => {
    localStorage.removeItem('pathfinder_token');
    setToken(null);
    setCurrentUser(null);
    setCurrentView('landing');
  };

  // Get recommendations from backend
  const fetchRecommendations = async (authToken) => {
    try {
      const res = await fetch(`${API_BASE}/recommendations`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const recs = await res.json();
        setRecommendations(recs);
        if (recs.length > 0) {
          setActiveRecId(recs[0].id);
        }
        setCurrentView('dashboard');
      }
    } catch (err) {
      console.error("Fetch recommendations error:", err);
    }
  };

  // Sync token headers and state
  const fetchUser = async (authToken) => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        
        // If user already has profile and recommendations, jump to dashboard!
        if (user.profile) {
          // Pre-fill profile state
          setSkills(user.profile.skills || []);
          setSelectedInterests(user.profile.interests || []);
          setGoalText(user.profile.goalText || '');
          setHoursPerWeek(user.profile.hoursPerWeek || 10);
          setTimelineMonths(user.profile.timelineMonths || 6);
          setBudgetPref(user.profile.budgetPref || 'free');

          // Fetch recommendations
          fetchRecommendations(authToken);
        } else {
          setCurrentView('onboarding');
          setOnboardingStep(1);
        }
      } else {
        // Token expired/invalid
        handleLogout();
      }
    } catch (err) {
      console.error("Auth fetch error:", err);
      handleLogout();
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('pathfinder_token');
    if (savedToken) {
      queueMicrotask(() => {
        setToken(savedToken);
        fetchUser(savedToken);
      });
    }
  }, []);

  // Sync Clerk auth with backend: auto-register/login when Clerk signs in.
  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && user && !token) {
      const clerkEmail = user.primaryEmailAddress?.emailAddress;
      if (!clerkEmail) return;

      const syncClerkWithBackend = async () => {
        try {
          let res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: clerkEmail, password: 'clerk_sso_' + user.id })
          });

          if (!res.ok) {
            res = await fetch(`${API_BASE}/auth/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: clerkEmail, password: 'clerk_sso_' + user.id })
            });
          }

          if (res.ok) {
            const data = await res.json();
            localStorage.setItem('pathfinder_token', data.token);
            setToken(data.token);
            await fetchUser(data.token);
          }
        } catch (err) {
          console.error('Clerk->Backend sync error:', err);
        }
      };
      syncClerkWithBackend();
    }
  }, [isLoaded, isSignedIn, user, token]);

  // Auth Submit handler
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const endpoint = authMode === 'register' ? 'register' : 'login';
      const res = await fetch(`${API_BASE}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('pathfinder_token', data.token);
      setToken(data.token);
      
      // If logging in, fetch full user to check profile path
      await fetchUser(data.token);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Onboarding Add Skill
  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput('');
  };

  // Onboarding Remove Skill
  const removeSkill = (indexToRemove) => {
    setSkills(skills.filter((_, idx) => idx !== indexToRemove));
  };

  // Onboarding Interest Toggle
  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  // Run multi-agent pipeline loader
  const startPipelineSimulation = async () => {
    setCurrentView('loading');
    setLoadingStepIdx(0);
    
    // Simulate loading steps in UI
    const timer = setInterval(() => {
      setLoadingStepIdx(prev => {
        if (prev >= loadingStepsText.length - 1) {
          clearInterval(timer);
          triggerRecommendationGeneration();
          return prev;
        }
        return prev + 1;
      });
    }, 1200);
  };

  // Trigger Backend profile save and recommendations generate
  const triggerRecommendationGeneration = async () => {
    try {
      // 1. Save profile to Express.js
      const profileRes = await fetch(`${API_BASE}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          skills,
          interests: selectedInterests,
          goalText,
          hoursPerWeek,
          timelineMonths,
          budgetPref
        })
      });

      if (!profileRes.ok) throw new Error('Failed to save profile');

      // 2. Generate recommendations
      const recRes = await fetch(`${API_BASE}/recommendations/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!recRes.ok) throw new Error('Failed to generate roadmaps');
      const recs = await recRes.json();
      setRecommendations(recs);
      if (recs.length > 0) {
        setActiveRecId(recs[0].id);
      }

      // 3. Move to trust checkpoint screen
      // Populate inferred skills from recommendations (what we need vs what user has)
      const uniqueInferred = Array.from(new Set(recs.flatMap(r => r.role.requiredSkills)));
      setInferredSkills(uniqueInferred);
      
      // Default confidence values
      const initialConf = {};
      uniqueInferred.forEach(s => {
        initialConf[s] = skills.includes(s) ? 80 : 30; // 80 if owned, 30 if gap
      });
      setInferredConfidence(initialConf);

      setCurrentView('checkpoint');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
      setCurrentView('onboarding');
    }
  };

  // Finalize checkpoint profile verification
  const confirmCheckpoint = async () => {
    // Save updated skills based on sliders set above 60 (capable/strong)
    const confirmedSkills = inferredSkills.filter(s => inferredConfidence[s] >= 50);
    
    try {
      // Save updated profile
      await fetch(`${API_BASE}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          skills: confirmedSkills,
          interests: selectedInterests,
          goalText,
          hoursPerWeek,
          timelineMonths,
          budgetPref
        })
      });

      // Fetch final recommendations
      await fetchRecommendations(token);
      setCurrentView('dashboard');
    } catch (err) {
      console.error("Confirm checkpoint error:", err);
    }
  };

  // Toggle checklist items in Postgres database
  const handleToggleItem = async (itemId) => {
    try {
      const res = await fetch(`${API_BASE}/roadmap/item/${itemId}/toggle`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const updatedItem = await res.json();
        // Update local state
        setRecommendations(prevRecs => 
          prevRecs.map(rec => ({
            ...rec,
            phases: rec.phases.map(phase => ({
              ...phase,
              items: phase.items.map(item => 
                item.id === itemId ? { ...item, done: updatedItem.done } : item
              )
            }))
          }))
        );
      }
    } catch (err) {
      console.error("Toggle item error:", err);
    }
  };

  // Chat Refinement process query
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');

    // Add typing indicator
    setChatMessages(prev => [...prev, { sender: 'ai', text: "Analyzing your request and refining the roadmap constraints..." }]);

    try {
      const res = await fetch(`${API_BASE}/recommendations/refine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userText })
      });

      if (!res.ok) throw new Error('Refinement request failed');

      const data = await res.json();

      // Remove typing indicator and add final AI reply
      setChatMessages(prev => {
        const filtered = prev.filter(m => m.text !== "Analyzing your request and refining the roadmap constraints...");
        return [...filtered, { sender: 'ai', text: `${data.reply}` }];
      });

      // Update dynamic states
      if (data.profile) {
        setSkills(data.profile.skills || []);
        setSelectedInterests(data.profile.interests || []);
        setGoalText(data.profile.goalText || '');
        setHoursPerWeek(data.profile.hoursPerWeek || 10);
        setTimelineMonths(data.profile.timelineMonths || 6);
      }

      if (data.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
        const currentActive = data.recommendations.find(r => r.id === activeRecId);
        if (!currentActive) {
          setActiveRecId(data.recommendations[0].id);
        }
      }

    } catch (err) {
      console.warn("Refinement API failed, using client fallback", err);
      // Remove typing indicator
      setChatMessages(prev => prev.filter(m => m.text !== "Analyzing your request and refining the roadmap constraints..."));

      // Simple rule fallback
      let aiText = '';
      const lower = userText.toLowerCase();
      if (lower.includes('coding') || lower.includes('programming') || lower.includes('code')) {
        aiText = "Refinement Agent (Fallback): Noted! Swapping software-heavy tasks for user design workflows.";
        setSkills(prev => prev.filter(s => !['javascript', 'python', 'sql'].includes(s.toLowerCase())));
        setSelectedInterests(['Visual Design', 'User Empathy', 'Writing']);
        setGoalText("Design user interfaces and user experience without deep programming");
      } else if (lower.includes('hours') || lower.includes('time') || lower.includes('study')) {
        aiText = "Refinement Agent (Fallback): Acknowledged. Compressing week commitments.";
        setHoursPerWeek(6);
        setTimelineMonths(10);
      } else {
        aiText = "Refinement Agent (Fallback): I have updated the multi-agent pipeline constraints based on your request. Let's trigger a fresh evaluation run!";
      }
      setChatMessages(prev => [...prev, { sender: 'ai', text: aiText }]);
    }
  };

  // Active Recommendation helper
  const activeRec = recommendations.find(r => r.id === activeRecId);

  // Calculate fit scores based on priority tuner weights
  const getDynamicFitScore = (roleName, baseScore) => {
    // Normalised adjustments based on role archetype matching
    let adjustment = 0;
    if (roleName === 'Product Designer') {
      adjustment = (tunerWeights.creativity * 3) + (tunerWeights.flexibility * 2) - (tunerWeights.stability * 1);
    } else if (roleName === 'Data Analyst') {
      adjustment = (tunerWeights.stability * 4) + (tunerWeights.income * 2) - (tunerWeights.creativity * 2);
    } else if (roleName === 'Growth Marketer') {
      adjustment = (tunerWeights.speed * 4) + (tunerWeights.flexibility * 3) - (tunerWeights.stability * 2);
    }
    return Math.min(Math.max(Math.round(baseScore + adjustment), 60), 98);
  };

  // Render total progress percent
  const getProgressPercentage = () => {
    if (!activeRec) return 0;
    const allItems = activeRec.phases.flatMap(p => p.items);
    if (allItems.length === 0) return 0;
    const doneItems = allItems.filter(i => i.done);
    return Math.round((doneItems.length / allItems.length) * 100);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* ========================================== LANDING PAGE ========================================== */}
      {currentView === 'landing' && (
        <section id="view-landing" className="view-section active">
          <header className="app-header">
            <div className="logo">
              <svg className="icon-indigo" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span>Life Path <span style={{fontWeight: 300, color: 'var(--slate-500)'}}>Finder</span></span>
            </div>
            <nav className="nav-links">
              <a href="#" onClick={() => setCurrentView('landing')} className={currentView === 'landing' ? 'active' : ''}>Home</a>
              <a href="#how-it-works">How it works</a>
            </nav>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isSignedIn ? (
                <>
                  <button onClick={() => {
                    if (recommendations.length > 0) {
                      setCurrentView('dashboard');
                    } else if (token) {
                      fetchRecommendations(token);
                    } else {
                      setCurrentView('onboarding');
                    }
                  }} className="btn btn-secondary" style={{ marginRight: '0.5rem' }}>Dashboard</button>
                  <UserButton />
                </>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <button className="btn btn-secondary">Sign In</button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="btn btn-primary">Sign Up</button>
                  </SignUpButton>
                </>
              )}
            </div>


          </header>

          <main className="hero-container">
            <div className="hero-content">
              <span className="eyebrow">Prototype Round 2</span>
              <h1 className="hero-title">Translate messy skills into a structured career path</h1>
              <p className="hero-subtitle">
                Life Path Finder takes your skills, interests, and constraints and uses multi-agent AI to generate tailored role matching, gap analysis, and week-by-week curriculum roadmaps.
              </p>
              <div className="hero-actions">
                {isSignedIn ? (
                  <button onClick={() => {
                    setCurrentView('onboarding');
                    setOnboardingStep(1);
                  }} className="btn btn-primary">Build Your Roadmap</button>
                ) : (
                  <SignUpButton mode="modal">
                    <button className="btn btn-primary">Build Your Roadmap</button>
                  </SignUpButton>
                )}
                <a href="#how-it-works" className="btn btn-secondary">Explore Archetypes</a>
              </div>
            </div>
            <div className="hero-visual">
              <div className="compass-container">
                <img src="/images/compass.png?v=2" alt="Pathfinder Compass" className="floating-3d-object" />
                <div className="glow-radial"></div>
              </div>
            </div>
          </main>

          <section id="how-it-works" className="info-section">
            <div className="section-header">
              <h2 className="section-title">How the Multi-Agent Core Works</h2>
              <p className="section-subtitle">A synchronized network of agents parsing your profile, not a single black box LLM.</p>
            </div>
            <div className="grid-steps">
              <div className="step-card">
                <div className="step-num">01</div>
                <h3 className="step-card-title">Profile Ingestion</h3>
                <p>O*NET databases and job scrapers normalize your inputs into structured tech taxonomy profiles.</p>
              </div>
              <div className="step-card">
                <div className="step-num">02</div>
                <h3 className="step-card-title">Embedding Similarity</h3>
                <p>SentenceTransformers similarity matching calculates initial scores against role archetypes.</p>
              </div>
              <div className="step-card">
                <div className="step-num">03</div>
                <h3 className="step-card-title">Gap Analysis</h3>
                <p>Set-difference agents outline exactly what you have vs what the market demands for the job.</p>
              </div>
              <div className="step-card">
                <div className="step-num">04</div>
                <h3 className="step-card-title">Curated Roadmap</h3>
                <p>Sequencing agents map training modules into manageable weekly goals matching study times.</p>
              </div>
            </div>
          </section>

          <footer className="app-footer">
            <p>Â© 2026 Life Path Finder. Built for career roadmap planning. All rights reserved.</p>
          </footer>
        </section>
      )}

      {/* ========================================== AUTH PAGE ========================================== */}
      {currentView === 'auth' && (
        <section id="view-intake" className="view-section active justify-center">
          <div className="intake-flow-container" style={{maxWidth: '480px'}}>
            <div className="intake-card">
              <h2 className="step-title" style={{textAlign: 'center', marginBottom: '8px'}}>
                {authMode === 'register' ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="step-description" style={{textAlign: 'center', marginBottom: '32px'}}>
                {authMode === 'register' ? 'Sign up to persist your roadmaps & progress' : 'Enter details to access your saved career paths'}
              </p>

              {errorMsg && (
                <div style={{color: 'var(--warm-coral)', background: 'rgba(251,113,133,0.1)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.85rem', textAlign: 'center'}}>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleAuthSubmit}>
                <div className="form-group">
                  <label htmlFor="auth-email">Email Address</label>
                  <input 
                    type="text" 
                    id="auth-email" 
                    placeholder="name@university.edu" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="auth-password">Password</label>
                  <input 
                    type="password" 
                    id="auth-password" 
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-full-width">
                  {authMode === 'register' ? 'Register & Continue' : 'Login'}
                </button>
              </form>

              <div style={{textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--slate-500)'}}>
                {authMode === 'register' ? (
                  <>Already have an account? <span onClick={() => setAuthMode('login')} style={{color: 'var(--path-indigo)', cursor: 'pointer', fontWeight: 600}}>Login here</span></>
                ) : (
                  <>New to PathFinder? <span onClick={() => setAuthMode('register')} style={{color: 'var(--path-indigo)', cursor: 'pointer', fontWeight: 600}}>Register here</span></>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================== ONBOARDING FLOW ========================================== */}
      {currentView === 'onboarding' && (
        <section id="view-intake" className="view-section active">
          <div className="intake-header">
            <span className="logo">
              <svg className="icon-indigo" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span>PathFinder Intake</span>
            </span>
            <span style={{fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--slate-500)'}}>Step {onboardingStep} of 3</span>
          </div>

          <div className="intake-progress-bar">
            <div className="progress-fill" style={{width: `${(onboardingStep / 3) * 100}%`}}></div>
          </div>

          <div className="intake-flow-container">
            <div className="intake-card">
              {/* STEP 1: SKILLS */}
              {onboardingStep === 1 && (
                <div className="intake-step active">
                  <span className="step-indicator">Onboarding Â· Stage 01</span>
                  <h2 className="step-title">What are your current skills?</h2>
                  <p className="step-description">Enter skills you have some experience in (languages, design tools, frameworks).</p>
                  
                  <div className="form-group">
                    <label>Skill Tags</label>
                    <div className="skill-input-container">
                      <div id="skills-tags-list">
                        {skills.map((skill, idx) => (
                          <span key={idx} className="skill-tag">
                            {skill}
                            <span onClick={() => removeSkill(idx)} className="skill-tag-remove">Ã—</span>
                          </span>
                        ))}
                      </div>
                      <input 
                        type="text" 
                        placeholder="Add skill..." 
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSkill(skillInput);
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="skills-suggestions">
                    <span>Popular:</span>
                    {SUGGESTED_SKILLS.filter(s => !skills.includes(s)).map((skill, idx) => (
                      <button key={idx} onClick={() => addSkill(skill)} className="btn-suggest-skill">+{skill}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: INTERESTS */}
              {onboardingStep === 2 && (
                <div className="intake-step active">
                  <span className="step-indicator">Onboarding Â· Stage 02</span>
                  <h2 className="step-title">Select core interest clusters</h2>
                  <p className="step-description">What kind of tasks or sub-domains pull your attention? Choose at least 2.</p>
                  
                  <div className="option-grid-multi">
                    {SUGGESTED_INTERESTS.map((interest, idx) => {
                      const isSelected = selectedInterests.includes(interest.label);
                      return (
                        <div 
                          key={idx} 
                          className={`interest-chip-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleInterest(interest.label)}
                        >
                          <div className="chip-icon">{interest.icon}</div>
                          <div className="chip-label">{interest.label}</div>
                          <div className="chip-sub">{interest.sub}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: CONSTRAINTS & GOAL */}
              {onboardingStep === 3 && (
                <div className="intake-step active">
                  <span className="step-indicator">Onboarding Â· Stage 03</span>
                  <h2 className="step-title">Specify goals & learning limits</h2>
                  <p className="step-description">Tell us your outcomes and weekly bandwidth bounds.</p>
                  
                  <div className="form-group">
                    <label htmlFor="goal-input">Target Career Goal / Outcome</label>
                    <input 
                      type="text" 
                      id="goal-input" 
                      value={goalText}
                      onChange={(e) => setGoalText(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Weekly Study Time Budget: <span style={{color: 'var(--path-indigo)'}}>{hoursPerWeek} Hours/Week</span></label>
                    <div className="range-display-container">
                      <input 
                        type="range" 
                        min="4" 
                        max="30" 
                        value={hoursPerWeek}
                        onChange={(e) => setHoursPerWeek(parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Target Timeline Limit: <span style={{color: 'var(--path-indigo)'}}>{timelineMonths} Months</span></label>
                    <div className="range-display-container">
                      <input 
                        type="range" 
                        min="2" 
                        max="24" 
                        value={timelineMonths}
                        onChange={(e) => setTimelineMonths(parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Budget Preferences</label>
                    <div className="option-grid">
                      <div className={`option-card ${budgetPref === 'free' ? 'selected' : ''}`} onClick={() => setBudgetPref('free')}>
                        <span className="option-title">Free Materials Only</span>
                        <span className="option-desc">Blogs, YouTube, GitHub, open docs.</span>
                      </div>
                      <div className={`option-card ${budgetPref === 'paid' ? 'selected' : ''}`} onClick={() => setBudgetPref('paid')}>
                        <span className="option-title">Paid Certifications</span>
                        <span className="option-desc">Coursera, Udemy, Bootcamps.</span>
                      </div>
                      <div className={`option-card ${budgetPref === 'any' ? 'selected' : ''}`} onClick={() => setBudgetPref('any')}>
                        <span className="option-title">Mixed/Any</span>
                        <span className="option-desc">No restriction on learning costs.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="intake-actions">
                {onboardingStep > 1 ? (
                  <button onClick={() => setOnboardingStep(onboardingStep - 1)} className="btn btn-secondary">Back</button>
                ) : (
                  <div></div>
                )}
                
                {onboardingStep < 3 ? (
                  <button onClick={() => setOnboardingStep(onboardingStep + 1)} className="btn btn-primary">Continue</button>
                ) : (
                  <button onClick={startPipelineSimulation} className="btn btn-primary">Process Profile</button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================== PIPELINE LOADING SCREEN ========================================== */}
      {currentView === 'loading' && (
        <section id="view-loading-pipeline" className="view-section active">
          <div className="pipeline-loader-content">
            <div className="loader-visual-wrapper">
              <img src="/images/compass.png" alt="Compass" className="rotating-compass" />
              <div className="glow-radial-loader"></div>
            </div>
            <h2>Running Multi-Agent Evaluation</h2>
            
            <div className="pipeline-steps-indicator">
              {loadingStepsText.map((_, idx) => (
                <span 
                  key={idx} 
                  className={`pipeline-step-dot ${idx <= loadingStepIdx ? 'active' : ''}`}
                ></span>
              ))}
            </div>
            
            <p className="pipeline-step-text">{loadingStepsText[loadingStepIdx]}</p>
          </div>
        </section>
      )}

      {/* ========================================== TRUST CHECKPOINT VIEW ========================================== */}
      {currentView === 'checkpoint' && (
        <section id="view-profile-review" className="view-section active">
          <div className="review-grid-container">
            <div className="review-left">
              <div className="review-title-section">
                <span className="eyebrow">Trust Checkpoint</span>
                <h2>Review Inferred Confidence</h2>
                <p>Based on your onboarding responses, the Skill Extraction Agent has inferred your starting levels. Tweak these sliders to ensure the roadmap matches your current expertise.</p>
              </div>

              <div className="review-card">
                <div className="review-card-header">
                  <h3>Skills Taxonomy Verification</h3>
                  <span className="mono-badge">Inferred Checkpoint</span>
                </div>
                
                {inferredSkills.map((skill, idx) => {
                  const val = inferredConfidence[skill] || 50;
                  let lvlClass = 'lvl-capable';
                  let lvlLabel = 'Capable';
                  if (val < 45) { lvlClass = 'lvl-emerging'; lvlLabel = 'Emerging'; }
                  else if (val > 75) { lvlClass = 'lvl-strong'; lvlLabel = 'Strong'; }

                  return (
                    <div key={idx} className="confidence-slider-item">
                      <div className="confidence-slider-info">
                        <span className="review-skill-name">{skill}</span>
                        <span className={`review-skill-lvl-badge ${lvlClass}`}>{lvlLabel} ({val}%)</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="100" 
                        value={val}
                        onChange={(e) => {
                          setInferredConfidence({
                            ...inferredConfidence,
                            [skill]: parseInt(e.target.value)
                          });
                        }}
                      />
                      <div className="confidence-labels-row">
                        <span>Emerging / Gap</span>
                        <span>Capable / Practiced</span>
                        <span>Strong / Expert</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="review-right">
              <div className="review-visual-card">
                <div className="visual-img-container">
                  <img id="review-constellation" src="/images/constellation.png" alt="Skill Constellation" />
                </div>
                
                <div className="inferred-profile-card">
                  <h4>Profile Summary</h4>
                  <p>Inbound Vector contains {skills.length} declared skill nodes. Synthesised roadmap will sequence {inferredSkills.length} total target capabilities.</p>
                  
                  <div className="profile-details-mini">
                    <div className="detail-item">
                      <span className="detail-label">Timeline</span>
                      <span className="detail-value">{timelineMonths} Months</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Hours</span>
                      <span className="detail-value">{hoursPerWeek} hr/wk</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Materials</span>
                      <span className="detail-value">{budgetPref.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="generate-paths-box">
                  <button onClick={confirmCheckpoint} className="btn btn-primary btn-full-width">Generate Learning Roadmaps</button>
                  <p className="generate-disclaimer">Recalculates similarity vectors against ONET taxonomy.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================== MAIN DASHBOARD ========================================== */}
      {currentView === 'dashboard' && activeRec && (
        <section id="view-dashboard" className="view-section active">
          <header className="dashboard-nav">
            <div className="logo" style={{fontSize: '1.1rem'}}>
              <svg className="icon-indigo" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span>Life Path Finder Dashboard</span>
            </div>
            
            <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
              <button onClick={() => setShowCompareModal(true)} className="btn btn-secondary" style={{minHeight: '36px', padding: '6px 16px', fontSize: '0.8rem'}}>
                Compare options
              </button>
              
              <div className="profile-avatar-container">
                <div className="avatar">{currentUser?.email?.slice(0,2).toUpperCase() || 'U'}</div>
                <span className="avatar-name">{currentUser?.email || 'User'}</span>
                <span onClick={handleLogout} style={{color: 'var(--warm-coral)', cursor: 'pointer', fontSize: '0.8rem', marginLeft: '12px'}}>Logout</span>
              </div>
            </div>
          </header>

          <main className="dashboard-layout">
            {/* Left Rail: Path Choices */}
            <div className="dashboard-left-rail">
              <div className="progress-card">
                <h4>Roadmap Progression</h4>
                <div className="progress-ring-wrapper">
                  <svg className="progress-ring-svg" width="120" height="120">
                    <circle className="progress-ring-bg" stroke="var(--cloud-100)" strokeWidth="8" fill="transparent" r="50" cx="60" cy="60" />
                    <circle 
                      className="progress-ring-indicator" 
                      stroke="var(--path-indigo)" 
                      strokeWidth="8" 
                      fill="transparent" 
                      r="50" 
                      cx="60" 
                      cy="60"
                      strokeDashoffset={314.15 - (314.15 * getProgressPercentage() / 100)}
                    />
                  </svg>
                  <div className="progress-ring-text">
                    <span id="dashboard-progress-percent">{getProgressPercentage()}%</span>
                    <span className="progress-sub">Done</span>
                  </div>
                </div>
                <div className="progress-details">
                  <span id="progress-complete-count">
                    {activeRec.phases.flatMap(p => p.items).filter(i => i.done).length} / {activeRec.phases.flatMap(p => p.items).length} Milestones Done
                  </span>
                  <span id="progress-next-milestone" style={{color: 'var(--slate-400)'}}>Next: Phase 1 Foundations</span>
                </div>
              </div>

              <div className="paths-menu-card">
                <div className="card-title-row">
                  <h3>Matched Paths</h3>
                  <button onClick={() => setShowCompareModal(true)} className="btn-tune-trigger">Tune weights</button>
                </div>
                <div className="paths-menu-list">
                  {recommendations.map((rec) => (
                    <button 
                      key={rec.id} 
                      onClick={() => setActiveRecId(rec.id)}
                      className={`path-select-item ${rec.id === activeRecId ? 'active' : ''}`}
                    >
                      <div className="path-select-info">
                        <span className="path-select-title">{rec.role.name}</span>
                        <span className="path-select-badge">Fit similarity</span>
                      </div>
                      <div className="fit-score-bubble">
                        {getDynamicFitScore(rec.role.name, rec.fitScore)}%
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Center Canvas: Graphical SVG Node Roadmap */}
            <div className="dashboard-center-canvas">
              <div className="canvas-header">
                <h2>Roadmap Graph</h2>
                <div className="canvas-view-toggle">
                  <button 
                    onClick={() => setCanvasView('graph')}
                    className={`toggle-btn ${canvasView === 'graph' ? 'active' : ''}`}
                  >
                    Graph Canvas
                  </button>
                  <button 
                    onClick={() => setCanvasView('timeline')}
                    className={`toggle-btn ${canvasView === 'timeline' ? 'active' : ''}`}
                  >
                    Curriculum List
                  </button>
                </div>
              </div>

              {canvasView === 'graph' ? (
                (() => {
                  // Generate snake coordinates for each phase
                  const nodesCoords = activeRec.phases.map((_, pIdx) => {
                    const row = Math.floor(pIdx / 4);
                    const col = pIdx % 4;
                    const actualCol = row % 2 === 0 ? col : 3 - col;
                    
                    const leftVal = 100 + actualCol * 200; // 100, 300, 500, 700
                    const wave = (actualCol % 2 === 0) ? 30 : -30;
                    const topVal = 100 + row * 180 + wave;
                    return { x: leftVal, y: topVal };
                  });

                  // Construct dynamic Bezier path connecting all coordinates
                  let pathD = '';
                  nodesCoords.forEach((coord, idx) => {
                    if (idx === 0) {
                      pathD = `M ${coord.x} ${coord.y}`;
                    } else {
                      const prev = nodesCoords[idx - 1];
                      const prevRow = Math.floor((idx - 1) / 4);
                      const currRow = Math.floor(idx / 4);
                      
                      let cp1x, cp1y, cp2x, cp2y;
                      if (prevRow === currRow) {
                        // Same row, curve horizontally
                        const direction = coord.x > prev.x ? 1 : -1;
                        cp1x = prev.x + 80 * direction;
                        cp1y = prev.y;
                        cp2x = coord.x - 80 * direction;
                        cp2y = coord.y;
                      } else {
                        // Vertical row change transition
                        cp1x = prev.x;
                        cp1y = prev.y + 80;
                        cp2x = coord.x;
                        cp2y = coord.y - 80;
                      }
                      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${coord.x} ${coord.y}`;
                    }
                  });

                  const maxX = Math.max(...nodesCoords.map(c => c.x)) + 150;
                  const maxY = Math.max(...nodesCoords.map(c => c.y)) + 150;

                  return (
                    <div className="graph-canvas-wrapper">
                      {/* Draw Bezier lines between phase nodes */}
                      <svg className="graph-lines" style={{ width: `${maxX}px`, height: `${maxY}px` }}>
                        {pathD && (
                          <path 
                            d={pathD} 
                            fill="none" 
                            stroke="rgba(89, 103, 242, 0.25)" 
                            strokeWidth="6" 
                            strokeLinecap="round"
                          />
                        )}
                      </svg>
                      
                      <div className="graph-nodes-grid" style={{ width: `${maxX}px`, height: `${maxY}px` }}>
                        {activeRec.phases.map((phase, pIdx) => {
                          const doneCount = phase.items.filter(i => i.done).length;
                          const isCompleted = doneCount === phase.items.length && phase.items.length > 0;
                          const isActive = !isCompleted && (pIdx === 0 || activeRec.phases[pIdx-1].items.every(i => i.done));
                          
                          const coord = nodesCoords[pIdx] || { x: 100, y: 100 };

                          let nodeClass = '';
                          if (isCompleted) nodeClass = 'completed';
                          else if (isActive) nodeClass = 'active';

                          return (
                            <div 
                              key={phase.id} 
                              className={`graph-node ${nodeClass} ${pIdx === selectedPhaseIdx ? 'active' : ''}`}
                              onClick={() => setSelectedPhaseIdx(pIdx)}
                              style={{left: `${coord.x}px`, top: `${coord.y}px`, cursor: 'pointer'}}
                            >
                              <div className="node-marker">
                                {isCompleted ? (
                                  <svg viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <span>0{pIdx + 1}</span>
                                )}
                              </div>
                              <span className="node-title">{phase.phaseName.split(':')[1] || phase.phaseName}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="timeline-view-container">
                  {activeRec.phases.map((phase, pIdx) => {
                    const doneCount = phase.items.filter(i => i.done).length;
                    const isCompleted = doneCount === phase.items.length && phase.items.length > 0;
                    
                    let phaseClass = '';
                    if (isCompleted) phaseClass = 'completed';
                    else if (pIdx === selectedPhaseIdx || (pIdx === 0 || activeRec.phases[pIdx-1].items.every(i => i.done))) phaseClass = 'active';

                    return (
                      <div 
                        key={phase.id} 
                        className={`timeline-phase-row ${phaseClass}`}
                        onClick={() => setSelectedPhaseIdx(pIdx)}
                        style={{cursor: 'pointer'}}
                      >
                        <div className="timeline-phase-marker">
                          <div className="timeline-dot">0{pIdx+1}</div>
                          {pIdx < activeRec.phases.length - 1 && <div className="timeline-connector"></div>}
                        </div>
                        <div className="timeline-phase-card">
                          <h3>{phase.phaseName}</h3>
                          <p>{doneCount} of {phase.items.length} checklist goals completed.</p>
                        </div>
                      </div>
                    );
                  })}

                </div>
              )}
            </div>

            {/* Right Rail: Inspector Card */}
            <div className="dashboard-right-rail">
              <div className="inspector-card">
                <div className="inspector-header">
                  <span className={`fit-badge badge-strong`}>
                    Fit Match
                  </span>
                  <button 
                    onClick={() => setSavedPaths({ ...savedPaths, [activeRec.id]: !savedPaths[activeRec.id] })}
                    className={`btn-save-path ${savedPaths[activeRec.id] ? 'saved' : ''}`}
                    title="Bookmark learning path"
                  >
                    <svg className="bookmark-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                </div>

                <h2 className="inspector-title">{activeRec.role.name}</h2>
                <p className="inspector-summary">{activeRec.role.description}</p>

                {/* Explanations Accordion */}
                <div className={`accordion-section ${expandedSections.description ? 'active' : ''}`}>
                  <div 
                    className="accordion-trigger"
                    onClick={() => setExpandedSections({ ...expandedSections, description: !expandedSections.description })}
                  >
                    Why this path fits you
                  </div>
                  <div className="accordion-content">
                    <p>{activeRec.explanation}</p>
                  </div>
                </div>

                {/* Skill Bridge Accordion */}
                <div className="accordion-section active">
                  <div className="accordion-trigger">
                    Your Skill Gaps Check
                  </div>
                  <div className="accordion-content" style={{display: 'block'}}>
                    <div className="skills-bridge-group">
                      <span className="bridge-title">Acquired Skills</span>
                      <div className="skills-chips-wrapper">
                        {skills.filter(s => activeRec.role.requiredSkills.includes(s)).map((skill, idx) => (
                          <span key={idx} className="skill-pill pill-overlap">{skill}</span>
                        ))}
                        {skills.filter(s => activeRec.role.requiredSkills.includes(s)).length === 0 && (
                          <span style={{fontSize: '0.8rem', color: 'var(--slate-400)'}}>None matching yet.</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="skills-bridge-group">
                      <span className="bridge-title">Missing Target Gaps</span>
                      <div className="skills-chips-wrapper">
                        {activeRec.role.requiredSkills.filter(s => !skills.includes(s)).map((skill, idx) => (
                          <span key={idx} className="skill-pill pill-gap">{skill}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Tradeoffs Accordion */}
                <div className={`accordion-section ${expandedSections.tradeoffs ? 'active' : ''}`}>
                  <div 
                    className="accordion-trigger"
                    onClick={() => setExpandedSections({ ...expandedSections, tradeoffs: !expandedSections.tradeoffs })}
                  >
                    Career Attributes Match
                  </div>
                  <div className="accordion-content">
                    <ul className="tradeoffs-list">
                      <li>ðŸš€ <strong>Learning Curve Speed:</strong> Quick transition path (Avg 4 months)</li>
                      <li>ðŸ’° <strong>Entry Income Estimate:</strong> Competitive starting salaries</li>
                      <li>ðŸ› ï¸ <strong>Job market density:</strong> Highly requested role across India startups</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Strip: Weekly Curriculum Action Items Checklist */}
            <div className="dashboard-bottom-strip">
              <div className="strip-header" style={{flexDirection: 'column', alignItems: 'flex-start', gap: '12px'}}>
                <div className="strip-header-title" style={{width: '100%', justifyContent: 'space-between'}}>
                  <h3>
                    Action Items â€” {activeRec.phases[selectedPhaseIdx]?.phaseName || activeRec.phases[0]?.phaseName}
                  </h3>
                  <span className="strip-hours-est">Est: {hoursPerWeek} hrs study commitment</span>
                </div>
                
                {/* Phase Selection Tabs */}
                <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px'}}>
                  {activeRec.phases.map((phase, pIdx) => {
                    const doneCount = phase.items.filter(i => i.done).length;
                    const isCompleted = doneCount === phase.items.length && phase.items.length > 0;
                    return (
                      <button
                        key={phase.id || pIdx}
                        onClick={() => setSelectedPhaseIdx(pIdx)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '16px',
                          fontSize: '0.8rem',
                          fontWeight: pIdx === selectedPhaseIdx ? '600' : '400',
                          backgroundColor: pIdx === selectedPhaseIdx ? 'var(--path-indigo)' : 'var(--slate-800)',
                          color: '#fff',
                          border: isCompleted ? '1px solid var(--warm-teal)' : '1px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {isCompleted && 'âœ“ '}0{pIdx + 1}: {phase.phaseName.split(':')[1] || phase.phaseName} ({doneCount}/{phase.items.length})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="weekly-actions-list">
                {(activeRec.phases[selectedPhaseIdx]?.items || activeRec.phases[0]?.items || []).map((item) => (
                  <div 
                    key={item.id} 
                    className={`action-checkbox-card ${item.done ? 'completed' : ''}`}
                    onClick={() => handleToggleItem(item.id)}
                  >
                    <div className="custom-chk-box"></div>
                    <div className="action-card-text">
                      <span className="action-title-label">{item.title}</span>
                      <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                        <span className="action-est-tag">{item.estHours} hrs</span>
                        {item.resourceUrl && (
                          <a 
                            href={item.resourceUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="action-link-res"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Source Resource â†—
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </main>

          {/* Floating Conversational Refinement Panel */}
          <div className={`chat-refinement-container ${chatOpen ? 'open-chat' : ''}`}>
            <div className="chat-header" onClick={() => setChatOpen(!chatOpen)}>
              <div className="chat-header-title-row">
                <span className="chat-indicator-dot"></span>
                <span>Refinement chat agent</span>
              </div>
              <button className="chat-minimize-btn">â–¼</button>
            </div>
            
            {chatOpen && (
              <div className="chat-body">
                <div className="chat-messages">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`chat-msg ${msg.sender === 'user' ? 'user-msg' : 'ai-msg'}`}>
                      {msg.text}
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSendChat} className="chat-input-row">
                  <input 
                    type="text" 
                    id="chat-input-text" 
                    placeholder="Ask e.g. 'I don't want to code'..." 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <button type="submit" className="chat-send-btn">Send</button>
                </form>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================== PATH COMPARISON MODAL ========================================== */}
      {showCompareModal && (
        <div className="modal-backdrop active">
          <div className="modal-content-wrapper">
            <div className="modal-header">
              <h2>Career Path Priority Compare</h2>
              <button onClick={() => setShowCompareModal(false)} className="btn-close-modal">Ã—</button>
            </div>
            
            <div className="compare-layout">
              {/* Tuner Left rail */}
              <div className="priority-tuner-panel">
                <h3>Priority weights</h3>
                <p className="tuner-desc">Recalculate dynamic fit metrics by adjusting sliders to reflect your target priorities.</p>
                
                <div className="tuner-sliders-list">
                  {Object.keys(tunerWeights).map((key) => (
                    <div key={key} className="tuner-slider-group">
                      <div className="slider-labels">
                        <span className="slider-title">{key.toUpperCase()}</span>
                        <span className="slider-val">{tunerWeights[key]}</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        value={tunerWeights[key]}
                        onChange={(e) => {
                          setTunerWeights({
                            ...tunerWeights,
                            [key]: parseInt(e.target.value)
                          });
                        }}
                        className="tuner-slider"
                      />
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowCompareModal(false)} className="btn btn-primary btn-full-width">Apply tuner priorities</button>
              </div>

              {/* Comparison columns */}
              <div className="compare-columns-grid">
                {recommendations.map((rec) => {
                  const dynamicScore = getDynamicFitScore(rec.role.name, rec.fitScore);
                  return (
                    <div key={rec.id} className="compare-column-card">
                      <div className="compare-card-header">
                        <h3 className="compare-card-title">{rec.role.name}</h3>
                        <p className="compare-card-summary">{rec.role.description}</p>
                      </div>

                      <div className="compare-field">
                        <span className="compare-field-label">Similarity Fit</span>
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                          <span className="compare-field-val fit-est">{dynamicScore}%</span>
                        </div>
                        <div className="compare-bar-bg">
                          <div className="compare-bar-fill" style={{width: `${dynamicScore}%`}}></div>
                        </div>
                      </div>

                      <div className="compare-field">
                        <span className="compare-field-label">Required Skills Count</span>
                        <span className="compare-field-val">{rec.role.requiredSkills.length} Core tags</span>
                      </div>

                      <div className="compare-field">
                        <span className="compare-field-label">Acquired Skills match</span>
                        <div className="compare-chips-list">
                          {skills.filter(s => rec.role.requiredSkills.includes(s)).map((s, idx) => (
                            <span key={idx} className="compare-chip">{s}</span>
                          ))}
                          {skills.filter(s => rec.role.requiredSkills.includes(s)).length === 0 && (
                            <span style={{fontSize: '0.8rem', color: 'var(--slate-400)'}}>0 matches</span>
                          )}
                        </div>
                      </div>

                      <div className="compare-field">
                        <span className="compare-field-label">Source Ingestion</span>
                        <span className="compare-field-val" style={{fontFamily: 'var(--font-mono)', fontSize: '0.75rem'}}>
                          {rec.role.source.toUpperCase()} API
                        </span>
                      </div>

                      <div className="compare-card-actions">
                        <button 
                          onClick={() => {
                            setActiveRecId(rec.id);
                            setShowCompareModal(false);
                          }} 
                          className="btn btn-secondary btn-full-width"
                        >
                          Select path
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
