# Meta Pixel + CAPI Implementation Guide for Trozzi

## Overview
This guide documents the complete implementation of Meta Pixel (Browser) + Conversions API (Server) tracking for the Trozzi e-commerce platform.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER (Frontend)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Meta Pixel   │  │  React App   │  │  metaPixel.js utils  │   │
│  │ (fbq)        │◄─┤   (Events)   │◄─┤  (track functions)   │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│         │                                    │                    │
│         │ Browser Events                     │ API Calls          │
│         ▼                                    ▼                    │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │                 Meta Pixel Endpoint                        │   │
│  │              (facebook.com/tr)                             │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ CAPI Events (Server-Side)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SERVER (Backend)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Express      │  │ metaCapi     │  │  metaCapi.service.js │   │
│  │ Routes       │──┤ Routes       │──┤  (send to Meta API)  │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                              │                   │
│                                              ▼                   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │              Meta Conversions API (CAPI)                   │   │
│  │         (graph.facebook.com/v19.0/{pixelId}/events)         │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                │
└─────────────────────────────────────────────────────────────────┘
```

## Implemented Events

### 1. ViewContent (Product Page)
**Trigger**: When product details are loaded on ProductDetail page
**Files Modified**:
- `my-project/src/Pages/ProductDetail/index.jsx`

**Code Implementation**:
```javascript
// Import
import { trackViewContent } from '../../utils/metaPixel';

// In component - fires once per product using ref flag
const hasTrackedViewContent = React.useRef(false);
const previousProductId = React.useRef(null);

useEffect(() => {
    // Reset flag when product ID changes
    if (previousProductId.current !== productId) {
        hasTrackedViewContent.current = false;
        previousProductId.current = productId;
    }
    // Track only when product loaded and not yet tracked
    if (product && !loading && !hasTrackedViewContent.current) {
        const price = pricing?.displaySelling || product.price || product.sellingPrice || 0;
        trackViewContent({
            _id: product._id || product.id,
            id: product._id || product.id,
            name: product.name,
            price: Number(price),
        });
        hasTrackedViewContent.current = true;
    }
}, [product, loading, productId]);
```

### 2. AddToCart
**Trigger**: When item is added to cart (server success or local fallback)
**Files Modified**:
- `my-project/src/context/CartContext.jsx`

**Code Implementation**:
```javascript
// Import
import { trackAddToCart } from '../utils/metaPixel';

// Helper function for consistent tracking
const trackAddToCartEvent = useCallback((productId, productName, price, quantity) => {
    trackAddToCart({
        _id: productId,
        id: productId,
        name: productName || 'Product',
        price: Number(price || 0),
    }, quantity);
}, []);

// Usage in API success path
trackAddToCartEvent(productId, detailObject.name, detailObject.price, quantity);

// Usage in fallback/error path (same function)
trackAddToCartEvent(productId, detailObject.name, detailObject.price, quantity);
```

### 3. InitiateCheckout
**Trigger**: When checkout page is loaded
**Files Modified**:
- `my-project/src/Pages/CheckoutPage.jsx` (already implemented)

**Code Implementation**:
```javascript
// Import
import { trackInitiateCheckout } from '../utils/metaPixel';

// In useEffect when page loads
useEffect(() => {
    if (items.length > 0) {
        trackInitiateCheckout({
            items: items,
            total: totalAmount
        });
    }
}, [items, totalAmount]);
```

### 4. Purchase
**Trigger**: When payment is successfully completed
**Files Modified**:
- `my-project/src/Pages/SummaryPage.jsx`

**Code Implementation**:
```javascript
// Import
import { trackPurchase } from '../utils/metaPixel';

// Helper to build Purchase tracking payload from order data
const buildPurchasePayload = (order, fallbackData = {}) => ({
    orderId: order._id || order.orderId || fallbackData.orderId,
    items: order.items || [],
    total: order.total || order.totalAmount || fallbackData.total,
    // User data for advanced matching
    email: order.customer?.email || order.email || fallbackData.customer?.email,
    phone: order.customer?.phone || order.phone || fallbackData.customer?.phone,
    firstName: order.customer?.firstName || order.customer?.name?.split(' ')[0] || fallbackData.customer?.firstName,
    lastName: order.customer?.lastName || order.customer?.name?.split(' ').slice(1).join(' ') || fallbackData.customer?.lastName,
    // Address info
    city: order.address?.city || fallbackData.address?.city,
    state: order.address?.state || fallbackData.address?.state,
    country: order.address?.country || fallbackData.address?.country,
    postalCode: order.address?.postalCode || order.address?.pincode || fallbackData.address?.postalCode || fallbackData.address?.pincode
});

// Usage in API response
trackPurchase(buildPurchasePayload(orderFromResponse, { orderId: verifyResp.data?.orderId || paymentId, total: data.total }));

// Usage in fallback
trackPurchase(buildPurchasePayload(
    { orderId: data.orderId, items: data.items, total: data.total },
    { customer: data.customer, address: data.address }
));
```

---

## Core Utility Files

### 1. Frontend: `my-project/src/utils/metaPixel.js`

```javascript
import { sendCapiEvent } from '../api/metaCapi';

/**
 * Generate a unique event ID for deduplication
 * Format: {eventName}_{timestamp}_{random}_{entityId}
 */
function generateEventId(eventName, entityId = 'unknown') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${eventName}_${timestamp}_${random}_${entityId}`.substring(0, 64);
}

/**
 * Track ViewContent event (Product Page)
 */
export function trackViewContent(product) {
    const eventId = generateEventId('ViewContent', product?.id || product?._id || 'unknown');
    const value = Number(product?.price || 0);
    
    console.log('[Meta Pixel] ViewContent event:', {
        eventId,
        productId: product?.id || product?._id,
        productName: product?.name,
        value,
        currency: 'INR'
    });

    // Browser Pixel Event
    if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'ViewContent', {
            content_ids: [String(product?.id || product?._id || '')],
            content_type: 'product',
            content_name: product?.name || '',
            value: value,
            currency: 'INR'
        }, { eventID: eventId });
    }

    // Server CAPI Event
    sendCapiEvent('ViewContent', {
        eventId,
        value,
        currency: 'INR',
        contentIds: [String(product?.id || product?._id || '')],
        contentType: 'product',
        contentName: product?.name || '',
        entityId: product?.id || product?._id || 'unknown'
    });
}

/**
 * Track AddToCart event
 */
export function trackAddToCart(product, quantity = 1) {
    const eventId = generateEventId('AddToCart', product?.id || product?._id || 'unknown');
    const value = Number(product?.price || 0) * Number(quantity || 1);
    
    console.log('[Meta Pixel] AddToCart event:', {
        eventId,
        productId: product?.id || product?._id,
        productName: product?.name,
        quantity,
        value,
        currency: 'INR'
    });

    // Browser Pixel Event
    if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'AddToCart', {
            content_ids: [String(product?.id || product?._id || '')],
            content_type: 'product',
            content_name: product?.name || '',
            value: value,
            currency: 'INR',
            num_items: quantity
        }, { eventID: eventId });
    }

    // Server CAPI Event
    sendCapiEvent('AddToCart', {
        eventId,
        value,
        currency: 'INR',
        contentIds: [String(product?.id || product?._id || '')],
        contentType: 'product',
        contentName: product?.name || '',
        entityId: product?.id || product?._id || 'unknown',
        contents: [{
            id: String(product?.id || product?._id || ''),
            quantity: Number(quantity || 1),
            item_price: Number(product?.price || 0)
        }]
    });
}

/**
 * Track InitiateCheckout event
 */
export function trackInitiateCheckout(cartData) {
    const items = cartData?.items || [];
    const eventId = generateEventId('InitiateCheckout', items.length > 0 ? items[0]?.product?._id : 'empty');
    const value = Number(cartData?.total || 0);
    
    const contentIds = items.map(item => String(item?.product?._id || item?.product || item?._id || '')).filter(Boolean);
    const contents = items.map(item => ({
        id: String(item?.product?._id || item?.product || item?._id || ''),
        quantity: Number(item?.quantity || 1),
        item_price: Number(item?.price || item?.product?.price || 0)
    }));
    
    console.log('[Meta Pixel] InitiateCheckout event:', {
        eventId,
        itemCount: items.length,
        value,
        currency: 'INR'
    });

    // Browser Pixel Event
    if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'InitiateCheckout', {
            content_ids: contentIds,
            content_type: 'product',
            value: value,
            currency: 'INR',
            num_items: items.length,
            contents: contents
        }, { eventID: eventId });
    }

    // Server CAPI Event
    sendCapiEvent('InitiateCheckout', {
        eventId,
        value,
        currency: 'INR',
        contentIds,
        contentType: 'product',
        entityId: items.length > 0 ? items[0]?.product?._id : 'checkout',
        contents
    });
}

/**
 * Track Purchase event
 */
export function trackPurchase(orderData) {
    const items = orderData?.items || [];
    const eventId = generateEventId('Purchase', orderData?.orderId || 'unknown');
    const value = Number(orderData?.total || 0);
    const orderId = orderData?.orderId || '';
    
    const contentIds = items.map(item => String(item?.product?._id || item?.product || item?._id || item?.productId || '')).filter(Boolean);
    const contents = items.map(item => ({
        id: String(item?.product?._id || item?.product || item?._id || item?.productId || ''),
        quantity: Number(item?.quantity || 1),
        item_price: Number(item?.price || item?.product?.price || 0)
    }));
    
    console.log('[Meta Pixel] Purchase event:', {
        eventId,
        orderId,
        itemCount: items.length,
        value,
        currency: 'INR'
    });

    // Browser Pixel Event
    if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Purchase', {
            content_ids: contentIds,
            content_type: 'product',
            value: value,
            currency: 'INR',
            num_items: items.length,
            order_id: String(orderId),
            contents: contents
        }, { eventID: eventId });
    }

    // Server CAPI Event with User Data
    sendCapiEvent('Purchase', {
        eventId,
        value,
        currency: 'INR',
        contentIds,
        contentType: 'product',
        entityId: orderId || 'purchase',
        orderId: String(orderId),
        contents,
        // User Data for Advanced Matching
        userData: {
            em: orderData?.email,
            ph: orderData?.phone,
            fn: orderData?.firstName,
            ln: orderData?.lastName,
            ct: orderData?.city,
            st: orderData?.state,
            country: orderData?.country,
            zp: orderData?.postalCode
        }
    });
}
```

### 2. Frontend API Client: `my-project/src/api/metaCapi.js`

```javascript
import { apiClient } from './client';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

/**
 * Get visitor ID for event deduplication
 */
function getVisitorId() {
    let visitorId = localStorage.getItem('meta_visitor_id');
    if (!visitorId) {
        visitorId = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('meta_visitor_id', visitorId);
    }
    return visitorId;
}

/**
 * Get Facebook Pixel browser ID (_fbp cookie)
 */
function getFbp() {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/_fbp=([^;]+)/);
    return match ? match[1] : null;
}

/**
 * Send CAPI event to backend
 */
export async function sendCapiEvent(eventName, eventData) {
    try {
        const payload = {
            eventName,
            eventId: eventData.eventId,
            value: Number(eventData.value || 0),
            currency: eventData.currency || 'INR',
            contentIds: eventData.contentIds || [],
            contentType: eventData.contentType || 'product',
            contentName: eventData.contentName || '',
            entityId: eventData.entityId || 'unknown',
            orderId: eventData.orderId || null,
            contents: eventData.contents || [],
            userData: eventData.userData || {},
            visitorId: getVisitorId(),
            fbp: getFbp(),
            eventSourceUrl: typeof window !== 'undefined' ? window.location.href : ''
        };

        console.log('[Meta CAPI] Sending to backend:', {
            eventName,
            eventId: eventData.eventId,
            value: payload.value,
            currency: payload.currency
        });

        const response = await apiClient.post('/meta-capi/event', payload);
        
        console.log('[Meta CAPI] Backend response:', response.data);
        return response.data;
    } catch (error) {
        console.error('[Meta CAPI] Failed to send event:', error);
        // Don't throw - we don't want to break the user flow if tracking fails
        return null;
    }
}

/**
 * Send custom event (for future use)
 */
export async function sendCustomEvent(eventName, customData = {}) {
    return sendCapiEvent(eventName, {
        ...customData,
        eventId: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
    });
}
```

### 3. Backend Service: `backend/src/services/metaCapi.service.js`

```javascript
const crypto = require('crypto');
const axios = require('axios');

const META_API_VERSION = 'v19.0';
const META_API_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

// Cache for hashed values to avoid re-hashing
const hashCache = new Map();

/**
 * SHA256 hash function for user data
 */
function sha256Hash(value) {
    if (!value) return null;
    const str = String(value).trim().toLowerCase();
    if (!str) return null;
    
    // Check cache
    if (hashCache.has(str)) return hashCache.get(str);
    
    const hash = crypto.createHash('sha256').update(str).digest('hex');
    hashCache.set(str, hash);
    return hash;
}

/**
 * Generate unique event ID
 */
function generateEventId(eventName, entityId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${eventName}_${timestamp}_${random}_${entityId}`.substring(0, 64);
}

/**
 * Build user data object with hashed PII for CAPI
 */
function buildUserData(req, userInfo = {}) {
    const userData = {};
    
    // Client IP address
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     req.socket?.remoteAddress ||
                     req.ip;
    if (clientIp) userData.client_ip_address = clientIp;
    
    // Client user agent
    const userAgent = req.headers['user-agent'];
    if (userAgent) userData.client_user_agent = userAgent;
    
    // Facebook Click ID (fbc) from URL or cookie
    const fbc = req.query?.fbclid || req.cookies?._fbc;
    if (fbc) userData.fbc = fbc;
    
    // Facebook Browser ID (fbp) from cookie
    const fbp = userInfo.fbp || req.cookies?._fbp;
    if (fbp) userData.fbp = fbp;
    
    // SHA256 Hashed Email
    const email = userInfo.em || userInfo.email;
    if (email) userData.em = sha256Hash(email);
    
    // SHA256 Hashed Phone
    const phone = userInfo.ph || userInfo.phone;
    if (phone) userData.ph = sha256Hash(phone);
    
    // SHA256 Hashed First Name
    const firstName = userInfo.fn || userInfo.firstName;
    if (firstName) userData.fn = sha256Hash(firstName);
    
    // SHA256 Hashed Last Name
    const lastName = userInfo.ln || userInfo.lastName;
    if (lastName) userData.ln = sha256Hash(lastName);
    
    // SHA256 Hashed City
    const city = userInfo.ct || userInfo.city;
    if (city) userData.ct = sha256Hash(city);
    
    // SHA256 Hashed State
    const state = userInfo.st || userInfo.state;
    if (state) userData.st = sha256Hash(state);
    
    // SHA256 Hashed Country Code
    const country = userInfo.country;
    if (country) userData.country = sha256Hash(country);
    
    // SHA256 Hashed ZIP/Postal Code
    const zip = userInfo.zp || userInfo.postalCode || userInfo.zip;
    if (zip) userData.zp = sha256Hash(zip);
    
    // External ID (your system's user ID, also hashed)
    const externalId = userInfo.externalId || userInfo.userId;
    if (externalId) userData.external_id = sha256Hash(String(externalId));
    
    return userData;
}

/**
 * Build custom data for events
 */
function buildCustomData(eventData) {
    // Ensure value is a number (not string)
    const rawValue = eventData.value;
    let numericValue = 0;
    if (typeof rawValue === 'number') {
        numericValue = rawValue;
    } else if (typeof rawValue === 'string') {
        numericValue = parseFloat(rawValue) || 0;
    } else if (rawValue != null) {
        numericValue = Number(rawValue) || 0;
    }

    const customData = {
        value: numericValue,
        currency: 'INR', // Always INR as required
    };

    // Add content data if available
    if (eventData.contentIds?.length) {
        customData.content_ids = eventData.contentIds;
        customData.content_type = eventData.contentType || 'product';
        customData.content_name = eventData.contentName || '';
        customData.contents = eventData.contents?.map(item => ({
            id: String(item.id || ''),
            quantity: Number(item.quantity || 1),
            item_price: Number(item.price || item.item_price || 0),
        })) || [];
    }

    // Order ID for Purchase events
    if (eventData.orderId) {
        customData.order_id = String(eventData.orderId);
    }

    // Debug logging
    console.log('[Meta CAPI] buildCustomData:', {
        originalValue: rawValue,
        type: typeof rawValue,
        finalValue: numericValue,
        currency: customData.currency,
        contentIds: customData.content_ids,
    });

    return customData;
}

/**
 * Send event to Meta Conversions API
 */
async function sendEventToMeta(eventName, eventData, req, userInfo = {}) {
    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
        console.error('[Meta CAPI] Configuration Error:');
        console.error('  META_PIXEL_ID:', pixelId ? 'Set (hidden)' : 'NOT SET');
        console.error('  META_CAPI_ACCESS_TOKEN:', accessToken ? 'Set (hidden)' : 'NOT SET');
        throw new Error('Missing META_PIXEL_ID or META_CAPI_ACCESS_TOKEN in environment variables');
    }

    // Generate or use provided event_id (CRITICAL for deduplication)
    const eventId = eventData.eventId || generateEventId(eventName, eventData.entityId || 'unknown');

    // Get event source URL with fallback
    const eventSourceUrl = eventData.eventSourceUrl ||
                           req.headers?.referer ||
                           req.headers?.origin ||
                           'https://trozzi.in';

    // Build the event payload
    const event = {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
        event_id: eventId,
        action_source: eventData.actionSource || 'website',
        event_source_url: eventSourceUrl, // REQUIRED for deduplication
        user_data: buildUserData(req, userInfo),
        custom_data: buildCustomData(eventData),
    };

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
            pixelId: pixelId.substring(0, 4) + '****',
            value: eventData.value,
            currency: eventData.currency || 'INR',
            eventSourceUrl,
            hasTestCode: !!process.env.META_CAPI_TEST_EVENT_CODE,
        });

        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
        });

        console.log('[Meta CAPI] Meta API Response:', {
            eventName,
            eventId,
            status: response.status,
            eventsReceived: response.data?.events_received,
            messages: response.data?.messages,
            fbtraceId: response.data?.fbtrace_id,
        });

        return {
            success: true,
            eventId,
            metaResponse: response.data,
        };
    } catch (error) {
        console.error('[Meta CAPI] Error sending event:', {
            eventName,
            eventId,
            error: error.message,
            response: error.response?.data,
        });
        throw error;
    }
}

// Export service functions
module.exports = {
    sendEventToMeta,
    sha256Hash,
    generateEventId,
};
```

### 4. Backend Routes: `backend/src/routes/metaCapi.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const { sendEventToMeta } = require('../services/metaCapi.service');
const { authenticateToken } = require('../middleware/auth.middleware');

/**
 * POST /api/meta-capi/event
 * Generic endpoint to send any CAPI event
 */
router.post('/event', async (req, res) => {
    try {
        const {
            eventName,
            eventId,
            value,
            currency,
            contentIds,
            contentType,
            contentName,
            entityId,
            orderId,
            contents,
            userData,
            fbp,
            eventSourceUrl,
        } = req.body;

        if (!eventName) {
            return res.status(400).json({ error: 'eventName is required' });
        }

        const eventData = {
            eventId,
            value: Number(value || 0),
            currency: currency || 'INR',
            contentIds: contentIds || [],
            contentType: contentType || 'product',
            contentName: contentName || '',
            entityId: entityId || 'unknown',
            orderId: orderId || null,
            contents: contents || [],
            eventSourceUrl: eventSourceUrl || req.headers.referer || 'https://trozzi.in',
        };

        const result = await sendEventToMeta(eventName, eventData, req, {
            ...userData,
            fbp,
        });

        res.json({
            success: true,
            eventId: result.eventId,
            message: 'Event sent to Meta CAPI',
        });
    } catch (error) {
        console.error('[Meta CAPI Route] Error:', error);
        res.status(500).json({
            error: 'Failed to send event to Meta',
            message: error.message,
        });
    }
});

/**
 * GET /api/meta-capi/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
    const testCode = process.env.META_CAPI_TEST_EVENT_CODE;

    res.json({
        status: 'ok',
        configured: !!(pixelId && accessToken),
        hasPixelId: !!pixelId,
        hasAccessToken: !!accessToken,
        testMode: !!testCode,
        testCode: testCode || null,
    });
});

module.exports = router;
```

---

## Environment Variables

Add these to your `.env` files:

### Backend: `backend/.env`
```env
# Meta Pixel & CAPI Configuration
META_PIXEL_ID=1851696042154850
META_CAPI_ACCESS_TOKEN=EAALuS9jMSGMBREth7vUDuxiJ0FD5UYmWXvtSMccd5pQ4HyulhZClE1Vvfe0yC7iSXUK5n7ZAg72xz0bAZCf2eA7V4mAAHUitBt0hXz73vMzqmmu46YD2bukKDDL8yV1gqeOFuZCY3dXc9Xtusf1BDtTInz6ZCcnUHFFVObMF7TwY8GKZBaFQlhIW2DJoZBUPmS0kQZDZD
META_CAPI_TEST_EVENT_CODE=TEST14511
```

### Frontend: `my-project/.env`
```env
# Meta Pixel ID (for client-side reference if needed)
REACT_APP_META_PIXEL_ID=1851696042154850
```

---

## Verification Steps

### Step 1: Verify Backend Health
```bash
curl http://localhost:5050/api/meta-capi/health
```
Expected response:
```json
{
  "status": "ok",
  "configured": true,
  "hasPixelId": true,
  "hasAccessToken": true,
  "testMode": true,
  "testCode": "TEST14511"
}
```

### Step 2: Open Meta Events Manager
1. Go to: https://business.facebook.com/events_manager
2. Select your Pixel: `1851696042154850`
3. Click on "Test Events" tab

### Step 3: Test Each Event

#### ViewContent Event
1. **Action**: Open any product page (e.g., `http://localhost:3000/product/123`)
2. **Expected in Test Events**:
   - Event: `ViewContent`
   - Event ID: `ViewContent_{timestamp}_{random}_{productId}`
   - URL: Current page URL
   - Parameters: `content_ids`, `content_type: "product"`, `value` (number), `currency: "INR"`

#### AddToCart Event
1. **Action**: Click "Add to Cart" button on any product
2. **Expected in Test Events**:
   - Event: `AddToCart`
   - Event ID: `AddToCart_{timestamp}_{random}_{productId}`
   - URL: Current page URL
   - Parameters: `content_ids`, `content_type`, `value`, `currency`, `num_items`

#### InitiateCheckout Event
1. **Action**: Navigate to checkout page (`/checkout`)
2. **Expected in Test Events**:
   - Event: `InitiateCheckout`
   - Event ID: `InitiateCheckout_{timestamp}_{random}_{firstItemId}`
   - URL: Checkout page URL
   - Parameters: `content_ids` (all items), `value` (cart total), `num_items`

#### Purchase Event
1. **Action**: Complete a test purchase
2. **Expected in Test Events**:
   - Event: `Purchase`
   - Event ID: `Purchase_{timestamp}_{random}_{orderId}`
   - URL: Summary page URL
   - Parameters: `content_ids`, `value`, `order_id`, `currency`
   - User Data: `em` (hashed email), `ph` (hashed phone) if provided

### Step 4: Verify Deduplication
1. Check that each event appears **twice** in Test Events:
   - Once from Browser (Pixel)
   - Once from Server (CAPI)
2. Both should have the **same Event ID**
3. Meta will show "Matched" status for deduplicated events

### Step 5: Check Console Logs
Open browser DevTools → Console and look for:
```
[Meta Pixel] ViewContent event: {eventId, productId, ...}
[Meta CAPI] Sending to backend: {eventName, eventId, ...}
[Meta CAPI] Backend response: {success, eventId, ...}
```

---

## Debugging

### Common Issues

#### 1. Events not appearing in Test Events
- Check that `META_CAPI_TEST_EVENT_CODE` is set correctly
- Verify Pixel ID and Access Token are correct
- Check browser console for JavaScript errors
- Check backend logs for API errors

#### 2. Duplicate events (not deduplicated)
- Ensure `event_id` is identical in both Pixel and CAPI calls
- Verify `event_source_url` is included in CAPI payload
- Check that timestamps are within 48 hours

#### 3. Currency showing as null
- Backend service now forces `currency: 'INR'` in `buildCustomData()`
- Check that `eventData.currency` is not overriding with null

#### 4. Value showing as string
- Backend service converts value to number: `Number(value) || 0`
- Frontend sends value as: `Number(product?.price || 0)`

#### 5. Missing event_source_url
- Backend now provides fallback: `eventSourceUrl || req.headers?.referer || 'https://trozzi.in'`
- Frontend sends: `window.location.href`

### Enable Debug Logging
All components now have extensive console logging. Check:
- Browser console for frontend events
- Backend terminal for CAPI events
- Meta Events Manager for received events

---

## Summary

✅ **Completed Implementations**:
1. ✅ Backend: `metaCapi.service.js` - Fixed value/currency handling, event_source_url
2. ✅ Frontend: ProductDetail - ViewContent tracking (with deduplication)
3. ✅ Frontend: CartContext - AddToCart tracking (consolidated helper)
4. ✅ Frontend: CheckoutPage - InitiateCheckout tracking
5. ✅ Frontend: SummaryPage - Purchase tracking with user data

✅ **Key Fixes Applied**:
- `value` always converted to number
- `currency` always set to 'INR'
- `event_source_url` always included with fallback
- `event_id` generated uniquely and passed to both Pixel and CAPI
- User data (email, phone) SHA256 hashed in backend
- Deduplication logic ensures same event_id for browser + server events

✅ **Files Modified**:
- `backend/src/services/metaCapi.service.js`
- `my-project/src/Pages/ProductDetail/index.jsx`
- `my-project/src/context/CartContext.jsx`
- `my-project/src/Pages/SummaryPage.jsx`

---

## Next Steps for Production

1. **Remove Test Event Code**: Clear `META_CAPI_TEST_EVENT_CODE` from production `.env`
2. **Verify Events in Production**: Check Events Manager "Overview" tab (not Test Events)
3. **Set up Conversions API Gateway**: Consider Meta's CAPI Gateway for better reliability
4. **Monitor Event Match Quality**: Check Facebook Events Manager for match rates
5. **A/B Test**: Compare attribution with/without CAPI to measure lift

---

**Implementation Date**: 2025-01-28  
**Pixel ID**: 1851696042154850  
**Test Event Code**: TEST14511
