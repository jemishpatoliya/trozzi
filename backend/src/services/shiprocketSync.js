const cron = require('node-cron');
const mongoose = require('mongoose');
const { Shipment } = require('../models/shipment');
const { Order } = require('../models/order');
const axios = require('axios');

// ========== CONFIGURATION ==========
const CONFIG = {
  CRON_INTERVAL: '*/1 * * * *', // Every 1 minute
  TOKEN_CACHE_MINUTES: 10,
  MAX_RETRIES: 3,
  RETRY_DELAY_BASE: 1000, // 1 second
  RATE_LIMIT_PER_MINUTE: 30,
  LOCK_TIMEOUT_MS: 55000, // 55 seconds (cron runs every 60s)
};

// ========== STATE ==========
let cachedToken = null;
let tokenExpiry = null;
let isCronRunning = false;
let lastCronStart = null;
const apiCallHistory = new Map();

// ========== TOKEN MANAGEMENT ==========
async function getShiprocketToken() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  
  if (!email || !password) {
    throw new Error('Shiprocket credentials not configured');
  }
  
  const response = await axios.post(
    'https://apiv2.shiprocket.in/v1/external/auth/login',
    { email, password },
    { timeout: 30000 }
  );
  
  const token = response.data.token;
  if (!token) throw new Error('No token received from Shiprocket');
  
  // Cache token for 10 minutes
  cachedToken = token;
  tokenExpiry = Date.now() + (CONFIG.TOKEN_CACHE_MINUTES * 60 * 1000);
  
  return token;
}

async function getValidToken() {
  // Return cached token if still valid
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry - 60000) {
    return cachedToken;
  }
  
  // Generate new token
  return await getShiprocketToken();
}

// ========== RATE LIMITING ==========
function checkRateLimit(key) {
  const now = Date.now();
  const lastCall = apiCallHistory.get(key);
  const minDelay = (60 * 1000) / CONFIG.RATE_LIMIT_PER_MINUTE; // 2 seconds between calls
  
  if (lastCall && (now - lastCall) < minDelay) {
    return false;
  }
  
  apiCallHistory.set(key, now);
  
  // Clean old entries
  apiCallHistory.forEach((timestamp, k) => {
    if (now - timestamp > 60000) apiCallHistory.delete(k);
  });
  
  return true;
}

// ========== RETRY SYSTEM ==========
async function withRetry(operation, context) {
  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isRetryable = error.response?.status === 429 || 
                         error.response?.status >= 500 || 
                         error.code === 'ECONNRESET' ||
                         error.code === 'ETIMEDOUT';
      
      if (!isRetryable || attempt === CONFIG.MAX_RETRIES) {
        throw error;
      }
      
      const delay = CONFIG.RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
      console.log(`[CRON] Retry ${attempt}/${CONFIG.MAX_RETRIES} for ${context} in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// ========== API CALLS ==========
async function getStatusByAWB(awb) {
  return withRetry(async () => {
    const token = await getValidToken();
    
    const response = await axios.get(
      `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      }
    );
    
    const trackData = response.data?.tracking_data?.shipment_track?.[0];
    const activities = response.data?.tracking_data?.shipment_track_activities;
    
    if (!trackData?.current_status) {
      return null;
    }
    
    const status = trackData.current_status;
    const adminStatus = activities?.[0]?.['sr-status-label'] || status;
    
    return { status, adminStatus, source: 'awb' };
  }, `AWB:${awb}`);
}

async function getStatusByOrderId(orderId) {
  return withRetry(async () => {
    const token = await getValidToken();
    
    const response = await axios.get(
      `https://apiv2.shiprocket.in/v1/external/orders/show/${orderId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      }
    );
    
    const orderData = response.data?.data;
    if (!orderData) return null;
    
    const shiprocketStatus = orderData.status || orderData.shipment_status || 'NEW';
    const awbCode = orderData.awb_code || orderData.shipments?.[0]?.awb_code;
    
    return {
      status: shiprocketStatus,
      adminStatus: shiprocketStatus,
      awbCode,
      source: 'order_id'
    };
  }, `Order:${orderId}`);
}

// ========== STATUS NORMALIZATION ==========
const STATUS_MAP = {
  'NEW': 'new',
  'PICKED_UP': 'processing',
  'IN_TRANSIT': 'shipped',
  'OUT_FOR_DELIVERY': 'shipped',
  'DELIVERED': 'delivered',
  'CANCELLED': 'cancelled',
  'RTO': 'returned',
  'RETURNED': 'returned',
  'RTO DELIVERED': 'returned'
};

function normalizeStatus(shiprocketStatus) {
  const key = String(shiprocketStatus || '').toUpperCase().trim();
  return STATUS_MAP[key] || key.toLowerCase();
}

// ========== CRON LOCK ==========
function acquireCronLock() {
  const now = Date.now();
  
  if (isCronRunning && lastCronStart && (now - lastCronStart) < CONFIG.LOCK_TIMEOUT_MS) {
    console.log('[CRON] Previous cron still running, skipping this cycle');
    return false;
  }
  
  isCronRunning = true;
  lastCronStart = now;
  return true;
}

function releaseCronLock() {
  isCronRunning = false;
}

// ========== MAIN CRON JOB ==========
cron.schedule(CONFIG.CRON_INTERVAL, async () => {
  if (!acquireCronLock()) return;
  
  const startTime = Date.now();
  
  try {
    // Fetch only pending orders (optimization: exclude final states)
    const orders = await Order.find({
      status: { $nin: ['delivered', 'cancelled', 'returned'] }
    }).select('orderNumber status shiprocket').sort({ updatedAt: 1 }).limit(100);

    if (orders.length === 0) {
      return;
    }
    
    let synced = 0;
    let failed = 0;
    let skipped = 0;
    let awbDiscovered = 0;

    for (const order of orders) {
      try {
        // Rate limit check
        if (!checkRateLimit(`order:${order._id}`)) {
          skipped++;
          continue;
        }
        
        // Find shipment
        const shipment = await Shipment.findOne({ order: order._id })
          .select('awbNumber shiprocketOrderId status');
        
        let trackingResult = null;
        
        // Method 1: AWB tracking
        if (shipment?.awbNumber) {
          if (checkRateLimit(`awb:${shipment.awbNumber}`)) {
            trackingResult = await getStatusByAWB(shipment.awbNumber);
          }
        }
        
        // Method 2: Order ID fallback
        if (!trackingResult && shipment?.shiprocketOrderId) {
          if (checkRateLimit(`oid:${shipment.shiprocketOrderId}`)) {
            trackingResult = await getStatusByOrderId(shipment.shiprocketOrderId);
            
            // Auto-discover AWB
            if (trackingResult?.awbCode && !shipment.awbNumber) {
              await Shipment.updateOne(
                { _id: shipment._id },
                { $set: { awbNumber: trackingResult.awbCode } }
              );
              awbDiscovered++;
            }
          }
        }
        
        if (!trackingResult) {
          failed++;
          continue;
        }
        
        const normalizedStatus = normalizeStatus(trackingResult.status);
        
        // Skip if no change
        if (normalizedStatus === order.status) {
          continue;
        }
        
        // Update order
        await Order.updateOne(
          { _id: order._id },
          {
            $set: {
              status: normalizedStatus,
              adminStatus: trackingResult.adminStatus,
              'shiprocket.lastSyncAt': new Date(),
              'shiprocket.trackingSource': trackingResult.source
            },
            $push: {
              statusHistory: {
                status: normalizedStatus,
                at: new Date(),
                source: 'shiprocket_api'
              }
            }
          }
        );
        
        // Update shipment
        if (shipment) {
          await Shipment.updateOne(
            { _id: shipment._id },
            {
              $set: {
                status: normalizedStatus,
                lastSyncAt: new Date()
              }
            }
          );
        }
        
        console.log(`[CRON] ${order.orderNumber}: ${order.status} → ${normalizedStatus}`);
        synced++;
        
      } catch (error) {
        console.error(`[CRON] Failed ${order.orderNumber}: ${error.message}`);
        failed++;
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[CRON] ${orders.length} orders: ${synced} synced, ${failed} failed, ${skipped} skipped, ${awbDiscovered} AWBs (${duration}ms)`);
    
  } catch (error) {
    console.error('[CRON] Fatal error:', error.message);
  } finally {
    releaseCronLock();
  }
});

console.log('[CRON] Production Shiprocket sync initialized');
