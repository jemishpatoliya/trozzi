const mongoose = require('mongoose');
require('dotenv').config();

async function migrateAdminData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    
    // Find admin records in users collection
    const adminUsers = await mongoose.connection.db.collection('users').find({role: 'admin'}).toArray();
    console.log('📊 Found admin users:', adminUsers.length);
    
    if (adminUsers.length > 0) {
      // Create admins collection with admin data
      await mongoose.connection.db.collection('admins').insertMany(adminUsers);
      console.log('✅ Admin users migrated to admins collection');
      
      // Remove admin records from users collection
      await mongoose.connection.db.collection('users').deleteMany({role: 'admin'});
      console.log('🗑️ Admin records removed from users collection');
      
      console.log('🎯 Admin users migrated:');
      adminUsers.forEach(admin => {
        console.log(`   - ${admin.email}`);
      });
    } else {
      console.log('ℹ️ No admin users found to migrate');
    }
    
    // Verify collections
    const userCount = await mongoose.connection.db.collection('users').countDocuments();
    const adminCount = await mongoose.connection.db.collection('admins').countDocuments();
    
    console.log(`📈 Final counts:`);
    console.log(`   - Users collection: ${userCount} records`);
    console.log(`   - Admins collection: ${adminCount} records`);
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

migrateAdminData();
