const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  quoteId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  facility: { type: String },
  phone: { type: String },
  address: { type: String },
  message: { type: String },
  items: [{
    productId: { type: String, required: true },
    quantity: { type: Number, required: true }
  }],
  status: { type: String, default: 'pending' }, // e.g., 'pending', 'responded', 'closed'
}, { timestamps: true });

module.exports = mongoose.model('Quote', quoteSchema);
