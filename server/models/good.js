const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  type: String,
  src: String,
}, { _id: false });

const GoodSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },


  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sellerName: String,
  sellerUsername: String,
  sellerAvatar: String,

  sellerPhone: String,
  phone: String,

  kind: {
    type: String,
    enum: ['seller', 'buyer-request', 'barter', 'sell'],
    default: 'seller',
  },
  mode: { type: String, enum: ['Sell', 'Buy', 'Barter'], default: 'Sell' },
  status: { type: String, enum: ['active', 'completed', 'sold'], default: 'active' },

  name: { type: String, required: true },
  type: { type: String, default: 'Electronics' },
  price: { type: Number, default: 0 },
  oldPrice: { type: Number, default: null },
  condition: { type: String, default: 'New' },
  location: { type: String, required: true },
  stock: { type: Number, default: 1 },
  description: String,
  features: [String],
  images: [String],
  videos: [String],

  budgetMin: Number,
  budgetMax: Number,
  quantity: { type: Number, default: 1 },
  urgency: String,

  giveName: String,
  giveType: String,
  giveCondition: String,
  giveValue: Number,
  giveDescription: String,
  giveFeatures: [String],

  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, 
  completedAt: { type: Date, default: null },
  wantName: String,
  wantType: String,
  wantCondition: String,
  wantValue: Number,
  wantDescription: String,
  wantFeatures: [String],
  wantImages: [String],
  wantVideos: [String],
  wantMedia: [MediaSchema],
  flexible: String,
}, { timestamps: true });

module.exports = mongoose.model('Good', GoodSchema);