require('dotenv').config();
const mongoose = require('mongoose');
const { Order } = require('./models/order');
const { Shipment } = require('./models/shipment');

// Add AWB numbers from Shiprocket dashboard here
const AWB_UPDATES = [
  { orderNumber: 'ORD-120678-BFCA33', awb: '1319450866699', courier: 'Xpressbees' },
  // Add remaining 21 orders here from Shiprocket dashboard
  // { orderNumber: 'ORD-XXXXX', awb: 'XXXXXXXXX', courier: 'Delhivery' },
];

async function updateAWB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('=== Manual AWB Update Script ===\n');

    let updated = 0;
    let created = 0;
    let failed = 0;

    for (const item of AWB_UPDATES) {
      try {
        // Find order
        const order = await Order.findOne({ orderNumber: item.orderNumber });
        if (!order) {
          console.log(`❌ Order not found: ${item.orderNumber}`);
          failed++;
          continue;
        }

        // Find or create shipment
        let shipment = await Shipment.findOne({ order: order._id });
        
        if (!shipment) {
          console.log(`⚠️ Creating new shipment for: ${item.orderNumber}`);
          shipment = await Shipment.create({
            order: order._id,
            status: 'processing'
          });
          created++;
        }

        // Update shipment with AWB
        await Shipment.updateOne(
          { _id: shipment._id },
          {
            $set: {
              awbNumber: item.awb,
              courierName: item.courier,
              status: 'processing',
              lastError: null,
              retryCount: 0
            }
          }
        );

        console.log(`✅ Updated AWB for: ${item.orderNumber}`);
        console.log(`   AWB: ${item.awb}, Courier: ${item.courier}`);
        updated++;

      } catch (error) {
        console.log(`❌ Error updating ${item.orderNumber}: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n=== Update Complete ===`);
    console.log(`Updated: ${updated}`);
    console.log(`Created: ${created}`);
    console.log(`Failed: ${failed}`);
    console.log(`\nNext cron run will sync these orders with Shiprocket API`);

    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

updateAWB();
