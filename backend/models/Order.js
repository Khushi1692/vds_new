const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orderId: { type: String, required: true, unique: true },
  stripeSessionId: { type: String, sparse: true },
  customerEmail: { type: String, required: true },
  customerName: { type: String },
  customerPhone: { type: String },
  companyName: { type: String },
  companyAbn: { type: String },
  store: {
    name: { type: String },
    address: { type: String },
    contactNumber: { type: String }
  },
  poNumber: { type: String },
  specialInstructions: { type: String },
  items: [{
    productId: { type: String, required: true },
    name: { type: String },
    sku: { type: String },
    price: { type: Number },
    quantity: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true }, // ex-GST subtotal in cents
  subtotalExGst: { type: Number }, // in dollars
  estimatedGst: { type: Number }, // 10% in dollars
  deliveryCharge: { type: Number, default: 0 }, // consolidated delivery charge in dollars (ex-GST)
  gstAmount: { type: Number, default: 0 }, // 10% GST on taxable amount
  finalInvoiceTotal: { type: Number, default: 0 }, // subtotalExGst + deliveryCharge + gstAmount
  currency: { type: String, default: 'aud' },
  paymentMethod: { type: String, default: 'invoice' }, // 'invoice' or 'card'
  paymentStatus: { type: String, default: 'pending_invoice' }, // 'pending_invoice', 'paid', 'unpaid', 'overdue'
  orderStatus: {
    type: String,
    enum: ['pending_invoice', 'invoice_issued', 'paid', 'dispatched', 'delivered', 'cancelled'],
    default: 'pending_invoice'
  },
  invoiceNumber: { type: String },
  invoiceIssuedAt: { type: Date },
  adminNotes: { type: String, default: '' },
  shippingAddress: { type: Object },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
