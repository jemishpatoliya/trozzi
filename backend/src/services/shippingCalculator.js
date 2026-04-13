/**
 * Shipping Calculator Service
 * Centralized shipping calculation logic to ensure consistency across order creation routes
 */

const roundMoney = (v) => Math.round((Number(v ?? 0) || 0) * 100) / 100;

/**
 * Calculate per-product shipping charge (per unit - for weight-based calculation)
 * @param {Object} product - Product document with shipping details
 * @returns {number} Shipping charge per unit
 */
function calculateProductShipping(product) {
  if (!product) return 0;

  // Check free shipping
  const free = typeof product?.freeShipping === 'boolean'
    ? product.freeShipping
    : Boolean(product?.management?.shipping?.freeShipping);
  if (free) return 0;

  // Calculate based on weight/dimensions (per unit)
  const weightKg = Number(product?.weight ?? product?.management?.shipping?.weightKg ?? 0) || 0;
  const dims = product?.dimensions ?? product?.management?.shipping?.dimensionsCm ?? { length: 0, width: 0, height: 0 };
  const length = Number(dims?.length ?? 0) || 0;
  const width = Number(dims?.width ?? 0) || 0;
  const height = Number(dims?.height ?? 0) || 0;
  const volumetric = (length * width * height) / 5000;
  const chargeable = Math.max(weightKg, volumetric);
  return Math.max(4.99, chargeable * 1.2);
}

/**
 * Check if product has custom flat shipping charge
 * @param {Object} product - Product document
 * @returns {number} Custom flat shipping charge (0 if not set)
 */
function getCustomFlatShipping(product) {
  if (!product) return 0;
  // Check top-level shippingCharge first (if > 0)
  const topLevelCharge = Number(product?.shippingCharge ?? 0);
  if (topLevelCharge > 0) return topLevelCharge;
  // Fall back to management.shipping.shippingCharge
  const mgmtCharge = Number(product?.management?.shipping?.shippingCharge ?? 0);
  if (mgmtCharge > 0) return mgmtCharge;
  return 0;
}

/**
 * Calculate order totals with server-side validation
 * @param {Array} items - Order items with productId, quantity, price
 * @param {Map} productById - Map of products by ID
 * @param {Object} options - Calculation options
 * @param {boolean} options.isCod - Whether this is a COD order (affects codCharge calculation)
 * @param {number} options.taxRate - Tax rate (default 0.18 for 18% GST)
 * @returns {Object} Calculated totals and enriched items
 */
function calculateOrderTotals(items, productById, options = {}) {
  const { isCod = false, taxRate = 0.18 } = options;

  // Calculate subtotal and enrich items with shipping
  let calculatedSubtotal = 0;
  let calculatedShipping = 0;
  let calculatedCodCharge = 0;
  let hasCustomFlatShipping = false;

  const enrichedItems = items.map((it) => {
    const pid = String(it?.productId || '').trim();
    const p = productById.get(pid);
    const qty = Math.max(1, Number(it?.quantity ?? 1) || 1);

    // Get product price from database for security
    const productPrice = Number(p?.price ?? p?.management?.pricing?.sellingPrice ?? 0) || 0;
    calculatedSubtotal += productPrice * qty;

    // Check for custom flat shipping (not multiplied by quantity)
    const customFlatShipping = getCustomFlatShipping(p);
    let shippingCharge = 0;

    if (customFlatShipping > 0) {
      // Custom flat shipping - applies once per product type, not per unit
      shippingCharge = customFlatShipping;
      calculatedShipping += customFlatShipping;
      hasCustomFlatShipping = true;
    } else {
      // Calculate based on weight/dimensions (per unit)
      shippingCharge = calculateProductShipping(p);
      calculatedShipping += shippingCharge * qty;
    }

    // Calculate COD charge if applicable (per unit)
    if (isCod && p) {
      const codEnabled = typeof p?.codAvailable === 'boolean'
        ? p.codAvailable
        : Boolean(p?.management?.shipping?.codAvailable);
      if (codEnabled) {
        const charge = Number(p?.codCharge ?? p?.management?.shipping?.codCharge ?? 0) || 0;
        calculatedCodCharge += charge * qty;
      }
    }

    return {
      productId: pid,
      name: String(it?.name || p?.name || ''),
      price: productPrice || Number(it?.price ?? 0) || 0,
      quantity: qty,
      selectedImage: String(it?.selectedImage || it?.image || ''),
      selectedColor: String(it?.selectedColor || it?.color || ''),
      selectedSize: String(it?.selectedSize || it?.size || ''),
      shippingCharge: roundMoney(shippingCharge),
      isFlatShipping: customFlatShipping > 0,
    };
  });

  calculatedSubtotal = roundMoney(calculatedSubtotal);
  calculatedShipping = roundMoney(calculatedShipping);
  calculatedCodCharge = roundMoney(calculatedCodCharge);

  // Calculate tax and total
  const tax = roundMoney(calculatedSubtotal * taxRate);
  const total = roundMoney(calculatedSubtotal + calculatedShipping + tax + calculatedCodCharge);

  return {
    subtotal: calculatedSubtotal,
    shipping: calculatedShipping,
    tax,
    codCharge: calculatedCodCharge,
    total,
    items: enrichedItems,
  };
}

module.exports = {
  calculateProductShipping,
  calculateOrderTotals,
  getCustomFlatShipping,
  roundMoney,
};
