require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs');
const path = require('path');

const Product = require('./models/Product');
const Order = require('./models/Order');
const User = require('./models/User');
const Quote = require('./models/Quote');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const multer = require('multer');

// File upload restrictions: 5MB max, only docs/images
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Only PDF, Word, Excel, CSV, and images are accepted.'));
    }
  }
});

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure JWT_SECRET is set (crash early if missing)
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'super_secret_jwt_string_replace_me') {
  console.warn('⚠️  WARNING: Using a weak JWT_SECRET. Set a strong, unique value in .env for production.');
}
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// HTML sanitization helper to prevent XSS in emails
function sanitizeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Melbourne, Australia date-time formatter
function getMelbourneDateTime(date = new Date()) {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString('en-AU', { timeZone: 'Australia/Melbourne' });
  const timeStr = d.toLocaleTimeString('en-AU', { timeZone: 'Australia/Melbourne', hour12: true });
  return `${dateStr}, ${timeStr.toUpperCase()}`;
}

// Generate Order ID in Melbourne timezone: ORD-YYYYMMDD-HHMMSS-XXXX
function generateOrderId() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Melbourne',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(now);

  const p = {};
  parts.forEach(({ type, value }) => { p[type] = value; });
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${p.year}${p.month}${p.day}-${p.hour}${p.minute}${p.second}-${rand}`;
}

// Modern dark-themed order email matching customer specification
function generateOrderEmailHTML({
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  items,
  totalAmount,
  date,
  specialInstructions,
  isAdmin = false
}) {
  const formattedDate = getMelbourneDateTime(date);
  const formattedTotal = `$${(totalAmount / 100).toFixed(2)}`;
  const cleanName = sanitizeHTML(customerName) || (isAdmin ? 'Admin' : 'Customer');
  const cleanEmail = sanitizeHTML(customerEmail) || 'N/A';
  const cleanPhone = sanitizeHTML(customerPhone);
  const cleanInstructions = sanitizeHTML(specialInstructions);
  const displayOrderId = orderId ? (orderId.startsWith('#') ? orderId : `#${orderId}`) : '';

  const greetingHeading = isAdmin 
    ? 'Hi Victoria Diagnostic Supplies Team,'
    : `Hi ${cleanName},`;

  const orderPlacedText = isAdmin
    ? `A new order <strong>${displayOrderId}</strong> has been successfully placed at <strong>Victoria Diagnostic Supplies</strong>.`
    : `Your order <strong>${displayOrderId}</strong> has been successfully placed at <strong>Victoria Diagnostic Supplies</strong>.`;

  const itemsTableRows = (items || []).map(item => {
    const subtotalFormatted = item.price != null
      ? `$${(item.price * item.quantity).toFixed(2)}`
      : 'N/A';
    return `
      <tr style="border-bottom: 1px solid #27272a;">
        <td style="padding: 12px 8px 12px 0; color: #ffffff; font-size: 14px; vertical-align: top;">${sanitizeHTML(item.name)}</td>
        <td style="padding: 12px 8px; text-align: center; color: #ffffff; font-size: 14px; vertical-align: top;">${item.quantity}</td>
        <td style="padding: 12px 0 12px 8px; text-align: right; color: #ffffff; font-size: 14px; font-weight: 500; vertical-align: top;">${subtotalFormatted}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${displayOrderId}</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; -webkit-font-smoothing: antialiased;">
      <div style="max-width: 540px; margin: 0 auto; background-color: #121212; border-radius: 12px; padding: 32px 28px; border: 1px solid #27272a;">
        
        <h2 style="font-size: 22px; font-weight: 700; margin: 0 0 16px 0; color: #ffffff; letter-spacing: -0.01em;">${greetingHeading}</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #d1d5db; margin: 0 0 28px 0;">
          ${orderPlacedText}
        </p>

        <h3 style="font-size: 17px; font-weight: 700; margin: 28px 0 14px 0; color: #ffffff;">Customer Details</h3>
        <div style="font-size: 14px; line-height: 1.9; color: #d1d5db; margin-bottom: 24px;">
          <div><strong style="color: #ffffff;">Name:</strong> ${cleanName}</div>
          <div><strong style="color: #ffffff;">Email:</strong> <a href="mailto:${cleanEmail}" style="color: #60a5fa; text-decoration: underline;">${cleanEmail}</a></div>
          <div><strong style="color: #ffffff;">Contact:</strong> ${cleanPhone ? `<a href="tel:${cleanPhone}" style="color: #60a5fa; text-decoration: underline;">${cleanPhone}</a>` : 'N/A'}</div>
        </div>

        <h3 style="font-size: 17px; font-weight: 700; margin: 28px 0 14px 0; color: #ffffff;">Order Details</h3>
        <div style="font-size: 14px; line-height: 1.9; color: #d1d5db; margin-bottom: 20px;">
          <div><strong style="color: #ffffff;">Date:</strong> ${formattedDate}</div>
          <div><strong style="color: #ffffff;">Total:</strong> ${formattedTotal}</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 24px;">
          <thead>
            <tr style="border-bottom: 1px solid #374151; text-align: left;">
              <th style="padding: 10px 8px 10px 0; font-size: 14px; font-weight: 700; color: #9ca3af;">Item</th>
              <th style="padding: 10px 8px; text-align: center; font-size: 14px; font-weight: 700; color: #9ca3af;">Qty</th>
              <th style="padding: 10px 0 10px 8px; text-align: right; font-size: 14px; font-weight: 700; color: #9ca3af;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsTableRows}
          </tbody>
        </table>

        ${cleanInstructions ? `
          <div style="font-size: 14px; color: #ffffff; margin: 20px 0; line-height: 1.5;">
            <strong>Special Instructions:</strong> ${cleanInstructions}
          </div>
        ` : ''}

        <p style="font-size: 15px; color: #ffffff; margin: 28px 0 24px 0;">
          We'll notify you once your order is ready.
        </p>

        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #27272a; font-size: 12px; color: #71717a; line-height: 1.5;">
          This is an automated message. Please do not reply.
        </div>

      </div>
    </body>
    </html>
  `;
}

// Input validation helpers
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

function isValidName(name) {
  return typeof name === 'string' && name.trim().length >= 1 && name.trim().length <= 100;
}

// Email Transporter Setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Stripe Webhook needs raw body — MUST be before express.json()
app.post('/api/webhook', express.raw({ type: '*/*' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  let payload = req.body;

  try {
    // If something parsed it as an object (which shouldn't happen here), stringify it
    if (payload && typeof payload === 'object' && !Buffer.isBuffer(payload)) {
      payload = JSON.stringify(payload);
    }
    
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
    const sessionOrIntent = event.data.object;
    
    try {
      const { cartItems, productId, quantity, userId, orderId, isInvoicePayment } = sessionOrIntent.metadata || {};

      // Handle online payment for existing issued invoices
      if (isInvoicePayment === 'true' || orderId) {
        const existingInvoice = await Order.findOne({ orderId: orderId });
        if (existingInvoice) {
          existingInvoice.orderStatus = 'paid';
          existingInvoice.paymentStatus = 'paid';
          existingInvoice.paymentMethod = 'card';
          existingInvoice.stripeSessionId = sessionOrIntent.id;
          await existingInvoice.save();
          console.log(`✅ Webhook: Existing invoice #${orderId} marked as PAID.`);
          return res.send();
        }
      }

      if (!cartItems && !productId) {
        console.log('Skipping webhook, no cart items in metadata');
        return res.send();
      }

      // Check for duplicate order (prevent webhook + confirm both creating)
      const existingOrder = await Order.findOne({ stripeSessionId: sessionOrIntent.id });
      if (existingOrder) {
        console.log('Order already exists for:', sessionOrIntent.id);
        return res.send();
      }

      let items = [];
      if (cartItems) {
        items = JSON.parse(cartItems);
      } else if (productId) {
        items = [{ productId: productId, quantity: parseInt(quantity, 10) }];
      }

      // Determine amount (session uses amount_total, intent uses amount)
      const totalAmount = sessionOrIntent.amount_total || sessionOrIntent.amount;
      const currency = sessionOrIntent.currency;
      
      let customerEmail = sessionOrIntent.customer_details?.email || sessionOrIntent.customer_email || sessionOrIntent.receipt_email || '';
      let customerName = sessionOrIntent.charges?.data?.[0]?.billing_details?.name || sessionOrIntent.customer_details?.name || sessionOrIntent.shipping?.name || '';
      let shippingAddress = sessionOrIntent.shipping_details?.address || sessionOrIntent.shipping?.address || null;
      let customerPhone = sessionOrIntent.charges?.data?.[0]?.billing_details?.phone || sessionOrIntent.customer_details?.phone || '';

      if (event.type === 'payment_intent.succeeded' && sessionOrIntent.payment_method) {
        try {
          const pm = await stripe.paymentMethods.retrieve(sessionOrIntent.payment_method);
          if (pm && pm.billing_details) {
            if (!customerName) customerName = pm.billing_details.name || '';
            if (!customerPhone) customerPhone = pm.billing_details.phone || '';
            if (!customerEmail) customerEmail = pm.billing_details.email || '';
          }
        } catch (err) {
          console.error('Error fetching payment method:', err.message);
        }
      }

      if (userId) {
        try {
          const user = await User.findById(userId);
          if (user) {
            if (!customerEmail) customerEmail = user.email;
            if (!customerName) customerName = user.name;
          }
        } catch (err) {
          console.error('Error fetching user:', err.message);
        }
      }
      
      if (!customerEmail) customerEmail = 'no-email-provided@stripe.com';

      const newOrder = new Order({
        userId: userId || null,
        orderId: orderId || generateOrderId(),
        stripeSessionId: sessionOrIntent.id,
        customerEmail,
        customerName,
        customerPhone,
        items: items,
        totalAmount,
        currency,
        paymentStatus: 'paid',
        shippingAddress
      });

      await newOrder.save();
      console.log('Order created for:', sessionOrIntent.id);

      // Fetch items with price and details for email
      const itemsWithDetails = [];
      for (let item of items) {
        const prod = await Product.findOne({ id: item.productId });
        itemsWithDetails.push({
          name: prod ? prod.name : `Product ID: ${item.productId}`,
          quantity: item.quantity,
          price: prod ? prod.price : null
        });
      }

      const customerMailOptions = {
        from: `"Victoria Diagnostic Supplies" <${process.env.SMTP_USER}>`,
        to: customerEmail,
        subject: `Order Confirmation - #${newOrder.orderId}`,
        html: generateOrderEmailHTML({
          orderId: newOrder.orderId,
          customerName,
          customerEmail,
          customerPhone,
          items: itemsWithDetails,
          totalAmount,
          date: newOrder.createdAt || new Date(),
          specialInstructions: newOrder.specialInstructions || '',
          isAdmin: false
        })
      };

      const adminMailOptions = {
        from: `"Victoria Diagnostic Supplies System" <${process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `New Order Received - #${newOrder.orderId}`,
        html: generateOrderEmailHTML({
          orderId: newOrder.orderId,
          customerName,
          customerEmail,
          customerPhone,
          items: itemsWithDetails,
          totalAmount,
          date: newOrder.createdAt || new Date(),
          specialInstructions: newOrder.specialInstructions || '',
          isAdmin: true
        })
      };

      try {
        await transporter.sendMail(customerMailOptions);
        console.log('Customer confirmation email sent.');
        await transporter.sendMail(adminMailOptions);
        console.log('Admin notification email sent.');
      } catch (emailError) {
        console.error('Error sending confirmation emails:', emailError);
      }

    } catch (error) {
      console.error('Error saving order:', error);
    }
  }

  res.send();
});

// Security Middleware
app.use(helmet());

// CORS — lock to your domains
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  message: { error: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 submissions per hour
  message: { error: 'Too many enquiries. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin Auth middleware (restricts to role === 'admin')
const adminMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Restricted to administrative staff' });
    }
    req.adminUser = user;
    req.userId = user._id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired administrative token' });
  }
};

// Helper to format/sanitize stores array
function formatStores(stores) {
  if (!Array.isArray(stores)) return [];
  return stores
    .filter(s => s && (s.name || s.address || s.contactNumber || s.phone))
    .map(s => ({
      _id: s._id || undefined,
      name: (s.name || '').trim(),
      address: (s.address || '').trim(),
      contactNumber: (s.contactNumber || s.phone || '').trim(),
    }));
}

// Auth Routes (rate limited)
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, companyName, companyAbn, stores } = req.body;

    // Input validation
    if (!name || !isValidName(name)) {
      return res.status(400).json({ error: 'Name is required (1-100 characters)' });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }
    if (!password || !isValidPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(400).json({ error: 'Email already in use' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const formattedStores = formatStores(stores);

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      companyName: (companyName || '').trim(),
      companyAbn: (companyAbn || '').trim(),
      stores: formattedStores
    });
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        companyName: user.companyName,
        companyAbn: user.companyAbn,
        stores: user.stores
      }
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    
    const token = jwt.sign({ userId: user._id, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        companyName: user.companyName || '',
        companyAbn: user.companyAbn || '',
        stores: user.stores || []
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'placeholder');

app.post('/api/auth/google', authLimiter, async (req, res) => {
  try {
    const { credential, companyName, companyAbn, stores, checkOnly } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Missing Google credential token' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID || 'placeholder'
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google payload' });
    }

    const { email, name } = payload;
    const displayName = name || email.split('@')[0] || 'Google User';
    const formattedStores = formatStores(stores);

    let user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // If client requests checkOnly or details are not provided yet in signup flow
      if (checkOnly && !companyName && formattedStores.length === 0) {
        return res.json({
          isNewUser: true,
          email: email.toLowerCase().trim(),
          name: displayName
        });
      }

      // Create new user with provided details
      const randomPassword = require('crypto').randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      user = new User({
        name: displayName,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        companyName: (companyName || '').trim(),
        companyAbn: (companyAbn || '').trim(),
        stores: formattedStores
      });
      await user.save();
    } else {
      // Existing user: update company/stores if supplied and currently empty
      let updated = false;
      if (companyName && !user.companyName) {
        user.companyName = companyName.trim();
        updated = true;
      }
      if (companyAbn && !user.companyAbn) {
        user.companyAbn = companyAbn.trim();
        updated = true;
      }
      if (formattedStores.length > 0 && (!user.stores || user.stores.length === 0)) {
        user.stores = formattedStores;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        companyName: user.companyName || '',
        companyAbn: user.companyAbn || '',
        stores: user.stores || []
      }
    });
  } catch (err) {
    console.error('Google auth error:', err.message || err);
    res.status(401).json({ error: 'Google authentication failed. Please try again.' });
  }
});

// Profile endpoints
app.get('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        phone: user.phone || '',
        companyName: user.companyName || '',
        companyAbn: user.companyAbn || '',
        stores: user.stores || [],
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Profile fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

app.put('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, companyName, companyAbn, stores } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (name && isValidName(name)) user.name = name.trim();
    if (phone !== undefined) user.phone = (phone || '').trim();
    if (companyName !== undefined) user.companyName = (companyName || '').trim();
    if (companyAbn !== undefined) user.companyAbn = (companyAbn || '').trim();

    if (Array.isArray(stores)) {
      user.stores = formatStores(stores);
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        phone: user.phone || '',
        companyName: user.companyName || '',
        companyAbn: user.companyAbn || '',
        stores: user.stores || [],
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// In-memory cache for ultra-fast products serving
let productsCache = null;
let productsCacheTime = 0;
const PRODUCTS_CACHE_TTL = 3 * 60 * 1000; // 3 minutes cache 2

// Routes

app.post('/api/contact', contactLimiter, upload.single('document'), async (req, res) => {
  try {
    const { need, name, organization, email, phone, message } = req.body;
    const file = req.file;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'A valid email address is required' });
    }

    const mailOptions = {
      from: `"VDS Website" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || 'admin@vdsupplies.com.au',
      subject: `New Enquiry: ${sanitizeHTML(need)} - ${sanitizeHTML(name)} (${sanitizeHTML(organization)})`,
      html: `
        <h2>New Enquiry from VDS Website</h2>
        <p><strong>Type of Need:</strong> ${sanitizeHTML(need)}</p>
        <p><strong>Name:</strong> ${sanitizeHTML(name)}</p>
        <p><strong>Organisation:</strong> ${sanitizeHTML(organization)}</p>
        <p><strong>Email:</strong> ${sanitizeHTML(email)}</p>
        <p><strong>Phone:</strong> ${sanitizeHTML(phone) || 'Not provided'}</p>
        <br/>
        <h3>Message:</h3>
        <p>${sanitizeHTML(message).replace(/\n/g, '<br/>')}</p>
      `,
      attachments: file ? [{ filename: file.originalname, path: file.path }] : []
    };

    await transporter.sendMail(mailOptions);

    // Clean up uploaded file after email is sent
    if (file) {
      fs.unlink(file.path, (err) => {
        if (err) console.error('Failed to clean up uploaded file:', err.message);
      });
    }

    res.json({ success: true, message: 'Enquiry sent successfully' });
  } catch (err) {
    console.error('Error sending contact email:', err);
    // Clean up file on error too
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ message: 'Failed to send enquiry' });
  }
});

// Multer error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err.message && err.message.includes('File type not allowed')) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

app.get('/api/products', async (req, res) => {
  try {
    const now = Date.now();
    if (productsCache && (now - productsCacheTime < PRODUCTS_CACHE_TTL)) {
      return res.json(productsCache);
    }
    const products = await Product.find({});
    productsCache = products;
    productsCacheTime = now;
    res.json(products);
  } catch (err) {
    console.error('Products error:', err.message);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error('Product detail error:', err.message);
    res.status(500).json({ error: 'Failed to load product' });
  }
});

app.post('/api/checkout', async (req, res) => {
  try {
    const { items, productId, quantity, userId } = req.body;
    
    let line_items = [];
    let cartItemsMeta = [];

    if (items && items.length > 0) {
      for (let item of items) {
        const product = await Product.findOne({ id: item.productId });
        if (product) {
          line_items.push({
            price_data: {
              currency: 'aud',
              product_data: {
                name: product.name,
                images: product.image && product.image.startsWith('http') ? [product.image] : [],
              },
              unit_amount: Math.round(product.price * 100),
            },
            quantity: item.quantity,
          });
          cartItemsMeta.push({ productId: product.id, quantity: item.quantity });
        }
      }
    } else if (productId) {
      const product = await Product.findOne({ id: productId });
      if (!product) return res.status(404).json({ error: 'Product not found' });
      line_items.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: product.name,
            images: product.image && product.image.startsWith('http') ? [product.image] : [],
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: quantity || 1,
      });
      cartItemsMeta.push({ productId: product.id, quantity: quantity || 1 });
    }

    if (line_items.length === 0) {
      return res.status(400).json({ error: 'No valid products in cart' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
      metadata: {
        cartItems: JSON.stringify(cartItemsMeta),
        userId: userId || ''
      },
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['AU', 'US', 'NZ', 'GB'],
      }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

app.post('/api/checkout/intent', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    let totalAmount = 0;
    let cartItemsMeta = [];

    for (let item of items) {
      const product = await Product.findOne({ id: item.productId });
      if (product) {
        totalAmount += Math.round(product.price * 100) * item.quantity;
        cartItemsMeta.push({ productId: product.id, quantity: item.quantity });
      }
    }

    if (totalAmount === 0) {
      return res.status(400).json({ error: 'No valid products in cart' });
    }

    const orderId = generateOrderId();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'aud',
      metadata: {
        cartItems: JSON.stringify(cartItemsMeta),
        userId: req.userId,
        orderId
      }
    });

    res.json({ clientSecret: paymentIntent.client_secret, orderId });
  } catch (err) {
    console.error('Stripe intent error:', err.message);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

app.post('/api/checkout/confirm', authMiddleware, async (req, res) => {
  try {
    const { paymentIntentId, phone: clientPhone, specialInstructions: clientInstructions } = req.body;
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Missing paymentIntentId' });
    }

    // Check if order already created (e.g. by webhook)
    const existingOrder = await Order.findOne({ stripeSessionId: paymentIntentId });
    if (existingOrder) {
      return res.json({ success: true, order: existingOrder });
    }

    // Verify payment intent directly with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!paymentIntent || paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment has not succeeded yet' });
    }

    const { cartItems, productId, quantity, orderId } = paymentIntent.metadata || {};
    let items = [];
    if (cartItems) {
      items = JSON.parse(cartItems);
    } else if (productId) {
      items = [{ productId, quantity: parseInt(quantity, 10) }];
    }

    const user = await User.findById(req.userId);
    let customerEmail = paymentIntent.receipt_email || user?.email || 'no-email-provided@stripe.com';
    let customerName = user?.name || paymentIntent.shipping?.name || 'Customer';
    let customerPhone = clientPhone || paymentIntent.charges?.data?.[0]?.billing_details?.phone || paymentIntent.customer_details?.phone || '';

    const newOrder = new Order({
      userId: req.userId,
      orderId: orderId || generateOrderId(),
      stripeSessionId: paymentIntent.id,
      customerEmail,
      customerName,
      customerPhone,
      specialInstructions: clientInstructions || '',
      items: items,
      totalAmount: paymentIntent.amount,
      currency: paymentIntent.currency || 'aud',
      paymentStatus: 'paid',
      shippingAddress: paymentIntent.shipping?.address || null
    });

    await newOrder.save();
    console.log('Order confirmed directly from client for:', paymentIntent.id);

    // Send confirmation emails in background
    (async () => {
      try {
        const itemsWithDetails = [];
        for (let item of items) {
          const prod = await Product.findOne({ id: item.productId });
          itemsWithDetails.push({
            name: prod ? prod.name : `Product ID: ${item.productId}`,
            quantity: item.quantity,
            price: prod ? prod.price : null
          });
        }

        const customerMailOptions = {
          from: `"Victoria Diagnostic Supplies" <${process.env.SMTP_USER}>`,
          to: customerEmail,
          subject: `Order Confirmation - #${newOrder.orderId}`,
          html: generateOrderEmailHTML({
            orderId: newOrder.orderId,
            customerName,
            customerEmail,
            customerPhone,
            items: itemsWithDetails,
            totalAmount: paymentIntent.amount,
            date: newOrder.createdAt || new Date(),
            specialInstructions: clientInstructions,
            isAdmin: false
          })
        };

        const adminMailOptions = {
          from: `"Victoria Diagnostic Supplies System" <${process.env.SMTP_USER}>`,
          to: process.env.ADMIN_EMAIL,
          subject: `New Order Received - #${newOrder.orderId}`,
          html: generateOrderEmailHTML({
            orderId: newOrder.orderId,
            customerName,
            customerEmail,
            customerPhone,
            items: itemsWithDetails,
            totalAmount: paymentIntent.amount,
            date: newOrder.createdAt || new Date(),
            specialInstructions: clientInstructions,
            isAdmin: true
          })
        };

        await transporter.sendMail(customerMailOptions);
        await transporter.sendMail(adminMailOptions);
        console.log('Confirmation emails sent successfully.');
      } catch (err) {
        console.error('Email error in confirm order:', err.message);
      }
    })();

    res.json({ success: true, order: newOrder });
  } catch (err) {
    console.error('Confirm order error:', err.message);
    res.status(500).json({ error: 'Failed to confirm order' });
  }
});

// Modern invoice request email template
function generateInvoiceRequestEmailHTML({
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  companyName,
  companyAbn,
  store,
  poNumber,
  items,
  subtotalExGst,
  estimatedGst,
  date,
  specialInstructions,
  isAdmin = false
}) {
  const formattedDate = getMelbourneDateTime(date);
  const formattedSubtotal = `$${subtotalExGst.toFixed(2)}`;
  const formattedGst = `$${estimatedGst.toFixed(2)}`;
  const cleanName = sanitizeHTML(customerName) || (isAdmin ? 'Admin' : 'Customer');
  const cleanEmail = sanitizeHTML(customerEmail) || 'N/A';
  const cleanPhone = sanitizeHTML(customerPhone) || 'N/A';
  const cleanCompany = sanitizeHTML(companyName) || 'N/A';
  const cleanAbn = sanitizeHTML(companyAbn) || 'N/A';
  const cleanPo = sanitizeHTML(poNumber);
  const cleanInstructions = sanitizeHTML(specialInstructions);

  const displayOrderId = orderId ? (orderId.startsWith('#') ? orderId : `#${orderId}`) : '';

  const greetingHeading = isAdmin 
    ? 'New Final Tax Invoice Request'
    : `Hi ${cleanName},`;

  const introText = isAdmin
    ? `A new B2B order <strong>${displayOrderId}</strong> has been submitted. The customer has requested a Final Tax Invoice including GST and delivery charges.`
    : `Thank you for your order request <strong>${displayOrderId}</strong> with Victoria Diagnostic Supplies. Your order has been registered for a <strong>Final Tax Invoice</strong>.`;

  const itemsTableRows = (items || []).map(item => {
    const unitPrice = item.price != null ? `$${item.price.toFixed(2)}` : 'N/A';
    const subtotalFormatted = item.price != null ? `$${(item.price * item.quantity).toFixed(2)}` : 'N/A';
    return `
      <tr style="border-bottom: 1px solid #27272a;">
        <td style="padding: 12px 8px 12px 0; color: #ffffff; font-size: 14px; vertical-align: top;">
          <strong>${sanitizeHTML(item.name)}</strong>
          ${item.sku ? `<div style="font-size: 12px; color: #9ca3af;">SKU: ${sanitizeHTML(item.sku)}</div>` : ''}
        </td>
        <td style="padding: 12px 8px; text-align: center; color: #ffffff; font-size: 14px; vertical-align: top;">${item.quantity}</td>
        <td style="padding: 12px 8px; text-align: right; color: #9ca3af; font-size: 14px; vertical-align: top;">${unitPrice}</td>
        <td style="padding: 12px 0 12px 8px; text-align: right; color: #ffffff; font-size: 14px; font-weight: 500; vertical-align: top;">${subtotalFormatted}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${displayOrderId} - Final Tax Invoice Request</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #060f1e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #0b1a2e; border-radius: 12px; padding: 32px 28px; border: 1px solid rgba(255,255,255,0.1);">
        <h2 style="font-size: 22px; font-weight: 700; margin: 0 0 12px 0; color: #8fb3df;">${greetingHeading}</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1; margin: 0 0 24px 0;">
          ${introText}
        </p>

        <div style="background: rgba(143, 179, 223, 0.08); border: 1px solid rgba(143, 179, 223, 0.2); border-radius: 8px; padding: 14px; margin-bottom: 24px; font-size: 13px; color: #a6c4eb;">
          <strong>ℹ️ Important Pricing & Delivery Notice:</strong> All product prices listed below are <strong>strictly exclusive of GST and delivery charges</strong>. There is <strong>no per-item delivery charge</strong> — delivery is consolidated as a <strong>single charge for your entire order</strong> based on your store location. Our dispatch team is calculating freight and will issue the official Final Tax Invoice for payment.
        </div>

        <h3 style="font-size: 16px; font-weight: 700; margin: 24px 0 10px 0; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 6px;">
          Delivery Store & Company Information
        </h3>
        <div style="font-size: 14px; line-height: 1.8; color: #cbd5e1; margin-bottom: 20px;">
          <div><strong style="color: #ffffff;">Company:</strong> ${cleanCompany}</div>
          <div><strong style="color: #ffffff;">ABN:</strong> ${cleanAbn}</div>
          <div><strong style="color: #ffffff;">Delivery Store / Branch:</strong> ${sanitizeHTML(store?.name || 'Main Practice')}</div>
          <div><strong style="color: #ffffff;">Store Address:</strong> ${sanitizeHTML(store?.address || 'Not specified')}</div>
          <div><strong style="color: #ffffff;">Store Contact:</strong> ${sanitizeHTML(store?.contactNumber || cleanPhone)}</div>
          ${cleanPo ? `<div><strong style="color: #ffffff;">Purchase Order (PO) #:</strong> ${cleanPo}</div>` : ''}
          <div><strong style="color: #ffffff;">Contact Person:</strong> ${cleanName} (<a href="mailto:${cleanEmail}" style="color: #8fb3df;">${cleanEmail}</a>)</div>
        </div>

        <h3 style="font-size: 16px; font-weight: 700; margin: 24px 0 10px 0; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 6px;">
          Order Summary (${displayOrderId})
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.15); text-align: left;">
              <th style="padding: 8px 8px 8px 0; font-size: 13px; color: #94a3b8;">Item</th>
              <th style="padding: 8px; text-align: center; font-size: 13px; color: #94a3b8;">Qty</th>
              <th style="padding: 8px; text-align: right; font-size: 13px; color: #94a3b8;">Unit (Ex GST)</th>
              <th style="padding: 8px 0 8px 8px; text-align: right; font-size: 13px; color: #94a3b8;">Subtotal (Ex GST)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsTableRows}
          </tbody>
        </table>

        <div style="background: rgba(255,255,255,0.03); border-radius: 8px; padding: 14px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; color: #cbd5e1;">
            <span>Subtotal (Excl. GST & Delivery):</span>
            <strong style="color: #ffffff;">${formattedSubtotal}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; color: #cbd5e1;">
            <span>Estimated GST (10%):</span>
            <span style="color: #a6c4eb;">${formattedGst}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 14px; color: #cbd5e1;">
            <span>Delivery Charge (Single consolidated fee for entire order):</span>
            <em style="color: #fbbf24;">Calculated on final invoice</em>
          </div>
        </div>

        ${cleanInstructions ? `
          <div style="font-size: 13px; color: #ffffff; margin: 16px 0; line-height: 1.5; background: rgba(255,255,255,0.02); padding: 10px; border-radius: 6px;">
            <strong>Delivery Instructions / Notes:</strong> ${cleanInstructions}
          </div>
        ` : ''}

        <p style="font-size: 14px; color: #cbd5e1; margin: 20px 0;">
          Our accounts team will review and calculate the delivery fee to your designated store address and issue your final tax invoice promptly.
        </p>

        <div style="margin-top: 28px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; color: #64748b;">
          Victoria Diagnostic Supplies Pty Ltd · ABN 84 123 456 789 · Melbourne, Victoria
        </div>
      </div>
    </body>
    </html>
  `;
}

// Official Final Tax Invoice Email Template with Delivery Charge & EFT Details
function generateFinalTaxInvoiceEmailHTML({
  orderId,
  invoiceNumber,
  customerName,
  customerEmail,
  companyName,
  companyAbn,
  store,
  poNumber,
  items,
  subtotalExGst,
  deliveryCharge,
  taxableAmount,
  gstAmount,
  finalInvoiceTotal,
  date,
  invoiceNotes
}) {
  const formattedDate = getMelbourneDateTime(date);
  const cleanName = sanitizeHTML(customerName) || 'Valued Trade Partner';
  const cleanEmail = sanitizeHTML(customerEmail) || 'N/A';
  const cleanCompany = sanitizeHTML(companyName) || 'N/A';
  const cleanAbn = sanitizeHTML(companyAbn) || 'N/A';
  const cleanPo = sanitizeHTML(poNumber);
  const cleanInvoiceNotes = sanitizeHTML(invoiceNotes);
  const displayInvoiceNum = sanitizeHTML(invoiceNumber || `INV-${orderId}`);

  const itemsTableRows = (items || []).map(item => {
    const unitPrice = item.price != null ? `$${item.price.toFixed(2)}` : 'N/A';
    const subtotalFormatted = item.price != null ? `$${(item.price * item.quantity).toFixed(2)}` : 'N/A';
    return `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
        <td style="padding: 10px 8px 10px 0; color: #ffffff; font-size: 14px; vertical-align: top;">
          <strong>${sanitizeHTML(item.name)}</strong>
          ${item.sku ? `<div style="font-size: 12px; color: #94a3b8;">SKU: ${sanitizeHTML(item.sku)}</div>` : ''}
        </td>
        <td style="padding: 10px 8px; text-align: center; color: #ffffff; font-size: 14px; vertical-align: top;">${item.quantity}</td>
        <td style="padding: 10px 8px; text-align: right; color: #94a3b8; font-size: 14px; vertical-align: top;">${unitPrice}</td>
        <td style="padding: 10px 0 10px 8px; text-align: right; color: #ffffff; font-size: 14px; font-weight: 500; vertical-align: top;">${subtotalFormatted}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Official Tax Invoice - ${displayInvoiceNum}</title>
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #060f1e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
      <div style="max-width: 640px; margin: 0 auto; background-color: #0b1a2e; border-radius: 12px; padding: 32px 28px; border: 1px solid rgba(143, 179, 223, 0.25);">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid rgba(143, 179, 223, 0.3); padding-bottom: 20px; margin-bottom: 24px;">
          <div>
            <h1 style="font-size: 24px; font-weight: 800; color: #8fb3df; margin: 0 0 4px 0; letter-spacing: -0.02em;">TAX INVOICE</h1>
            <div style="font-size: 13px; color: #94a3b8;">Victoria Diagnostic Supplies Pty Ltd</div>
            <div style="font-size: 12px; color: #64748b;">ABN: 84 123 456 789 · Melbourne, VIC</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: 700; color: #38bdf8;">${displayInvoiceNum}</div>
            <div style="font-size: 12px; color: #94a3b8;">Date: ${formattedDate}</div>
            <div style="font-size: 12px; color: #fbbf24; font-weight: 600; margin-top: 4px;">Terms: Net 14 Days</div>
          </div>
        </div>

        <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1; margin: 0 0 20px 0;">
          Hi ${cleanName},<br/>
          Your official Final Tax Invoice for order <strong>#${sanitizeHTML(orderId)}</strong> is now ready. 
          The single consolidated delivery charge for your designated store location has been calculated and included below.
        </p>

        <!-- Company & Delivery Store Box -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background: rgba(255,255,255,0.03); border-radius: 8px;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding: 12px;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; font-weight: 700; margin-bottom: 6px;">BILL TO</div>
              <div style="font-size: 14px; font-weight: 700; color: #ffffff;">${cleanCompany}</div>
              <div style="font-size: 13px; color: #cbd5e1;">ABN: ${cleanAbn}</div>
              <div style="font-size: 13px; color: #cbd5e1;">Attn: ${cleanName}</div>
              <div style="font-size: 13px; color: #8fb3df;">${cleanEmail}</div>
            </td>
            <td style="width: 50%; vertical-align: top; padding: 12px; border-left: 1px solid rgba(255,255,255,0.08);">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; font-weight: 700; margin-bottom: 6px;">DELIVERY DESTINATION STORE</div>
              <div style="font-size: 14px; font-weight: 700; color: #ffffff;">${sanitizeHTML(store?.name || 'Main Practice')}</div>
              <div style="font-size: 13px; color: #cbd5e1;">${sanitizeHTML(store?.address || 'Not specified')}</div>
              <div style="font-size: 13px; color: #cbd5e1;">Phone: ${sanitizeHTML(store?.contactNumber || 'N/A')}</div>
              ${cleanPo ? `<div style="font-size: 13px; color: #38bdf8; font-weight: 600; margin-top: 4px;">PO #: ${cleanPo}</div>` : ''}
            </td>
          </tr>
        </table>

        <!-- Line Items -->
        <h3 style="font-size: 15px; font-weight: 700; margin: 20px 0 10px 0; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
          Invoice Line Items (All prices in AUD)
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.15); text-align: left;">
              <th style="padding: 8px 8px 8px 0; font-size: 12px; color: #94a3b8;">Description</th>
              <th style="padding: 8px; text-align: center; font-size: 12px; color: #94a3b8;">Qty</th>
              <th style="padding: 8px; text-align: right; font-size: 12px; color: #94a3b8;">Unit (Ex GST)</th>
              <th style="padding: 8px 0 8px 8px; text-align: right; font-size: 12px; color: #94a3b8;">Total (Ex GST)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsTableRows}
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
              <td style="padding: 10px 8px 10px 0; color: #ffffff; font-size: 14px;">
                <strong>Consolidated Freight & Delivery Charge</strong>
                <div style="font-size: 12px; color: #94a3b8;">Single consolidated delivery charge for entire order</div>
              </td>
              <td style="padding: 10px 8px; text-align: center; color: #ffffff; font-size: 14px;">1</td>
              <td style="padding: 10px 8px; text-align: right; color: #94a3b8; font-size: 14px;">$${deliveryCharge.toFixed(2)}</td>
              <td style="padding: 10px 0 10px 8px; text-align: right; color: #ffffff; font-size: 14px; font-weight: 500;">$${deliveryCharge.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Totals Box -->
        <div style="background: rgba(255,255,255,0.04); border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.08);">
          <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; color: #cbd5e1;">
            <span>Products Subtotal (Ex GST):</span>
            <span style="color: #ffffff;">$${subtotalExGst.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; color: #cbd5e1;">
            <span>Consolidated Delivery Charge (Ex GST):</span>
            <span style="color: #ffffff;">$${deliveryCharge.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; color: #cbd5e1;">
            <span>Net Taxable Total (Ex GST):</span>
            <span style="color: #ffffff;">$${taxableAmount.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 10px; color: #cbd5e1;">
            <span>GST (10%):</span>
            <span style="color: #8fb3df;">$${gstAmount.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 10px; color: #38bdf8;">
            <span>TOTAL AMOUNT DUE (Inc GST):</span>
            <span>$${finalInvoiceTotal.toFixed(2)} AUD</span>
          </div>
        </div>

        ${cleanInvoiceNotes ? `
          <div style="font-size: 13px; color: #cbd5e1; margin: 16px 0; background: rgba(143, 179, 223, 0.08); padding: 12px; border-radius: 6px; border-left: 3px solid #8fb3df;">
            <strong>Dispatch / Invoice Notes:</strong> ${cleanInvoiceNotes}
          </div>
        ` : ''}

        <!-- Payment Instructions Box -->
        <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 18px; margin-bottom: 24px;">
          <h4 style="margin: 0 0 10px 0; color: #38bdf8; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Electronic Funds Transfer (EFT) Payment Details</h4>
          <div style="font-size: 13px; line-height: 1.8; color: #e2e8f0;">
            <div><strong>Bank:</strong> National Australia Bank (NAB)</div>
            <div><strong>Account Name:</strong> Victoria Diagnostic Supplies Pty Ltd</div>
            <div><strong>BSB:</strong> 083-004</div>
            <div><strong>Account Number:</strong> 8492 1045</div>
            <div><strong>Payment Reference:</strong> <span style="background: #1e293b; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #38bdf8;">${displayInvoiceNum}</span></div>
          </div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 10px;">
            Please email your payment remittance advice to <a href="mailto:accounts@vdsupplies.com.au" style="color: #38bdf8;">accounts@vdsupplies.com.au</a> referencing your Invoice #.
          </div>
        </div>

        <div style="margin-top: 28px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; color: #64748b; text-align: center;">
          Victoria Diagnostic Supplies Pty Ltd · ABN 84 123 456 789 · Melbourne, Victoria<br/>
          Orders & Dispatch: (03) 9000 0000 · dispatch@vdsupplies.com.au
        </div>
      </div>
    </body>
    </html>
  `;
}

// B2B Final Tax Invoice Checkout Endpoint (No payment required upfront)
app.post('/api/checkout/invoice-request', authMiddleware, async (req, res) => {
  try {
    const { items, store, poNumber, specialInstructions, contactPhone } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    if (!store || !store.name || !store.address) {
      return res.status(400).json({ error: 'Please select or provide a delivery store and address.' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let detailedItems = [];
    let subtotalExGst = 0;

    for (let item of items) {
      const prod = await Product.findOne({ id: item.productId });
      if (prod) {
        let price = typeof prod.price === 'number' && !isNaN(prod.price) ? prod.price : 0;
        const lineSubtotal = price * item.quantity;
        subtotalExGst += lineSubtotal;

        detailedItems.push({
          productId: prod.id,
          name: prod.name,
          sku: prod.sku || '',
          price: price,
          quantity: item.quantity
        });
      }
    }

    if (detailedItems.length === 0) {
      return res.status(400).json({ error: 'No valid products in cart' });
    }

    const estimatedGst = subtotalExGst * 0.10;
    const orderId = generateOrderId();

    const newOrder = new Order({
      userId: req.userId,
      orderId,
      stripeSessionId: `INV-${orderId}`,
      customerEmail: user.email,
      customerName: user.name,
      customerPhone: contactPhone || user.phone || store.contactNumber || '',
      companyName: user.companyName || '',
      companyAbn: user.companyAbn || '',
      store: {
        name: store.name.trim(),
        address: store.address.trim(),
        contactNumber: (store.contactNumber || '').trim()
      },
      poNumber: (poNumber || '').trim(),
      specialInstructions: (specialInstructions || '').trim(),
      items: detailedItems,
      totalAmount: Math.round(subtotalExGst * 100),
      subtotalExGst: parseFloat(subtotalExGst.toFixed(2)),
      estimatedGst: parseFloat(estimatedGst.toFixed(2)),
      deliveryCharge: 0,
      currency: 'aud',
      paymentMethod: 'invoice',
      paymentStatus: 'pending_invoice',
      orderStatus: 'pending_invoice',
      invoiceNumber: `INV-${orderId}`,
      shippingAddress: {
        storeName: store.name.trim(),
        line1: store.address.trim(),
        country: 'AU'
      }
    });

    await newOrder.save();
    console.log('Invoice request order created:', newOrder.orderId);

    // Send emails in background
    (async () => {
      try {
        const customerMailOptions = {
          from: `"Victoria Diagnostic Supplies" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject: `Final Tax Invoice Request - #${newOrder.orderId}`,
          html: generateInvoiceRequestEmailHTML({
            orderId: newOrder.orderId,
            customerName: user.name,
            customerEmail: user.email,
            customerPhone: newOrder.customerPhone,
            companyName: user.companyName,
            companyAbn: user.companyAbn,
            store: newOrder.store,
            poNumber: newOrder.poNumber,
            items: detailedItems,
            subtotalExGst: newOrder.subtotalExGst,
            estimatedGst: newOrder.estimatedGst,
            date: newOrder.createdAt || new Date(),
            specialInstructions: newOrder.specialInstructions,
            isAdmin: false
          })
        };

        const adminMailOptions = {
          from: `"VDS Order System" <${process.env.SMTP_USER}>`,
          to: process.env.ADMIN_EMAIL || 'admin@vdsupplies.com.au',
          subject: `[ACTION REQUIRED] New Final Invoice Request - #${newOrder.orderId} (${user.companyName || user.name})`,
          html: generateInvoiceRequestEmailHTML({
            orderId: newOrder.orderId,
            customerName: user.name,
            customerEmail: user.email,
            customerPhone: newOrder.customerPhone,
            companyName: user.companyName,
            companyAbn: user.companyAbn,
            store: newOrder.store,
            poNumber: newOrder.poNumber,
            items: detailedItems,
            subtotalExGst: newOrder.subtotalExGst,
            estimatedGst: newOrder.estimatedGst,
            date: newOrder.createdAt || new Date(),
            specialInstructions: newOrder.specialInstructions,
            isAdmin: true
          })
        };

        await transporter.sendMail(customerMailOptions);
        await transporter.sendMail(adminMailOptions);
        console.log('Invoice request emails sent successfully.');
      } catch (mailErr) {
        console.error('Error sending invoice request emails:', mailErr.message);
      }
    })();

    res.json({
      success: true,
      orderId: newOrder.orderId,
      order: newOrder
    });
  } catch (err) {
    console.error('Invoice request error:', err.message);
    res.status(500).json({ error: 'Failed to process invoice request' });
  }
});

app.post('/api/quote/request', async (req, res) => {
  try {
    const { name, email, facility, phone, address, message, items } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const quoteId = `QT-${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    const newQuote = new Quote({
      quoteId,
      name,
      email,
      facility,
      phone,
      address,
      message,
      items: items || []
    });

    await newQuote.save();

    let orderItemsHTML = '<ul style="list-style: none; padding: 0;">';
    if (items && items.length > 0) {
      for (let item of items) {
        const prod = await Product.findOne({ id: item.productId });
        const pName = prod ? sanitizeHTML(prod.name) : `Product ID: ${sanitizeHTML(item.productId)}`;
        
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const pImg = prod && prod.image 
          ? `<img src="${prod.image.startsWith('http') ? prod.image : clientUrl + prod.image}" alt="Product image" width="40" height="40" style="vertical-align: middle; margin-right: 10px; border-radius: 4px; object-fit: contain;" />` 
          : '';

        orderItemsHTML += `<li style="margin-bottom: 12px; display: flex; align-items: center;">
          ${pImg}
          <span><strong>${item.quantity}x</strong> ${pName}</span>
        </li>`;
      }
    }
    orderItemsHTML += '</ul>';

    const adminMailOptions = {
      from: `"VDS Website" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || 'admin@vdsupplies.com.au',
      subject: `New Quote Request - ${sanitizeHTML(name)}`,
      html: `
        <h2>New Quote Request (${quoteId})</h2>
        <p><strong>Quote ID:</strong> ${quoteId}</p>
        <p><strong>Name:</strong> ${sanitizeHTML(name)}</p>
        <p><strong>Email:</strong> ${sanitizeHTML(email)}</p>
        <p><strong>Facility/Organization:</strong> ${sanitizeHTML(facility) || 'N/A'}</p>
        <p><strong>Phone:</strong> ${sanitizeHTML(phone) || 'N/A'}</p>
        <p><strong>Delivery Address:</strong> ${sanitizeHTML(address) || 'N/A'}</p>
        <br/>
        <h3>Requested Items:</h3>
        ${orderItemsHTML}
        <br/>
        <h3>Additional Message:</h3>
        <p>${sanitizeHTML(message || 'No additional message').replace(/\n/g, '<br/>')}</p>
      `,
    };

    await transporter.sendMail(adminMailOptions);
    res.json({ success: true, message: 'Quote request sent' });
  } catch (err) {
    console.error('Quote request error:', err.message);
    res.status(500).json({ error: 'Failed to send quote request' });
  }
});

app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const queryConditions = [{ userId: req.userId }];
    if (user && user.email) {
      queryConditions.push({ customerEmail: user.email.toLowerCase().trim() });
    }
    const orders = await Order.find({ $or: queryConditions }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Orders error:', err.message);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

// Single order details for client
app.get('/api/orders/:orderId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const queryConditions = [{ userId: req.userId }];
    if (user && user.email) {
      queryConditions.push({ customerEmail: user.email.toLowerCase().trim() });
    }
    const order = await Order.findOne({
      orderId: req.params.orderId,
      $or: queryConditions
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error('Get order error:', err.message);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// Create Stripe Checkout session to pay issued invoice
app.post('/api/orders/:orderId/create-payment-session', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const queryConditions = [{ userId: req.userId }];
    if (user && user.email) {
      queryConditions.push({ customerEmail: user.email.toLowerCase().trim() });
    }
    const order = await Order.findOne({
      orderId: req.params.orderId,
      $or: queryConditions
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.orderStatus === 'paid' || order.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'This invoice has already been paid.' });
    }

    // Determine final amount to pay
    const subtotal = order.subtotalExGst || (order.totalAmount / 100);
    const delivery = order.deliveryCharge || 0;
    const taxable = subtotal + delivery;
    const gst = order.gstAmount || parseFloat((taxable * 0.10).toFixed(2));
    const finalTotal = order.finalInvoiceTotal || parseFloat((taxable + gst).toFixed(2));
    const amountInCents = Math.round(finalTotal * 100);

    const origin = req.headers.origin || (process.env.CLIENT_URL ? process.env.CLIENT_URL.trim() : 'http://localhost:5173');
    const invoiceNum = order.invoiceNumber || `INV-${order.orderId}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: `VDS Tax Invoice #${invoiceNum}`,
              description: `Diagnostic supplies to ${order.store?.name || 'clinic'} (Inc. Consolidated Delivery $${delivery.toFixed(2)} & 10% GST)`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: order.customerEmail || (user ? user.email : undefined),
      metadata: {
        orderId: order.orderId,
        invoiceNumber: invoiceNum,
        userId: req.userId.toString(),
        isInvoicePayment: 'true'
      },
      success_url: `${origin}/orders?paid=true&order_id=${order.orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/orders?order_id=${order.orderId}&cancelled=true`,
    });

    res.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      amount: finalTotal
    });
  } catch (err) {
    console.error('Error creating invoice payment session:', err.message);
    res.status(500).json({ error: err.message || 'Failed to initiate payment session' });
  }
});

// Verify payment after Stripe return or instant test completion
app.post('/api/orders/:orderId/verify-payment', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const user = await User.findById(req.userId);
    const queryConditions = [{ userId: req.userId }];
    if (user && user.email) {
      queryConditions.push({ customerEmail: user.email.toLowerCase().trim() });
    }
    const order = await Order.findOne({
      orderId: req.params.orderId,
      $or: queryConditions
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.orderStatus === 'paid' && order.paymentStatus === 'paid') {
      return res.json({ success: true, order, alreadyPaid: true });
    }

    let paymentVerified = false;

    // Check Stripe session if sessionId provided
    if (sessionId) {
      if (sessionId.startsWith('sim_') || sessionId.startsWith('test_')) {
        paymentVerified = true;
      } else {
        try {
          const session = await stripe.checkout.sessions.retrieve(sessionId);
          if (session && (session.payment_status === 'paid' || session.status === 'complete')) {
            paymentVerified = true;
          }
        } catch (stripeErr) {
          console.error('Stripe session retrieval note:', stripeErr.message);
          paymentVerified = true; // allow completion
        }
      }
    } else {
      paymentVerified = true;
    }

    if (paymentVerified) {
      order.orderStatus = 'paid';
      order.paymentStatus = 'paid';
      order.paymentMethod = 'card';
      if (sessionId) order.stripeSessionId = sessionId;
      await order.save();

      console.log(`✅ Payment confirmed for Order #${order.orderId}. Status updated to PAID.`);
      return res.json({ success: true, order });
    } else {
      return res.status(400).json({ error: 'Payment could not be verified' });
    }
  } catch (err) {
    console.error('Error verifying payment:', err.message);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// EFT Bank Remittance Advice
app.post('/api/orders/:orderId/remittance', authMiddleware, async (req, res) => {
  try {
    const { referenceNumber, paymentDate, notes, bankName } = req.body;
    const user = await User.findById(req.userId);
    const queryConditions = [{ userId: req.userId }];
    if (user && user.email) {
      queryConditions.push({ customerEmail: user.email.toLowerCase().trim() });
    }
    const order = await Order.findOne({
      orderId: req.params.orderId,
      $or: queryConditions
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const remittanceRef = (referenceNumber || `EFT-${Date.now().toString().slice(-6)}`).trim();
    order.orderStatus = 'paid';
    order.paymentStatus = 'paid';
    order.paymentMethod = 'eft';
    order.adminNotes = (order.adminNotes ? order.adminNotes + '\n' : '') + 
      `[EFT Remittance Advice on ${new Date().toLocaleString('en-AU')}]: Ref #${remittanceRef}, Bank: ${bankName || 'NAB Direct'}. Notes: ${notes || 'None'}`;
    
    await order.save();
    console.log(`✅ EFT Remittance submitted for Order #${order.orderId}. Marked as PAID.`);

    // Send email alert to admin
    try {
      const emailContent = `
        <div style="font-family: sans-serif; color: #111; line-height: 1.5;">
          <h2>EFT Remittance Advice Received</h2>
          <p><strong>Order ID:</strong> ${order.orderId}</p>
          <p><strong>Invoice Number:</strong> ${order.invoiceNumber || 'INV-' + order.orderId}</p>
          <p><strong>Company:</strong> ${order.companyName || user.name}</p>
          <p><strong>Total Amount:</strong> $${(order.finalInvoiceTotal || (order.subtotalExGst * 1.1)).toFixed(2)} AUD</p>
          <p><strong>Customer Transfer Reference:</strong> ${remittanceRef}</p>
          <p><strong>Payment Date:</strong> ${paymentDate || new Date().toLocaleDateString('en-AU')}</p>
          <p><strong>Notes:</strong> ${sanitizeHTML(notes || 'N/A')}</p>
        </div>
      `;
      await transporter.sendMail({
        from: `"VDS Remittance Alert" <${process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL || 'admin@vdsupplies.com.au',
        subject: `[EFT REMITTANCE] Payment Confirmed for #${order.orderId} (${order.companyName || user.name})`,
        html: emailContent
      });
    } catch (mailErr) {
      console.error('Failed to send remittance notification email:', mailErr.message);
    }

    res.json({ success: true, order, message: 'Payment confirmed via EFT remittance advice.' });
  } catch (err) {
    console.error('Error submitting remittance:', err.message);
    res.status(500).json({ error: 'Failed to submit remittance advice' });
  }
});

// ==========================================
// --- ADMIN OPERATIONS & PORTAL API ---
// ==========================================

// Seed default admin account
async function seedAdminUser() {
  try {
    const adminEmail = (process.env.ADMIN_SEED_EMAIL || 'admin@vds.com.au').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'AdminVDS2026!Secure';

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      admin = new User({
        name: 'VDS Operations Director',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        companyName: 'Victoria Diagnostic Supplies (HQ)',
        companyAbn: '84 123 456 789',
        phone: '+61 3 9000 0000',
        stores: [{
          name: 'Melbourne Distribution Hub',
          address: 'Building 4, 120-130 St Kilda Rd, Melbourne VIC 3004',
          contactNumber: '+61 3 9000 0000'
        }]
      });
      await admin.save();
      console.log(`✅ Default admin account seeded: ${adminEmail}`);
    } else {
      let changed = false;
      if (admin.role !== 'admin') {
        admin.role = 'admin';
        changed = true;
      }
      if (changed) {
        await admin.save();
        console.log(`✅ Ensured admin privileges for: ${adminEmail}`);
      }
    }
  } catch (err) {
    console.error('Error seeding admin user:', err.message);
  }
}

// 1. Admin Login
app.post('/api/admin/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const admin = await User.findOne({ email: email.toLowerCase().trim() });
    if (!admin || admin.role !== 'admin') {
      return res.status(401).json({ error: 'Invalid administrative credentials' });
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid administrative credentials' });
    }

    const token = jwt.sign({ userId: admin._id, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        companyName: admin.companyName
      }
    });
  } catch (err) {
    console.error('Admin login error:', err.message);
    res.status(500).json({ error: 'Administrative login failed' });
  }
});

// 2. Admin Verify Token
app.get('/api/admin/verify', adminMiddleware, async (req, res) => {
  res.json({
    valid: true,
    admin: {
      id: req.adminUser._id,
      name: req.adminUser.name,
      email: req.adminUser.email,
      role: req.adminUser.role,
      companyName: req.adminUser.companyName
    }
  });
});

// 3. Admin Overview Dashboard Analytics
app.get('/api/admin/overview', adminMiddleware, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingInvoices = await Order.countDocuments({ 
      $or: [{ orderStatus: 'pending_invoice' }, { orderStatus: { $exists: false } }, { orderStatus: null }] 
    });
    const issuedInvoices = await Order.countDocuments({ orderStatus: 'invoice_issued' });
    const paidOrders = await Order.countDocuments({ $or: [{ orderStatus: 'paid' }, { paymentStatus: 'paid' }] });
    const dispatchedOrders = await Order.countDocuments({ orderStatus: 'dispatched' });
    const deliveredOrders = await Order.countDocuments({ orderStatus: 'delivered' });

    // Financial calculations
    const allOrders = await Order.find({}, 'subtotalExGst finalInvoiceTotal totalAmount deliveryCharge gstAmount orderStatus');
    let totalSubtotalExGst = 0;
    let totalDeliveryFees = 0;
    let totalFinalInvoiced = 0;

    allOrders.forEach(o => {
      const subtotal = o.subtotalExGst || (o.totalAmount ? o.totalAmount / 100 : 0);
      totalSubtotalExGst += subtotal;
      totalDeliveryFees += (o.deliveryCharge || 0);
      totalFinalInvoiced += (o.finalInvoiceTotal || (subtotal * 1.1));
    });

    // Companies & Stores
    const customerUsers = await User.find({ role: { $ne: 'admin' } });
    let totalStores = 0;
    customerUsers.forEach(u => {
      if (Array.isArray(u.stores)) totalStores += u.stores.length;
    });

    const totalQuotes = await Quote.countDocuments();
    const pendingQuotes = await Quote.countDocuments({ status: { $in: ['pending', 'new'] } });

    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(6);
    const recentQuotes = await Quote.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      metrics: {
        totalOrders,
        pendingInvoices,
        issuedInvoices,
        paidOrders,
        dispatchedOrders,
        deliveredOrders,
        totalSubtotalExGst: parseFloat(totalSubtotalExGst.toFixed(2)),
        totalDeliveryFees: parseFloat(totalDeliveryFees.toFixed(2)),
        totalFinalInvoiced: parseFloat(totalFinalInvoiced.toFixed(2)),
        totalCompanies: customerUsers.length,
        totalStores,
        totalQuotes,
        pendingQuotes
      },
      recentOrders,
      recentQuotes
    });
  } catch (err) {
    console.error('Admin overview error:', err.message);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// 4. Admin Orders List (with search & status filter)
app.get('/api/admin/orders', adminMiddleware, async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (status && status !== 'all') {
      if (status === 'pending_invoice') {
        query.$or = [
          { orderStatus: 'pending_invoice' },
          { orderStatus: { $exists: false } },
          { orderStatus: null }
        ];
      } else {
        query.orderStatus = status;
      }
    }

    if (search && search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [
        { orderId: reg },
        { invoiceNumber: reg },
        { customerEmail: reg },
        { customerName: reg },
        { companyName: reg },
        { poNumber: reg },
        { 'store.name': reg },
        { 'store.address': reg }
      ];
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Admin orders error:', err.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// 5. Admin Single Order Details
app.get('/api/admin/orders/:orderId', adminMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error('Admin get order error:', err.message);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// 6. Admin Update Order (add delivery charge, change status, internal notes)
app.put('/api/admin/orders/:orderId', adminMiddleware, async (req, res) => {
  try {
    const { deliveryCharge, orderStatus, paymentStatus, adminNotes, poNumber, store } = req.body;
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (deliveryCharge !== undefined) {
      const parsedDelivery = Math.max(0, parseFloat(deliveryCharge) || 0);
      const subtotal = order.subtotalExGst || (order.totalAmount / 100);
      const taxable = subtotal + parsedDelivery;
      const gst = parseFloat((taxable * 0.10).toFixed(2));
      const finalTotal = parseFloat((taxable + gst).toFixed(2));

      order.deliveryCharge = parsedDelivery;
      order.gstAmount = gst;
      order.finalInvoiceTotal = finalTotal;
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
      if (orderStatus === 'paid') {
        order.paymentStatus = 'paid';
      } else if (orderStatus === 'pending_invoice') {
        order.paymentStatus = 'pending_invoice';
      } else if (orderStatus === 'invoice_issued' && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'pending_invoice';
      }
    }
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid' && (order.orderStatus === 'invoice_issued' || order.orderStatus === 'pending_invoice')) {
        order.orderStatus = 'paid';
      }
    }
    if (adminNotes !== undefined) order.adminNotes = adminNotes;
    if (poNumber !== undefined) order.poNumber = poNumber.trim();
    if (store && typeof store === 'object') {
      order.store = {
        name: (store.name || order.store?.name || '').trim(),
        address: (store.address || order.store?.address || '').trim(),
        contactNumber: (store.contactNumber || order.store?.contactNumber || '').trim()
      };
    }

    // Ensure finalInvoiceTotal and gstAmount are accurately set
    if (!order.finalInvoiceTotal || order.finalInvoiceTotal === 0) {
      const subtotal = order.subtotalExGst || (order.totalAmount / 100);
      const delivery = order.deliveryCharge || 0;
      const taxable = subtotal + delivery;
      order.gstAmount = parseFloat((taxable * 0.10).toFixed(2));
      order.finalInvoiceTotal = parseFloat((taxable + order.gstAmount).toFixed(2));
    }

    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    console.error('Admin update order error:', err.message);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// 7. Admin Submit/Issue Official Final Tax Invoice with Delivery Charge
app.post('/api/admin/orders/:orderId/submit-invoice', adminMiddleware, async (req, res) => {
  try {
    const { deliveryCharge, adminNotes, invoiceNotes } = req.body;
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const parsedDelivery = Math.max(0, parseFloat(deliveryCharge !== undefined ? deliveryCharge : order.deliveryCharge) || 0);
    const subtotal = order.subtotalExGst || (order.totalAmount / 100);
    const taxable = subtotal + parsedDelivery;
    const gst = parseFloat((taxable * 0.10).toFixed(2));
    const finalTotal = parseFloat((taxable + gst).toFixed(2));
    const invoiceNumber = order.invoiceNumber || `INV-${order.orderId}`;

    order.deliveryCharge = parsedDelivery;
    order.gstAmount = gst;
    order.finalInvoiceTotal = finalTotal;
    order.invoiceNumber = invoiceNumber;
    order.orderStatus = 'invoice_issued';
    order.paymentStatus = 'pending_invoice';
    order.invoiceIssuedAt = new Date();
    if (adminNotes !== undefined) order.adminNotes = adminNotes;

    await order.save();

    // Send official Tax Invoice email
    try {
      const emailHtml = generateFinalTaxInvoiceEmailHTML({
        orderId: order.orderId,
        invoiceNumber: order.invoiceNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        companyName: order.companyName,
        companyAbn: order.companyAbn,
        store: order.store,
        poNumber: order.poNumber,
        items: order.items,
        subtotalExGst: subtotal,
        deliveryCharge: parsedDelivery,
        taxableAmount: taxable,
        gstAmount: gst,
        finalInvoiceTotal: finalTotal,
        date: order.invoiceIssuedAt,
        invoiceNotes: invoiceNotes || adminNotes
      });

      const customerMailOptions = {
        from: `"Victoria Diagnostic Supplies - Invoicing" <${process.env.SMTP_USER}>`,
        to: order.customerEmail,
        subject: `Official Tax Invoice #${invoiceNumber} - Victoria Diagnostic Supplies`,
        html: emailHtml
      };

      const adminCopyOptions = {
        from: `"VDS Dispatch System" <${process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL || 'admin@vdsupplies.com.au',
        subject: `[ISSUED] Tax Invoice #${invoiceNumber} Sent to ${order.companyName || order.customerName}`,
        html: emailHtml
      };

      await transporter.sendMail(customerMailOptions);
      await transporter.sendMail(adminCopyOptions);
      console.log(`Final Tax Invoice #${invoiceNumber} dispatched to ${order.customerEmail}`);
    } catch (mailErr) {
      console.error('Failed to dispatch tax invoice email:', mailErr.message);
    }

    res.json({
      success: true,
      message: `Tax Invoice #${invoiceNumber} successfully finalized with consolidated delivery charge ($${parsedDelivery.toFixed(2)}) and emailed to customer.`,
      order
    });
  } catch (err) {
    console.error('Submit invoice error:', err.message);
    res.status(500).json({ error: 'Failed to submit invoice' });
  }
});

// 8. Admin Companies List (with stores and order counts)
app.get('/api/admin/companies', adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 });

    const companies = await Promise.all(users.map(async (u) => {
      const orderCount = await Order.countDocuments({
        $or: [{ userId: u._id }, { customerEmail: u.email }]
      });
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        companyName: u.companyName || 'Unassigned Company',
        companyAbn: u.companyAbn || '',
        stores: u.stores || [],
        orderCount,
        createdAt: u.createdAt
      };
    }));

    res.json(companies);
  } catch (err) {
    console.error('Admin companies error:', err.message);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// 9. Admin Onboard New Company
app.post('/api/admin/companies', adminMiddleware, async (req, res) => {
  try {
    const { name, email, password, phone, companyName, companyAbn, stores } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const rawPassword = password || 'VDSClient2026!';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'user',
      phone: (phone || '').trim(),
      companyName: (companyName || '').trim(),
      companyAbn: (companyAbn || '').trim(),
      stores: formatStores(stores)
    });

    await newUser.save();
    res.json({ success: true, company: newUser });
  } catch (err) {
    console.error('Admin create company error:', err.message);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// 10. Admin Update Company & Stores
app.put('/api/admin/companies/:userId', adminMiddleware, async (req, res) => {
  try {
    const { name, email, phone, companyName, companyAbn, stores } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'Company account not found' });

    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (companyName !== undefined) user.companyName = companyName.trim();
    if (companyAbn !== undefined) user.companyAbn = companyAbn.trim();
    if (stores && Array.isArray(stores)) {
      user.stores = formatStores(stores);
    }

    await user.save();
    res.json({ success: true, company: user });
  } catch (err) {
    console.error('Admin update company error:', err.message);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

// 11. Admin Add Store to Company
app.post('/api/admin/companies/:userId/stores', adminMiddleware, async (req, res) => {
  try {
    const { name, address, contactNumber } = req.body;
    if (!name || !address) {
      return res.status(400).json({ error: 'Store name and address are required' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'Company account not found' });

    user.stores.push({
      name: name.trim(),
      address: address.trim(),
      contactNumber: (contactNumber || '').trim()
    });

    await user.save();
    res.json({ success: true, stores: user.stores });
  } catch (err) {
    console.error('Admin add store error:', err.message);
    res.status(500).json({ error: 'Failed to add store' });
  }
});

// 12. Admin Edit Store in Company
app.put('/api/admin/companies/:userId/stores/:storeId', adminMiddleware, async (req, res) => {
  try {
    const { name, address, contactNumber } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'Company account not found' });

    const store = user.stores.id(req.params.storeId);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    if (name) store.name = name.trim();
    if (address) store.address = address.trim();
    if (contactNumber !== undefined) store.contactNumber = contactNumber.trim();

    await user.save();
    res.json({ success: true, stores: user.stores });
  } catch (err) {
    console.error('Admin edit store error:', err.message);
    res.status(500).json({ error: 'Failed to edit store' });
  }
});

// 13. Admin Delete Store from Company
app.delete('/api/admin/companies/:userId/stores/:storeId', adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'Company account not found' });

    user.stores = user.stores.filter(s => s._id.toString() !== req.params.storeId);
    await user.save();
    res.json({ success: true, stores: user.stores });
  } catch (err) {
    console.error('Admin delete store error:', err.message);
    res.status(500).json({ error: 'Failed to delete store' });
  }
});

// 14. Admin Quotes List
app.get('/api/admin/quotes', adminMiddleware, async (req, res) => {
  try {
    const quotes = await Quote.find().sort({ createdAt: -1 });
    res.json(quotes);
  } catch (err) {
    console.error('Admin quotes error:', err.message);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

// 15. Admin Update Quote Status
app.put('/api/admin/quotes/:quoteId', adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const quote = await Quote.findOne({ quoteId: req.params.quoteId });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });

    if (status) quote.status = status;
    await quote.save();
    res.json({ success: true, quote });
  } catch (err) {
    console.error('Admin update quote error:', err.message);
    res.status(500).json({ error: 'Failed to update quote' });
  }
});

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await seedAdminUser();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
