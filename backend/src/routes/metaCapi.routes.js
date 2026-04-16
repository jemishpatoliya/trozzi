/**
 * Meta Conversions API (CAPI) Routes
 * Server-side endpoints for sending events to Meta
 */

const express = require('express');
const router = express.Router();
const MetaCapiService = require('../services/metaCapi.service');
const { authenticateUser } = require('../middleware/userAuth');
const { authenticateAdmin } = require('../middleware/adminAuth');

/**
 * Simple authentication middleware for CAPI routes
 * Accepts either user token or allows anonymous with IP validation
 */
const authenticateCAPI = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      // Try to authenticate as user
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      if (decoded.type === 'user' || decoded.type === 'admin') {
        req.user = { id: decoded.id, type: decoded.type };
        req.isAuthenticated = true;
        return next();
      }
    }
    
    // Allow anonymous but mark as not authenticated
    // Events will still be tracked but without user data
    req.isAuthenticated = false;
    req.user = null;
    next();
    
  } catch (error) {
    // Token invalid but still allow request (anonymous tracking)
    req.isAuthenticated = false;
    req.user = null;
    next();
  }
};

// Apply authentication middleware to all CAPI routes
router.use(authenticateCAPI);

/**
 * @route   POST /api/meta-capi/page-view
 * @desc    Track PageView event
 * @access  Public (with optional auth)
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
      fbLoginId,
      fbp,
    } = req.body;

    const result = await MetaCapiService.trackPageView(req, {
      eventId,
      pageId,
      value,
      currency,
      sourceUrl,
      email,
      phone,
      userId,
      fbLoginId,
      fbp,
    });

    res.json({
      success: true,
      eventId: result.eventId,
      message: 'PageView event tracked successfully',
    });

  } catch (error) {
    console.error('[Meta CAPI Route] PageView error:', error);
    res.status(500).json({
      success: false,
      error: error.error?.message || error.message || 'Failed to track PageView',
      eventId: error.eventId,
    });
  }
});

/**
 * @route   POST /api/meta-capi/view-content
 * @desc    Track ViewContent event (product page view)
 * @access  Public (with optional auth)
 */
router.post('/view-content', async (req, res) => {
  try {
    const {
      eventId,
      productId,
      productName,
      price,
      currency,
      sourceUrl,
      email,
      phone,
      userId,
      fbLoginId,
      fbp,
    } = req.body;
    
    // Validation
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'productId is required',
      });
    }
    
    const result = await MetaCapiService.trackViewContent(req, {
      eventId,
      productId,
      productName,
      price,
      currency,
      sourceUrl,
      email,
      phone,
      userId,
      fbLoginId,
      fbp,
    });
    
    res.json({
      success: true,
      eventId: result.eventId,
      message: 'ViewContent event tracked successfully',
    });
    
  } catch (error) {
    console.error('[Meta CAPI Route] ViewContent error:', error);
    res.status(500).json({
      success: false,
      error: error.error?.message || error.message || 'Failed to track ViewContent',
      eventId: error.eventId,
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
      productId,
      productName,
      price,
      quantity,
      value,
      currency,
      sourceUrl,
      email,
      phone,
      userId,
      fbLoginId,
      fbp,
    } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'productId is required',
      });
    }
    
    const calculatedValue = value || (price * quantity);
    
    const result = await MetaCapiService.trackAddToCart(req, {
      eventId,
      productId,
      productName,
      price,
      quantity,
      value: calculatedValue,
      currency,
      contents: [{
        id: productId,
        quantity: quantity || 1,
        price: price || 0,
      }],
      sourceUrl,
      email,
      phone,
      userId,
      fbLoginId,
      fbp,
    });
    
    res.json({
      success: true,
      eventId: result.eventId,
      message: 'AddToCart event tracked successfully',
    });
    
  } catch (error) {
    console.error('[Meta CAPI Route] AddToCart error:', error);
    res.status(500).json({
      success: false,
      error: error.error?.message || error.message || 'Failed to track AddToCart',
      eventId: error.eventId,
    });
  }
});

/**
 * @route   POST /api/meta-capi/add-payment-info
 * @desc    Track AddPaymentInfo event
 * @access  Public
 */
router.post('/add-payment-info', async (req, res) => {
  try {
    const {
      eventId,
      paymentId,
      orderId,
      value,
      currency,
      contents,
      contentIds,
      sourceUrl,
      email,
      phone,
      userId,
      fbLoginId,
      firstName,
      lastName,
      city,
      state,
      country,
      postalCode,
      fbp,
    } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'orderId is required',
      });
    }

    const result = await MetaCapiService.trackAddPaymentInfo(req, {
      eventId,
      paymentId,
      orderId,
      value,
      currency,
      contents: contents?.map(item => ({
        id: item.productId || item.id,
        quantity: item.quantity,
        price: item.price,
      })),
      contentIds: contentIds || contents?.map(item => item.productId || item.id),
      sourceUrl,
      email,
      phone,
      userId,
      fbLoginId,
      firstName,
      lastName,
      city,
      state,
      country,
      postalCode,
      fbp,
    });

    res.json({
      success: true,
      eventId: result.eventId,
      message: 'AddPaymentInfo event tracked successfully',
    });

  } catch (error) {
    console.error('[Meta CAPI Route] AddPaymentInfo error:', error);
    res.status(500).json({
      success: false,
      error: error.error?.message || error.message || 'Failed to track AddPaymentInfo',
      eventId: error.eventId,
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
      cartId,
      value,
      currency,
      contents,
      contentIds,
      sourceUrl,
      email,
      phone,
      userId,
      fbLoginId,
      // Address info for advanced matching
      city,
      state,
      country,
      postalCode,
      fbp,
    } = req.body;
    
    if (!value && (!contents || !contents.length)) {
      return res.status(400).json({
        success: false,
        error: 'value or contents is required',
      });
    }
    
    const result = await MetaCapiService.trackInitiateCheckout(req, {
      eventId,
      cartId,
      value,
      currency,
      contents: contents?.map(item => ({
        id: item.productId || item.id,
        quantity: item.quantity,
        price: item.price,
      })),
      contentIds: contentIds || contents?.map(item => item.productId || item.id),
      sourceUrl,
      email,
      phone,
      userId,
      fbLoginId,
      city,
      state,
      country,
      postalCode,
      fbp,
    });
    
    res.json({
      success: true,
      eventId: result.eventId,
      message: 'InitiateCheckout event tracked successfully',
    });
    
  } catch (error) {
    console.error('[Meta CAPI Route] InitiateCheckout error:', error);
    res.status(500).json({
      success: false,
      error: error.error?.message || error.message || 'Failed to track InitiateCheckout',
      eventId: error.eventId,
    });
  }
});

/**
 * @route   POST /api/meta-capi/purchase
 * @desc    Track Purchase event (most important)
 * @access  Public
 */
router.post('/purchase', async (req, res) => {
  try {
    const {
      eventId,
      orderId,
      value,
      currency,
      contents,
      contentIds,
      sourceUrl,
      // User data
      email,
      phone,
      userId,
      fbLoginId,
      firstName,
      lastName,
      // Address
      city,
      state,
      country,
      postalCode,
      fbp,
    } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'orderId is required',
      });
    }
    
    if (!value) {
      return res.status(400).json({
        success: false,
        error: 'value (order total) is required',
      });
    }
    
    const result = await MetaCapiService.trackPurchase(req, {
      eventId,
      orderId,
      value,
      currency,
      contents: contents?.map(item => ({
        id: item.productId || item.id || item._id,
        quantity: item.quantity,
        price: item.price,
      })),
      contentIds: contentIds || contents?.map(item => item.productId || item.id || item._id),
      sourceUrl,
      email,
      phone,
      userId,
      fbLoginId,
      firstName,
      lastName,
      city,
      state,
      country,
      postalCode,
      fbp,
    });
    
    res.json({
      success: true,
      eventId: result.eventId,
      message: 'Purchase event tracked successfully',
    });
    
  } catch (error) {
    console.error('[Meta CAPI Route] Purchase error:', error);
    res.status(500).json({
      success: false,
      error: error.error?.message || error.message || 'Failed to track Purchase',
      eventId: error.eventId,
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
    const { eventId, value, currency, customData, userId, email, phone, fbp } = req.body;
    
    const result = await MetaCapiService.trackCustomEvent(req, eventName, {
      eventId,
      value,
      currency,
      customData,
      userId,
      email,
      phone,
      fbp,
    });
    
    res.json({
      success: true,
      eventId: result.eventId,
      message: `${eventName} event tracked successfully`,
    });
    
  } catch (error) {
    console.error(`[Meta CAPI Route] ${req.params.eventName} error:`, error);
    res.status(500).json({
      success: false,
      error: error.error?.message || error.message || 'Failed to track event',
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
  
  // Only show first 4 chars of sensitive data for verification
  res.json({
    success: true,
    config: {
      pixelIdConfigured: !!pixelId,
      pixelIdPrefix: pixelId ? `${pixelId.substring(0, 4)}****` : null,
      accessTokenConfigured: !!accessToken,
      accessTokenPrefix: accessToken ? `${accessToken.substring(0, 4)}****` : null,
      testMode: !!testCode,
    },
    message: accessToken 
      ? 'Meta CAPI is configured' 
      : 'Meta CAPI is NOT configured - add META_CAPI_ACCESS_TOKEN to .env',
  });
});

module.exports = router;
