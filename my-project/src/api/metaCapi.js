/**
 * Meta Conversions API (CAPI) Frontend Service
 * Sends events to backend for server-side tracking
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

/**
 * Get authentication token from storage
 */
function getAuthToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
}

/**
 * Get current user info from storage
 */
function getUserInfo() {
  try {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

/**
 * Generate unique event ID for deduplication
 * Same ID will be sent to both Pixel (browser) and CAPI (server)
 */
export function generateEventId(eventName, entityId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${eventName}_${entityId}_${timestamp}_${random}`;
}

/**
 * Send event to backend CAPI endpoint
 */
async function sendEvent(endpoint, data) {
  const token = getAuthToken();
  const user = getUserInfo();
  
  // Extract fbp (Facebook Pixel browser ID) from cookie
  const getFbpCookie = () => {
    const match = document.cookie.match(/_fbp=([^;]+)/);
    return match ? match[1] : null;
  };
  
  const payload = {
    ...data,
    // Add user data if available
    ...(user?.email && { email: user.email }),
    ...(user?.phone && { phone: user.phone }),
    ...(user?._id && { userId: user._id }),
    // Add fbp cookie for matching
    fbp: getFbpCookie(),
    // Add source URL
    sourceUrl: window.location.href,
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/meta-capi${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error(`[Meta CAPI] Failed to send event to ${endpoint}:`, error);
    // Don't throw - CAPI failures shouldn't break user experience
    return { success: false, error: error.message };
  }
}

/**
 * Track ViewContent event via CAPI
 * @param {Object} product - Product data
 * @param {string} eventId - Unique event ID for deduplication
 */
export async function trackViewContentCAPI(product, eventId) {
  return sendEvent('/view-content', {
    eventId,
    productId: product._id || product.id,
    productName: product.name,
    price: product.price,
    currency: 'INR',
  });
}

/**
 * Track AddToCart event via CAPI
 * @param {Object} product - Product data
 * @param {number} quantity - Quantity added
 * @param {string} eventId - Unique event ID for deduplication
 */
export async function trackAddToCartCAPI(product, quantity, eventId) {
  const value = (product.price || 0) * quantity;
  
  return sendEvent('/add-to-cart', {
    eventId,
    productId: product._id || product.id,
    productName: product.name,
    price: product.price,
    quantity,
    value,
    currency: 'INR',
  });
}

/**
 * Track InitiateCheckout event via CAPI
 * @param {Array} cartItems - Cart items array
 * @param {number} totalValue - Cart total value
 * @param {string} eventId - Unique event ID for deduplication
 */
export async function trackInitiateCheckoutCAPI(cartItems, totalValue, eventId) {
  const contents = cartItems.map(item => ({
    productId: item.product?._id || item.productId || item._id,
    quantity: item.quantity,
    price: item.price || item.product?.price || 0,
  }));
  
  const contentIds = contents.map(c => c.productId);
  
  return sendEvent('/initiate-checkout', {
    eventId,
    cartId: `cart_${Date.now()}`,
    value: totalValue,
    currency: 'INR',
    contents,
    contentIds,
  });
}

/**
 * Track Purchase event via CAPI
 * @param {Object} orderData - Order data
 * @param {string} eventId - Unique event ID for deduplication
 */
export async function trackPurchaseCAPI(orderData, eventId) {
  const contents = orderData.items?.map(item => ({
    productId: item.productId || item._id || item.id,
    quantity: item.quantity,
    price: item.price || 0,
  })) || [];
  
  const contentIds = contents.map(c => c.productId);
  
  return sendEvent('/purchase', {
    eventId,
    orderId: orderData.orderId || orderData._id || orderData.orderNumber,
    value: orderData.total || orderData.orderTotal || orderData.amount,
    currency: 'INR',
    contents,
    contentIds,
    // User data from order
    email: orderData.email || orderData.customer?.email,
    phone: orderData.phone || orderData.customer?.phone,
    firstName: orderData.firstName || orderData.customer?.firstName || orderData.customer?.name?.split(' ')[0],
    lastName: orderData.lastName || orderData.customer?.lastName || orderData.customer?.name?.split(' ').slice(1).join(' '),
    // Address info
    city: orderData.city || orderData.address?.city,
    state: orderData.state || orderData.address?.state,
    country: orderData.country || orderData.address?.country,
    postalCode: orderData.postalCode || orderData.address?.postalCode || orderData.address?.pincode,
  });
}

/**
 * Track custom event via CAPI
 * @param {string} eventName - Custom event name
 * @param {Object} data - Event data
 */
export async function trackCustomEventCAPI(eventName, data) {
  return sendEvent(`/custom/${eventName}`, data);
}

/**
 * Check CAPI health/configuration status
 */
export async function checkCAPIHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/meta-capi/health`);
    return await response.json();
  } catch (error) {
    console.error('[Meta CAPI] Health check failed:', error);
    return { success: false, error: error.message };
  }
}

// Export all functions
const metaCapiApi = {
  generateEventId,
  trackViewContentCAPI,
  trackAddToCartCAPI,
  trackInitiateCheckoutCAPI,
  trackPurchaseCAPI,
  trackCustomEventCAPI,
  checkCAPIHealth,
};

export default metaCapiApi;
