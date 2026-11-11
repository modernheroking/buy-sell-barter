const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  good: { type: mongoose.Schema.Types.ObjectId, ref: 'Good', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  kind: { type: String, enum: ['sell', 'buyer-request', 'barter'], default: 'sell' },
  price: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
  sellerConfirmed: { type: Boolean, default: false },
  buyerConfirmed: { type: Boolean, default: false },
  sellerConfirmedAt: { type: Date, default: null },
  buyerConfirmedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

TransactionSchema.index({ good: 1, buyer: 1, status: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);