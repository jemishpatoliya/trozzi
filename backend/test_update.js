require('dotenv').config();
const mongoose = require('mongoose');

async function testUpdate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://cluster0.xxxxx.mongodb.net/trozzi');
    const db = mongoose.connection.db;
    
    console.log('=== Testing Manual Database Update ===');
    
    // Update target order with AWB and status
    const result = await db.collection('orders').updateOne(
      { orderNumber: 'ORD-120678-BFCA33' },
      { 
        $set: { 
          awb: '1319450866699',
          status: 'delivered',
          adminStatus: 'DELIVERED',
          updatedAt: new Date()
        }
      }
    );
    
    console.log('Update Result:', result);
    
    // Verify update
    const updatedOrder = await db.collection('orders').findOne({ orderNumber: 'ORD-120678-BFCA33' });
    console.log('\n=== Updated Order ===');
    console.log('Order Number:', updatedOrder.orderNumber);
    console.log('AWB:', updatedOrder.awb);
    console.log('Status:', updatedOrder.status);
    console.log('Admin Status:', updatedOrder.adminStatus);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testUpdate();
