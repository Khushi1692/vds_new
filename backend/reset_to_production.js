require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Order = require('./models/Order');
const Quote = require('./models/Quote');
const Product = require('./models/Product');
const bcrypt = require('bcryptjs');

async function resetToProduction() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas...');

  // 1. Clean Orders
  const deletedOrders = await Order.deleteMany({});
  console.log(`✅ Cleared all testing orders (${deletedOrders.deletedCount} orders removed).`);

  // 2. Clean Quotes
  const deletedQuotes = await Quote.deleteMany({});
  console.log(`✅ Cleared all testing quote requests (${deletedQuotes.deletedCount} quotes removed).`);

  // 3. Clean Users (Remove test accounts, retain real owner and official admin)
  const testEmails = [
    'test_1790847737395@example.com',
    'dr.vance.test@radiologymelb.com.au',
    'elena.rostova@healthvic.com.au',
    'tutflix1@gmail.com',
    'chatrolamitbhai1@gmail.com',
    'lakhaniraj2006@gmail.com',
    'raghavshoor41@gmail.com'
  ];

  const deletedUsers = await User.deleteMany({ email: { $in: testEmails } });
  console.log(`✅ Removed ${deletedUsers.deletedCount} testing user accounts.`);

  // 4. Ensure Official Admin Account
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
      companyName: 'Victoria Diagnostic Supplies (Internal HQ)',
      companyAbn: '84 123 456 789',
      phone: '+61 3 9000 0000',
      stores: [{
        name: 'Melbourne Distribution Hub',
        address: 'Building 4, 120-130 St Kilda Rd, Melbourne VIC 3004',
        contactNumber: '+61 3 9000 0000'
      }]
    });
    await admin.save();
    console.log(`✅ Created clean official admin: ${adminEmail}`);
  } else {
    admin.role = 'admin';
    await admin.save();
    console.log(`✅ Verified official admin: ${adminEmail}`);
  }

  // 5. Ensure Owner Account (kathrotiyakhushi@gmail.com) has admin role
  const ownerEmail = (process.env.ADMIN_EMAIL || 'kathrotiyakhushi@gmail.com').toLowerCase().trim();
  let owner = await User.findOne({ email: ownerEmail });
  if (owner) {
    owner.role = 'admin';
    owner.companyName = owner.companyName || 'Victoria Diagnostic Supplies';
    await owner.save();
    console.log(`✅ Verified admin privileges for owner account: ${ownerEmail}`);
  }

  // 6. Verify Catalog Products
  const productCount = await Product.countDocuments();
  console.log(`✅ Active catalog products: ${productCount} items.`);

  // Print final database summary
  console.log('\n=============================================');
  console.log('--- REAL-WORLD PRODUCTION DATABASE SUMMARY ---');
  console.log('=============================================');
  console.log('Orders in DB:', await Order.countDocuments(), '(Clean slate ready for real customer orders)');
  console.log('Quotes in DB:', await Quote.countDocuments(), '(Clean slate ready for real quote inquiries)');
  console.log('Products in DB:', await Product.countDocuments(), '(Official catalog with live stock & pricing)');
  console.log('\nUsers in DB:');
  const remainingUsers = await User.find({}, 'name email role companyName stores');
  remainingUsers.forEach(u => {
    console.log(`  - ${u.email} | ${u.name} | Role: ${u.role} | Company: ${u.companyName || 'N/A'}`);
  });
  console.log('=============================================\n');

  process.exit(0);
}

resetToProduction().catch((err) => {
  console.error('Reset error:', err);
  process.exit(1);
});
