const mongoose = require('mongoose');
const { AdminModel } = require('./src/models/admin');
require('dotenv').config();

async function debugAdminLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin exists
    const admin = await AdminModel.findOne({ email: 'admin@gmail.com' });
    if (!admin) {
      console.log('❌ Admin not found in database');
      return;
    }

    console.log('✅ Admin found:');
    console.log('Email:', admin.email);
    console.log('Active:', admin.active);
    console.log('Role:', admin.role);

    // Test password comparison - need to include password field
    const adminWithPassword = await AdminModel.findOne({ email: 'admin@gmail.com' }).select('+password');
    if (adminWithPassword) {
      console.log('Admin with password field found:', !!adminWithPassword.password);
      
      // Test password comparison
      const testPassword = 'admin123';
      const isPasswordValid = await adminWithPassword.comparePassword(testPassword);
      console.log('Password test (admin123):', isPasswordValid ? '✅ Valid' : '❌ Invalid');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugAdminLogin();
