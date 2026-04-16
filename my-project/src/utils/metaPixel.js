/**
 * Meta Pixel Event Tracking Utility
 * Production-ready eCommerce event tracking with deduplication support
 * Includes Conversions API (CAPI) integration for server-side tracking
 */

import {
  trackViewContentCAPI,
  trackAddToCartCAPI,
  trackInitiateCheckoutCAPI,
  trackPurchaseCAPI,
  checkCAPIHealth,
} from '../api/metaCapi';

const PIXEL_ID = '1851696042154850';

// Generate unique event ID for deduplication (shared between Pixel and CAPI)
const generateEventId = (eventName, identifier = '') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `evt_${eventName}_${identifier}_${timestamp}_${random}`;
};

// Enable/disable CAPI integration
const CAPI_ENABLED = process.env.REACT_APP_META_CAPI_ENABLED !== 'false';

// Check if Meta Pixel is loaded
const isPixelLoaded = () => {
  return typeof window !== 'undefined' && window.fbq && typeof window.fbq === 'function';
};

// Safe pixel event firing with fallback
const safeTrack = (eventName, params, eventId) => {
  if (!isPixelLoaded()) {
    console.warn(`[Meta Pixel] ${eventName} - Pixel not loaded`);
    return false;
  }

  try {
    window.fbq('track', eventName, params, { eventID: eventId });
    console.log(`[Meta Pixel] ${eventName} fired`, { params, eventId });
    return true;
  } catch (error) {
    console.error(`[Meta Pixel] ${eventName} failed:`, error);
    return false;
  }
};

// Check if event was already fired (duplicate prevention)
const hasEventFired = (eventKey) => {
  if (typeof window === 'undefined') return false;
  const fired = sessionStorage.getItem(`pixel_${eventKey}`);
  return fired === 'true';
};

// Mark event as fired
const markEventFired = (eventKey, ttlMinutes = 30) => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`pixel_${eventKey}`, 'true');
  
  // Auto-clear after TTL to allow re-tracking after some time
  setTimeout(() => {
    sessionStorage.removeItem(`pixel_${eventKey}`);
  }, ttlMinutes * 60 * 1000);
};

// Clear fired event (for testing or re-tracking)
const clearEventFired = (eventKey) => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(`pixel_${eventKey}`);
};

/**
 * Track Product View (ViewContent)
 * Trigger on product detail page load
 */
export const trackViewContent = (product, options = {}) => {
  if (!product) return false;

  const productId = String(product._id || product.id || '');
  const eventKey = `viewcontent_${productId}`;
  
  // Prevent duplicate within same session
  if (hasEventFired(eventKey) && !options.force) {
    console.log(`[Meta Pixel] ViewContent already fired for ${productId}`);
    return false;
  }

  const price = Number(product.price || product.sellingPrice || 0);
  const params = {
    content_ids: [productId],
    content_name: product.name || product.title || '',
    content_type: 'product',
    value: price,
    currency: 'INR'
  };

  const eventId = generateEventId('ViewContent', productId);
  const success = safeTrack('ViewContent', params, eventId);
  
  // Send to CAPI (server-side) with same eventId for deduplication
  if (CAPI_ENABLED) {
    trackViewContentCAPI(product, eventId).catch(err => {
      console.warn('[Meta Pixel] CAPI ViewContent failed:', err.message);
    });
  }
  
  if (success) {
    markEventFired(eventKey);
  }
  
  return { success, eventId };
};

/**
 * Track Add to Cart
 * Trigger when user clicks Add to Cart button
 */
export const trackAddToCart = (product, quantity = 1, options = {}) => {
  if (!product) return false;

  const productId = String(product._id || product.id || '');
  const eventKey = `addtocart_${productId}_${quantity}_${Date.now()}`;
  
  const price = Number(product.price || product.sellingPrice || 0);
  const totalValue = price * quantity;
  
  const params = {
    content_ids: [productId],
    content_name: product.name || product.title || '',
    content_type: 'product',
    value: totalValue,
    currency: 'INR',
    quantity: quantity
  };

  const eventId = generateEventId('AddToCart', productId);
  const success = safeTrack('AddToCart', params, eventId);
  
  // Send to CAPI (server-side) with same eventId for deduplication
  if (CAPI_ENABLED) {
    trackAddToCartCAPI(product, quantity, eventId).catch(err => {
      console.warn('[Meta Pixel] CAPI AddToCart failed:', err.message);
    });
  }
  
  if (success && options.persist !== false) {
    // Store cart item for checkout tracking
    const cartSnapshot = JSON.parse(sessionStorage.getItem('pixel_cart_snapshot') || '[]');
    const existingIndex = cartSnapshot.findIndex(item => item.id === productId);
    
    if (existingIndex >= 0) {
      cartSnapshot[existingIndex].quantity += quantity;
    } else {
      cartSnapshot.push({
        id: productId,
        name: product.name || product.title || '',
        price: price,
        quantity: quantity
      });
    }
    
    sessionStorage.setItem('pixel_cart_snapshot', JSON.stringify(cartSnapshot));
  }
  
  return { success, eventId };
};

/**
 * Track Initiate Checkout
 * Trigger when user enters checkout page
 */
export const trackInitiateCheckout = (cartItems, options = {}) => {
  if (!Array.isArray(cartItems) || cartItems.length === 0) return false;

  const eventKey = 'initiatecheckout_' + cartItems.map(i => i.id || i._id).join('_');
  
  // Check recent firing (prevent duplicate on refresh)
  if (hasEventFired(eventKey) && !options.force) {
    console.log('[Meta Pixel] InitiateCheckout already fired for this cart');
    return false;
  }

  const contentIds = [];
  const contentNames = [];
  let totalValue = 0;
  let totalQuantity = 0;

  cartItems.forEach(item => {
    const product = item.product || item;
    const id = String(product._id || product.id || item.id || '');
    const name = product.name || product.title || item.name || '';
    const price = Number(product.price || product.sellingPrice || item.price || 0);
    const qty = Number(item.quantity || 1);
    
    if (id) {
      contentIds.push(id);
      contentNames.push(name);
      totalValue += price * qty;
      totalQuantity += qty;
    }
  });

  const params = {
    content_ids: contentIds,
    content_name: contentNames.join(', '),
    content_type: 'product',
    value: totalValue,
    currency: 'INR',
    num_items: totalQuantity
  };

  const eventId = generateEventId('InitiateCheckout', contentIds.join('_'));
  const success = safeTrack('InitiateCheckout', params, eventId);
  
  // Send to CAPI (server-side) with same eventId for deduplication
  if (CAPI_ENABLED) {
    trackInitiateCheckoutCAPI(cartItems, totalValue, eventId).catch(err => {
      console.warn('[Meta Pixel] CAPI InitiateCheckout failed:', err.message);
    });
  }
  
  if (success) {
    markEventFired(eventKey, 60); // 60 min TTL for checkout
  }
  
  return { success, eventId };
};

/**
 * Track Purchase
 * Trigger ONLY on order success page
 * Duplicate prevention: Uses localStorage + sessionStorage
 */
export const trackPurchase = (order, options = {}) => {
  if (!order) return false;

  const orderId = String(order.orderId || order._id || order.id || '');
  if (!orderId) {
    console.error('[Meta Pixel] Purchase tracking requires order ID');
    return false;
  }

  // Strict duplicate check: localStorage for cross-session, sessionStorage for same session
  const storageKey = `pixel_purchase_${orderId}`;
  const firedKey = `fired_purchases`;
  
  // Check localStorage for already fired purchases
  const firedPurchases = JSON.parse(localStorage.getItem(firedKey) || '[]');
  if (firedPurchases.includes(orderId) && !options.force) {
    console.log(`[Meta Pixel] Purchase already tracked for order ${orderId}`);
    return false;
  }

  // Also check sessionStorage for current session
  if (sessionStorage.getItem(storageKey) && !options.force) {
    console.log(`[Meta Pixel] Purchase already tracked in this session for ${orderId}`);
    return false;
  }

  // Extract items
  const items = order.items || order.products || [];
  const contentIds = [];
  const contentNames = [];
  
  items.forEach(item => {
    const product = item.product || item;
    const id = String(product._id || product.id || item.productId || item.id || '');
    const name = product.name || product.title || item.name || item.productName || '';
    if (id) {
      contentIds.push(id);
      contentNames.push(name);
    }
  });

  const value = Number(order.total || order.totalAmount || order.value || 0);
  const numItems = items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);

  const params = {
    content_ids: contentIds,
    content_name: contentNames.join(', '),
    content_type: 'product',
    value: value,
    currency: 'INR',
    num_items: numItems,
    order_id: orderId
  };

  const eventId = generateEventId('Purchase', orderId);
  const success = safeTrack('Purchase', params, eventId);
  
  // Send to CAPI (server-side) with same eventId for deduplication
  if (CAPI_ENABLED) {
    trackPurchaseCAPI(order, eventId).catch(err => {
      console.warn('[Meta Pixel] CAPI Purchase failed:', err.message);
    });
  }
  
  if (success) {
    // Mark as fired in both storage types
    firedPurchases.push(orderId);
    localStorage.setItem(firedKey, JSON.stringify(firedPurchases));
    sessionStorage.setItem(storageKey, 'true');
    
    console.log(`[Meta Pixel] Purchase tracked for order ${orderId}`);
  }
  
  return { success, eventId };
};

/**
 * Track Search
 * Optional: Track product searches
 */
export const trackSearch = (searchString, resultsCount = 0) => {
  if (!searchString) return false;

  const params = {
    search_string: searchString,
    content_ids: [],
    content_type: 'product'
  };

  const eventId = generateEventId('Search', searchString.replace(/\s+/g, '_'));
  return safeTrack('Search', params, eventId);
};

/**
 * Track Add to Wishlist
 * Optional: Track wishlist additions
 */
export const trackAddToWishlist = (product) => {
  if (!product) return false;

  const productId = String(product._id || product.id || '');
  const price = Number(product.price || product.sellingPrice || 0);
  
  const params = {
    content_ids: [productId],
    content_name: product.name || product.title || '',
    content_type: 'product',
    value: price,
    currency: 'INR'
  };

  const eventId = generateEventId('AddToWishlist', productId);
  return safeTrack('AddToWishlist', params, eventId);
};

// Utility: Reset all fired events (for testing)
export const resetAllTracking = () => {
  if (typeof window === 'undefined') return;
  
  const keys = Object.keys(sessionStorage);
  keys.forEach(key => {
    if (key.startsWith('pixel_')) {
      sessionStorage.removeItem(key);
    }
  });
  
  localStorage.removeItem('fired_purchases');
  console.log('[Meta Pixel] All tracking events reset');
};

// Export for debugging
window.__metaPixelUtils = {
  trackViewContent,
  trackAddToCart,
  trackInitiateCheckout,
  trackPurchase,
  resetAllTracking,
  isPixelLoaded,
  checkCAPIHealth,
  isCAPIEnabled: () => CAPI_ENABLED,
};

export default {
  trackViewContent,
  trackAddToCart,
  trackInitiateCheckout,
  trackPurchase,
  trackSearch,
  trackAddToWishlist,
  resetAllTracking,
  isPixelLoaded
};
