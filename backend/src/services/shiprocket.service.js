const axios = require('axios');

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

let cachedToken = null;
let tokenExpiresAt = 0;
let inflightTokenPromise = null;

function getRequiredEnv(name) {
  const val = String(process.env[name] || '').trim();
  if (!val) throw new Error(`Missing ${name}`);
  return val;
}

function getTokenTtlMs() {
  const raw = Number(process.env.SHIPROCKET_TOKEN_TTL_MS);
  // Shiprocket token is typically valid for ~10 days, but we keep a shorter default TTL for safety.
  return Number.isFinite(raw) && raw > 0 ? raw : 8 * 60 * 60 * 1000; // 8 hours
}

function invalidateToken() {
  cachedToken = null;
  tokenExpiresAt = 0;
  inflightTokenPromise = null;
}

async function loginAndGetToken() {
  const email = getRequiredEnv('SHIPROCKET_EMAIL');
  const password = getRequiredEnv('SHIPROCKET_PASSWORD');

  const url = `${SHIPROCKET_BASE_URL}/auth/login`;
  const res = await axios.post(url, { email, password }, { timeout: 30_000 });

  const token = res?.data?.token;
  if (!token) throw new Error('Shiprocket login did not return token');

  cachedToken = token;
  tokenExpiresAt = Date.now() + getTokenTtlMs();

  return token;
}

async function getShiprocketToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiresAt && now < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  if (inflightTokenPromise) return inflightTokenPromise;

  inflightTokenPromise = (async () => {
    try {
      return await loginAndGetToken();
    } finally {
      inflightTokenPromise = null;
    }
  })();

  return inflightTokenPromise;
}

function isAuthError(err) {
  const status = err?.response?.status;
  return status === 401 || status === 403;
}

async function shiprocketRequest(config, { retryOnAuth = true } = {}) {
  const token = await getShiprocketToken();

  try {
    return await axios({
      timeout: 30_000,
      ...config,
      headers: {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    if (retryOnAuth && isAuthError(err)) {
      invalidateToken();
      const freshToken = await getShiprocketToken();
      return await axios({
        timeout: 30_000,
        ...config,
        headers: {
          ...(config.headers || {}),
          Authorization: `Bearer ${freshToken}`,
        },
      });
    }
    throw err;
  }
}

async function createAdhocOrder(payload) {
  const url = `${SHIPROCKET_BASE_URL}/orders/create/adhoc`;
  const res = await shiprocketRequest({ method: 'POST', url, data: payload });
  return res.data;
}

async function generateAwb({ shipmentId, courierId }) {
  const url = `${SHIPROCKET_BASE_URL}/courier/assign/awb`;
  const res = await shiprocketRequest({
    method: 'POST',
    url,
    data: {
      shipment_id: shipmentId,
      courier_id: courierId,
    },
  });
  return res.data;
}

async function schedulePickup({ shipmentId }) {
  const url = `${SHIPROCKET_BASE_URL}/courier/generate/pickup`;
  const res = await shiprocketRequest({
    method: 'POST',
    url,
    data: {
      shipment_id: [shipmentId],
    },
  });
  return res.data;
}

function buildOrderItemsFromOrder(order) {
  const items = Array.isArray(order?.items) ? order.items : [];

  return items.map((item) => ({
    name: String(item?.name || ''),
    sku: String(item?.sku || ''),
    units: Number(item?.quantity || 1),
    selling_price: Number(item?.price || 0),
    discount: Number(item?.discount || 0),
    tax: Number(item?.tax || 0),
    hsn: Number(item?.hsn || 0),
  }));
}

function buildAdhocOrderPayloadFromOrder(order, { paymentMethod }) {
  const pickupLocation = String(process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary');

  const orderDate = new Date().toISOString().split('T')[0];
  const customerName = String(order?.customer?.name || '');
  const address = order?.address || {};

  // NOTE: For single warehouse, pickup_location must match Shiprocket panel pickup name exactly.
  const payload = {
    order_id: String(order?.orderNumber || ''),
    order_date: orderDate,
    pickup_location: pickupLocation,
    channel_id: '',
    comment: `Order ${String(order?.orderNumber || '')}`,

    billing_customer_name: customerName,
    billing_last_name: '',
    billing_address: String(address?.line1 || ''),
    billing_address_2: String(address?.line2 || ''),
    billing_city: String(address?.city || ''),
    billing_state: String(address?.state || ''),
    billing_pincode: String(address?.postalCode || ''),
    billing_country: String(address?.country || 'India'),
    billing_email: String(order?.customer?.email || ''),
    billing_phone: String(order?.customer?.phone || ''),

    shipping_is_billing: true,

    order_items: buildOrderItemsFromOrder(order),

    payment_method: paymentMethod, // 'Prepaid' | 'COD'
    cod_amount: paymentMethod === 'COD' ? Number(order?.total || 0) : 0,
    shipping_charges: Number(order?.shipping || 0),
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    sub_total: Number(order?.subtotal || 0),

    // Package dimensions (fallbacks). Ideally map from products/warehouse configs.
    length: Number(process.env.SHIPROCKET_PKG_LENGTH || 10),
    breadth: Number(process.env.SHIPROCKET_PKG_BREADTH || 10),
    height: Number(process.env.SHIPROCKET_PKG_HEIGHT || 10),
    weight: Number(process.env.SHIPROCKET_PKG_WEIGHT || 0.5),
  };

  return payload;
}

async function createShipmentForOrder(order, { paymentMethod }) {
  try {
    const payload = buildAdhocOrderPayloadFromOrder(order, { paymentMethod });
    const result = await createAdhocOrder(payload);

    // Optional: if AWB not returned, generate AWB using default courier.
    if (!result?.awb_code && result?.shipment_id) {
      const courierIdRaw = process.env.SHIPROCKET_DEFAULT_COURIER_ID;
      const courierId = Number(courierIdRaw);
      if (Number.isFinite(courierId) && courierId > 0) {
        const awbRes = await generateAwb({ shipmentId: result.shipment_id, courierId });
        result.awb_code = awbRes?.awb_code || result.awb_code;
        result.courier_name = awbRes?.courier_name || result.courier_name;
      }
    }

    // Optional: auto schedule pickup once shipment exists.
    if (result?.shipment_id) {
      try {
        await schedulePickup({ shipmentId: result.shipment_id });
      } catch (e) {
        // Don’t fail the whole flow if pickup scheduling fails.
        console.error('[Shiprocket] Pickup scheduling failed:', e?.response?.data || e.message);
      }
    }

    return result;
  } catch (e) {
    const data = e?.response?.data;
    console.error('[Shiprocket] Create shipment failed:', data || e.message);
    const msg = data?.message || data?.error || e.message || 'Shiprocket error';
    const err = new Error(msg);
    err.statusCode = e?.response?.status || 500;
    err.raw = data;
    throw err;
  }
}

module.exports = {
  getShiprocketToken,
  invalidateToken,
  shiprocketRequest,
  createAdhocOrder,
  generateAwb,
  schedulePickup,
  buildOrderItemsFromOrder,
  buildAdhocOrderPayloadFromOrder,
  createShipmentForOrder,
};
