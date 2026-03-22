const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const statusRoutes = require('./routes/status');
const Message = require('./models/Message');
const User = require('./models/User'); // Added for seeding

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/status', statusRoutes);

// Database connection
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/whatsapp-clone')
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    // Auto-seed sample users for testing
    try {
      const userCount = await User.countDocuments();
      if (userCount < 4) {
        const sampleUsers = [
          { username: 'Alice', email: 'alice@test.com', profilePic: '' },
          { username: 'Bob', email: 'bob@test.com', profilePic: '' },
          { username: 'Charlie', email: 'charlie@test.com', profilePic: '' },
          { username: 'Dave', email: 'dave@test.com', profilePic: '' }
        ];
        
        for (const u of sampleUsers) {
          const exists = await User.findOne({ username: u.username });
          if (!exists) {
            await User.create(u);
          }
        }
        console.log('Sample users seeded successfully.');
      }
    } catch (err) {
      console.error('Error seeding users:', err);
    }
  })
  .catch((err) => console.log('MongoDB connection error: ', err));

// Socket.IO logic
const io = new Server(server, {
  cors: {
    origin: '*', // Allow frontend to connect
    methods: ['GET', 'POST'],
  },
});

const userSocketMap = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  const broadcastOnlineUsers = () => {
    io.emit('online_users', Array.from(userSocketMap.keys()));
  };

  socket.on('register_user', (userId) => {
    userSocketMap.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);
    broadcastOnlineUsers();
  });

  socket.on('send_message', async (data) => {
    try {
      const receiver = await User.findById(data.receiverId);
      if (receiver && receiver.isGroup) {
        receiver.members.forEach(memberId => {
          const memberSocketId = userSocketMap.get(memberId.toString());
          // Emit to all members except the sender's current socket
          if (memberSocketId && memberSocketId !== socket.id) {
            io.to(memberSocketId).emit('receive_message', data);
          }
        });
      } else {
        const receiverSocketId = userSocketMap.get(data.receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.id}`);
    for (let [key, value] of userSocketMap.entries()) {
      if (value === socket.id) {
        userSocketMap.delete(key);
        try {
          const now = new Date();
          await User.findByIdAndUpdate(key, { lastSeen: now });
          io.emit('user_offline', { userId: key, lastSeen: now });
        } catch (err) {
          console.error(err);
        }
        broadcastOnlineUsers();
        break;
      }
    }
  });

  socket.on('mark_delivered', async (messageId, senderId) => {
    try {
      await Message.findByIdAndUpdate(messageId, { status: 'delivered' });
      const senderSocketId = userSocketMap.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit('message_status_update', { messageId, status: 'delivered' });
      }
    } catch (e) {
      console.log(e);
    }
  });

  socket.on('mark_read', async ({ messageIds, senderId }) => {
    try {
      await Message.updateMany({ _id: { $in: messageIds } }, { status: 'read' });
      const senderSocketId = userSocketMap.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit('message_status_update', { messageIds, status: 'read' });
      }
    } catch (e) {
      console.log(e);
    }
  });

  // Message actions
  const broadcastAction = async (event, data) => {
    try {
      const receiver = await User.findById(data.receiverId);
      if (receiver && receiver.isGroup) {
        receiver.members.forEach(memberId => {
          const memberSocketId = userSocketMap.get(memberId.toString());
          if (memberSocketId && memberSocketId !== socket.id) {
            io.to(memberSocketId).emit(event, data);
          }
        });
      } else {
        const receiverSocketId = userSocketMap.get(data.receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit(event, data);
        }
      }
    } catch (e) { console.error(e); }
  };

  socket.on('edit_message', (data) => broadcastAction('message_edited', data));
  socket.on('delete_message', (data) => broadcastAction('message_deleted', data));
  socket.on('react_message', (data) => broadcastAction('message_reacted', data));
  socket.on('typing', (data) => broadcastAction('typing', data));
  socket.on('stop_typing', (data) => broadcastAction('stop_typing', data));

  // WebRTC Signals
  socket.on('webrtc_offer', (data) => {
    const receiverId = userSocketMap.get(data.target);
    if(receiverId) {
      io.to(receiverId).emit('webrtc_offer', data);
    } else {
      socket.emit('call_ended', { target: data.target, reason: 'offline' });
    }
  });
  
  socket.on('webrtc_answer', (data) => {
    const receiverId = userSocketMap.get(data.target);
    if(receiverId) io.to(receiverId).emit('webrtc_answer', data);
  });

  socket.on('webrtc_ice_candidate', (data) => {
    const receiverId = userSocketMap.get(data.target);
    if(receiverId) io.to(receiverId).emit('webrtc_ice_candidate', data);
  });

  socket.on('call_ended', (data) => {
    const receiverId = userSocketMap.get(data.target);
    if(receiverId) io.to(receiverId).emit('call_ended', data);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
