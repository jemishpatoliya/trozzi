const mongoose = require('mongoose');
const { AdminModel } = require('./src/models/admin');
require('dotenv').config();

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const admin = await AdminModel.findOne({ email: 'admin@gmail.com' });
    if (admin) {
      console.log('✅ Admin found:');
      console.log('Email:', admin.email);
      console.log('Name:', admin.firstName, admin.lastName);
      console.log('Active:', admin.active);
      console.log('Role:', admin.role);
    } else {
      console.log('❌ Admin not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAdmin();
