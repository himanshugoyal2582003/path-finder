const express = require('express');
const store = require('../store');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Toggle roadmap item completion state
router.put('/item/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedItem = await store.toggleRoadmapItem(id, req.user.userId);

    if (!updatedItem) {
      return res.status(404).json({ error: 'Roadmap item not found' });
    }

    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Toggle roadmap item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
