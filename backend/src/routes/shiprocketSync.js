const express = require('express');
const { authenticateAny } = require('../middleware/authAny');
const { Order } = require('../models/order');
const { Shipment } = require('../models/shipment');
const { getShiprocketOrders, getValidShiprocketToken } = require('../services/shiprocketApi');

const router = express.Router();

// Get all Shiprocket orders and sync with local orders
router.get('/sync-all', authenticateAny, async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    console.log('[SYNC] Starting full Shiprocket sync...');
    
    // Get all orders from Shiprocket
    let allShiprocketOrders = [];
    let page = 0;
    let hasMore = true;
    
    while (hasMore) {
      const shiprocketData = await getShiprocketOrders(page, 100);
      if (shiprocketData?.data?.length > 0) {
        allShiprocketOrders = allShiprocketOrders.concat(shiprocketData.data);
        hasMore = shiprocketData.data.length === 100;
        page++;
      } else {
        hasMore = false;
      }
    }
    
    console.log(`[SYNC] Fetched ${allShiprocketOrders.length} orders from Shiprocket`);
    
    // Get all local orders
    const localOrders = await Order.find({})
      .select('orderNumber status shiprocket.orderId createdAtIso')
      .sort({ createdAt: -1 });
    
    console.log(`[SYNC] Found ${localOrders.length} local orders`);
    
    // Create order map for quick lookup
    const localOrderMap = new Map();
    localOrders.forEach(order => {
      localOrderMap.set(order.orderNumber, order);
      if (order.shiprocket?.orderId) {
        localOrderMap.set(order.shiprocket.orderId, order);
      }
    });
    
    // Sync statuses
    let updatedCount = 0;
    let syncedCount = 0;
    
    for (const shiprocketOrder of allShiprocketOrders) {
      const shiprocketOrderId = String(shiprocketOrder.id || '');
      const shiprocketOrderNumber = String(shiprocketOrder.channel_order_id || '');
      const shiprocketStatus = normalizeShiprocketStatus(shiprocketOrder.status);
      
      // Find local order
      let localOrder = null;
      if (shiprocketOrderNumber) {
        localOrder = localOrderMap.get(shiprocketOrderNumber);
      }
      if (!localOrder && shiprocketOrderId) {
        localOrder = localOrderMap.get(shiprocketOrderId);
      }
      
      if (localOrder) {
        // Check if status needs update
        if (localOrder.status !== shiprocketStatus) {
          console.log(`[SYNC] Updating ${localOrder.orderNumber}: ${localOrder.status} → ${shiprocketStatus}`);
          
          // Update order status
          await Order.updateOne(
            { _id: localOrder._id },
            {
              $set: { 
                status: shiprocketStatus,
                'shiprocket.lastSyncAt': new Date(),
                'shiprocket.lastStatus': shiprocketStatus
              },
              $push: {
                statusHistory: {
                  status: shiprocketStatus,
                  at: new Date(),
                  source: 'shiprocket_sync'
                }
              }
            }
          );
          
          // Update shipment if exists
          await Shipment.updateOne(
            { order: localOrder._id },
            {
              $set: { 
                status: shiprocketStatus,
                lastSyncAt: new Date()
              },
              $push: {
                eventHistory: {
                  status: shiprocketStatus,
                  at: new Date(),
                  source: 'shiprocket_sync'
                }
              }
            }
          );
          
          updatedCount++;
        }
        syncedCount++;
      } else {
        console.log(`[SYNC] Order not found locally: ${shiprocketOrderNumber} (${shiprocketOrderId})`);
      }
    }
    
    console.log(`[SYNC] Completed: ${syncedCount} synced, ${updatedCount} updated`);
    
    res.json({
      success: true,
      data: {
        shiprocketOrders: allShiprocketOrders.length,
        localOrders: localOrders.length,
        synced: syncedCount,
        updated: updatedCount,
        syncedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[SYNC] Error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to sync orders' 
    });
  }
});

// Normalize Shiprocket status
function normalizeShiprocketStatus(status) {
  const statusMap = {
    'NEW': 'new',
    'PICKED_UP': 'processing',
    'IN_TRANSIT': 'shipped',
    'OUT_FOR_DELIVERY': 'shipped',
    'DELIVERED': 'delivered',
    'CANCELLED': 'cancelled',
    'RETURNED': 'returned',
    'RTO': 'cancelled',
    'DEL': 'delivered',  // Handle short DEL status
    'DELIVERED': 'delivered'  // Handle full DELIVERED status
  };
  
  // Convert to uppercase and trim
  const normalizedStatus = String(status || '').toUpperCase().trim();
  return statusMap[normalizedStatus] || 'processing';
}

// Get order status verification
router.get('/verify-status/:orderNumber', authenticateAny, async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const orderNumber = req.params.orderNumber;
    
    // Find local order
    const localOrder = await Order.findOne({ orderNumber })
      .select('orderNumber status shiprocket.orderId statusHistory createdAtIso')
      .populate('shiprocket');
    
    if (!localOrder) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Get Shiprocket status if available
    let shiprocketStatus = null;
    if (localOrder.shiprocket?.orderId) {
      try {
        const { syncOrderFromShiprocket } = require('../services/shiprocketApi');
        const shiprocketData = await syncOrderFromShiprocket(localOrder.shiprocket.orderId);
        shiprocketStatus = shiprocketData?.status || null;
      } catch (e) {
        console.error(`[VERIFY] Shiprocket API error for ${orderNumber}:`, e.message);
      }
    }

    // Get status history
    const statusHistory = localOrder.statusHistory || [];
    const lastAdminChange = statusHistory.find(h => h.source === 'admin');
    const lastShiprocketChange = statusHistory.find(h => h.source === 'shiprocket' || h.source === 'shiprocket_api');

    res.json({
      success: true,
      data: {
        orderNumber: localOrder.orderNumber,
        currentStatus: localOrder.status,
        shiprocketStatus: shiprocketStatus,
        statusMatch: localOrder.status === shiprocketStatus,
        lastAdminChange: lastAdminChange ? {
          status: lastAdminChange.status,
          at: lastAdminChange.at,
          source: lastAdminChange.source
        } : null,
        lastShiprocketChange: lastShiprocketChange ? {
          status: lastShiprocketChange.status,
          at: lastShiprocketChange.at,
          source: lastShiprocketChange.source
        } : null,
        fullHistory: statusHistory.map(h => ({
          status: h.status,
          at: h.at,
          source: h.source
        })),
        createdAt: localOrder.createdAtIso
      }
    });

  } catch (error) {
    console.error('[VERIFY] Error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify status' 
    });
  }
});

// Force sync specific order immediately
router.post('/force-sync/:orderNumber', authenticateAny, async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const orderNumber = req.params.orderNumber;
    
    // Find local order
    const localOrder = await Order.findOne({ orderNumber })
      .select('orderNumber status shiprocket.orderId statusHistory')
      .populate('order');
    
    if (!localOrder) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    console.log(`[FORCE SYNC] Starting sync for order ${orderNumber}`);

    // Get Shiprocket status immediately
    let shiprocketStatus = null;
    if (localOrder.shiprocket?.orderId) {
      try {
        const { syncOrderFromShiprocket } = require('../services/shiprocketApi');
        const shiprocketData = await syncOrderFromShiprocket(localOrder.shiprocket.orderId);
        shiprocketStatus = shiprocketData?.status || null;
        
        console.log(`[FORCE SYNC] Shiprocket status: ${shiprocketStatus}, Local status: ${localOrder.status}`);
        
        // Force update regardless of admin changes
        if (shiprocketStatus && shiprocketStatus !== localOrder.status) {
          console.log(`[FORCE SYNC] Updating order ${orderNumber}: ${localOrder.status} → ${shiprocketStatus}`);
          
          // Update order status immediately
          await Order.updateOne(
            { _id: localOrder._id },
            {
              $set: { 
                status: shiprocketStatus,
                'shiprocket.lastSyncAt': new Date(),
                'shiprocket.lastStatus': shiprocketStatus,
                'shiprocket.forceSynced': true
              },
              $push: {
                statusHistory: {
                  status: shiprocketStatus,
                  at: new Date(),
                  source: 'shiprocket_force_sync'
                }
              }
            }
          );

          // Update shipment if exists
          await Shipment.updateOne(
            { order: localOrder._id },
            {
              $set: { 
                status: shiprocketStatus,
                lastSyncAt: new Date(),
                forceSynced: true
              },
              $push: {
                eventHistory: {
                  status: shiprocketStatus,
                  at: new Date(),
                  source: 'shiprocket_force_sync'
                }
              }
            }
          );

          console.log(`[FORCE SYNC] Successfully force updated order ${orderNumber} to ${shiprocketStatus}`);
          
          res.json({
            success: true,
            data: {
              orderNumber: localOrder.orderNumber,
              previousStatus: localOrder.status,
              newStatus: shiprocketStatus,
              forceSynced: true,
              syncedAt: new Date().toISOString(),
              message: 'Order status force updated from Shiprocket'
            }
          });
        } else {
          res.json({
            success: true,
            data: {
              orderNumber: localOrder.orderNumber,
              currentStatus: localOrder.status,
              shiprocketStatus: shiprocketStatus,
              statusMatch: localOrder.status === shiprocketStatus,
              message: 'Status already matches or no Shiprocket data available'
            }
          });
        }
        
      } catch (e) {
        console.error(`[FORCE SYNC] Shiprocket API error for ${orderNumber}:`, e.message);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to get Shiprocket status' 
        });
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'No Shiprocket order ID found' 
      });
    }

  } catch (error) {
    console.error('[FORCE SYNC] Error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to force sync order' 
    });
  }
});

module.exports = router;
