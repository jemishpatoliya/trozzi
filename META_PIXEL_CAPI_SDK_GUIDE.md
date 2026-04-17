# Meta Pixel + CAPI Complete Implementation Guide
## Using Official Facebook Business SDK

---

## ✅ IMPLEMENTATION COMPLETE

This guide covers the production-ready implementation of Meta Pixel (Browser) + Conversions API (Server) using the official Facebook Node.js SDK.

---

## 📁 Files Created/Modified

### Backend Files
1. `backend/src/services/metaCapiSdk.service.js` - SDK-based CAPI service
2. `backend/src/routes/metaCapiSdk.routes.js` - API routes
3. `backend/index.js` - Updated to use new routes
4. `backend/package.json` - Added `facebook-nodejs-business-sdk` dependency

### Frontend Files
1. `my-project/src/utils/metaPixelSdk.js` - Complete tracking utility
2. `my-project/src/Pages/ProductDetail/index.jsx` - ViewContent tracking
3. `my-project/src/context/CartContext.jsx` - AddToCart tracking
4. `my-project/src/Pages/CheckoutPage.jsx` - InitiateCheckout tracking
5. `my-project/src/Pages/SummaryPage.jsx` - Purchase tracking
6. `my-project/src/components/ProductDetalis/index.jsx` - Product interactions

---

## 🔧 Environment Variables

### Backend `.env`
```env
# Meta Pixel & CAPI Configuration
META_PIXEL_ID=1851696042154850
META_CAPI_ACCESS_TOKEN=EAALuS9jMSGMBREth7vUDuxiJ0FD5UYmWXvtSMccd5pQ4HyulhZClE1Vvfe0yC7iSXUK5n7ZAg72xz0bAZCf2eA7V4mAAHUitBt0hXz73vMzqmmu46YD2bukKDDL8yV1gqeOFuZCY3dXc9Xtusf1BDtTInz6ZCcnUHFFVObMF7TwY8GKZBaFQlhIW2DJoZBUPmS0kQZDZD
META_CAPI_TEST_EVENT_CODE=TEST14511  # Remove for production
```

### Frontend `.env`
```env
# Meta Pixel ID (for client-side reference)
REACT_APP_META_PIXEL_ID=1851696042154850
REACT_APP_META_CAPI_ENABLED=true
```

---

## 📊 Event Tracking Implementation

### 1. ViewContent (Product Page)
**Trigger**: When product details are loaded

```javascript
// In ProductDetail/index.jsx
import { trackViewContent } from '../../utils/metaPixelSdk';

// In useEffect after product loads
trackViewContent({
    _id: product._id || product.id,
    id: product._id || product.id,
    name: product.name,
    price: Number(product.price),
});
```

**What Gets Tracked**:
- Browser: `fbq('track', 'ViewContent', { content_ids, content_name, value, currency })`
- Server: Event sent to `/api/meta-capi/view-content`
- Event ID: `ViewContent_{productId}_{timestamp}_{random}`

---

### 2. AddToCart
**Trigger**: When user clicks Add to Cart

```javascript
// In CartContext.jsx
import { trackAddToCart } from '../utils/metaPixelSdk';

// When item added
trackAddToCart({
    _id: productId,
    id: productId,
    name: productName,
    price: Number(price),
}, quantity);
```

**What Gets Tracked**:
- Browser: `fbq('track', 'AddToCart', { content_ids, content_name, value, currency, quantity })`
- Server: Event sent to `/api/meta-capi/add-to-cart`
- Event ID: `AddToCart_{productId}_{timestamp}_{random}`

---

### 3. InitiateCheckout
**Trigger**: When checkout page loads

```javascript
// In CheckoutPage.jsx
import { trackInitiateCheckout } from '../utils/metaPixelSdk';

// In useEffect
trackInitiateCheckout({
    items: cartItems,
    totalValue: cartTotal,
});
```

**What Gets Tracked**:
- Browser: `fbq('track', 'InitiateCheckout', { content_ids, value, currency, num_items })`
- Server: Event sent to `/api/meta-capi/initiate-checkout`
- Event ID: `InitiateCheckout_{cartId}_{timestamp}_{random}`

---

### 4. Purchase
**Trigger**: When order is successfully placed

```javascript
// In SummaryPage.jsx
import { trackPurchase } from '../utils/metaPixelSdk';

// When payment successful
trackPurchase({
    orderId: order._id,
    items: order.items,
    total: order.total,
    email: order.customer?.email,
    phone: order.customer?.phone,
    firstName: order.customer?.firstName,
    lastName: order.customer?.lastName,
    city: order.address?.city,
    state: order.address?.state,
    country: order.address?.country,
    postalCode: order.address?.postalCode,
});
```

**What Gets Tracked**:
- Browser: `fbq('track', 'Purchase', { content_ids, value, currency, order_id })`
- Server: Event sent to `/api/meta-capi/purchase`
- Event ID: `Purchase_{orderId}_{timestamp}_{random}`
- User Data: Email, Phone (SHA256 hashed on server)

---

## 🔍 Testing & Verification Steps

### Step 1: Verify Backend Health

**Terminal Command**:
```bash
curl http://localhost:5050/api/meta-capi/health
```

**Expected Response**:
```json
{
  "success": true,
  "configured": true,
  "pixelId": "1851****",
  "hasAccessToken": true,
  "testMode": true,
  "testCode": "TEST14511",
  "message": "Meta CAPI SDK is configured and ready"
}
```

---

### Step 2: Open Meta Events Manager

1. Go to: https://business.facebook.com/events_manager
2. Select your Pixel: `1851696042154850`
3. Click on **"Test Events"** tab
4. Enter test code: `TEST14511`

---

### Step 3: Test ViewContent Event

**Action**:
1. Open any product page (e.g., `http://localhost:3000/product/123`)

**Browser Console Expected**:
```
[Meta Pixel] ViewContent fired: { eventId: "ViewContent_123_1699999999999_a1b2c3", ... }
[Meta CAPI] Sending to backend: /view-content { eventId, productId, ... }
[Meta CAPI] Backend response: { success: true, eventId: "..." }
```

**Meta Test Events Expected**:
- Event: `ViewContent`
- Source: Browser + Server (both should appear)
- Event ID: Same for both sources
- Status: `Active` (will become `Matched` after deduplication)

---

### Step 4: Test AddToCart Event

**Action**:
1. Click "Add to Cart" button on any product

**Browser Console Expected**:
```
[Meta Pixel] AddToCart fired: { eventId: "AddToCart_123_1699999999999_d4e5f6", ... }
[Meta CAPI] Sending to backend: /add-to-cart { eventId, productId, quantity, ... }
[Meta CAPI] Backend response: { success: true, eventId: "..." }
```

**Meta Test Events Expected**:
- Event: `AddToCart`
- Source: Browser + Server
- Parameters: `content_ids`, `value`, `currency`, `quantity`

---

### Step 5: Test InitiateCheckout Event

**Action**:
1. Navigate to checkout page (`http://localhost:3000/checkout`)

**Browser Console Expected**:
```
[Meta Pixel] InitiateCheckout fired: { eventId: "InitiateCheckout_cart_1699999999999_g7h8i9", ... }
[Meta CAPI] Sending to backend: /initiate-checkout { eventId, cartId, value, ... }
[Meta CAPI] Backend response: { success: true, eventId: "..." }
```

**Meta Test Events Expected**:
- Event: `InitiateCheckout`
- Source: Browser + Server
- Parameters: `content_ids` (all items), `num_items`, `value`

---

### Step 6: Test Purchase Event

**Action**:
1. Complete a test order (use test payment mode)
2. Wait for success page

**Browser Console Expected**:
```
[Meta Pixel] Purchase fired: { eventId: "Purchase_order123_1699999999999_j0k1l2", ... }
[Meta CAPI] Sending to backend: /purchase { eventId, orderId, value, items, ... }
[Meta CAPI] Backend response: { success: true, eventId: "..." }
```

**Meta Test Events Expected**:
- Event: `Purchase`
- Source: Browser + Server
- Parameters: `order_id`, `content_ids`, `value`, `currency`
- User Data: Hashed email and phone (if provided)

---

## ✅ Deduplication Verification

**How to Verify Deduplication is Working**:

1. In Meta Test Events, look for events with **SAME** `event_id`
2. One from "Browser" source, one from "Server" source
3. Status should show as `Matched` (means deduplication working)
4. Events with different IDs will show as `Active` (not deduplicated)

**Example in Test Events**:
| Event | Source | Event ID | Status |
|-------|--------|----------|--------|
| ViewContent | Browser | ViewContent_123_1699999999999_a1b2c3 | Matched |
| ViewContent | Server | ViewContent_123_1699999999999_a1b2c3 | Matched |
| AddToCart | Browser | AddToCart_123_1699999999999_d4e5f6 | Matched |
| AddToCart | Server | AddToCart_123_1699999999999_d4e5f6 | Matched |

---

## 🐛 Debugging

### Enable Debug Mode

Add to URL: `?meta_debug=1`
```
http://localhost:3000/product/123?meta_debug=1
```

This enables verbose console logging.

### Common Issues & Solutions

#### Issue 1: "Pixel not loaded"
**Console Error**: `[Meta Pixel] ViewContent - Pixel not loaded`

**Solution**: Meta Pixel base code not initialized. Check `index.html` has:
```html
<script>
!function(f,b,e,v,n,t,s)
{...fbq('init', '1851696042154850');...}
</script>
```

#### Issue 2: "Backend error"
**Console Error**: `[Meta CAPI] Backend error: ...`

**Solution**: 
1. Check backend is running on port 5050
2. Verify health endpoint: `curl http://localhost:5050/api/meta-capi/health`
3. Check backend console for detailed error

#### Issue 3: Events not appearing in Meta
**Solution**:
1. Verify `META_CAPI_TEST_EVENT_CODE` is set
2. Check credentials in backend `.env`
3. Ensure `META_PIXEL_ID` matches your Events Manager Pixel ID
4. Wait 1-2 minutes for events to appear

#### Issue 4: Currency showing null
**Fixed**: Backend now forces `currency: 'INR'` in all events

#### Issue 5: Value showing as string
**Fixed**: Frontend and backend both convert to `Number(value)`

---

## 🚀 Production Deployment

### Step 1: Remove Test Event Code

Edit `backend/.env`:
```env
# Remove or comment out test event code
# META_CAPI_TEST_EVENT_CODE=TEST14511
```

### Step 2: Restart Backend
```bash
cd backend
npm run dev
```

### Step 3: Verify in Production
1. Events should appear in Events Manager "Overview" tab (not Test Events)
2. Check "Event Sources" shows both Browser and Server
3. Verify match rates in "Settings" → "Event Match Quality"

---

## 📈 Expected Results

After implementation, you should see:

1. ✅ All 4 standard events tracking (ViewContent, AddToCart, InitiateCheckout, Purchase)
2. ✅ Hybrid tracking: Browser + Server for each event
3. ✅ Deduplication working (same event_id for both sources)
4. ✅ All required parameters included (content_ids, value, currency, etc.)
5. ✅ User data hashing (email, phone) for better match quality
6. ✅ Debug logs in browser console (when debug mode enabled)
7. ✅ Events appearing in Meta Events Manager within 1-2 minutes

---

## 📞 Support

If you face any issues:
1. Check browser console for errors
2. Check backend terminal logs
3. Verify health endpoint returns `configured: true`
4. Ensure all imports are updated to use `metaPixelSdk`

---

**Implementation Date**: 2025-01-28  
**Facebook SDK Version**: `facebook-nodejs-business-sdk`  
**Pixel ID**: 1851696042154850  
**Status**: ✅ PRODUCTION READY
