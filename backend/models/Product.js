const mongoose = require('mongoose');

const specSchema = new mongoose.Schema({
  label: String,
  value: String,
  detail: String
}, { _id: false });

const badgeSchema = new mongoose.Schema({
  label: String,
  desc: String,
  icon: String
}, { _id: false });

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  sku: String,
  price: Number,
  priceLabel: String,
  category: String,
  artgNumber: String,
  liveStock: Number,
  tagline: String,
  description: String,
  specs: [specSchema],
  certifications: [String],
  stockStatus: String,
  bulkOrderAvailable: Boolean,
  image: String,
  images: [String],
  featured: Boolean,
  heroQuote: String,
  badges: [badgeSchema]
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
