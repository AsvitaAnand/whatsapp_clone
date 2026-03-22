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

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .populate('replyTo');

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a message via REST (Socket.IO will also handle real-time)
router.post('/', async (req, res) => {
  try {
    const { senderId, receiverId, text, type, audioData, fileData, fileName, replyTo } = req.body;
    
    if (!senderId || !receiverId) {
      return res.status(400).json({ error: 'Sender and receiver are required' });
    }

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (sender && sender.blockedUsers && sender.blockedUsers.includes(receiverId)) {
      return res.status(403).json({ error: 'You blocked this contact. Unblock to send messages.' });
    }
    if (receiver && receiver.blockedUsers && receiver.blockedUsers.includes(senderId)) {
      return res.status(403).json({ error: 'You have been blocked by this user.' });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text: text ? text.trim() : '',
      type: type || 'text',
      audioData: audioData || '',
      fileData: fileData || '',
      fileName: fileName || '',
      replyTo: replyTo || null
    });

    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Delete chat conversation
router.delete('/:userId1/:userId2', async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const query = {
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    };
    await Message.deleteMany(query);
    res.status(200).json({ message: 'Chat deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit a message
router.put('/:messageId', async (req, res) => {
  try {
    const { text } = req.body;
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    
    message.text = text;
    message.isEdited = true;
    const updatedMessage = await message.save();
    res.status(200).json(updatedMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a single message for everyone
router.delete('/:messageId', async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    
    message.text = '🚫 This message was deleted';
    message.isDeleted = true;
    message.fileData = '';
    message.audioData = '';
    message.type = 'text';

    const updatedMessage = await message.save();
    res.status(200).json(updatedMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle reaction on a message
router.put('/react/:messageId', async (req, res) => {
  try {
    const { userId, emoji } = req.body;
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    const existingReactionIndex = message.reactions.findIndex(r => String(r.user) === String(userId));
    
    if (existingReactionIndex > -1) {
      if (message.reactions[existingReactionIndex].emoji === emoji) {
        // Toggle off if same emoji
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        // Change emoji
        message.reactions[existingReactionIndex].emoji = emoji;
      }
    } else {
      // Add new
      message.reactions.push({ user: userId, emoji });
    }

    const updatedMessage = await message.save();
    res.status(200).json(updatedMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
