require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

// Backfill script to sync all old orders with AWB from Shiprocket
async function backfillShiprocketStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    console.log('=== Shiprocket Status Backfill ===\n');
    
    // Step 1: Login to Shiprocket
    console.log('Step 1: Logging into Shiprocket...');
    const loginRes = await axios.post(
      'https://apiv2.shiprocket.in/v1/external/auth/login',
      {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD
      }
    );
    const token = loginRes.data.token;
    console.log('✅ Login successful\n');
    
    // Step 2: Find all shipments with AWB (not delivered/cancelled)
    const shipments = await db.collection('shipments').find({
      awbNumber: { $exists: true, $ne: '' },
      status: { $nin: ['delivered', 'cancelled', 'returned'] }
    }).toArray();
    
    console.log(`Step 2: Found ${shipments.length} shipments to sync\n`);
    
    let updatedCount = 0;
    let failedCount = 0;
    
    // Step 3: Sync each shipment
    for (const shipment of shipments) {
      try {
        const awb = shipment.awbNumber;
        const orderId = shipment.order;
        
        console.log(`Processing AWB: ${awb}`);
        
        // Call Shiprocket API
        const trackingRes = await axios.get(
          `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
          }
        );
        
        const currentStatus = trackingRes.data?.tracking_data?.shipment_track?.[0]?.current_status;
        
        if (!currentStatus) {
          console.log(`  ⚠️ No status found for AWB ${awb}`);
          failedCount++;
          continue;
        }
        
        console.log(`  Shiprocket status: ${currentStatus}`);
        
        // Normalize status
        const statusMap = {
          'DELIVERED': 'delivered',
          'SHIPPED': 'shipped',
          'OUT FOR DELIVERY': 'shipped',
          'IN TRANSIT': 'shipped',
          'PICKED UP': 'processing',
          'NEW': 'processing'
        };
        
        const normalizedStatus = statusMap[currentStatus.toUpperCase()] || currentStatus.toLowerCase();
        
        // Update shipment
        await db.collection('shipments').updateOne(
          { _id: shipment._id },
          {
            $set: {
              status: normalizedStatus,
              shiprocketRawStatus: currentStatus,
              lastSyncAt: new Date()
            }
          }
        );
        
        // Update linked order
        if (orderId) {
          const orderUpdate = await db.collection('orders').updateOne(
            { _id: orderId },
            {
              $set: {
                status: normalizedStatus,
                adminStatus: currentStatus,
                'shiprocket.lastSyncAt': new Date()
              },
              $push: {
                statusHistory: {
                  status: normalizedStatus,
                  at: new Date(),
                  source: 'backfill_script'
                }
              }
            }
          );
          
          if (orderUpdate.modifiedCount > 0) {
            console.log(`  ✅ Updated order: ${normalizedStatus}`);
            updatedCount++;
          } else {
            console.log(`  ℹ️ Order already up to date`);
          }
        }
        
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        failedCount++;
      }
      
      console.log('');
    }
    
    console.log('=== Backfill Complete ===');
    console.log(`Updated: ${updatedCount} orders`);
    console.log(`Failed: ${failedCount} orders`);
    console.log(`\nRun this script again anytime to sync all orders.`);
    
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

backfillShiprocketStatus();
