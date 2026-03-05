const express = require('express');
const { authenticateAny } = require('../middleware/authAny');
const { Shipment } = require('../models/shipment');
const { Order } = require('../models/order');
const { getShiprocketOrders, getValidShiprocketToken } = require('../services/shiprocketApi');

const router = express.Router();

// Get Shiprocket orders data for admin panel
router.get('/shiprocket-data', authenticateAny, async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 50;

    // Get data from Shiprocket API
    const shiprocketData = await getShiprocketOrders(page, limit);
    
    // Also get local orders for comparison
    const localOrders = await Order.find({})
      .select('orderNumber status createdAtIso shiprocket.orderId')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: {
        shiprocket: shiprocketData,
        local: localOrders,
        syncedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Shiprocket Data] Error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch Shiprocket data' 
    });
  }
});

// Sync specific order from Shiprocket
router.post('/sync-order/:orderId', authenticateAny, async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const orderId = req.params.orderId;
    
    // Find shipment
    const shipment = await Shipment.findOne({ 
      $or: [
        { order: orderId },
        { shiprocketOrderId: orderId }
      ]
    }).populate('order');

    if (!shipment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Shipment not found' 
      });
    }

    // Sync from Shiprocket API
    const { syncOrderFromShiprocket } = require('../services/shiprocketApi');
    const shiprocketSync = await syncOrderFromShiprocket(shipment.shiprocketOrderId);
    
    if (!shiprocketSync) {
      return res.status(400).json({ 
        success: false, 
        message: 'Failed to sync from Shiprocket' 
      });
    }

    res.json({
      success: true,
      data: {
        orderId: shipment.order._id,
        orderNumber: shipment.order.orderNumber,
        previousStatus: shipment.status,
        newStatus: shiprocketSync.status,
        trackingData: shiprocketSync.trackingData,
        syncedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Sync Order] Error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to sync order' 
    });
  }
});

// Get Shiprocket token status
router.get('/shiprocket-token', authenticateAny, async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const token = await getValidShiprocketToken();
    
    res.json({
      success: true,
      data: {
        tokenExists: !!token,
        // Don't expose the actual token for security
        tokenPreview: token ? `${token.substring(0, 20)}...` : null,
        checkedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Shiprocket Token] Error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check Shiprocket token' 
    });
  }
});

module.exports = router;
