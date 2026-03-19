const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['text', 'audio', 'image', 'file', 'call'],
    default: 'text'
  },
  audioData: {
    type: String,
    default: ''
  },
  fileData: {
    type: String,
    default: ''
  },
  fileName: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
