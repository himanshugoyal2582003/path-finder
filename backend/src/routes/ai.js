const express = require('express');
const axios = require('axios');

const router = express.Router();

const getAiServiceUrl = () => process.env.AI_SERVICE_URL || 'http://localhost:8000';

const localSkillExtract = (text) => {
  const haystack = ` ${String(text || '').toLowerCase()} `;
  const skills = [
    ['Python', ['python', 'pandas', 'numpy', 'jupyter']],
    ['JavaScript', ['javascript', 'typescript', 'react', 'node.js', 'next.js']],
    ['SQL', ['sql', 'postgres', 'mysql', 'database']],
    ['Excel', ['excel', 'spreadsheet', 'pivot table']],
    ['PowerBI/Tableau', ['power bi', 'powerbi', 'tableau', 'dashboard']],
    ['Machine Learning', ['machine learning', 'sklearn', 'model training']],
    ['Cloud', ['aws', 'azure', 'gcp', 'cloud']],
    ['DevOps', ['docker', 'kubernetes', 'ci/cd']],
    ['Figma Prototyping', ['figma', 'prototype', 'wireframe']],
    ['Visual Design', ['visual design', 'typography', 'layout']],
    ['User Research', ['user research', 'usability', 'persona']],
    ['Writing', ['writing', 'copywriting', 'documentation']],
    ['Marketing', ['marketing', 'campaign', 'growth']],
  ];

  return skills
    .filter(([, aliases]) => aliases.some((alias) => haystack.includes(alias)))
    .map(([skill]) => skill);
};

router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${getAiServiceUrl()}/health`, { timeout: 5000 });
    res.status(200).json(response.data);
  } catch (error) {
    res.status(503).json({ status: 'unavailable', error: error.message });
  }
});

router.post('/classify', async (req, res) => {
  try {
    const response = await axios.post(`${getAiServiceUrl()}/api/classify`, req.body, { timeout: 15000 });
    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 503;
    res.status(status).json(error.response?.data || { error: error.message });
  }
});

router.post('/job-description/skills', async (req, res) => {
  try {
    const response = await axios.post(`${getAiServiceUrl()}/api/job-description/skills`, req.body, { timeout: 10000 });
    res.status(200).json(response.data);
  } catch (error) {
    const { title = '', description = '' } = req.body || {};
    res.status(200).json({
      skills: localSkillExtract(`${title} ${description}`),
      source: 'backend-fallback',
      warning: error.message,
    });
  }
});

router.get('/job-market/roles', async (req, res) => {
  try {
    const response = await axios.get(`${getAiServiceUrl()}/api/job-market/roles`, { timeout: 10000 });
    res.status(200).json(response.data);
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

module.exports = router;
