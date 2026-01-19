const mongoose = require('mongoose');
const { AdminModel } = require('./src/models/admin');
require('dotenv').config();

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await AdminModel.findOne({ email: 'admin@gmail.com' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('Email: admin@gmail.com');
      console.log('Password: admin123');
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const adminUser = new AdminModel({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@gmail.com',
      password: 'admin123',
      phone: '9876543210'
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully');
    console.log('Email: admin@gmail.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createAdminUser();
