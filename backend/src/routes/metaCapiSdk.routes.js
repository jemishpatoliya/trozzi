/**
 * Meta Conversions API (CAPI) Routes
 * Using Official Facebook Business SDK
 * 
 * Endpoints:
 * - POST /api/meta-capi/page-view
 * - POST /api/meta-capi/view-content
 * - POST /api/meta-capi/add-to-cart
 * - POST /api/meta-capi/initiate-checkout
 * - POST /api/meta-capi/purchase
 * - GET /api/meta-capi/health
 */

'use strict';

const express = require('express');
const router = express.Router();
const MetaCapiSdkService = require('../services/metaCapiSdk.service');

/**
 * Authentication middleware for CAPI routes
 * Allows both authenticated users and anonymous users
 */
const authenticateCAPI = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

            if (decoded.type === 'user' || decoded.type === 'admin') {
                req.user = { id: decoded.id, type: decoded.type };
                req.isAuthenticated = true;
                return next();
            }
        }

        // Allow anonymous tracking
        req.isAuthenticated = false;
        req.user = null;
        next();

    } catch (error) {
        // Token invalid but allow anonymous tracking
        req.isAuthenticated = false;
        req.user = null;
        next();
    }
};

// Apply middleware
router.use(authenticateCAPI);

/**
 * @route   POST /api/meta-capi/page-view
 * @desc    Track PageView event
 * @access  Public
 */
router.post('/page-view', async (req, res) => {
    try {
        const {
            eventId,
            pageId,
            value,
            currency,
            sourceUrl,
            email,
            phone,
            userId,
            fbp,
        } = req.body;

        console.log('[Meta CAPI Route] PageView:', { eventId, pageId, sourceUrl });

        const result = await MetaCapiSdkService.trackPageView(req, {
            eventId,
            pageId,
            value,
            currency,
            sourceUrl,
            email,
            phone,
            userId,
            fbp,
        });

        res.json({
            success: true,
            eventId: result.eventId,
            message: 'PageView event tracked successfully',
        });

    } catch (error) {
        console.error('[Meta CAPI Route] PageView error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to track PageView',
        });
    }
});

/**
 * @route   POST /api/meta-capi/view-content
 * @desc    Track ViewContent event (Product Page)
 * @access  Public
 */
router.post('/view-content', async (req, res) => {
    try {
        const {
            eventId,
            eventTime,
            productId,
            productName,
            productDescription,
            price,
            currency,
            category,
            subcategory,
            brand,
            sku,
            contentIds,
            contentType,
            contentName,
            contents,
            imageUrl,
            availability,
            condition,
            sourceUrl,
            email,
            phone,
            firstName,
            lastName,
            city,
            state,
            country,
            postalCode,
            userId,
            externalId,
            fbp,
        } = req.body;

        // Validation
        if (!productId) {
            return res.status(400).json({
                success: false,
                error: 'productId is required',
            });
        }

        console.log('[Meta CAPI Route] ViewContent:', { 
            eventId, 
            productId, 
            productName, 
            price,
            category,
            hasUserData: !!(email || phone),
            contentCount: contents?.length || 0
        });

        const result = await MetaCapiSdkService.trackViewContent(req, {
            eventId,
            eventTime,
            productId,
            productName,
            productDescription,
            price: Number(price) || 0,
            currency,
            category,
            subcategory,
            brand,
            sku,
            contentIds,
            contentType,
            contentName,
            contents,
            imageUrl,
            availability,
            condition,
            sourceUrl,
            email,
            phone,
            firstName,
            lastName,
            city,
            state,
            country,
            postalCode,
            userId,
            externalId,
            fbp,
        });

        res.json({
            success: true,
            eventId: result.eventId,
            message: 'ViewContent event tracked successfully',
        });

    } catch (error) {
        console.error('[Meta CAPI Route] ViewContent error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to track ViewContent',
        });
    }
});

/**
 * @route   POST /api/meta-capi/add-to-cart
 * @desc    Track AddToCart event
 * @access  Public
 */
router.post('/add-to-cart', async (req, res) => {
    try {
        const {
            eventId,
            eventTime,
            productId,
            productName,
            productDescription,
            price,
            quantity,
            value,
            currency,
            category,
            subcategory,
            brand,
            sku,
            contentIds,
            contentType,
            contentName,
            contents,
            imageUrl,
            availability,
            condition,
            cartId,
            cartTotal,
            sourceUrl,
            email,
            phone,
            firstName,
            lastName,
            city,
            state,
            country,
            postalCode,
            userId,
            externalId,
            fbp,
        } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                error: 'productId is required',
            });
        }

        console.log('[Meta CAPI Route] AddToCart:', { 
            eventId, 
            productId, 
            quantity, 
            price,
            category,
            hasUserData: !!(email || phone),
            contentCount: contents?.length || 0
        });

        const result = await MetaCapiSdkService.trackAddToCart(req, {
            eventId,
            eventTime,
            productId,
            productName,
            productDescription,
            price: Number(price) || 0,
            quantity: Number(quantity) || 1,
            value: Number(value) || (Number(price) * Number(quantity || 1)),
            currency,
            category,
            subcategory,
            brand,
            sku,
            contentIds,
            contentType,
            contentName,
            contents,
            imageUrl,
            availability,
            condition,
            cartId,
            cartTotal,
            sourceUrl,
            email,
            phone,
            firstName,
            lastName,
            city,
            state,
            country,
            postalCode,
            userId,
            externalId,
            fbp,
        });

        res.json({
            success: true,
            eventId: result.eventId,
            message: 'AddToCart event tracked successfully',
        });

    } catch (error) {
        console.error('[Meta CAPI Route] AddToCart error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to track AddToCart',
        });
    }
});

/**
 * @route   POST /api/meta-capi/initiate-checkout
 * @desc    Track InitiateCheckout event
 * @access  Public
 */
router.post('/initiate-checkout', async (req, res) => {
    try {
        const {
            eventId,
            eventTime,
            cartId,
            value,
            currency,
            numItems,
            contents,
            contentIds,
            contentType,
            subtotal,
            shipping,
            tax,
            discount,
            coupon,
            sourceUrl,
            email,
            phone,
            firstName,
            lastName,
            city,
            state,
            country,
            postalCode,
            userId,
            externalId,
            fbp,
        } = req.body;

        console.log('[Meta CAPI Route] InitiateCheckout:', { 
            eventId, 
            cartId, 
            value,
            numItems,
            hasUserData: !!(email || phone),
            contentCount: contents?.length || 0
        });

        const result = await MetaCapiSdkService.trackInitiateCheckout(req, {
            eventId,
            eventTime,
            cartId,
            value: Number(value) || 0,
            currency,
            numItems,
            contents: contents || [],
            contentIds: contentIds || [],
            contentType,
            subtotal,
            shipping,
            tax,
            discount,
            coupon,
            sourceUrl,
            email,
            phone,
            firstName,
            lastName,
            city,
            state,
            country,
            postalCode,
            userId,
            externalId,
            fbp,
        });

        res.json({
            success: true,
            eventId: result.eventId,
            message: 'InitiateCheckout event tracked successfully',
        });

    } catch (error) {
        console.error('[Meta CAPI Route] InitiateCheckout error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to track InitiateCheckout',
        });
    }
});

/**
 * @route   POST /api/meta-capi/purchase
 * @desc    Track Purchase event
 * @access  Public
 */
router.post('/purchase', async (req, res) => {
    try {
        const {
            eventId,
            eventTime,
            orderId,
            orderNumber,
            orderStatus,
            value,
            currency,
            numItems,
            items,
            contents,
            contentIds,
            contentType,
            paymentMethod,
            shippingMethod,
            subtotal,
            shipping,
            tax,
            discount,
            coupon,
            customerId,
            customerEmail,
            sourceUrl,
            email,
            phone,
            firstName,
            lastName,
            city,
            state,
            country,
            postalCode,
            street,
            userId,
            externalId,
            fbp,
        } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                error: 'orderId is required',
            });
        }

        console.log('[Meta CAPI Route] Purchase:', { 
            eventId, 
            orderId, 
            orderNumber,
            value, 
            itemCount: (items || contents || []).length,
            hasUserData: !!(email || phone),
            paymentMethod
        });

        const result = await MetaCapiSdkService.trackPurchase(req, {
            eventId,
            eventTime,
            orderId,
            orderNumber,
            orderStatus,
            value: Number(value) || 0,
            currency,
            numItems,
            items: items || contents || [],
            contents,
            contentIds,
            contentType,
            paymentMethod,
            shippingMethod,
            subtotal,
            shipping,
            tax,
            discount,
            coupon,
            customerId,
            customerEmail,
            sourceUrl,
            email,
            phone,
            userId,
            externalId,
            firstName,
            lastName,
            city,
            state,
            country,
            postalCode,
            street,
            fbp,
        });

        res.json({
            success: true,
            eventId: result.eventId,
            message: 'Purchase event tracked successfully',
        });

    } catch (error) {
        console.error('[Meta CAPI Route] Purchase error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to track Purchase',
        });
    }
});

/**
 * @route   POST /api/meta-capi/custom/:eventName
 * @desc    Track custom event
 * @access  Public
 */
router.post('/custom/:eventName', async (req, res) => {
    try {
        const { eventName } = req.params;
        const eventData = req.body;

        console.log('[Meta CAPI Route] Custom event:', { eventName, eventId: eventData.eventId });

        const result = await MetaCapiSdkService.trackCustomEvent(req, eventName, eventData);

        res.json({
            success: true,
            eventId: result.eventId,
            message: `${eventName} event tracked successfully`,
        });

    } catch (error) {
        console.error('[Meta CAPI Route] Custom event error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to track custom event',
        });
    }
});

/**
 * @route   GET /api/meta-capi/health
 * @desc    Check CAPI configuration health
 * @access  Public
 */
router.get('/health', (req, res) => {
    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
    const testCode = process.env.META_CAPI_TEST_EVENT_CODE;

    const isConfigured = !!(pixelId && accessToken);

    res.json({
        success: true,
        configured: isConfigured,
        pixelId: pixelId ? `${pixelId.substring(0, 4)}****` : null,
        hasAccessToken: !!accessToken,
        testMode: !!testCode,
        testCode: testCode || null,
        message: isConfigured
            ? 'Meta CAPI SDK is configured and ready'
            : 'Meta CAPI is NOT configured - add credentials to .env',
    });
});

module.exports = router;
