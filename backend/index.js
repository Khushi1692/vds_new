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
      const { cartItems, productId, quantity, userId, orderId } = sessionOrIntent.metadata || {};
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
        orderId: orderId || `ORD-${Date.now()}`,
        stripeSessionId: sessionOrIntent.id,
        customerEmail,
        customerName,
        items: items,
        totalAmount,
        currency,
        paymentStatus: 'paid',
        shippingAddress
      });

      await newOrder.save();
      console.log('Order created for:', sessionOrIntent.id);

      // Send emails
      const formatAmount = (amount) => `$${(amount / 100).toFixed(2)}`;
      
      let orderItemsHTML = '<ul>';
      for (let item of items) {
        const prod = await Product.findOne({ id: item.productId });
        const pName = prod ? sanitizeHTML(prod.name) : `Product ID: ${sanitizeHTML(item.productId)}`;
        orderItemsHTML += `<li>${item.quantity}x ${pName}</li>`;
      }
      orderItemsHTML += '</ul>';

      const customerMailOptions = {
        from: `"Victoria Diagnostic Supplies" <${process.env.SMTP_USER}>`,
        to: customerEmail,
        subject: `Order Confirmation - ${newOrder.orderId}`,
        html: `
          <h2>Thank you for your order!</h2>
          <p>Hi ${sanitizeHTML(customerName) || 'Customer'},</p>
          <p>We've received your order <strong>${newOrder.orderId}</strong> and are preparing it now.</p>
          <p><strong>Total Amount:</strong> ${formatAmount(totalAmount)}</p>
          <p>Thanks for shopping with us!</p>
        `,
      };

      const adminMailOptions = {
        from: `"Victoria Diagnostic Supplies System" <${process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `New Order Received - ${newOrder.orderId}`,
        html: `
          <h2>New Order Alert</h2>
          <p>A new order has been placed on the store.</p>
          <ul>
            <li><strong>Order ID:</strong> ${newOrder.orderId}</li>
            <li><strong>Customer Name:</strong> ${sanitizeHTML(customerName) || 'N/A'}</li>
            <li><strong>Customer Email:</strong> ${sanitizeHTML(customerEmail)}</li>
            <li><strong>Customer Mobile:</strong> ${sanitizeHTML(customerPhone) || 'N/A'}</li>
            <li><strong>Total Amount:</strong> ${formatAmount(totalAmount)}</li>
          </ul>
          <h3>Order Items:</h3>
          ${orderItemsHTML}
          <p>Check the admin dashboard for full details.</p>
        `,
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

// Auth Routes (rate limited)
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

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
    const user = new User({ name: name.trim(), email: email.toLowerCase().trim(), password: hashedPassword });
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
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
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'placeholder');

app.post('/api/auth/google', authLimiter, async (req, res) => {
  try {
    const { credential } = req.body;
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

    let user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Create user if they don't exist
      // Give a random secure password since they use Google to login
      const randomPassword = require('crypto').randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      user = new User({ name: displayName, email: email.toLowerCase().trim(), password: hashedPassword });
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Google auth error:', err.message || err);
    res.status(401).json({ error: 'Google authentication failed. Please try again.' });
  }
});

// In-memory cache for ultra-fast products serving
let productsCache = null;
let productsCacheTime = 0;
const PRODUCTS_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

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

    const orderId = `ORD-${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

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
    const { paymentIntentId } = req.body;
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

    const newOrder = new Order({
      userId: req.userId,
      orderId: orderId || `ORD-${Date.now()}`,
      stripeSessionId: paymentIntent.id,
      customerEmail,
      customerName,
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
        const formatAmount = (amount) => `$${(amount / 100).toFixed(2)}`;
        let orderItemsHTML = '<ul>';
        for (let item of items) {
          const prod = await Product.findOne({ id: item.productId });
          const pName = prod ? sanitizeHTML(prod.name) : `Product ID: ${sanitizeHTML(item.productId)}`;
          orderItemsHTML += `<li>${item.quantity}x ${pName}</li>`;
        }
        orderItemsHTML += '</ul>';

        const customerMailOptions = {
          from: `"Victoria Diagnostic Supplies" <${process.env.SMTP_USER}>`,
          to: customerEmail,
          subject: `Order Confirmation - ${newOrder.orderId}`,
          html: `
            <h2>Thank you for your order!</h2>
            <p>Hi ${sanitizeHTML(customerName)},</p>
            <p>We've received your order <strong>${newOrder.orderId}</strong> and are preparing it now.</p>
            <p><strong>Total Amount:</strong> ${formatAmount(paymentIntent.amount)}</p>
            <p>Thanks for shopping with us!</p>
          `,
        };

        const adminMailOptions = {
          from: `"Victoria Diagnostic Supplies System" <${process.env.SMTP_USER}>`,
          to: process.env.ADMIN_EMAIL,
          subject: `New Order Received - ${newOrder.orderId}`,
          html: `
            <h2>New Order Alert</h2>
            <p>A new order has been placed on the store.</p>
            <ul>
              <li><strong>Order ID:</strong> ${newOrder.orderId}</li>
              <li><strong>Customer Name:</strong> ${sanitizeHTML(customerName)}</li>
              <li><strong>Customer Email:</strong> ${sanitizeHTML(customerEmail)}</li>
              <li><strong>Total Amount:</strong> ${formatAmount(paymentIntent.amount)}</li>
            </ul>
            <h3>Order Items:</h3>
            ${orderItemsHTML}
          `,
        };

        await transporter.sendMail(customerMailOptions);
        await transporter.sendMail(adminMailOptions);
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

app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Orders error:', err.message);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
