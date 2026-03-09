require('dotenv').config();
const mongoose = require('mongoose');

async function checkShipments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    console.log('=== Checking Shipments ===\n');
    
    // All shipments
    const total = await db.collection('shipments').countDocuments();
    console.log(`Total shipments: ${total}`);
    
    // With AWB
    const withAwb = await db.collection('shipments').countDocuments({
      awbNumber: { $exists: true, $ne: '' }
    });
    console.log(`With AWB: ${withAwb}`);
    
    // Without AWB
    const withoutAwb = await db.collection('shipments').countDocuments({
      $or: [
        { awbNumber: { $exists: false } },
        { awbNumber: '' }
      ]
    });
    console.log(`Without AWB: ${withoutAwb}\n`);
    
    // Show shipments without AWB
    const noAwbShipments = await db.collection('shipments').find({
      $or: [
        { awbNumber: { $exists: false } },
        { awbNumber: '' }
      ]
    })
    .select('order awbNumber status lastError')
    .limit(10)
    .toArray();
    
    console.log('Shipments without AWB (need manual update):');
    for (const s of noAwbShipments) {
      const order = await db.collection('orders').findOne({ _id: s.order });
      console.log(`  Order: ${order?.orderNumber || s.order}, Status: ${s.status}, Error: ${s.lastError || 'N/A'}`);
    }
    
    // Show shipments with AWB
    const withAwbShipments = await db.collection('shipments').find({
      awbNumber: { $exists: true, $ne: '' }
    })
    .select('order awbNumber status')
    .toArray();
    
    console.log('\nShipments with AWB (will sync):');
    for (const s of withAwbShipments) {
      const order = await db.collection('orders').findOne({ _id: s.order });
      console.log(`  Order: ${order?.orderNumber || s.order}, AWB: ${s.awbNumber}, Status: ${s.status}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkShipments();
