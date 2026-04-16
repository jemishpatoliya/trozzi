/**
 * Meta Conversions API (CAPI) Service
 * Server-side event tracking for Meta ads
 * 
 * Features:
 * - SHA256 hashing for user data
 * - Event deduplication with event_id
 * - Retry logic for failed requests
 * - Comprehensive error handling
 */

const axios = require('axios');
const crypto = require('crypto');

// Meta Graph API Configuration
const META_API_VERSION = 'v18.0'; // Use latest stable version
const META_API_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

/**
 * SHA256 Hash function for user data
 * Required for email, phone, and other PII
 */
function hashData(data) {
  if (!data || typeof data !== 'string') return null;
  
  // Normalize: lowercase, trim whitespace
  const normalized = data.toLowerCase().trim();
  
  // Create SHA256 hash
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Generate unique event ID for deduplication
 * Format: {event_name}_{product_id/order_id}_{timestamp}_{random}
 */
function generateEventId(eventName, entityId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${eventName}_${entityId}_${timestamp}_${random}`;
}

/**
 * Extract client IP from request
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const remoteAddress = req.connection?.remoteAddress;
  
  return forwarded?.split(',')[0]?.trim() || 
         realIp || 
         remoteAddress || 
         req.ip ||
         '127.0.0.1';
}

/**
 * Build user data object with hashed fields
 */
function buildUserData(req, userInfo = {}) {
  const clientIp = getClientIp(req);
  const userAgent = req.headers['user-agent'] || '';
  
  const userData = {
    // Client data (not hashed)
    client_ip_address: clientIp,
    client_user_agent: userAgent,
    
    // Hashed user data (if available)
    ...(userInfo.email && { em: hashData(userInfo.email) }),
    ...(userInfo.phone && { ph: hashData(userInfo.phone) }),
    ...(userInfo.firstName && { fn: hashData(userInfo.firstName) }),
    ...(userInfo.lastName && { ln: hashData(userInfo.lastName) }),
    ...(userInfo.city && { ct: hashData(userInfo.city) }),
    ...(userInfo.state && { st: hashData(userInfo.state) }),
    ...(userInfo.country && { country: hashData(userInfo.country) }),
    ...(userInfo.postalCode && { zp: hashData(userInfo.postalCode) }),
    
    // FB Login ID (if user logged in with Facebook)
    ...(userInfo.fbLoginId && { fb_login_id: userInfo.fbLoginId }),
    
    // External ID (your internal user ID)
    ...(userInfo.externalId && { external_id: hashData(userInfo.externalId) }),
  };
  
  return userData;
}

/**
 * Build custom data for events
 */
function buildCustomData(eventData) {
  const customData = {
    value: Number(eventData.value || 0),
    currency: eventData.currency || 'INR',
  };
  
  // Add content data if available
  if (eventData.contentIds?.length) {
    customData.content_ids = eventData.contentIds;
    customData.content_type = eventData.contentType || 'product';
    customData.content_name = eventData.contentName || '';
    customData.contents = eventData.contents?.map(item => ({
      id: String(item.id || ''),
      quantity: Number(item.quantity || 1),
      item_price: Number(item.price || 0),
    })) || [];
  }
  
  // Order ID for Purchase events
  if (eventData.orderId) {
    customData.order_id = String(eventData.orderId);
  }
  
  // Predicted LTV (for high-value customers)
  if (eventData.predictedLtv) {
    customData.predicted_ltv = Number(eventData.predictedLtv);
  }
  
  // Status for checkout events
  if (eventData.status) {
    customData.status = eventData.status;
  }
  
  return customData;
}

/**
 * Send event to Meta Conversions API
 */
async function sendEventToMeta(eventName, eventData, req, userInfo = {}) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  
  if (!pixelId || !accessToken) {
    throw new Error('Missing META_PIXEL_ID or META_CAPI_ACCESS_TOKEN in environment variables');
  }
  
  // Generate or use provided event_id
  const eventId = eventData.eventId || generateEventId(eventName, eventData.entityId || 'unknown');
  
  // Build the event payload
  const event = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
    event_id: eventId,
    action_source: eventData.actionSource || 'website',
    user_data: buildUserData(req, userInfo),
    custom_data: buildCustomData(eventData),
  };
  
  // Optional: Add original event data for deduplication
  if (eventData.eventSourceUrl) {
    event.event_source_url = eventData.eventSourceUrl;
  }
  
  // Optional: Add data processing options
  if (process.env.META_CAPI_DATA_OPTIONS) {
    event.data_processing_options = JSON.parse(process.env.META_CAPI_DATA_OPTIONS);
  }
  
  const payload = {
    data: [event],
    ...(process.env.META_CAPI_TEST_EVENT_CODE && {
      test_event_code: process.env.META_CAPI_TEST_EVENT_CODE,
    }),
  };
  
  const url = `${META_API_BASE_URL}/${pixelId}/events?access_token=${accessToken}`;
  
  try {
    console.log(`[Meta CAPI] Sending ${eventName} event:`, {
      eventId,
      value: eventData.value,
      currency: eventData.currency,
    });
    
    const response = await axios.post(url, payload, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`[Meta CAPI] ${eventName} event sent successfully:`, {
      eventId,
      fbTraceId: response.data?.fbtrace_id,
      eventsReceived: response.data?.events_received,
    });
    
    return {
      success: true,
      eventId,
      fbTraceId: response.data?.fbtrace_id,
      response: response.data,
    };
    
  } catch (error) {
    const errorDetails = {
      eventName,
      eventId,
      status: error.response?.status,
      message: error.response?.data?.error?.message || error.message,
      type: error.response?.data?.error?.type,
      code: error.response?.data?.error?.code,
    };
    
    console.error('[Meta CAPI] Event failed:', errorDetails);
    
    throw {
      success: false,
      eventId,
      error: errorDetails,
      rawError: error,
    };
  }
}

/**
 * Retry wrapper for failed events
 */
async function sendEventWithRetry(eventName, eventData, req, userInfo = {}, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendEventToMeta(eventName, eventData, req, userInfo);
    } catch (error) {
      lastError = error;
      
      // Don't retry on authentication errors
      if (error.error?.code === 190 || error.error?.code === 102) {
        console.error('[Meta CAPI] Authentication error, not retrying:', error.error);
        throw error;
      }
      
      // Don't retry on invalid data errors
      if (error.error?.code === 100 || error.error?.type === 'OAuthException') {
        console.error('[Meta CAPI] Invalid data error, not retrying:', error.error);
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
        console.log(`[Meta CAPI] Retry ${attempt}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Public API Methods
 */

const MetaCapiService = {
  /**
   * Track ViewContent event (product page view)
   */
  async trackViewContent(req, data) {
    const eventData = {
      eventId: data.eventId,
      entityId: data.productId,
      contentIds: [data.productId],
      contentType: 'product',
      contentName: data.productName,
      value: data.price,
      currency: data.currency || 'INR',
      actionSource: 'website',
      eventSourceUrl: data.sourceUrl,
    };
    
    return sendEventWithRetry('ViewContent', eventData, req, {
      email: data.email,
      phone: data.phone,
      externalId: data.userId,
      fbLoginId: data.fbLoginId,
    });
  },
  
  /**
   * Track AddToCart event
   */
  async trackAddToCart(req, data) {
    const eventData = {
      eventId: data.eventId,
      entityId: data.productId,
      contentIds: [data.productId],
      contentType: 'product',
      contentName: data.productName,
      value: data.value,
      currency: data.currency || 'INR',
      contents: data.contents || [{
        id: data.productId,
        quantity: data.quantity,
        price: data.price,
      }],
      actionSource: 'website',
      eventSourceUrl: data.sourceUrl,
    };
    
    return sendEventWithRetry('AddToCart', eventData, req, {
      email: data.email,
      phone: data.phone,
      externalId: data.userId,
      fbLoginId: data.fbLoginId,
    });
  },
  
  /**
   * Track InitiateCheckout event
   */
  async trackInitiateCheckout(req, data) {
    const eventData = {
      eventId: data.eventId,
      entityId: data.cartId || 'checkout',
      contentIds: data.contentIds,
      contentType: 'product',
      value: data.value,
      currency: data.currency || 'INR',
      contents: data.contents,
      actionSource: 'website',
      eventSourceUrl: data.sourceUrl,
    };
    
    return sendEventWithRetry('InitiateCheckout', eventData, req, {
      email: data.email,
      phone: data.phone,
      externalId: data.userId,
      fbLoginId: data.fbLoginId,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postalCode,
    });
  },
  
  /**
   * Track Purchase event (most important)
   */
  async trackPurchase(req, data) {
    const eventData = {
      eventId: data.eventId,
      entityId: data.orderId,
      orderId: data.orderId,
      contentIds: data.contentIds,
      contentType: 'product',
      value: data.value,
      currency: data.currency || 'INR',
      contents: data.contents,
      actionSource: 'website',
      eventSourceUrl: data.sourceUrl,
    };
    
    return sendEventWithRetry('Purchase', eventData, req, {
      email: data.email,
      phone: data.phone,
      externalId: data.userId,
      fbLoginId: data.fbLoginId,
      firstName: data.firstName,
      lastName: data.lastName,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postalCode,
    });
  },
  
  /**
   * Track custom event
   */
  async trackCustomEvent(req, eventName, data) {
    return sendEventWithRetry(eventName, {
      eventId: data.eventId,
      entityId: data.entityId || 'custom',
      value: data.value,
      currency: data.currency || 'INR',
      ...data.customData,
    }, req, {
      email: data.email,
      phone: data.phone,
      externalId: data.userId,
    });
  },
  
  // Expose utility functions
  hashData,
  generateEventId,
};

module.exports = MetaCapiService;
