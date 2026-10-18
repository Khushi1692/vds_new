const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: { type: String, default: '', trim: true },
  address: { type: String, default: '', trim: true },
  contactNumber: { type: String, default: '', trim: true },
}, { _id: true, timestamps: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  phone: { type: String, default: '', trim: true },
  companyName: { type: String, default: '', trim: true },
  companyAbn: { type: String, default: '', trim: true },
  stores: [storeSchema],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
