const express = require('express');
const store = require('../store');
const authMiddleware = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// Detailed weekly action items per role — used when AI service is unavailable
const ROLE_WEEKLY_ACTIONS = {
  'Product Designer': {
    'Phase 1: Foundation': [
      { title: "Read 'Refactoring UI' chapters on layout & typography", resourceUrl: 'https://refactoringui.com', estHours: 3 },
      { title: "Complete Figma onboarding playground tutorial", resourceUrl: 'https://figma.com', estHours: 2 },
      { title: "Create a typography scale for a personal website project", resourceUrl: 'https://type-scale.com', estHours: 3 }
    ],
    'Phase 2: Core Skills': [
      { title: "Build a high-fidelity interactive mobile prototype in Figma", resourceUrl: 'https://figma.com', estHours: 6 },
      { title: "Draft a research plan with 5 user questions for a food app", resourceUrl: 'https://medium.com/ux', estHours: 4 },
      { title: "Synthesize findings into a simple Persona PDF template", resourceUrl: 'https://figma.com/templates', estHours: 5 }
    ],
    'Phase 3: Applied Practice': [
      { title: "Set up a component library with 10 button states using Auto-Layout", resourceUrl: 'https://youtube.com', estHours: 6 },
      { title: "Design 3 responsive screens for a checkout landing page", resourceUrl: 'https://dribbble.com', estHours: 8 },
      { title: "Perform a cognitive walkthrough evaluation on your own design", resourceUrl: 'https://nngroup.com', estHours: 6 }
    ],
    'Phase 4: Portfolio Prep': [
      { title: "Write an 800-word case study focusing on trade-offs & decisions", resourceUrl: 'https://substack.com', estHours: 6 },
      { title: "Build and deploy a portfolio site on Framer or Notion", resourceUrl: 'https://framer.com', estHours: 8 },
      { title: "Optimize site metadata and request feedback from 2 peers", resourceUrl: 'https://linkedin.com', estHours: 4 }
    ]
  },
  'Data Analyst': {
    'Phase 1: SQL Foundations': [
      { title: "Complete SQL ZOO interactive database tutorials", resourceUrl: 'https://sqlzoo.net', estHours: 4 },
      { title: "Solve 10 medium queries on HackerRank platform", resourceUrl: 'https://hackerrank.com', estHours: 3 },
      { title: "Diagram a relational model for a school enrollment database", resourceUrl: 'https://draw.io', estHours: 3 }
    ],
    'Phase 2: BI Dashboards': [
      { title: "Connect Tableau to a public dataset and build 3 worksheets", resourceUrl: 'https://public.tableau.com', estHours: 5 },
      { title: "Design a dashboard layout on paper before implementation", resourceUrl: 'https://medium.com', estHours: 2 },
      { title: "Write a bulleted executive summary of a sales trend analysis", resourceUrl: 'https://medium.com', estHours: 5 }
    ],
    'Phase 3: Python Prep': [
      { title: "Write a Python script to import a dirty CSV and filter nulls", resourceUrl: 'https://jupyter.org', estHours: 6 },
      { title: "Merge two dataframes on an ID key and recalculate metrics", resourceUrl: 'https://pandas.pydata.org', estHours: 5 },
      { title: "Export cleaned data back to SQLite and verify schemas", resourceUrl: 'https://python.org', estHours: 5 }
    ],
    'Phase 4: Capstone Project': [
      { title: "Select a Kaggle dataset and execute 5 analytical queries", resourceUrl: 'https://kaggle.com', estHours: 6 },
      { title: "Write a detailed README describing the business problem solved", resourceUrl: 'https://github.com', estHours: 5 },
      { title: "Record a 3-minute video presentation explaining your dashboard", resourceUrl: 'https://loom.com', estHours: 3 }
    ]
  },
  'Growth Marketer': {
    'Phase 1: Marketing Funnels': [
      { title: "Map a user funnel journey from initial ad click to checkout", resourceUrl: 'https://hubspot.com', estHours: 3 },
      { title: "Draft 3 variations of landing page hero copy targeting freelancers", resourceUrl: 'https://copyhackers.com', estHours: 3 },
      { title: "Read 'Copywriting Secrets' key chapters", resourceUrl: 'https://kindle.com', estHours: 2 }
    ],
    'Phase 2: Analytics Setup': [
      { title: "Configure custom event tracking in Google Analytics sandbox", resourceUrl: 'https://skillshop.withgoogle.com', estHours: 5 },
      { title: "Draft an A/B test plan with a sample size calculator", resourceUrl: 'https://optimizely.com', estHours: 4 },
      { title: "Analyze a historical cohort chart to identify dropoff weeks", resourceUrl: 'https://excel.microsoft.com', estHours: 3 }
    ],
    'Phase 3: Acquisition Loops': [
      { title: "Draft a search engine marketing (SEM) campaign budget", resourceUrl: 'https://ads.google.com', estHours: 5 },
      { title: "Run a site audit on a local service website for SEO flaws", resourceUrl: 'https://screamingfrog.co.uk', estHours: 5 },
      { title: "Create a content outline targeting 3 core high-value keywords", resourceUrl: 'https://semrush.com', estHours: 4 }
    ],
    'Phase 4: Launch Campaign': [
      { title: "Deploy a free landing page on Carrd with signup form", resourceUrl: 'https://carrd.co', estHours: 4 },
      { title: "Write a LinkedIn post driving initial organic traffic", resourceUrl: 'https://linkedin.com', estHours: 2 },
      { title: "Build a Google Sheets report tracking CAC, CTR, and signups", resourceUrl: 'https://sheets.google.com', estHours: 4 }
    ]
  }
};

// Get active recommendations
router.get('/', authMiddleware, async (req, res) => {
  try {
    const profile = await store.findProfileByUserId(req.user.userId);
    if (!profile) {
      return res.status(404).json({ error: 'Please set up onboarding profile first.' });
    }
    const recommendations = await store.findRecommendationsByProfileId(profile.id);
    res.status(200).json(recommendations);
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Trigger generation of career path recommendations
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const profile = await store.findProfileByUserId(req.user.userId);
    if (!profile) {
      return res.status(400).json({ error: 'Please set up your profile first.' });
    }

    // Try FastAPI AI service first
    let aiServiceData = null;
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    try {
      console.log(`Connecting to FastAPI AI Service at ${aiServiceUrl}/api/agent/pipeline`);
      const response = await axios.post(`${aiServiceUrl}/api/agent/pipeline`, {
        skills: profile.skills,
        interests: profile.interests,
        goalText: profile.goalText,
        hoursPerWeek: profile.hoursPerWeek,
        timelineMonths: profile.timelineMonths,
        budgetPref: profile.budgetPref
      }, { timeout: 120000 });  // 120s to allow dynamic roadmap generation

      aiServiceData = response.data;
      console.log('AI Service responded successfully');
    } catch (apiError) {
      console.warn('AI Service unavailable, using local fallback scoring.', apiError.message);
    }

    // Clear old recommendations
    await store.deleteRecommendationsByProfileId(profile.id);

    let results = [];

    if (aiServiceData && Array.isArray(aiServiceData.recommendations)) {
      // Use AI service results
      for (const rec of aiServiceData.recommendations) {
        const role = await store.upsertRole({
          name: rec.roleName,
          description: rec.description,
          requiredSkills: rec.requiredSkills,
          source: 'ai-service',
          embedding: []
        });

        const recommendation = await store.createRecommendation({
          profileId: profile.id,
          roleId: role.id,
          fitScore: rec.fitScore,
          explanation: rec.explanation,
          phases: rec.phases.map(p => ({
            phaseName: p.phaseName,
            items: p.items.map(i => ({
              title: i.title,
              resourceUrl: i.resourceUrl || '',
              estHours: i.estHours || 4
            }))
          }))
        });
        results.push(recommendation);
      }
    } else {
      // LOCAL FALLBACK: Compute similarity and build roadmaps from seed data
      const roles = await store.findAllRoles();
      const userSkillsSet = new Set(profile.skills.map(s => s.toLowerCase()));
      const userInterestsSet = new Set(profile.interests.map(i => i.toLowerCase()));

      for (const role of roles) {
        // Jaccard overlap scoring
        let matchedCount = 0;
        role.requiredSkills.forEach(s => {
          if (userSkillsSet.has(s.toLowerCase())) matchedCount++;
        });

        // Interest affinity boost
        let interestBoost = 0;
        if (role.name === 'Product Designer') {
          if (userInterestsSet.has('visual design') || userInterestsSet.has('user empathy')) interestBoost += 15;
        } else if (role.name === 'Data Analyst') {
          if (userInterestsSet.has('data analysis') || userInterestsSet.has('problem solving')) interestBoost += 15;
        } else if (role.name === 'Growth Marketer') {
          if (userInterestsSet.has('writing') || userInterestsSet.has('experimentation')) interestBoost += 15;
        }

        const skillScore = role.requiredSkills.length > 0 ? (matchedCount / role.requiredSkills.length) * 70 : 0;
        const fitScore = Math.min(Math.max(Math.round(skillScore + interestBoost + 45), 62), 97);

        // Generate explanation
        const matchedSkills = profile.skills.filter(s => role.requiredSkills.map(r => r.toLowerCase()).includes(s.toLowerCase()));
        const missingSkills = role.requiredSkills.filter(s => !userSkillsSet.has(s.toLowerCase()));
        let explanation = '';
        if (fitScore >= 85) {
          explanation = `Strong alignment! Your skills in ${matchedSkills.slice(0, 2).join(' and ')} map directly to this role. Focus on filling gaps in ${missingSkills.slice(0, 2).join(' and ')} to be job-ready within ${profile.timelineMonths} months.`;
        } else if (fitScore >= 72) {
          explanation = `Promising fit based on overlapping competencies. Building ${missingSkills.slice(0, 2).join(' and ')} will significantly boost your readiness for ${role.name} positions.`;
        } else {
          explanation = `Exploratory path — requires foundational work across ${missingSkills.slice(0, 3).join(', ')}. Your goal "${profile.goalText}" could benefit from this direction with dedicated study.`;
        }

        // Build phases from detailed weekly actions
        const weeklyActions = ROLE_WEEKLY_ACTIONS[role.name] || {};
        const phases = Object.entries(weeklyActions).map(([phaseName, items]) => ({
          phaseName,
          items: items.map(item => ({
            title: item.title,
            resourceUrl: item.resourceUrl,
            estHours: profile.hoursPerWeek < 8 ? Math.max(2, Math.round(item.estHours * 0.7)) : item.estHours
          }))
        }));

        const recommendation = await store.createRecommendation({
          profileId: profile.id,
          roleId: role.id,
          fitScore,
          explanation,
          phases
        });
        results.push(recommendation);
      }
    }

    res.status(200).json(results);
  } catch (error) {
    console.error('Generate recommendations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dynamic profile refinement and roadmap regeneration
router.post('/refine', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required for refinement.' });
    }

    const profile = await store.findProfileByUserId(req.user.userId);
    if (!profile) {
      return res.status(400).json({ error: 'Please set up your profile first.' });
    }

    // 1. Call FastAPI Refine Agent
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    console.log(`Connecting to FastAPI Refine Agent at ${aiServiceUrl}/api/agent/refine`);
    
    let refineData;
    try {
      const refineRes = await axios.post(`${aiServiceUrl}/api/agent/refine`, {
        skills: profile.skills,
        interests: profile.interests,
        goalText: profile.goalText,
        hoursPerWeek: profile.hoursPerWeek,
        timelineMonths: profile.timelineMonths,
        message
      }, { timeout: 35000 });
      refineData = refineRes.data;
    } catch (refineErr) {
      console.warn('AI Refine service failed, using fallback rules.', refineErr.message);
      // Backend fallback rules mimicking FastAPI fallback
      refineData = {
        reply: "AI refinement service unavailable. Applied local rule adjustments.",
        skills: profile.skills,
        interests: profile.interests,
        goalText: profile.goalText,
        hoursPerWeek: profile.hoursPerWeek,
        timelineMonths: profile.timelineMonths
      };
      const lower = message.toLowerCase();
      if (lower.includes('code') || lower.includes('coding') || lower.includes('programming')) {
        refineData.skills = profile.skills.filter(s => !['javascript', 'python', 'sql'].includes(s.toLowerCase()));
        if (!refineData.interests.includes('Visual Design')) refineData.interests.push('Visual Design');
        refineData.goalText = "Design user interfaces and user experience without deep programming";
      } else if (lower.includes('hours') || lower.includes('time') || lower.includes('study')) {
        refineData.hoursPerWeek = Math.max(4, profile.hoursPerWeek - 4);
        refineData.timelineMonths = Math.min(24, profile.timelineMonths + 4);
      }
    }

    // 2. Save the updated profile values back to the DB
    const updatedProfile = await store.upsertProfile(req.user.userId, {
      skills: refineData.skills,
      interests: refineData.interests,
      goalText: refineData.goalText,
      hoursPerWeek: refineData.hoursPerWeek,
      timelineMonths: refineData.timelineMonths,
      budgetPref: profile.budgetPref
    });

    // 3. Regenerate recommendations using the new profile values
    let aiServiceData = null;
    try {
      console.log(`Regenerating recommendations at ${aiServiceUrl}/api/agent/pipeline`);
      const response = await axios.post(`${aiServiceUrl}/api/agent/pipeline`, {
        skills: updatedProfile.skills,
        interests: updatedProfile.interests,
        goalText: updatedProfile.goalText,
        hoursPerWeek: updatedProfile.hoursPerWeek,
        timelineMonths: updatedProfile.timelineMonths,
        budgetPref: updatedProfile.budgetPref
      }, { timeout: 120000 });  // 120s to allow dynamic roadmap generation
      aiServiceData = response.data;
    } catch (apiError) {
      console.warn('AI Service pipeline failed during refinement, using fallback scoring.', apiError.message);
    }

    // Clear old recommendations
    await store.deleteRecommendationsByProfileId(updatedProfile.id);

    let results = [];
    if (aiServiceData && Array.isArray(aiServiceData.recommendations)) {
      for (const rec of aiServiceData.recommendations) {
        const role = await store.upsertRole({
          name: rec.roleName,
          description: rec.description,
          requiredSkills: rec.requiredSkills,
          source: 'ai-service',
          embedding: []
        });

        const recommendation = await store.createRecommendation({
          profileId: updatedProfile.id,
          roleId: role.id,
          fitScore: rec.fitScore,
          explanation: rec.explanation,
          phases: rec.phases.map(p => ({
            phaseName: p.phaseName,
            items: p.items.map(i => ({
              title: i.title,
              resourceUrl: i.resourceUrl || '',
              estHours: i.estHours || 4
            }))
          }))
        });
        results.push(recommendation);
      }
    } else {
      // Local fallback generation
      const roles = await store.findAllRoles();
      const userSkillsSet = new Set(updatedProfile.skills.map(s => s.toLowerCase()));
      const userInterestsSet = new Set(updatedProfile.interests.map(i => i.toLowerCase()));

      for (const role of roles) {
        let matchedCount = 0;
        role.requiredSkills.forEach(s => {
          if (userSkillsSet.has(s.toLowerCase())) matchedCount++;
        });

        let interestBoost = 0;
        if (role.name === 'Product Designer') {
          if (userInterestsSet.has('visual design') || userInterestsSet.has('user empathy')) interestBoost += 15;
        } else if (role.name === 'Data Analyst') {
          if (userInterestsSet.has('data analysis') || userInterestsSet.has('problem solving')) interestBoost += 15;
        } else if (role.name === 'Growth Marketer') {
          if (userInterestsSet.has('writing') || userInterestsSet.has('experimentation')) interestBoost += 15;
        }

        const skillScore = role.requiredSkills.length > 0 ? (matchedCount / role.requiredSkills.length) * 70 : 0;
        const fitScore = Math.min(Math.max(Math.round(skillScore + interestBoost + 45), 62), 97);

        const matchedSkills = updatedProfile.skills.filter(s => role.requiredSkills.map(r => r.toLowerCase()).includes(s.toLowerCase()));
        const missingSkills = role.requiredSkills.filter(s => !userSkillsSet.has(s.toLowerCase()));
        let explanation = '';
        if (fitScore >= 85) {
          explanation = `Strong alignment! Your skills in ${matchedSkills.slice(0, 2).join(' and ')} map directly to this role. Focus on filling gaps in ${missingSkills.slice(0, 2).join(' and ')} to be job-ready within ${updatedProfile.timelineMonths} months.`;
        } else if (fitScore >= 72) {
          explanation = `Promising fit based on overlapping competencies. Building ${missingSkills.slice(0, 2).join(' and ')} will significantly boost your readiness for ${role.name} positions.`;
        } else {
          explanation = `Exploratory path — requires foundational work across ${missingSkills.slice(0, 3).join(', ')}. Your goal "${updatedProfile.goalText}" could benefit from this direction with dedicated study.`;
        }

        const weeklyActions = ROLE_WEEKLY_ACTIONS[role.name] || {};
        const phases = Object.entries(weeklyActions).map(([phaseName, items]) => ({
          phaseName,
          items: items.map(item => ({
            title: item.title,
            resourceUrl: item.resourceUrl,
            estHours: updatedProfile.hoursPerWeek < 8 ? Math.max(2, Math.round(item.estHours * 0.7)) : item.estHours
          }))
        }));

        const recommendation = await store.createRecommendation({
          profileId: updatedProfile.id,
          roleId: role.id,
          fitScore,
          explanation,
          phases
        });
        results.push(recommendation);
      }
    }

    // 4. Return reply, updated profile, and new recommendations
    res.status(200).json({
      reply: refineData.reply,
      profile: updatedProfile,
      recommendations: results
    });

  } catch (error) {
    console.error('Refine recommendations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
