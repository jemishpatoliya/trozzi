/**
 * Meta Pixel + Conversions API (CAPI) Integration
 * Frontend JavaScript for eCommerce tracking
 * 
 * Features:
 * - Client-side Meta Pixel tracking
 * - Server-side CAPI tracking (dual tracking)
 * - Event deduplication with shared event_id
 * - Automatic user data collection for Advanced Matching
 * - All e-commerce events supported
 */

class MetaTracker {
  constructor(options = {}) {
    this.pixelId = options.pixelId || '1851696042154850';
    this.apiBaseUrl = options.apiBaseUrl || '/api/meta-capi';
    this.debug = options.debug || false;
    this.userData = {};
    
    this.initPixel();
  }

  /**
   * Initialize Meta Pixel
   */
  initPixel() {
    if (typeof fbq !== 'undefined') {
      this.log('Meta Pixel already initialized');
      return;
    }

    // Meta Pixel base code
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', this.pixelId);
    // DO NOT fire PageView here - let the React SDK handle it
    // to prevent duplicate PageView events
    
    this.log('Meta Pixel initialized with ID:', this.pixelId);
  }

  /**
   * Set user data for Advanced Matching
   */
  setUserData(userData) {
    this.userData = {
      ...this.userData,
      ...userData,
    };
    
    // Update Pixel with user data for Advanced Matching
    if (typeof fbq !== 'undefined') {
      fbq('init', this.pixelId, this.userData);
    }
    
    this.log('User data updated:', Object.keys(this.userData));
  }

  /**
   * Generate unique event ID for deduplication
   */
  generateEventId(eventName, entityId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const safeEntityId = String(entityId || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
    return `${eventName}_${safeEntityId}_${timestamp}_${random}`;
  }

  /**
   * Get current page URL
   */
  getCurrentUrl() {
    return window.location.href;
  }

  /**
   * Get user agent
   */
  getUserAgent() {
    return navigator.userAgent;
  }

  /**
   * Send event to both Pixel (client) and CAPI (server)
   * @param {string} eventName - Meta event name
   * @param {object} data - Event data
   * @param {object} options - Tracking options
   */
  async trackEvent(eventName, data = {}, options = {}) {
    const eventId = data.eventId || this.generateEventId(eventName, data.entityId || data.productId || data.orderId);
    const sourceUrl = this.getCurrentUrl();
    
    // Prepare base event data
    const baseEventData = {
      eventId,
      sourceUrl,
      ...this.userData,
      ...data,
    };

    this.log(`Tracking ${eventName}:`, { eventId, value: data.value });

    // 1. Track with Meta Pixel (client-side)
    this.trackPixel(eventName, data, eventId);

    // 2. Track with CAPI (server-side) - unless disabled
    if (!options.skipServer) {
      try {
        await this.trackServer(eventName, baseEventData);
      } catch (error) {
        this.log(`Server tracking failed for ${eventName}:`, error.message);
      }
    }

    return { eventId, success: true };
  }

  /**
   * Track with Meta Pixel (client-side)
   */
  trackPixel(eventName, data, eventId) {
    if (typeof fbq === 'undefined') {
      this.log('fbq not available, skipping Pixel tracking');
      return;
    }

    const pixelData = {
      eventID: eventId,
    };

    // Add content data if available
    if (data.contentIds) {
      pixelData.content_ids = data.contentIds;
      pixelData.content_type = data.contentType || 'product';
      pixelData.content_name = data.contentName;
    }

    if (data.contents) {
      pixelData.contents = data.contents.map(item => ({
        id: String(item.id || item.productId),
        quantity: item.quantity || 1,
        item_price: item.price || 0,
      }));
    }

    if (data.value) {
      pixelData.value = data.value;
      pixelData.currency = data.currency || 'INR';
    }

    if (data.numItems) {
      pixelData.num_items = data.numItems;
    }

    // Track standard or custom event
    if (['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'AddPaymentInfo', 'Purchase'].includes(eventName)) {
      fbq('track', eventName, pixelData);
    } else {
      fbq('trackCustom', eventName, pixelData);
    }

    this.log(`Pixel ${eventName} tracked:`, pixelData);
  }

  /**
   * Track with CAPI (server-side)
   */
  async trackServer(eventName, data) {
    const endpointMap = {
      'PageView': 'page-view',
      'ViewContent': 'view-content',
      'AddToCart': 'add-to-cart',
      'InitiateCheckout': 'initiate-checkout',
      'AddPaymentInfo': 'add-payment-info',
      'Purchase': 'purchase',
    };

    const endpoint = endpointMap[eventName] || `custom/${eventName}`;
    const url = `${this.apiBaseUrl}/${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'same-origin',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      this.log(`Server ${eventName} tracked:`, result);
      return result;

    } catch (error) {
      this.log(`Server tracking error for ${eventName}:`, error.message);
      throw error;
    }
  }

  // ==================== E-COMMERCE EVENT METHODS ====================

  /**
   * Track PageView with deduplication
   */
  async trackPageView(pageData = {}) {
    const GLOBAL_PAGE_VIEW_KEY = '__META_PAGE_VIEW_FIRED__';
    const PAGE_VIEW_TIMEOUT = 30000; // 30 seconds
    
    const now = Date.now();
    const path = pageData.pageId || window.location.pathname;
    
    // Check global flag to prevent duplicates
    if (window[GLOBAL_PAGE_VIEW_KEY]) {
      const timeSinceLastFire = now - window[GLOBAL_PAGE_VIEW_KEY];
      if (timeSinceLastFire < PAGE_VIEW_TIMEOUT) {
        this.log('PageView blocked - already fired', timeSinceLastFire, 'ms ago');
        return { eventId: null, success: false, reason: 'duplicate' };
      }
    }
    
    // Set global flag
    window[GLOBAL_PAGE_VIEW_KEY] = now;
    
    return this.trackEvent('PageView', {
      pageId: path,
      value: pageData.value || 0,
      currency: pageData.currency || 'INR',
    });
  }

  /**
   * Track ViewContent (product page view)
   */
  async trackViewContent(product) {
    const contents = [{
      id: product.id,
      quantity: 1,
      price: product.price,
    }];

    return this.trackEvent('ViewContent', {
      productId: String(product.id),
      productName: product.name,
      price: product.price,
      value: product.price,
      currency: product.currency || 'INR',
      contentIds: [String(product.id)],
      contentType: 'product',
      contentName: product.name,
      contents,
      numItems: 1,
    });
  }

  /**
   * Track AddToCart
   */
  async trackAddToCart(product, quantity = 1) {
    const calculatedValue = product.price * quantity;
    const contents = [{
      id: String(product.id),
      quantity: quantity,
      price: product.price,
    }];

    return this.trackEvent('AddToCart', {
      productId: String(product.id),
      productName: product.name,
      price: product.price,
      quantity: quantity,
      value: calculatedValue,
      currency: product.currency || 'INR',
      contentIds: [String(product.id)],
      contentType: 'product',
      contentName: product.name,
      contents,
      numItems: quantity,
    });
  }

  /**
   * Track InitiateCheckout
   */
  async trackInitiateCheckout(cartData) {
    const items = cartData.items || [];
    const totalValue = cartData.value || items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const contents = items.map(item => ({
      id: String(item.id || item.productId),
      quantity: item.quantity || 1,
      price: item.price || 0,
    }));

    return this.trackEvent('InitiateCheckout', {
      cartId: cartData.cartId,
      value: totalValue,
      currency: cartData.currency || 'INR',
      contentIds: items.map(item => String(item.id || item.productId)),
      contentType: 'product',
      contents,
      numItems: items.reduce((sum, item) => sum + (item.quantity || 1), 0),
      ...cartData.userInfo,
    });
  }

  /**
   * Track AddPaymentInfo
   */
  async trackAddPaymentInfo(paymentData) {
    const items = paymentData.items || [];
    const totalValue = paymentData.value || items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const contents = items.map(item => ({
      id: String(item.id || item.productId),
      quantity: item.quantity || 1,
      price: item.price || 0,
    }));

    return this.trackEvent('AddPaymentInfo', {
      paymentId: paymentData.paymentId,
      orderId: paymentData.orderId,
      value: totalValue,
      currency: paymentData.currency || 'INR',
      contentIds: items.map(item => String(item.id || item.productId)),
      contentType: 'product',
      contents,
      numItems: items.reduce((sum, item) => sum + (item.quantity || 1), 0),
      ...paymentData.userInfo,
    });
  }

  /**
   * Track Purchase (most important!)
   */
  async trackPurchase(orderData) {
    const items = orderData.items || [];
    const totalValue = orderData.value || items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const contents = items.map(item => ({
      id: String(item.id || item.productId),
      quantity: item.quantity || 1,
      price: item.price || 0,
    }));

    return this.trackEvent('Purchase', {
      orderId: String(orderData.orderId),
      value: totalValue,
      currency: orderData.currency || 'INR',
      contentIds: items.map(item => String(item.id || item.productId)),
      contentType: 'product',
      contents,
      numItems: items.reduce((sum, item) => sum + (item.quantity || 1), 0),
      ...orderData.userInfo,
    });
  }

  /**
   * Track custom event
   */
  async trackCustom(eventName, data) {
    return this.trackEvent(eventName, data);
  }

  /**
   * Logging helper
   */
  log(...args) {
    if (this.debug) {
      console.log('[MetaTracker]', ...args);
    }
  }
}

// ==================== GLOBAL INSTANCE ====================

/**
 * Initialize global MetaTracker instance
 * Usage in HTML:
 * <script src="/meta-tracking.js"></script>
 * <script>
 *   const tracker = initMetaTracker({ debug: true });
 *   tracker.trackPageView();
 * </script>
 */
function initMetaTracker(options = {}) {
  window.metaTracker = new MetaTracker(options);
  return window.metaTracker;
}

// Auto-initialize if metaTrackingConfig is defined
if (typeof window !== 'undefined' && window.metaTrackingConfig) {
  document.addEventListener('DOMContentLoaded', () => {
    initMetaTracker(window.metaTrackingConfig);
  });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MetaTracker, initMetaTracker };
}
