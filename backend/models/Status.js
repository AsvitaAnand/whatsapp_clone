const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String, // 'text' or 'image'
    enum: ['text', 'image'],
    required: true,
  },
  content: {
    type: String, // base64 string or plain text
    required: true,
  },
  backgroundColor: {
    type: String, // hex code if text
    default: '#00a884'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // Document auto-deletes when expiresAt is reached
  }
}, { timestamps: true });

module.exports = mongoose.model('Status', statusSchema);
