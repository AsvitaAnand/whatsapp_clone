const router = require('express').Router();
const User = require('../models/User');

// Login or Register (simple identification by username)
router.post('/login', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || username.trim() === '') {
      return res.status(400).json({ error: 'Username is required' });
    }

    let user = await User.findOne({ username: username.trim() });
    
    // If user doesn't exist, create one
    if (!user) {
      user = new User({ username: username.trim() });
      await user.save();
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
