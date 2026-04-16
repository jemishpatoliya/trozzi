# Meta Conversions API (CAPI) - Complete Setup Guide

## 🚀 Overview

This document provides a complete setup guide for Meta Conversions API (CAPI) integration with your eCommerce website.

**Features:**
- ✅ Dual tracking (Pixel client-side + CAPI server-side)
- ✅ Event deduplication with shared event_id
- ✅ SHA256 hashed user data for Advanced Matching
- ✅ All e-commerce events supported
- ✅ Automatic retry mechanism
- ✅ Comprehensive error handling

---

## 📋 Prerequisites

1. **Meta Business Account** with admin access
2. **Meta Pixel** already created (Pixel ID: 1851696042154850)
3. **Access Token** (generated from Events Manager)

---

## 🔑 Step 1: Generate Meta Access Token

### Method A: Events Manager (Recommended)
1. Go to [Meta Events Manager](https://business.facebook.com/events_manager)
2. Select your Pixel (1851696042154850)
3. Click **Settings** tab
4. Scroll to **Conversions API** section
5. Click **Generate Access Token**
6. Copy the token and save it securely

### Method B: Business Settings
1. Go to [Business Settings](https://business.facebook.com/settings)
2. Navigate to **System Users** or **Users**
3. Select user → **Assign Assets** → **Pixels**
4. Grant "Manage Pixel" permission
5. Generate token with `ads_management` and `ads_read` permissions

---

## ⚙️ Step 2: Backend Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# ============================================
# META CONVERSIONS API CONFIGURATION
# ============================================

# Your Meta Pixel ID (REQUIRED)
META_PIXEL_ID=1851696042154850

# Your Meta Access Token (REQUIRED)
# Generate from: https://business.facebook.com/events_manager
META_CAPI_ACCESS_TOKEN=YOUR_ACCESS_TOKEN_HERE

# Test Event Code (OPTIONAL - for debugging)
# Get from Events Manager → Test Events tab
META_CAPI_TEST_EVENT_CODE=TEST12345

# Data Processing Options (OPTIONAL)
# For LDU (Limited Data Use) compliance
# META_CAPI_DATA_OPTIONS=["LDU"]
```

### Verify Configuration

```bash
# Check if API is configured
GET http://localhost:5000/api/meta-capi/health

# Response:
{
  "success": true,
  "config": {
    "pixelIdConfigured": true,
    "pixelIdPrefix": "1851****",
    "accessTokenConfigured": true,
    "accessTokenPrefix": "EAAB****",
    "testMode": true
  }
}
```

---

## 🌐 Step 3: Frontend Integration

### Option 1: Include Script Tag

```html
<!-- In your HTML head or before closing body -->
<script src="/meta-tracking.js"></script>

<script>
  // Initialize tracker
  const tracker = initMetaTracker({
    pixelId: '1851696042154850',
    apiBaseUrl: '/api/meta-capi',
    debug: true  // Enable console logging
  });
</script>
```

### Option 2: Module Import (React/Vue/Angular)

```javascript
import { MetaTracker } from './meta-tracking.js';

const tracker = new MetaTracker({
  pixelId: '1851696042154850',
  apiBaseUrl: '/api/meta-capi',
  debug: process.env.NODE_ENV === 'development'
});

export default tracker;
```

### Option 3: Auto-Initialize

```html
<script>
  window.metaTrackingConfig = {
    pixelId: '1851696042154850',
    apiBaseUrl: '/api/meta-capi',
    debug: true
  };
</script>
<script src="/meta-tracking.js"></script>
```

---

## 📊 Step 4: Track Events

### 1. PageView (Automatic)
```javascript
// Usually tracked automatically on page load
tracker.trackPageView({ pageId: 'homepage' });
```

### 2. ViewContent (Product Page)
```javascript
tracker.trackViewContent({
  id: 'IP15P',
  name: 'iPhone 15 Pro',
  price: 129900,
  currency: 'INR'
});
```

### 3. AddToCart
```javascript
tracker.trackAddToCart({
  id: 'IP15P',
  name: 'iPhone 15 Pro',
  price: 129900,
  currency: 'INR'
}, 2); // quantity = 2
```

### 4. InitiateCheckout
```javascript
tracker.trackInitiateCheckout({
  cartId: 'cart_12345',
  items: [
    { id: 'IP15P', name: 'iPhone 15 Pro', price: 129900, quantity: 1 },
    { id: 'APP2', name: 'AirPods Pro 2', price: 24900, quantity: 1 }
  ],
  value: 154800,
  currency: 'INR',
  userInfo: {
    email: 'customer@example.com',
    phone: '919876543210',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    postalCode: '400001'
  }
});
```

### 5. AddPaymentInfo
```javascript
tracker.trackAddPaymentInfo({
  paymentId: 'pay_67890',
  orderId: 'order_54321',
  items: [...],  // cart items
  value: 154800,
  currency: 'INR'
});
```

### 6. Purchase (CRITICAL!)
```javascript
tracker.trackPurchase({
  orderId: 'order_54321',
  items: [
    { id: 'IP15P', name: 'iPhone 15 Pro', price: 129900, quantity: 1 },
    { id: 'APP2', name: 'AirPods Pro 2', price: 24900, quantity: 1 }
  ],
  value: 154800,
  currency: 'INR',
  userInfo: {
    email: 'customer@example.com',
    phone: '919876543210',
    firstName: 'John',
    lastName: 'Doe',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    postalCode: '400001'
  }
});
```

---

## 👤 Step 5: Advanced Matching (User Data)

Set user data for better attribution:

```javascript
// Set on login or when user data is available
tracker.setUserData({
  email: 'customer@example.com',
  phone: '919876543210',  // Format: country code + number
  firstName: 'John',
  lastName: 'Doe',
  externalId: 'user_12345'  // Your internal user ID
});
```

**Data is automatically hashed with SHA256 before sending to Meta.**

---

## 🧪 Step 6: Testing with Test Events

### 1. Get Test Event Code
1. Go to [Events Manager](https://business.facebook.com/events_manager)
2. Select your Pixel
3. Click **Test Events** tab
4. Copy the test code (e.g., `TEST12345`)

### 2. Configure Backend
```bash
# Add to .env
META_CAPI_TEST_EVENT_CODE=TEST12345
```

### 3. Restart Server
```bash
npm restart
# or
pm2 restart your-app
```

### 4. Send Test Events

**Via Frontend:**
Open `http://localhost:5000/meta-capi-example.html` and click buttons to trigger events.

**Via API Directly:**
```bash
curl -X POST http://localhost:5000/api/meta-capi/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST_ORDER_001",
    "value": 99999,
    "currency": "INR",
    "contents": [
      {"id": "PROD001", "quantity": 1, "price": 99999}
    ],
    "contentIds": ["PROD001"],
    "email": "test@example.com"
  }'
```

### 5. Verify in Events Manager
- Check **Test Events** tab in real-time
- You should see events appearing within seconds
- Look for green checkmarks indicating successful deduplication

---

## 🔍 Step 7: Debugging & Validation

### Check API Response

All API responses include:
```json
{
  "success": true,
  "eventId": "Purchase_order_123_1234567890_abc123",
  "message": "Purchase event tracked successfully"
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid token` | Wrong access token | Regenerate token in Events Manager |
| `Missing parameters` | Required field empty | Check `orderId` for Purchase, `productId` for ViewContent |
| `Pixel not found` | Wrong Pixel ID | Verify `META_PIXEL_ID` in .env |
| `Rate limit` | Too many requests | Implement client-side throttling |

### Enable Debug Mode

```javascript
const tracker = initMetaTracker({
  pixelId: '1851696042154850',
  apiBaseUrl: '/api/meta-capi',
  debug: true  // ← This enables console logging
});
```

Check browser console for detailed logs:
```
[MetaTracker] Tracking Purchase: { eventId: "...", value: 99999 }
[MetaTracker] Pixel Purchase tracked: {...}
[MetaTracker] Server Purchase tracked: {...}
```

### Server Logs

Backend logs all events:
```
[Meta CAPI] Sending Purchase event: { eventId, value, currency }
[Meta CAPI] Purchase event sent successfully: { eventId, fbTraceId, eventsReceived }
```

---

## 🚀 Step 8: Go Live (Production)

### 1. Remove Test Mode
```bash
# Remove or comment out in .env
# META_CAPI_TEST_EVENT_CODE=TEST12345
```

### 2. Verify Pixel is Active
- Go to Events Manager → Overview tab
- Pixel should show "Active" status

### 3. Check Event Quality
- Events Manager → Event Quality tab
- Aim for "Great" or "Good" ratings

### 4. Monitor for 24-48 Hours
- Check Events Manager for incoming events
- Verify Purchase events are firing correctly
- Compare Pixel vs CAPI event counts (should be similar)

---

## 📁 File Structure

```
backend/
├── src/
│   ├── services/
│   │   └── metaCapi.service.js      # Core CAPI service
│   └── routes/
│       └── metaCapi.routes.js        # API endpoints
├── public/
│   ├── meta-tracking.js              # Frontend tracking library
│   └── meta-capi-example.html        # Demo/test page
├── .env                              # Configuration
└── META_CAPI_SETUP.md               # This file
```

---

## 🔒 Security Best Practices

1. **Never expose access token in frontend**
   - ✅ Token is only in `.env` and used server-side
   - ❌ Never put token in HTML or JavaScript

2. **Hash sensitive user data**
   - ✅ Email, phone, names are automatically SHA256 hashed
   - ✅ Only hashed values sent to Meta

3. **Use HTTPS in production**
   - Required for secure data transmission

4. **Validate incoming data**
   - All API endpoints validate required fields

5. **Rate limiting**
   - Implement rate limiting on CAPI endpoints

---

## 📊 API Reference

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/meta-capi/page-view` | POST | Track page view |
| `/api/meta-capi/view-content` | POST | Track product view |
| `/api/meta-capi/add-to-cart` | POST | Track add to cart |
| `/api/meta-capi/initiate-checkout` | POST | Track checkout start |
| `/api/meta-capi/add-payment-info` | POST | Track payment info |
| `/api/meta-capi/purchase` | POST | Track purchase |
| `/api/meta-capi/custom/:event` | POST | Track custom event |
| `/api/meta-capi/health` | GET | Check configuration |

### Request Format (Example: Purchase)

```json
{
  "eventId": "Purchase_order_123_1699999999_abc123",
  "orderId": "order_123",
  "value": 99999,
  "currency": "INR",
  "contents": [
    { "id": "PROD001", "quantity": 2, "price": 49999 }
  ],
  "contentIds": ["PROD001"],
  "sourceUrl": "https://yourstore.com/checkout",
  "email": "customer@example.com",
  "phone": "919876543210",
  "userId": "user_12345",
  "firstName": "John",
  "lastName": "Doe",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "postalCode": "400001"
}
```

---

## 🆘 Troubleshooting

### Events Not Showing in Events Manager

1. **Check configuration:**
   ```bash
   GET /api/meta-capi/health
   ```

2. **Verify test mode:**
   - Make sure `META_CAPI_TEST_EVENT_CODE` is set
   - Check Test Events tab (not Overview tab)

3. **Check server logs:**
   - Look for `[Meta CAPI]` entries
   - Check for error messages

4. **Verify Pixel ID:**
   - Must match exactly in `.env` and frontend

### High Event Differences (Pixel vs CAPI)

- **Pixel higher:** Ad blockers blocking CAPI (expected)
- **CAPI higher:** Check for duplicate event_id
- **Both low:** Pixel not firing correctly

### Purchase Events Not Firing

- Verify `orderId` is provided
- Check `value` is a number > 0
- Ensure items array is properly formatted

---

## 📞 Support

- **Meta Documentation:** https://developers.facebook.com/docs/marketing-api/conversions-api
- **Events Manager:** https://business.facebook.com/events_manager
- **Meta Support:** https://www.facebook.com/business/help

---

## ✅ Checklist

- [ ] Access token generated
- [ ] .env configured with token and Pixel ID
- [ ] Backend routes added to app
- [ ] Frontend script included
- [ ] Test event code set
- [ ] Test events appearing in Events Manager
- [ ] All e-commerce events tested
- [ ] Production configuration ready
- [ ] HTTPS enabled in production

---

**Ready to track 100% of your conversions! 🎉**
