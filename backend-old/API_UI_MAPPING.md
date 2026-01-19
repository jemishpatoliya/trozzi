# TROZZY API ↔ UI MAPPING DOCUMENT

## Authentication APIs

| Frontend Component | API Endpoint | Method | Request Payload | Response Shape | Permissions |
|-------------------|-------------|--------|----------------|---------------|-------------|
| LoginPage | `/api/auth/login` | POST | `{email, password}` | `{success, data: {user, token}}` | Public |
| RegisterPage | `/api/auth/register` | POST | `{firstName, lastName, email, password, phone}` | `{success, data: {user, token}}` | Public |
| AuthContext | `/api/auth/me` | GET | - | `{success, data: user}` | Authenticated |
| AuthContext | `/api/auth/logout` | POST | - | `{success, message}` | Authenticated |

## Product APIs

| Frontend Component | API Endpoint | Method | Request Payload | Response Shape | Permissions |
|-------------------|-------------|--------|----------------|---------------|-------------|
| ProductListing | `/api/products` | GET | Query params: `{page, limit, category, featured, q, minPrice, maxPrice, inStock, onSale, freeShipping, rating, sizes, colors, brands, sort, order}` | `{success, data: products[], pagination}` | Public |
| ProductDetail | `/api/products/:id` | GET | - | `{success, data: product}` | Public |
| ProductDetail | `/api/products/slug/:slug` | GET | - | `{success, data: product}` | Public |
| AdminDashboard | `/api/products` | POST | Product object | `{success, data: product}` | Admin |
| AdminDashboard | `/api/products/:id` | PUT | Product object | `{success, data: product}` | Admin |
| AdminDashboard | `/api/products/:id` | DELETE | - | `{success, message}` | Admin |

## Category APIs

| Frontend Component | API Endpoint | Method | Request Payload | Response Shape | Permissions |
|-------------------|-------------|--------|----------------|---------------|-------------|
| Navigation | `/api/categories` | GET | Query: `{active}` | `{success, data: categories[]}` | Public |
| CategoryPage | `/api/categories/:id` | GET | - | `{success, data: category}` | Public |
| AdminDashboard | `/api/categories` | POST | Category object | `{success, data: category}` | Admin |
| AdminDashboard | `/api/categories/:id` | PUT | Category object | `{success, data: category}` | Admin |
| AdminDashboard | `/api/categories/:id` | DELETE | - | `{success, message}` | Admin |

## Cart APIs

| Frontend Component | API Endpoint | Method | Request Payload | Response Shape | Permissions |
|-------------------|-------------|--------|----------------|---------------|-------------|
| CartContext | `/api/cart` | GET | - | `{items: [], totalAmount}` | Authenticated User |
| CartContext | `/api/cart/add` | POST | `{productId, quantity}` | `{success, message, items, totalAmount}` | Authenticated User |
| CartContext | `/api/cart/update` | PUT | `{productId, quantity}` | `{success, message, items, totalAmount}` | Authenticated User |
| CartContext | `/api/cart/remove` | DELETE | `{productId}` | `{success, message, items, totalAmount}` | Authenticated User |
| CartContext | `/api/cart/clear` | DELETE | - | `{success, message, items: [], totalAmount: 0}` | Authenticated User |
| CartContext | `/api/cart/count` | GET | - | `{itemCount}` | Authenticated User |

## Payment APIs

| Frontend Component | API Endpoint | Method | Request Payload | Response Shape | Permissions |
|-------------------|-------------|--------|----------------|---------------|-------------|
| CheckoutPage | `/api/payments/create-order` | POST | `{amount, currency, provider}` | `{success, paymentId, provider, amount, currency, providerOrderId, status, nextAction}` | Authenticated User |
| CheckoutPage | `/api/payments/initiate` | POST | `{amount, currency, provider}` | `{success, paymentId, provider, amount, currency, providerOrderId, status, nextAction}` | Authenticated User |
| CheckoutPage | `/api/payments/verify` | POST | `{paymentId, status, orderData}` | `{success, paymentId, status, provider, orderId}` | Authenticated User |

## Order APIs

| Frontend Component | API Endpoint | Method | Request Payload | Response Shape | Permissions |
|-------------------|-------------|--------|----------------|---------------|-------------|
| AdminDashboard | `/api/orders` | GET | Query: `{status, search, page, limit}` | `{success, data: orders[], pagination}` | Admin |
| OrderTracking | `/api/orders/my` | GET | - | `{success, data: orders[]}` | Authenticated User |
| CheckoutPage | `/api/orders` | POST | `{currency, items, customer, address}` | `{success, data: order}` | Authenticated User |
| AdminDashboard | `/api/orders/:id/status` | PUT | `{status}` | `{success, data: {id, status}}` | Admin |
| OrderTracking | `/api/orders/:id` | GET | - | `{success, data: order}` | Authenticated User/Admin |

## Review APIs

| Frontend Component | API Endpoint | Method | Request Payload | Response Shape | Permissions |
|-------------------|-------------|--------|----------------|---------------|-------------|
| ProductDetail | `/api/reviews` | GET | Query: `{productId, status, page, limit}` | `{success, data: reviews[], pagination}` | Public |
| ProductDetail | `/api/reviews/:id` | GET | - | `{success, data: review}` | Public |
| ProductDetail | `/api/reviews` | POST | `{productId, rating, title, comment}` | `{success, message, data: review}` | Authenticated User |
| ProductDetail | `/api/reviews/:id` | PUT | `{rating, title, comment}` | `{success, message, data: review}` | User/Admin |
| AdminDashboard | `/api/reviews/:id/status` | PUT | `{status}` | `{success, message, data: review}` | Admin |
| ProductDetail | `/api/reviews/:id` | DELETE | - | `{success, message}` | User/Admin |

## Banner APIs

| Frontend Component | API Endpoint | Method | Request Payload | Response Shape | Permissions |
|-------------------|-------------|--------|----------------|---------------|-------------|
| Home/BannerSection | `/api/banners` | GET | Query: `{position, active}` | `{success, data: banners[]}` | Public |
| AdminDashboard | `/api/banners` | POST | `{title, image, link, position, active, order}` | `{success, message, data: banner}` | Admin |
| AdminDashboard | `/api/banners/:id` | PUT | Banner object | `{success, message, data: banner}` | Admin |
| AdminDashboard | `/api/banners/:id` | DELETE | - | `{success, message}` | Admin |

## Key UI-Backend Alignments Verified:

### 1. User Schema Alignment
- ✅ Frontend uses: `firstName`, `lastName`, `email`, `phone`
- ✅ Backend provides exactly these fields
- ✅ Roles: Only `admin` and `user` (removed `moderator`)

### 2. Product Schema Alignment
- ✅ Frontend uses: `colorVariants` with `color`, `colorName`, `colorCode`, `images`, `price`, `stock`, `sku`
- ✅ Backend provides exactly these fields
- ✅ Removed unused: `questions`, `answers`, `warranty`, `dimensions`, `weight`, `metaTitle`, `metaDescription`, `keyFeatures`, `variants`, `management`

### 3. Cart System Alignment
- ✅ Frontend expects: `items` array with `product`, `quantity`, `price`
- ✅ Backend provides exactly this structure
- ✅ Total calculation matches frontend logic

### 4. Order System Alignment
- ✅ Frontend sends: `items`, `customer`, `address` in checkout
- ✅ Backend accepts and stores exactly this structure
- ✅ Order statuses match frontend expectations

### 5. Payment System Alignment
- ✅ Frontend calls: `/payments/create-order` and `/payments/verify`
- ✅ Backend provides mock implementation with correct response structure
- ✅ Payment providers: `phonepe`, `paytm`, `upi` (as used in frontend)

### 6. Review System Alignment
- ✅ Frontend submits: `rating`, `title`, `comment`, `productId`
- ✅ Backend stores and returns exactly these fields
- ✅ Approval workflow matches admin panel needs

### 7. Banner System Alignment
- ✅ Frontend calls: `/banners?position=home_ad_grid`
- ✅ Backend provides `imageUrl` field (as expected by frontend)
- ✅ Position filtering works correctly

## Confirmed: Zero Frontend-Backend Mismatch