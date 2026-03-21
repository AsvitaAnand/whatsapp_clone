const express = require('express');
const router = express.Router();
const Status = require('../models/Status');

// Create a new status
router.post('/', async (req, res) => {
  try {
    const { userId, type, content, backgroundColor } = req.body;
    
    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const newStatus = new Status({
      user: userId,
      type,
      content,
      backgroundColor,
      expiresAt
    });

    const savedStatus = await newStatus.save();
    res.status(201).json(savedStatus);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get all active statuses grouped by user
router.get('/', async (req, res) => {
  try {
    const cutoff = new Date();
    
    // Sort by createdAt ascending so the viewer runs through them oldest to newest
    const statuses = await Status.find({ expiresAt: { $gt: cutoff } })
      .populate('user', 'username profilePic')
      .sort({ createdAt: 1 });

    // Group by user
    const grouped = statuses.reduce((acc, status) => {
      const userId = status.user._id.toString();
      if (!acc[userId]) {
        acc[userId] = {
          user: status.user,
          items: []
        };
      }
      acc[userId].items.push(status);
      return acc;
    }, {});

    // Return as array
    res.status(200).json(Object.values(grouped));
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
