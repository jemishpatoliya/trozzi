const mongoose = require('mongoose');
const { UserModel } = require('./src/models/user');
require('dotenv').config();

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await UserModel.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('✅ Test user already exists');
      await mongoose.disconnect();
      return;
    }

    // Create test user
    const testUser = new UserModel({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: '123456',
      phone: '1234567890'
    });

    await testUser.save();
    console.log('✅ Test user created successfully');
    console.log('Email: test@example.com');
    console.log('Password: 123456');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestUser();
