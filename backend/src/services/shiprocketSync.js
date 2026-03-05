const cron = require('node-cron');
const mongoose = require('mongoose');
const { Shipment } = require('../models/shipment');
const { Order } = require('../models/order');
const { validateTransition } = require('../middleware/stateMachine');
const { syncOrderFromShiprocket } = require('./shiprocketApi');

// Sync Shiprocket status every 1 minute via API
cron.schedule('*/1 * * * *', async () => {
  console.log('[CRON] Starting Shiprocket API status sync (every 1 minute)...');
  
  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.log('[CRON] Database not ready, skipping sync');
      return;
    }

    // Get active orders with AWB numbers (not delivered/cancelled/returned)
    console.log(`[CRON] Querying orders with AWB...`);
    const activeOrders = await Order.find({
      awb: { $exists: true, $ne: '' },
      status: { $nin: ['delivered', 'cancelled', 'returned'] }
    }).sort({ createdAt: -1 });

    console.log(`[CRON] Found ${activeOrders.length} active orders with AWB to sync via API`);
    
    // Debug: Show all orders without AWB
    const allOrders = await Order.find({
      status: { $nin: ['delivered', 'cancelled', 'returned'] }
    }).select('orderNumber awb status').limit(10);
    console.log(`[CRON] Sample orders (first 10):`);
    allOrders.forEach(order => {
      console.log(`  - ${order.orderNumber}: AWB=${order.awb || 'NULL'}, Status=${order.status}`);
    });

    // Force sync ORD-120678-BFCA33 specifically
    console.log(`[CRON] Looking for target order ORD-120678-BFCA33...`);
    const targetOrder = await Order.findOne({ orderNumber: 'ORD-120678-BFCA33' });
    
    if (targetOrder) {
      console.log(`[CRON] Found target order: ${targetOrder.orderNumber}, AWB=${targetOrder.awb || 'NULL'}, Status=${targetOrder.status}`);
      
      // Update AWB if not present
      if (!targetOrder.awb) {
        console.log(`[CRON] Updating AWB for target order ORD-120678-BFCA33`);
        await Order.updateOne(
          { _id: targetOrder._id },
          { $set: { awb: '1319450866699' } }
        );
        targetOrder.awb = '1319450866699';
        console.log(`[CRON] AWB updated: ${targetOrder.awb}`);
      } else {
        console.log(`[CRON] AWB already exists: ${targetOrder.awb}`);
      }
      
      console.log(`[CRON] Force syncing target order ORD-120678-BFCA33 (AWB: ${targetOrder.awb})`);
      try {
        const shiprocketSync = await syncOrderFromShiprocket(targetOrder.awb);
        if (shiprocketSync) {
          console.log(`[CRON] Target order Shiprocket status: ${shiprocketSync.status}, Local: ${targetOrder.status}`);
          
          if (shiprocketSync.status !== targetOrder.status) {
            console.log(`[CRON] FORCE UPDATING target order ORD-120678-BFCA33: ${targetOrder.status} → ${shiprocketSync.status} (${shiprocketSync.adminStatus})`);
            
            // Update order status immediately
            await Order.updateOne(
              { _id: targetOrder._id },
              {
                $set: { 
                  status: shiprocketSync.status,
                  adminStatus: shiprocketSync.adminStatus, // Add admin status for display
                  'shiprocket.lastSyncAt': new Date(),
                  'shiprocket.lastStatus': shiprocketSync.status,
                  'shiprocket.adminStatus': shiprocketSync.adminStatus,
                  'shiprocket.forceSynced': true
                },
                $push: {
                  statusHistory: {
                    status: shiprocketSync.status,
                    at: new Date(),
                    source: 'shiprocket_force_sync'
                  }
                }
              }
            );

            // Update shipment if exists
            await Shipment.updateOne(
              { order: targetOrder._id },
              {
                $set: { 
                  status: shiprocketSync.status,
                  lastSyncAt: new Date(),
                  forceSynced: true
                },
                $push: {
                  eventHistory: {
                    status: shiprocketSync.status,
                    at: new Date(),
                    source: 'shiprocket_force_sync'
                  }
                }
              }
            );

            console.log(`[CRON] Successfully force updated target order ORD-120678-BFCA33 to ${shiprocketSync.status}`);
          }
        }
      } catch (e) {
        console.error(`[CRON] Target order sync error:`, e.message);
      }
    }

    for (const order of activeOrders) {
      try {
        console.log(`[CRON] Processing order ${order.orderNumber} (AWB: ${order.awb})`);

        // Check if admin changed status recently (within 5 minutes)
        const lastManualChange = order.statusHistory?.find(h => h.source === 'admin');
        if (lastManualChange) {
          const minutesSinceManualChange = (new Date() - new Date(lastManualChange.at)) / (1000 * 60);
          if (minutesSinceManualChange < 5) {
            console.log(`[CRON] Skipping order ${order.orderNumber} - admin changed status recently (${minutesSinceManualChange.toFixed(1)} min ago)`);
            continue;
          }
        }

        // Get status from Shiprocket API using AWB
        console.log(`[CRON] Fetching Shiprocket status for order ${order.orderNumber} (AWB: ${order.awb})`);
        const shiprocketSync = await syncOrderFromShiprocket(order.awb);
        if (!shiprocketSync) {
          console.log(`[CRON] Failed to sync order ${order.orderNumber} - no Shiprocket data`);
          continue;
        }

        console.log(`[CRON] Shiprocket status for ${order.orderNumber}: ${shiprocketSync.status} (${shiprocketSync.adminStatus}), Local: ${order.status}`);

        // Only update if status is different
        if (shiprocketSync.status !== order.status) {
          console.log(`[CRON] Updating order ${order.orderNumber}: ${order.status} → ${shiprocketSync.status}`);
          
          // Validate transition
          try {
            validateTransition('order', order.status, shiprocketSync.status);
          } catch (e) {
            console.error(`[CRON] Invalid transition for order ${order.orderNumber}:`, e.message);
            // Force update anyway for delivered orders
            if (shiprocketSync.status === 'delivered') {
              console.log(`[CRON] Forcing delivered status update for order ${order.orderNumber}`);
            } else {
              continue;
            }
          }

          // Update order status immediately
          await Order.updateOne(
            { _id: order._id },
            {
              $set: { 
                status: shiprocketSync.status,
                adminStatus: shiprocketSync.adminStatus, // Add admin status for display
                'shiprocket.lastSyncAt': new Date(),
                'shiprocket.lastStatus': shiprocketSync.status,
                'shiprocket.adminStatus': shiprocketSync.adminStatus,
                'shiprocket.forceSynced': true
              },
              $push: {
                statusHistory: {
                  status: shiprocketSync.status,
                  at: new Date(),
                  source: 'shiprocket_api'
                }
              }
            }
          );

          // Update shipment if exists
          await Shipment.updateOne(
            { order: order._id },
            {
              $set: { 
                status: shiprocketSync.status,
                lastSyncAt: new Date(),
                forceSynced: true
              },
              $push: {
                eventHistory: {
                  status: shiprocketSync.status,
                  at: new Date(),
                  source: 'shiprocket_api'
                }
              }
            }
          );

          console.log(`[CRON] Successfully updated order ${order.orderNumber} to ${shiprocketSync.status}`);
        } else {
          console.log(`[CRON] Order ${order.orderNumber} status unchanged`);
        }
        
      } catch (e) {
        console.error(`[CRON] Error syncing order ${order.orderNumber}:`, e.message);
      }
    }

    console.log('[CRON] Shiprocket API sync completed');
  } catch (e) {
    console.error('[CRON] Shiprocket API sync error:', e);
  }
});

console.log('[CRON] Shiprocket API sync scheduler initialized (every 1 minute)');
