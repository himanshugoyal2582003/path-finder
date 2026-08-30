const express = require('express');
const store = require('../store');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    const profile = await store.findProfileByUserId(req.user.userId);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.status(200).json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update profile
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { skills, interests, goalText, hoursPerWeek, timelineMonths, budgetPref } = req.body;

    if (!skills || !Array.isArray(skills)) {
      return res.status(400).json({ error: 'Skills must be an array of strings' });
    }
    if (!interests || !Array.isArray(interests)) {
      return res.status(400).json({ error: 'Interests must be an array of strings' });
    }
    if (!goalText) {
      return res.status(400).json({ error: 'Goal text is required' });
    }

    const profile = await store.upsertProfile(req.user.userId, {
      skills,
      interests,
      goalText,
      hoursPerWeek: parseInt(hoursPerWeek) || 10,
      timelineMonths: parseInt(timelineMonths) || 6,
      budgetPref: budgetPref || 'free'
    });

    res.status(200).json(profile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
