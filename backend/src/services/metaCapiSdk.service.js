/**
 * Meta Conversions API (CAPI) Service
 * Using Official Facebook Business SDK
 * 
 * Features:
 * - Server-side event tracking with official SDK
 * - SHA256 hashing for user data
 * - Event deduplication with event_id
 * - Comprehensive error handling and logging
 */

'use strict';

const bizSdk = require('facebook-nodejs-business-sdk');
const ServerEvent = bizSdk.ServerEvent;
const EventRequest = bizSdk.EventRequest;
const UserData = bizSdk.UserData;
const CustomData = bizSdk.CustomData;
const Content = bizSdk.Content;
const crypto = require('crypto');

// Get credentials from environment
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const PIXEL_ID = process.env.META_PIXEL_ID;
const TEST_EVENT_CODE = process.env.META_CAPI_TEST_EVENT_CODE;

// Initialize API if credentials available
let api = null;
if (ACCESS_TOKEN) {
    api = bizSdk.FacebookAdsApi.init(ACCESS_TOKEN);
}

/**
 * SHA256 Hash function for user data
 * Required for email, phone, and other PII
 */
function sha256Hash(data) {
    if (!data || typeof data !== 'string') return null;
    
    // Normalize: lowercase, trim whitespace
    const normalized = data.toLowerCase().trim();
    if (!normalized) return null;
    
    // Create SHA256 hash
    return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Generate unique event ID for deduplication
 * Format: {event_name}_{entity_id}_{timestamp}_{random}
 */
function generateEventId(eventName, entityId = 'unknown') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${eventName}_${entityId}_${timestamp}_${random}`.substring(0, 64);
}

/**
 * Get client IP from request
 */
function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const remoteAddress = req.connection?.remoteAddress || req.socket?.remoteAddress;
    
    if (forwarded) {
        const firstIp = forwarded.split(',')[0].trim();
        if (firstIp && firstIp !== '::1' && firstIp !== '127.0.0.1') {
            return firstIp;
        }
    }
    
    if (realIp && realIp !== '::1' && realIp !== '127.0.0.1') {
        return realIp;
    }
    
    if (remoteAddress && remoteAddress !== '::1' && remoteAddress !== '127.0.0.1') {
        return remoteAddress;
    }
    
    return '0.0.0.0';
}

/**
 * Get user agent from request
 */
function getUserAgent(req) {
    return req.headers['user-agent'] || 'unknown';
}

/**
 * Get fbc (Facebook Click ID) from request
 */
function getFbc(req) {
    // Try from query params first (fbclid)
    if (req.query && req.query.fbclid) {
        return `fb.1.${Date.now()}.${req.query.fbclid}`;
    }
    
    // Try from cookies
    if (req.cookies && req.cookies._fbc) {
        return req.cookies._fbc;
    }
    
    return null;
}

/**
 * Get fbp (Facebook Browser ID) from request
 */
function getFbp(req) {
    // Try from request body first
    if (req.body && req.body.fbp) {
        return req.body.fbp;
    }
    
    // Try from cookies
    if (req.cookies && req.cookies._fbp) {
        return req.cookies._fbp;
    }
    
    return null;
}

/**
 * Build Content objects for custom data
 */
function buildContents(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return [];
    }
    
    return items.map(item => {
        const content = new Content();
        content.setId(String(item.id || item.productId || item._id || ''));
        content.setQuantity(Number(item.quantity || 1));
        content.setItemPrice(Number(item.price || item.item_price || 0));
        return content;
    });
}

/**
 * Send event to Meta Conversions API using SDK
 */
async function sendEvent(eventName, eventData, req, userInfo = {}) {
    if (!ACCESS_TOKEN || !PIXEL_ID) {
        console.error('[Meta CAPI SDK] Configuration Error: Missing ACCESS_TOKEN or PIXEL_ID');
        throw new Error('Missing META_CAPI_ACCESS_TOKEN or META_PIXEL_ID in environment variables');
    }

    const eventId = eventData.eventId || generateEventId(eventName, eventData.entityId || 'unknown');
    const currentTimestamp = Math.floor(Date.now() / 1000);

    console.log(`[Meta CAPI SDK] Sending ${eventName} event:`, {
        eventId,
        pixelId: PIXEL_ID.substring(0, 4) + '****',
        value: eventData.value,
        currency: eventData.currency || 'INR',
        hasTestCode: !!TEST_EVENT_CODE
    });

    try {
        // Build User Data
        const userData = new UserData();
        
        // Client identifiers
        userData.setClientIpAddress(getClientIp(req));
        userData.setClientUserAgent(getUserAgent(req));
        
        // Facebook identifiers
        const fbc = getFbc(req);
        if (fbc) userData.setFbc(fbc);
        
        const fbp = userInfo.fbp || getFbp(req);
        if (fbp) userData.setFbp(fbp);
        
        // Hashed PII (SHA256)
        if (userInfo.email) {
            userData.setEmails([sha256Hash(userInfo.email)]);
        }
        if (userInfo.phone) {
            userData.setPhones([sha256Hash(userInfo.phone)]);
        }
        if (userInfo.firstName) {
            userData.setFirstName(sha256Hash(userInfo.firstName));
        }
        if (userInfo.lastName) {
            userData.setLastName(sha256Hash(userInfo.lastName));
        }
        if (userInfo.city) {
            userData.setCity(sha256Hash(userInfo.city));
        }
        if (userInfo.state) {
            userData.setState(sha256Hash(userInfo.state));
        }
        if (userInfo.country) {
            userData.setCountry(sha256Hash(userInfo.country));
        }
        if (userInfo.postalCode) {
            userData.setZipCode(sha256Hash(userInfo.postalCode));
        }
        if (userInfo.externalId || userInfo.userId) {
            userData.setExternalId(sha256Hash(String(userInfo.externalId || userInfo.userId)));
        }

        // Build Custom Data
        const customData = new CustomData();
        
        // Ensure value is a number
        const numericValue = Number(eventData.value) || 0;
        customData.setValue(numericValue);
        
        // Always use INR
        customData.setCurrency(eventData.currency || 'INR');
        
        // Content data
        if (eventData.contentIds && eventData.contentIds.length > 0) {
            customData.setContentIds(eventData.contentIds.map(String));
            customData.setContentType(eventData.contentType || 'product');
            
            if (eventData.contentName) {
                customData.setContentName(eventData.contentName);
            }
        }
        
        // Add contents if available
        if (eventData.contents && eventData.contents.length > 0) {
            const contents = buildContents(eventData.contents);
            customData.setContents(contents);
        }
        
        // Order ID for Purchase
        if (eventData.orderId) {
            customData.setOrderId(String(eventData.orderId));
        }

        // Add custom properties for additional product/user details (as JSON string)
        const customProperties = {};
        
        if (eventData.category) customProperties.category = eventData.category;
        if (eventData.subcategory) customProperties.subcategory = eventData.subcategory;
        if (eventData.brand) customProperties.brand = eventData.brand;
        if (eventData.sku) customProperties.sku = eventData.sku;
        if (eventData.productDescription) customProperties.product_description = eventData.productDescription;
        if (eventData.imageUrl) customProperties.image_url = eventData.imageUrl;
        if (eventData.availability) customProperties.availability = eventData.availability;
        if (eventData.condition) customProperties.condition = eventData.condition;
        
        // Order details
        if (eventData.orderNumber) customProperties.order_number = eventData.orderNumber;
        if (eventData.orderStatus) customProperties.order_status = eventData.orderStatus;
        if (eventData.paymentMethod) customProperties.payment_method = eventData.paymentMethod;
        if (eventData.shippingMethod) customProperties.shipping_method = eventData.shippingMethod;
        
        // Financial breakdown
        if (eventData.subtotal !== undefined) customProperties.subtotal = eventData.subtotal;
        if (eventData.shipping !== undefined) customProperties.shipping = eventData.shipping;
        if (eventData.tax !== undefined) customProperties.tax = eventData.tax;
        if (eventData.discount !== undefined) customProperties.discount = eventData.discount;
        if (eventData.coupon) customProperties.coupon = eventData.coupon;
        
        // Cart info
        if (eventData.cartId) customProperties.cart_id = eventData.cartId;
        if (eventData.cartTotal !== undefined) customProperties.cart_total = eventData.cartTotal;
        if (eventData.numItems !== undefined) customProperties.num_items = eventData.numItems;
        
        // Customer info
        if (eventData.customerId) customProperties.customer_id = eventData.customerId;
        if (eventData.customerEmail) customProperties.customer_email = eventData.customerEmail;
        
        // Add custom properties if any exist
        if (Object.keys(customProperties).length > 0) {
            customData.setCustomProperties(customProperties);
        }

        // Build Server Event
        const serverEvent = new ServerEvent();
        serverEvent.setEventName(eventName);
        serverEvent.setEventTime(eventData.eventTime || currentTimestamp);
        serverEvent.setEventId(eventId);
        serverEvent.setUserData(userData);
        serverEvent.setCustomData(customData);
        serverEvent.setActionSource(eventData.actionSource || 'website');

        // Create Event Request
        const eventRequest = new EventRequest(ACCESS_TOKEN, PIXEL_ID);
        eventRequest.setEvents([serverEvent]);
        
        // Add test event code if in test mode
        if (TEST_EVENT_CODE) {
            eventRequest.setTestEventCode(TEST_EVENT_CODE);
        }

        // Execute the request
        console.log('[Meta CAPI SDK] Executing event request...');
        const response = await eventRequest.execute();
        
        console.log('[Meta CAPI SDK] Success:', {
            eventName,
            eventId,
            response: JSON.stringify(response)
        });

        return {
            success: true,
            eventId,
            response
        };

    } catch (error) {
        console.error('[Meta CAPI SDK] Error:', {
            eventName,
            eventId,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

// Export service methods
const MetaCapiSdkService = {
    /**
     * Track PageView event
     */
    async trackPageView(req, data) {
        return sendEvent('PageView', {
            eventId: data.eventId,
            eventTime: data.eventTime,
            value: data.value || 0,
            currency: data.currency || 'INR',
            actionSource: data.actionSource || 'website',
            entityId: data.pageId || 'page'
        }, req, {
            email: data.email,
            phone: data.phone,
            externalId: data.userId,
            fbp: data.fbp,
            fbc: data.fbc
        });
    },

    /**
     * Track ViewContent event (Product Page)
     */
    async trackViewContent(req, data) {
        return sendEvent('ViewContent', {
            eventId: data.eventId,
            eventTime: data.eventTime,
            value: Number(data.price) || 0,
            currency: data.currency || 'INR',
            contentIds: data.contentIds || [String(data.productId)],
            contentType: data.contentType || 'product',
            contentName: data.contentName || data.productName || '',
            contents: data.contents || [{
                id: String(data.productId),
                quantity: 1,
                price: Number(data.price) || 0
            }],
            actionSource: data.actionSource || 'website',
            entityId: data.productId,
            // Additional product details for custom data
            productDescription: data.productDescription,
            category: data.category,
            subcategory: data.subcategory,
            brand: data.brand,
            sku: data.sku,
            imageUrl: data.imageUrl,
            availability: data.availability,
            condition: data.condition
        }, req, {
            email: data.email,
            phone: data.phone,
            firstName: data.firstName,
            lastName: data.lastName,
            city: data.city,
            state: data.state,
            country: data.country,
            postalCode: data.postalCode,
            externalId: data.userId || data.externalId,
            fbp: data.fbp,
            fbc: data.fbc
        });
    },

    /**
     * Track AddToCart event
     */
    async trackAddToCart(req, data) {
        const value = Number(data.price || 0) * Number(data.quantity || 1);
        
        return sendEvent('AddToCart', {
            eventId: data.eventId,
            eventTime: data.eventTime,
            value: value,
            currency: data.currency || 'INR',
            contentIds: data.contentIds || [String(data.productId)],
            contentType: data.contentType || 'product',
            contentName: data.contentName || data.productName || '',
            contents: data.contents || [{
                id: String(data.productId),
                quantity: Number(data.quantity || 1),
                price: Number(data.price || 0)
            }],
            actionSource: data.actionSource || 'website',
            entityId: data.productId,
            // Additional product details
            productDescription: data.productDescription,
            category: data.category,
            subcategory: data.subcategory,
            brand: data.brand,
            sku: data.sku,
            imageUrl: data.imageUrl,
            availability: data.availability,
            condition: data.condition,
            // Cart info
            cartId: data.cartId,
            cartTotal: data.cartTotal
        }, req, {
            email: data.email,
            phone: data.phone,
            firstName: data.firstName,
            lastName: data.lastName,
            city: data.city,
            state: data.state,
            country: data.country,
            postalCode: data.postalCode,
            externalId: data.userId || data.externalId,
            fbp: data.fbp,
            fbc: data.fbc
        });
    },

    /**
     * Track InitiateCheckout event
     */
    async trackInitiateCheckout(req, data) {
        const contents = (data.contents || []).map(item => ({
            id: String(item.productId || item.id || ''),
            quantity: Number(item.quantity || 1),
            price: Number(item.price || 0),
            title: item.title || item.name || '',
            description: item.description || '',
            category: item.category || '',
            brand: item.brand || '',
            image: item.image || ''
        }));
        
        const contentIds = contents.map(c => c.id);
        const value = Number(data.value || data.totalValue || 0);
        
        return sendEvent('InitiateCheckout', {
            eventId: data.eventId,
            eventTime: data.eventTime,
            value: value,
            currency: data.currency || 'INR',
            contentIds,
            contentType: data.contentType || 'product',
            contents,
            actionSource: data.actionSource || 'website',
            entityId: contentIds[0] || 'checkout',
            // Cart details
            cartId: data.cartId,
            cartTotal: data.cartTotal || value,
            numItems: data.numItems || contents.length,
            subtotal: data.subtotal,
            shipping: data.shipping,
            tax: data.tax,
            discount: data.discount,
            coupon: data.coupon
        }, req, {
            email: data.email,
            phone: data.phone,
            firstName: data.firstName,
            lastName: data.lastName,
            city: data.city,
            state: data.state,
            country: data.country,
            postalCode: data.postalCode,
            externalId: data.userId || data.externalId,
            fbp: data.fbp,
            fbc: data.fbc
        });
    },

    /**
     * Track Purchase event
     */
    async trackPurchase(req, data) {
        const contents = (data.items || data.contents || []).map(item => ({
            id: String(item.productId || item._id || item.id || ''),
            quantity: Number(item.quantity || 1),
            price: Number(item.price || item.product?.price || 0),
            title: item.title || item.name || item.product?.name || '',
            description: item.description || item.product?.description || '',
            category: item.category || item.product?.category || '',
            subcategory: item.subcategory || item.product?.subcategory || '',
            brand: item.brand || item.product?.brand || '',
            sku: item.sku || item.product?.sku || '',
            image: item.image || item.product?.mainImage || ''
        }));
        
        const contentIds = contents.map(c => c.id).filter(Boolean);
        const value = Number(data.value || data.total || 0);
        
        return sendEvent('Purchase', {
            eventId: data.eventId,
            eventTime: data.eventTime,
            value: value,
            currency: data.currency || 'INR',
            contentIds,
            contentType: data.contentType || 'product',
            contents,
            orderId: data.orderId,
            actionSource: data.actionSource || 'website',
            entityId: data.orderId || 'purchase',
            // Order details
            orderNumber: data.orderNumber,
            orderStatus: data.orderStatus,
            paymentMethod: data.paymentMethod,
            shippingMethod: data.shippingMethod,
            // Financial breakdown
            subtotal: data.subtotal,
            shipping: data.shipping,
            tax: data.tax,
            discount: data.discount,
            coupon: data.coupon,
            // Customer info
            customerId: data.customerId,
            customerEmail: data.customerEmail,
            numItems: data.numItems || contents.length
        }, req, {
            email: data.email,
            phone: data.phone,
            externalId: data.userId || data.externalId,
            firstName: data.firstName,
            lastName: data.lastName,
            city: data.city,
            state: data.state,
            country: data.country,
            postalCode: data.postalCode,
            street: data.street,
            fbp: data.fbp,
            fbc: data.fbc
        });
    },

    /**
     * Track custom event
     */
    async trackCustomEvent(req, eventName, data) {
        return sendEvent(eventName, {
            eventId: data.eventId,
            eventTime: data.eventTime,
            value: Number(data.value || 0),
            currency: data.currency || 'INR',
            contentIds: data.contentIds || [],
            contentType: data.contentType || 'product',
            actionSource: data.actionSource || 'website',
            entityId: data.entityId || 'custom'
        }, req, {
            email: data.email,
            phone: data.phone,
            externalId: data.userId || data.externalId,
            fbp: data.fbp,
            fbc: data.fbc
        });
    },

    // Expose utility functions
    generateEventId,
    sha256Hash
};

module.exports = MetaCapiSdkService;
