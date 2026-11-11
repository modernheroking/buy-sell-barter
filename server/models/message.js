const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, default: '' },
  type: { type: String, enum: ['text', 'image', 'voice', 'file'], default: 'text' },
  fileUrl: String,
  fileName: String,
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  isSeen: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);