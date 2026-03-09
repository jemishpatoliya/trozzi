const mongoose = require('mongoose');
require('dotenv').config();

async function checkAWB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://cluster0.xxxxx.mongodb.net/trozzi');
    const db = mongoose.connection.db;
    
    // Check latest orders
    const orders = await db.collection('orders').find({})
      .project({ orderNumber: 1, awb: 1, status: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    console.log('=== Latest Orders with AWB Status ===');
    orders.forEach(order => {
      console.log(`Order: ${order.orderNumber || order._id}, AWB: ${order.awb || 'NULL'}, Status: ${order.status}`);
    });
    
    // Check orders with AWB
    const awbOrders = await db.collection('orders').find({ awb: { $exists: true, $ne: '' } })
      .project({ orderNumber: 1, awb: 1, status: 1 })
      .toArray();
    
    console.log(`\n=== Orders with AWB (${awbOrders.length} total) ===`);
    awbOrders.forEach(order => {
      console.log(`Order: ${order.orderNumber}, AWB: ${order.awb}, Status: ${order.status}`);
    });
    
    // Check specific target order
    const targetOrder = await db.collection('orders').findOne({ orderNumber: 'ORD-120678-BFCA33' });
    if (targetOrder) {
      console.log(`\n=== Target Order ORD-120678-BFCA33 ===`);
      console.log(`AWB: ${targetOrder.awb || 'NULL'}`);
      console.log(`Status: ${targetOrder.status}`);
      console.log(`Admin Status: ${targetOrder.adminStatus || 'NULL'}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAWB();
