const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  good: { type: mongoose.Schema.Types.ObjectId, ref: 'Good', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  stars: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, required: true, trim: true, maxlength: 500 },
}, { timestamps: true });

ReviewSchema.index({ good: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);