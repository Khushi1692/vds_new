const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orderId: { type: String },
  stripeSessionId: { type: String, required: true, unique: true },
  customerEmail: { type: String, required: true },
  customerName: { type: String },
  customerPhone: { type: String },
  specialInstructions: { type: String },
  items: [{
    productId: { type: String, required: true },
    quantity: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true }, // in cents
  currency: { type: String, default: 'aud' },
  paymentStatus: { type: String, required: true }, // 'paid', 'unpaid'
  shippingAddress: { type: Object }, // Address object from Stripe
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
