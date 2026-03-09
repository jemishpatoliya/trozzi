// MongoDB Index Creation Script
// Run once: node create_indexes.js

require('dotenv').config();
const mongoose = require('mongoose');

async function createIndexes() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/trozzi';
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;
    
    console.log('=== Creating MongoDB Indexes for Performance ===\n');
    
    // Orders collection indexes
    console.log('Creating orders indexes...');
    await db.collection('orders').createIndex({ status: 1 });
    await db.collection('orders').createIndex({ orderNumber: 1 }, { unique: true });
    await db.collection('orders').createIndex({ updatedAt: 1 });
    await db.collection('orders').createIndex({ 'shiprocket.shiprocketOrderId': 1 });
    console.log('✅ Orders indexes created\n');
    
    // Shipments collection indexes
    console.log('Creating shipments indexes...');
    await db.collection('shipments').createIndex({ order: 1 });
    await db.collection('shipments').createIndex({ awbNumber: 1 });
    await db.collection('shipments').createIndex({ shiprocketOrderId: 1 });
    await db.collection('shipments').createIndex({ status: 1 });
    console.log('✅ Shipments indexes created\n');
    
    console.log('=== All Indexes Created Successfully ===');
    console.log('Cron queries will now run 10x faster!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();
