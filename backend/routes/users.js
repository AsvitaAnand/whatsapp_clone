const router = require('express').Router();
const User = require('../models/User');

// Get all users except the current one
router.get('/', async (req, res) => {
  try {
    const { currentUserId } = req.query;
    
    let query = {};
    if (currentUserId) {
      query = {
        $or: [
          { _id: { $ne: currentUserId }, isGroup: { $ne: true } },
          { isGroup: true, members: currentUserId }
        ]
      };
    }

    const users = await User.find(query).sort({ username: 1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new Group
router.post('/group', async (req, res) => {
  try {
    const { name, members, profilePic, admin } = req.body;
    if (!name || !members || members.length === 0) {
      return res.status(400).json({ error: 'Name and members are required' });
    }
    const newGroup = new User({
      username: name,
      isGroup: true,
      groupAdmin: admin,
      members,
      profilePic: profilePic || ''
    });
    
    try {
      await newGroup.save();
      res.status(201).json(newGroup);
    } catch (e) {
      if (e.code === 11000) {
        newGroup.username = name + ' ' + Date.now().toString().slice(-4);
        await newGroup.save();
        res.status(201).json(newGroup);
      } else {
        throw e;
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile picture
router.put('/:id', async (req, res) => {
  try {
    const { profilePic } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { profilePic },
      { new: true }
    );
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
