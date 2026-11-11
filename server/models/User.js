const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  country: { type: String, default: 'Nigeria' },
  age: Number,
  state: String,
  street: String,
  gender: { type: String, default: 'Male' },
  location: String,
  bio: String,
  purpose: String,

  lastSeenMarket: { type: Date, default: new Date(0) },
  lastSeenBuyers: { type: Date, default: new Date(0) },
  lastSeenSellers: { type: Date, default: new Date(0) },
  avatar: { type: String, default: '' },
  cover: { type: String, default: '' },
  profileComplete: { type: Boolean, default: false },
  joined: { type: String, default: () => new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);