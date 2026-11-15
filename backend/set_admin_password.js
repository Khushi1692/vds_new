require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function setAdminPassword() {
  const args = process.argv.slice(2);
  const targetEmail = (args[0] || process.env.ADMIN_SEED_EMAIL || 'admin@vds.com.au').toLowerCase().trim();
  const targetPassword = args[1] || process.env.ADMIN_SEED_PASSWORD || process.env.ADMIN_PASSWORD || 'AdminVDS2026!Secure';

  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(process.env.MONGODB_URI);

  let user = await User.findOne({ email: targetEmail });
  const hashedPassword = await bcrypt.hash(targetPassword, 10);

  if (!user) {
    user = new User({
      name: targetEmail === 'admin@vds.com.au' ? 'VDS Operations Director' : 'Admin User',
      email: targetEmail,
      password: hashedPassword,
      role: 'admin',
      companyName: 'Victoria Diagnostic Supplies (HQ)',
      companyAbn: '84 123 456 789',
      phone: '0422 228 496',
      stores: [{
        name: 'Victoria Diagnostic Supplies',
        address: '16 Welsh Cres, Clyde North VIC 3978',
        contactNumber: '0422 228 496'
      }]
    });
    await user.save();
    console.log(`✅ Created admin user "${targetEmail}" with defined password.`);
  } else {
    user.password = hashedPassword;
    user.role = 'admin';
    await user.save();
    console.log(`✅ Successfully updated password and admin role for "${targetEmail}".`);
  }

  // Double-check verification
  const verifyUser = await User.findOne({ email: targetEmail });
  const valid = await bcrypt.compare(targetPassword, verifyUser.password);
  console.log(`🔒 Password verification test: ${valid ? 'PASSED' : 'FAILED'}`);

  process.exit(0);
}

setAdminPassword().catch(err => {
  console.error('Error setting admin password:', err);
  process.exit(1);
});

