const router = require('express').Router();
const User = require('../models/User');
const Message = require('../models/Message');

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

// Get conversations with last messages and unread counts
router.get('/conversations/:currentUserId', async (req, res) => {
  try {
    const { currentUserId } = req.params;
    
    // 1. Get all relevant users/groups
    const query = {
      $or: [
        { _id: { $ne: currentUserId }, isGroup: { $ne: true } },
        { isGroup: true, members: currentUserId }
      ]
    };

    const users = await User.find(query).lean();
    const currentUserDoc = await User.findById(currentUserId).lean();
    const archived = (currentUserDoc?.archivedChats || []).map(id => String(id));
    const blocked = (currentUserDoc?.blockedUsers || []).map(id => String(id));
    const muted = (currentUserDoc?.mutedChats || []).map(id => String(id));
    
    // 2. For each user/group, get the last message and unread count
    const conversations = await Promise.all(users.map(async (u) => {
      let lastMessage = null;
      let unreadCount = 0;

      if (u.isGroup) {
        lastMessage = await Message.findOne({ receiverId: u._id }).sort({ createdAt: -1 }).lean();
        // Skip unread count for groups to simplify for clone, unless we have track of read per user.
      } else {
        lastMessage = await Message.findOne({
          $or: [
            { senderId: currentUserId, receiverId: u._id },
            { senderId: u._id, receiverId: currentUserId }
          ]
        }).sort({ createdAt: -1 }).lean();

        unreadCount = await Message.countDocuments({
          senderId: u._id,
          receiverId: currentUserId,
          status: { $ne: 'read' }
        });
      }

      return {
        ...u,
        lastMessage,
        unreadCount,
        isArchived: archived.includes(String(u._id)),
        isBlocked: blocked.includes(String(u._id)),
        isMuted: muted.includes(String(u._id))
      };
    }));

    // Sort by lastMessage timestamp descending
    conversations.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt || a.lastMessage.timestamp).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt || b.lastMessage.timestamp).getTime() : 0;
      if (timeA === timeB) {
         return a.username.localeCompare(b.username);
      }
      return timeB - timeA;
    });

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle chat action
router.post('/action', async (req, res) => {
  try {
    const { userId, contactId, action, value } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let arrayField = '';
    if (action === 'archive') arrayField = 'archivedChats';
    if (action === 'block') arrayField = 'blockedUsers';
    if (action === 'mute') arrayField = 'mutedChats';

    if (value) {
      if (!user[arrayField].some(id => String(id) === String(contactId))) {
        user[arrayField].push(contactId);
      }
    } else {
      user[arrayField] = user[arrayField].filter(id => String(id) !== String(contactId));
    }

    await user.save();
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
