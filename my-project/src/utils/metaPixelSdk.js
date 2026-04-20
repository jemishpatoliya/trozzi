/**
 * Meta Pixel + CAPI Tracking Utility (Production-Ready)
 * 
 * Features:
 * - Browser-side Meta Pixel tracking (fbq)
 * - Server-side CAPI tracking via backend API
 * - Event deduplication with unique event_id
 * - Comprehensive error handling and logging
 * - Debug mode for development
 */

import { apiClient } from '../api/client';

// Configuration
const PIXEL_ID = process.env.REACT_APP_META_PIXEL_ID || '1851696042154850';
const CAPI_ENABLED = process.env.REACT_APP_META_CAPI_ENABLED !== 'false';
const DEBUG_MODE = process.env.NODE_ENV === 'development' || window.location.search.includes('meta_debug=1');

/**
 * Generate unique event ID for deduplication
 * Same ID sent to both Pixel (browser) and CAPI (server)
 * Format: {event_name}_{entity_id}_{timestamp}_{random}
 */
const generateEventId = (eventName, entityId = 'unknown') => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${eventName}_${entityId}_${timestamp}_${random}`.substring(0, 64);
};

/**
 * Check if Meta Pixel (fbq) is loaded
 */
const isPixelLoaded = () => {
    return typeof window !== 'undefined' && window.fbq && typeof window.fbq === 'function';
};

/**
 * Get _fbp (Facebook Browser ID) from cookie
 * Format: fb.1.{timestamp}.{random}
 */
const getFbp = () => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/_fbp=([^;]+)/);
    return match ? match[1] : null;
};

/**
 * Get _fbc (Facebook Click ID) from cookie - CRITICAL for match quality
 */
const getFbc = () => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/_fbc=([^;]+)/);
    return match ? match[1] : null;
};

/**
 * Get complete user data for advanced matching
 * Returns: email, phone, firstName, lastName, city, state, country, zip, external_id
 */
const getUserFullData = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const address = user.address || user.shippingAddress || {};
        
        // Split name into first and last
        const fullName = user.name || user.fullName || '';
        const nameParts = fullName.split(' ');
        const firstName = user.firstName || nameParts[0] || '';
        const lastName = user.lastName || nameParts.slice(1).join(' ') || '';
        
        return {
            email: user.email || null,
            phone: user.phone || user.mobile || null,
            firstName: firstName,
            lastName: lastName,
            city: address.city || user.city || null,
            state: address.state || user.state || null,
            country: address.country || user.country || 'IN',
            zip: address.postalCode || address.pincode || user.postalCode || user.pincode || null,
            external_id: user._id || user.id || localStorage.getItem('visitorId') || null
        };
    } catch {
        return {
            email: null,
            phone: null,
            firstName: '',
            lastName: '',
            city: null,
            state: null,
            country: 'IN',
            zip: null,
            external_id: localStorage.getItem('visitorId') || null
        };
    }
};

/**
 * Get visitor/user ID for tracking
 */
const getUserId = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user._id || user.id || localStorage.getItem('visitorId') || null;
    } catch {
        return null;
    }
};

/**
 * Get user email for advanced matching
 */
const getUserEmail = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.email || null;
    } catch {
        return null;
    }
};

/**
 * Get user phone for advanced matching
 */
const getUserPhone = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.phone || null;
    } catch {
        return null;
    }
};

/**
 * Safe pixel event firing with fallback
 */
const safeTrack = (eventName, params, eventId) => {
    if (!isPixelLoaded()) {
        if (DEBUG_MODE) console.warn(`[Meta Pixel] ${eventName} - Pixel not loaded`);
        return false;
    }

    try {
        // Send to Meta Pixel with eventID for deduplication
        window.fbq('track', eventName, params, { eventID: eventId });
        
        if (DEBUG_MODE) {
            console.log(`[Meta Pixel] ${eventName} fired:`, { params, eventId });
        }
        
        return true;
    } catch (error) {
        console.error(`[Meta Pixel] ${eventName} failed:`, error);
        return false;
    }
};

/**
 * Send event to CAPI via backend
 * Includes ALL user data and tracking parameters for 8+ match quality
 */
const sendToCapi = async (endpoint, data) => {
    if (!CAPI_ENABLED) {
        if (DEBUG_MODE) console.log('[Meta CAPI] CAPI disabled, skipping server event');
        return null;
    }

    try {
        const userData = getUserFullData();
        
        const payload = {
            ...data,
            // Facebook tracking cookies (CRITICAL for match quality)
            fbp: getFbp(),
            fbc: getFbc(), // Click ID from ads
            
            // Complete user data for advanced matching
            userId: userData.external_id,
            externalId: userData.external_id,
            email: userData.email,
            phone: userData.phone,
            firstName: userData.firstName,
            lastName: userData.lastName,
            city: userData.city,
            state: userData.state,
            country: userData.country,
            postalCode: userData.zip,
            
            // Browser info (backend will extract IP and user agent from headers)
            sourceUrl: window.location.href,
            userAgent: navigator.userAgent,
        };

        if (DEBUG_MODE) {
            console.log('[Meta CAPI] Sending to backend:', endpoint, {
                ...payload,
                email: payload.email ? '***@***.com' : null,
                phone: payload.phone ? '***' : null
            });
        }

        const response = await apiClient.post(`/meta-capi${endpoint}`, payload);
        
        if (DEBUG_MODE) {
            console.log('[Meta CAPI] Backend response:', response.data);
        }
        
        return response.data;
    } catch (error) {
        console.error('[Meta CAPI] Backend error:', error.message);
        return null;
    }
};

/**
 * Track ViewContent event (Product Page)
 * Trigger: When product detail page loads
 * 
 * @param {Object} product - Product data { _id, id, name, price }
 * @returns {Object} { success, eventId }
 */
export const trackViewContent = async (product, additionalData = {}) => {
    if (!product) {
        console.warn('[Meta Pixel] ViewContent - No product data');
        return { success: false, eventId: null };
    }

    const productId = String(product._id || product.id || '');
    const eventId = generateEventId('ViewContent', productId);
    const price = Number(product.price || product.sellingPrice || 0);
    
    // Build full content data
    const contentIds = [productId];
    const contents = [{
        id: productId,
        quantity: 1,
        price: price,
        title: product.name || product.title || '',
        description: product.description || product.shortDescription || '',
        category: product.category || '',
        brand: product.brand || '',
        image: product.mainImage || product.images?.[0] || product.thumbnail || ''
    }];

    // Browser Pixel Event
    const pixelParams = {
        content_ids: contentIds,
        content_name: product.name || product.title || '',
        content_type: 'product',
        value: price,
        currency: 'INR',
        contents: contents.map(c => ({ id: c.id, quantity: c.quantity, item_price: c.price }))
    };

    const pixelSuccess = safeTrack('ViewContent', pixelParams, eventId);

    // Server CAPI Event - FULL DATA
    const capiPromise = sendToCapi('/view-content', {
        eventId,
        eventTime: Math.floor(Date.now() / 1000),
        productId,
        productName: product.name || product.title || '',
        productDescription: product.description || product.shortDescription || '',
        price,
        currency: 'INR',
        category: product.category || '',
        subcategory: product.subcategory || '',
        brand: product.brand || '',
        sku: product.sku || product.productCode || '',
        contentIds,
        contentType: 'product',
        contentName: product.name || product.title || '',
        contents,
        imageUrl: product.mainImage || product.images?.[0] || product.thumbnail || '',
        availability: product.stock > 0 ? 'in stock' : 'out of stock',
        condition: product.condition || 'new',
        // User data
        email: additionalData.email || getUserEmail(),
        phone: additionalData.phone || getUserPhone(),
        firstName: additionalData.firstName || '',
        lastName: additionalData.lastName || '',
        city: additionalData.city || '',
        state: additionalData.state || '',
        country: additionalData.country || 'IN',
        postalCode: additionalData.postalCode || additionalData.pincode || ''
    });

    // Don't wait for CAPI in browser
    capiPromise.catch(() => {});

    return { 
        success: pixelSuccess, 
        eventId,
        pixelFired: pixelSuccess,
        capiSent: CAPI_ENABLED
    };
};

/**
 * Track AddToCart event
 * Trigger: When user clicks Add to Cart
 * 
 * @param {Object} product - Product data { _id, id, name, price }
 * @param {number} quantity - Quantity added (default: 1)
 * @returns {Object} { success, eventId }
 */
export const trackAddToCart = async (product, quantity = 1, additionalData = {}) => {
    if (!product) {
        console.warn('[Meta Pixel] AddToCart - No product data');
        return { success: false, eventId: null };
    }

    const productId = String(product._id || product.id || '');
    const eventId = generateEventId('AddToCart', productId);
    const price = Number(product.price || product.sellingPrice || 0);
    const value = price * quantity;
    
    // Build full content data
    const contents = [{
        id: productId,
        quantity: quantity,
        price: price,
        title: product.name || product.title || '',
        description: product.description || product.shortDescription || '',
        category: product.category || '',
        brand: product.brand || '',
        image: product.mainImage || product.images?.[0] || product.thumbnail || ''
    }];

    // Browser Pixel Event
    const pixelParams = {
        content_ids: [productId],
        content_name: product.name || product.title || '',
        content_type: 'product',
        value: value,
        currency: 'INR',
        quantity: quantity,
        contents: contents.map(c => ({ id: c.id, quantity: c.quantity, item_price: c.price }))
    };

    const pixelSuccess = safeTrack('AddToCart', pixelParams, eventId);

    // Server CAPI Event - FULL DATA
    const capiPromise = sendToCapi('/add-to-cart', {
        eventId,
        eventTime: Math.floor(Date.now() / 1000),
        productId,
        productName: product.name || product.title || '',
        productDescription: product.description || product.shortDescription || '',
        price,
        quantity,
        currency: 'INR',
        value: value,
        category: product.category || '',
        subcategory: product.subcategory || '',
        brand: product.brand || '',
        sku: product.sku || product.productCode || '',
        contentIds: [productId],
        contentType: 'product',
        contentName: product.name || product.title || '',
        contents,
        imageUrl: product.mainImage || product.images?.[0] || product.thumbnail || '',
        availability: product.stock > 0 ? 'in stock' : 'out of stock',
        condition: product.condition || 'new',
        // Cart info
        cartId: additionalData.cartId || `cart_${Date.now()}`,
        cartTotal: additionalData.cartTotal || value,
        // User data
        email: additionalData.email || getUserEmail(),
        phone: additionalData.phone || getUserPhone(),
        firstName: additionalData.firstName || '',
        lastName: additionalData.lastName || '',
        city: additionalData.city || '',
        state: additionalData.state || '',
        country: additionalData.country || 'IN',
        postalCode: additionalData.postalCode || additionalData.pincode || ''
    });

    capiPromise.catch(() => {});

    return { 
        success: pixelSuccess, 
        eventId,
        pixelFired: pixelSuccess,
        capiSent: CAPI_ENABLED
    };
};

/**
 * Track InitiateCheckout event
 * Trigger: When checkout page loads
 * 
 * @param {Object} cartData - Cart data { items: [], totalValue: number }
 * @returns {Object} { success, eventId }
 */
export const trackInitiateCheckout = async (cartData, additionalData = {}) => {
    const items = cartData?.items || [];
    
    if (items.length === 0) {
        console.warn('[Meta Pixel] InitiateCheckout - Empty cart');
        return { success: false, eventId: null };
    }

    const firstItemId = String(items[0]?._id || items[0]?.id || items[0]?.productId || 'cart');
    const eventId = generateEventId('InitiateCheckout', firstItemId);
    const value = Number(cartData.totalValue || cartData.total || 0);

    // Build full content data
    const contents = items.map(item => ({
        id: String(item._id || item.id || item.productId || ''),
        quantity: Number(item.quantity || 1),
        price: Number(item.price || item.product?.price || 0),
        title: item.name || item.title || item.product?.name || '',
        description: item.description || item.product?.description || '',
        category: item.category || item.product?.category || '',
        brand: item.brand || item.product?.brand || '',
        image: item.mainImage || item.image || item.product?.mainImage || ''
    }));

    const contentIds = contents.map(c => c.id).filter(Boolean);

    // Browser Pixel Event
    const pixelParams = {
        content_ids: contentIds,
        content_type: 'product',
        value: value,
        currency: 'INR',
        num_items: items.length,
        contents: contents.map(c => ({ id: c.id, quantity: c.quantity, item_price: c.price }))
    };

    const pixelSuccess = safeTrack('InitiateCheckout', pixelParams, eventId);

    // Server CAPI Event - FULL DATA
    const capiPromise = sendToCapi('/initiate-checkout', {
        eventId,
        eventTime: Math.floor(Date.now() / 1000),
        cartId: cartData.cartId || `cart_${Date.now()}`,
        value,
        currency: 'INR',
        numItems: items.length,
        contents,
        contentIds,
        contentType: 'product',
        // Cart summary
        subtotal: cartData.subtotal || value,
        shipping: cartData.shipping || 0,
        tax: cartData.tax || 0,
        discount: cartData.discount || 0,
        coupon: cartData.coupon || '',
        // User data
        email: additionalData.email || getUserEmail(),
        phone: additionalData.phone || getUserPhone(),
        firstName: additionalData.firstName || '',
        lastName: additionalData.lastName || '',
        city: additionalData.city || '',
        state: additionalData.state || '',
        country: additionalData.country || 'IN',
        postalCode: additionalData.postalCode || additionalData.pincode || ''
    });

    capiPromise.catch(() => {});

    return { 
        success: pixelSuccess, 
        eventId,
        pixelFired: pixelSuccess,
        capiSent: CAPI_ENABLED
    };
};

/**
 * Track Purchase event
 * Trigger: When order is successfully placed
 * 
 * @param {Object} orderData - Order data { orderId, items: [], total, ... }
 * @returns {Object} { success, eventId }
 */
export const trackPurchase = async (orderData) => {
    if (!orderData?.orderId) {
        console.warn('[Meta Pixel] Purchase - No orderId');
        return { success: false, eventId: null };
    }

    const orderId = String(orderData.orderId);
    const eventId = generateEventId('Purchase', orderId);
    const items = orderData.items || [];
    const value = Number(orderData.total || orderData.value || 0);

    // Build full content data with product details
    const purchaseContents = items.map(item => ({
        id: String(item.productId || item._id || item.id || ''),
        quantity: Number(item.quantity || 1),
        price: Number(item.price || item.product?.price || 0),
        title: item.name || item.title || item.product?.name || '',
        description: item.description || item.product?.description || '',
        category: item.category || item.product?.category || '',
        subcategory: item.subcategory || item.product?.subcategory || '',
        brand: item.brand || item.product?.brand || '',
        sku: item.sku || item.product?.sku || '',
        image: item.mainImage || item.image || item.product?.mainImage || ''
    }));

    const contentIds = purchaseContents.map(c => c.id).filter(Boolean);

    // Browser Pixel Event
    const pixelParams = {
        content_ids: contentIds,
        content_type: 'product',
        value: value,
        currency: 'INR',
        num_items: items.length,
        order_id: orderId,
        contents: purchaseContents.map(c => ({ id: c.id, quantity: c.quantity, item_price: c.price }))
    };

    const pixelSuccess = safeTrack('Purchase', pixelParams, eventId);

    // Server CAPI Event - FULL DATA with all order and user details
    const capiPromise = sendToCapi('/purchase', {
        eventId,
        eventTime: Math.floor(Date.now() / 1000),
        orderId,
        value,
        currency: 'INR',
        numItems: items.length,
        items: purchaseContents,
        contentIds,
        contentType: 'product',
        // Order details
        orderNumber: orderData.orderNumber || orderId,
        orderStatus: orderData.status || 'completed',
        paymentMethod: orderData.paymentMethod || '',
        shippingMethod: orderData.shippingMethod || '',
        // Financial breakdown
        subtotal: orderData.subtotal || value,
        shipping: orderData.shipping || 0,
        tax: orderData.tax || 0,
        discount: orderData.discount || 0,
        coupon: orderData.coupon || orderData.couponCode || '',
        // Customer data
        customerId: orderData.customerId || orderData.customer?._id || getUserId() || '',
        customerEmail: orderData.customerEmail || orderData.email || orderData.customer?.email || getUserEmail() || '',
        // Full user data for advanced matching
        email: orderData.email || orderData.customer?.email || getUserEmail(),
        phone: orderData.phone || orderData.customer?.phone || getUserPhone(),
        firstName: orderData.firstName || orderData.customer?.firstName || orderData.customer?.name?.split(' ')[0] || '',
        lastName: orderData.lastName || orderData.customer?.lastName || orderData.customer?.name?.split(' ').slice(1).join(' ') || '',
        // Address
        city: orderData.city || orderData.address?.city || orderData.shippingAddress?.city || '',
        state: orderData.state || orderData.address?.state || orderData.shippingAddress?.state || '',
        country: orderData.country || orderData.address?.country || orderData.shippingAddress?.country || 'IN',
        postalCode: orderData.postalCode || orderData.pincode || orderData.address?.postalCode || orderData.shippingAddress?.pincode || '',
        street: orderData.street || orderData.address?.street || orderData.shippingAddress?.street || ''
    });

    capiPromise.catch(() => {});

    return { 
        success: pixelSuccess, 
        eventId,
        pixelFired: pixelSuccess,
        capiSent: CAPI_ENABLED
    };
};

/**
 * Track AddToWishlist event
 * Trigger: When user adds product to wishlist
 * 
 * @param {Object} product - Product data { _id, id, name, price }
 * @returns {Object} { success, eventId }
 */
export const trackAddToWishlist = async (product) => {
    if (!product) {
        console.warn('[Meta Pixel] AddToWishlist - No product data');
        return { success: false, eventId: null };
    }

    const productId = String(product._id || product.id || '');
    const eventId = generateEventId('AddToWishlist', productId);
    const price = Number(product.price || product.sellingPrice || 0);

    // Browser Pixel Event (Custom event)
    const pixelParams = {
        content_ids: [productId],
        content_name: product.name || product.title || '',
        content_type: 'product',
        value: price,
        currency: 'INR'
    };

    const pixelSuccess = safeTrack('AddToWishlist', pixelParams, eventId);

    // Server CAPI Event
    const capiPromise = sendToCapi('/custom/AddToWishlist', {
        eventId,
        entityId: productId,
        value: price,
        currency: 'INR',
        contentIds: [productId],
        contentType: 'product',
        contentName: product.name || product.title || ''
    });

    capiPromise.catch(() => {});

    return { 
        success: pixelSuccess, 
        eventId,
        pixelFired: pixelSuccess,
        capiSent: CAPI_ENABLED
    };
};

/**
 * Check CAPI health/status
 */
export const checkCapiHealth = async () => {
    try {
        const response = await apiClient.get('/meta-capi/health');
        return response.data;
    } catch (error) {
        console.error('[Meta CAPI] Health check failed:', error.message);
        return { configured: false, error: error.message };
    }
};

/**
 * Initialize Meta Pixel (call once on app load)
 */
export const initMetaPixel = () => {
    if (typeof window === 'undefined') return;
    
    // Check if already initialized
    if (window.fbq && window.fbq.loaded) {
        if (DEBUG_MODE) console.log('[Meta Pixel] Already initialized');
        return;
    }

    if (DEBUG_MODE) console.log('[Meta Pixel] Initializing...');

    // Meta Pixel Base Code (wrapped to avoid ESLint error)
    (function(f,b,e,v,n,t,s){
        if(f.fbq)return;
        n=f.fbq=function(){
            n.callMethod? n.callMethod.apply(n,arguments):n.queue.push(arguments)
        };
        if(!f._fbq)f._fbq=n;
        n.push=n;
        n.loaded=!0;
        n.version='2.0';
        n.queue=[];
        t=b.createElement(e);
        t.async=!0;
        t.src=v;
        s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)
    })(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');

    // Initialize with Pixel ID
    window.fbq('init', PIXEL_ID);
    
    // Track PageView
    window.fbq('track', 'PageView');

    if (DEBUG_MODE) console.log('[Meta Pixel] Initialized with ID:', PIXEL_ID);
};

// Default export
export default {
    trackViewContent,
    trackAddToCart,
    trackInitiateCheckout,
    trackPurchase,
    checkCapiHealth,
    initMetaPixel,
    generateEventId
};
