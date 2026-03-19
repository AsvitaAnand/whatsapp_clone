const router = require('express').Router();
const Message = require('../models/Message');
const User = require('../models/User');

// Get calls for a user
router.get('/calls/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const calls = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
      type: 'call'
    }).sort({ createdAt: -1 });
    res.status(200).json(calls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages between two users or from a group
router.get('/:userId1/:userId2', async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;

    const user2 = await User.findById(userId2);
    let query;
    if (user2 && user2.isGroup) {
      query = { receiverId: userId2 };
    } else {
      query = {
        $or: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      };
    }

    const messages = await Message.find(query).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a message via REST (Socket.IO will also handle real-time)
router.post('/', async (req, res) => {
  try {
    const { senderId, receiverId, text, type, audioData, fileData, fileName } = req.body;
    
    if (!senderId || !receiverId) {
      return res.status(400).json({ error: 'Sender and receiver are required' });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text: text ? text.trim() : '',
      type: type || 'text',
      audioData: audioData || '',
      fileData: fileData || '',
      fileName: fileName || ''
    });

    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;
