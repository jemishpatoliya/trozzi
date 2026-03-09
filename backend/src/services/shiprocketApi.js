const axios = require('axios');

let shiprocketToken = null;
let tokenExpiry = null;

// Get Shiprocket API token
async function getShiprocketToken() {
  try {
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;
    
    if (!email || !password) {
      throw new Error('Shiprocket credentials not configured');
    }

    const response = await axios.post(
      'https://apiv2.shiprocket.in/v1/external/auth/login',
      {
        email: email,
        password: password
      }
    );

    const token = response.data.token;
    shiprocketToken = token;
    // Set expiry to 9 days from now (before 10 days expiry)
    tokenExpiry = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
    
    console.log('[Shiprocket] Token generated successfully');
    return token;
  } catch (error) {
    console.error('[Shiprocket] Token generation failed:', error.response?.data || error.message);
    throw error;
  }
}

// Get valid token (refresh if needed)
async function getValidShiprocketToken() {
  if (!shiprocketToken || !tokenExpiry || new Date() >= tokenExpiry) {
    return await getShiprocketToken();
  }
  return shiprocketToken;
}

// Get order status from Shiprocket API
async function getShiprocketOrderStatus(shipmentId) {
  try {
    const token = await getValidShiprocketToken();
    
    const response = await axios.get(
      `https://apiv2.shiprocket.in/v1/external/courier/track/shipment/${shipmentId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error(`[Shiprocket] Failed to get status for shipment ${shipmentId}:`, error.response?.data || error.message);
    throw error;
  }
}

// Get all orders from Shiprocket
async function getShiprocketOrders(page = 0, limit = 100) {
  try {
    const token = await getValidShiprocketToken();
    
    const response = await axios.get(
      `https://apiv2.shiprocket.in/v1/external/orders?page=${page}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('[Shiprocket] Failed to get orders:', error.response?.data || error.message);
    throw error;
  }
}

// Sync order status from Shiprocket API using AWB with retry mechanism
async function syncOrderFromShiprocket(awbNumber, retryCount = 0) {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second
  
  try {
    const token = await getValidShiprocketToken();
    
    // Use AWB tracking endpoint instead of shipment_id
    const response = await axios.get(
      `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awbNumber}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    console.log(`[Shiprocket API] Raw response for AWB ${awbNumber}:`, JSON.stringify(response.data, null, 2));
    
    // Get status from correct field - shipment_track[0].current_status
    let originalStatus = '';
    try {
      const trackData = response.data.tracking_data?.shipment_track?.[0];
      if (trackData?.current_status) {
        originalStatus = String(trackData.current_status).trim();
        console.log(`[Shiprocket API] Using correct field - current_status: "${originalStatus}"`);
      } else {
        // Fallback to main status field
        originalStatus = String(response.data.status || '').trim();
        console.log(`[Shiprocket API] Using fallback field - status: "${originalStatus}"`);
      }
    } catch (e) {
      console.log(`[Shiprocket API] Error accessing tracking_data, using fallback status`);
      originalStatus = String(response.data.status || '').trim();
    }
    
    // Get sr-status-label from latest activity for admin display
    let adminStatus = '';
    try {
      const activities = response.data.tracking_data?.shipment_track_activities;
      if (activities && activities.length > 0) {
        const latestActivity = activities[0]; // First one is latest
        adminStatus = latestActivity['sr-status-label'] || originalStatus;
        console.log(`[Shiprocket API] Using sr-status-label for admin: "${adminStatus}"`);
      }
    } catch (e) {
      console.log(`[Shiprocket API] Error accessing activities, using current_status`);
      adminStatus = originalStatus;
    }
    
    // Normalize status - comprehensive mapping
    const statusMap = {
      // Standard statuses
      'NEW': 'new',
      'PICKED_UP': 'processing', 
      'IN_TRANSIT': 'shipped',
      'OUT_FOR_DELIVERY': 'shipped',
      'DELIVERED': 'delivered',
      'CANCELLED': 'cancelled',
      'RETURNED': 'returned',
      'RTO': 'cancelled',
      
      // Short variations
      'DEL': 'delivered',
      'DELIVERED': 'delivered',
      'DLV': 'delivered',
      'D': 'delivered',
      
      // Additional possible statuses
      'DISPATCHED': 'shipped',
      'SHIPPED': 'shipped',
      'ON_THE_WAY': 'shipped',
      'OUT_FOR_DEL': 'shipped',
      'OFD': 'shipped',
      
      // Processing variations
      'PROCESSING': 'processing',
      'PACKED': 'processing',
      'READY_TO_SHIP': 'processing',
      'ORDER_PLACED': 'new',
      'ORDER_CONFIRMED': 'processing',
      
      // Cancel variations
      'CANCEL': 'cancelled',
      'CANCELED': 'cancelled',
      'REJECTED': 'cancelled',
      
      // Return variations
      'RETURN': 'returned',
      'RETURN_REQUESTED': 'returned',
      'RETURN_INITIATED': 'returned'
    };
    
    // Convert to uppercase and trim for better matching
    const normalizedStatus = originalStatus.toUpperCase().trim();
    const currentStatus = statusMap[normalizedStatus] || 'processing';
    
    console.log(`[Shiprocket API] Status mapping for AWB ${awbNumber}:`);
    console.log(`  - Original: "${originalStatus}"`);
    console.log(`  - Normalized: "${normalizedStatus}"`);
    console.log(`  - Mapped to: "${currentStatus}"`);
    
    // Special handling for delivered status
    if (originalStatus.toLowerCase().includes('deliver') || 
        normalizedStatus.includes('DELIVER') ||
        normalizedStatus.includes('DLV')) {
      console.log(`[Shiprocket API] Detected delivered status - forcing to 'delivered'`);
      return {
        status: 'delivered',
        adminStatus: adminStatus || 'DELIVERED', // For admin panel display
        trackingData: response.data,
        lastUpdated: new Date()
      };
    }
    
    return {
      status: currentStatus,
      adminStatus: adminStatus, // For admin panel display
      trackingData: response.data,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error(`[Shiprocket] Sync failed for AWB ${awbNumber}:`, error.response?.data || error.message);
    
    // Retry logic with exponential backoff
    if (retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount);
      console.log(`[Shiprocket] Retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return await syncOrderFromShiprocket(awbNumber, retryCount + 1);
    }
    
    console.error(`[Shiprocket] Max retries reached for AWB ${awbNumber}`);
    return null;
  }
}

module.exports = {
  getShiprocketToken,
  getValidShiprocketToken,
  getShiprocketOrderStatus,
  getShiprocketOrders,
  syncOrderFromShiprocket
};
