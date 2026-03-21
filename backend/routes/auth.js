const router = require('express').Router();
const User = require('../models/User');

// Seed sample users
const seedSampleUsers = async () => {
  const samples = [
    { username: 'Alice', email: 'alice@test.com', password: 'password123' },
    { username: 'Bob', email: 'bob@test.com', password: 'password123' },
    { username: 'Charlie', email: 'charlie@test.com', password: 'password123' },
    { username: 'Dave', email: 'dave@test.com', password: 'password123' }
  ];

  try {
    for (const u of samples) {
      let existing = await User.findOne({ username: u.username });
      if (existing) {
        // Update user if they don't have the newly required fields
        if (existing.email !== u.email || existing.password !== u.password) {
          existing.email = u.email;
          existing.password = u.password;
          await existing.save();
        }
      } else {
        const newUser = new User(u);
        await newUser.save();
      }
    }
    console.log("Sample users verified and seeded.");
  } catch (err) {
    console.error("Error seeding sample users:", err);
  }
};

// Call the seed function
seedSampleUsers();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }

    const existingUser = await User.findOne({ $or: [{ email: email.trim() }, { username: username.trim() }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    const user = new User({ username: username.trim(), email: email.trim(), password });
    await user.save();

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.trim() });
    
    // Simple verification
    if (!user || user.password !== password) {
       return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
