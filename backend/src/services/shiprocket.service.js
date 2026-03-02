const axios = require('axios');

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

let cachedToken = null;
let tokenExpiresAt = 0;
let inflightTokenPromise = null;

function maskEmail(email) {
  const s = String(email || '');
  const at = s.indexOf('@');
  if (at <= 1) return s;
  return `${s.slice(0, 2)}***${s.slice(at)}`;
}

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
  let res;
  try {
    res = await axios.post(url, { email, password }, { timeout: 30_000 });
  } catch (e) {
    const status = e?.response?.status;
    const data = e?.response?.data;
    console.error('[Shiprocket] Login failed', {
      email: maskEmail(email),
      status,
      data,
    });
    throw e;
  }

  const token = res?.data?.token;
  if (!token) throw new Error('Shiprocket login did not return token');

  console.log('[Shiprocket] Login success', {
    email: maskEmail(email),
    tokenReceived: true,
  });

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
      console.warn('[Shiprocket] Auth error, invalidating token and retrying once', {
        status: err?.response?.status,
        url: config?.url,
        method: config?.method,
      });
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

async function getShiprocketOrderDetails(orderId) {
  const url = `${SHIPROCKET_BASE_URL}/orders/show/${encodeURIComponent(String(orderId || ''))}`;
  const res = await shiprocketRequest({ method: 'GET', url });
  return res.data;
}

async function syncShipmentAwbFromShiprocket(shipment) {
  try {
    if (!shipment?.shiprocketOrderId) {
      throw new Error('No Shiprocket order ID found');
    }
    
    console.log(`[Shiprocket] Fetching order details for ${shipment.shiprocketOrderId}`);
    const orderDetails = await getShiprocketOrderDetails(shipment.shiprocketOrderId);
    
    // Debug: log full response structure
    console.log('[Shiprocket] Order details response:', JSON.stringify(orderDetails, null, 2).slice(0, 2000));
    
    // Extract AWB from response (handle different response structures)
    const shipments = orderDetails?.shipments || [];
    const firstShipment = shipments[0] || {};
    
    let awbNumber = firstShipment?.awb_code || orderDetails?.awb_code || null;
    let courierName = firstShipment?.courier_name || orderDetails?.courier_name || null;
    let trackingUrl = firstShipment?.tracking_url || orderDetails?.tracking_url || null;
    const shipmentId = firstShipment?.shipment_id || orderDetails?.shipment_id || null;
    
    // If no AWB found but we have shipment_id, try to generate AWB
    if (!awbNumber && shipmentId) {
      console.log(`[Shiprocket] No AWB found, attempting to generate for shipment ${shipmentId}`);
      const courierIdRaw = process.env.SHIPROCKET_DEFAULT_COURIER_ID;
      const courierId = Number(courierIdRaw);
      console.log(`[Shiprocket] Default courier ID: ${courierIdRaw}, parsed: ${courierId}`);
      if (Number.isFinite(courierId) && courierId > 0) {
        try {
          const awbRes = await generateAwb({ shipmentId, courierId });
          console.log('[Shiprocket] AWB generation response:', awbRes);
          if (awbRes?.awb_code) {
            awbNumber = awbRes.awb_code;
            courierName = awbRes.courier_name || courierName;
            console.log(`[Shiprocket] AWB generated: ${awbNumber}`);
          } else if (awbRes?.response?.awb_code) {
            awbNumber = awbRes.response.awb_code;
            courierName = awbRes.response.courier_name || courierName;
            console.log(`[Shiprocket] AWB generated from response: ${awbNumber}`);
          }
        } catch (awbError) {
          console.error('[Shiprocket] AWB generation failed:', awbError?.response?.data || awbError.message);
        }
      } else {
        console.error(`[Shiprocket] Invalid courier ID: ${courierIdRaw}. Please set SHIPROCKET_DEFAULT_COURIER_ID env variable.`);
      }
    }
    
    if (!awbNumber) {
      throw new Error('No AWB found in Shiprocket response and failed to generate');
    }
    
    console.log(`[Shiprocket] AWB synced: ${awbNumber}, Courier: ${courierName}`);
    return { awbNumber, courierName, trackingUrl };
  } catch (error) {
    console.error('[Shiprocket] Failed to sync AWB:', error?.response?.data || error.message);
    throw error;
  }
}

async function cancelShiprocketOrders({ ids }) {
  const list = Array.isArray(ids) ? ids : [];
  const clean = list.map((v) => String(v || '').trim()).filter(Boolean);
  if (!clean.length) {
    const err = new Error('No Shiprocket order ids to cancel');
    err.statusCode = 400;
    throw err;
  }

  const url = `${SHIPROCKET_BASE_URL}/orders/cancel`;
  const res = await shiprocketRequest({
    method: 'POST',
    url,
    data: { ids: clean },
  });
  return res.data;
}

function buildOrderItemsFromOrder(order) {
  const items = Array.isArray(order?.items) ? order.items : [];

  return items.map((item, idx) => {
    const name = String(item?.name || '').trim();
    const skuCandidate =
      String(item?.sku || '').trim()
      || String(item?.productId || '').trim()
      || String(item?.product || '').trim()
      || String(item?.product?._id || '').trim()
      || String(item?._id || '').trim();

    const sku = skuCandidate || `SKU-${idx + 1}`;

    return {
      name: name || `Item-${idx + 1}`,
      sku,
      units: Number(item?.quantity || 1),
      selling_price: Math.max(1, Number(item?.price || 0)), // Shiprocket requires min 1
      discount: Number(item?.discount || 0),
      tax: Number(item?.tax || 0),
      hsn: Number(item?.hsn || 0),
    };
  });
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
    // Shiprocket order total typically adds these charges into Order Total.
    // We use giftwrap_charges to carry COD charge (if any) and transaction_charges for tax.
    giftwrap_charges: paymentMethod === 'COD' ? Number(order?.codCharge || 0) : 0,
    transaction_charges: Number(order?.tax || 0),
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

    // If AWB not returned, generate AWB using default courier.
    if (!result?.awb_code && result?.shipment_id) {
      const courierIdRaw = process.env.SHIPROCKET_DEFAULT_COURIER_ID;
      const courierId = Number(courierIdRaw);
      if (Number.isFinite(courierId) && courierId > 0) {
        try {
          console.log(`[Shiprocket] Generating AWB for shipment ${result.shipment_id} with courier ${courierId}`);
          const awbRes = await generateAwb({ shipmentId: result.shipment_id, courierId });
          console.log('[Shiprocket] AWB generation response:', awbRes);
          
          // Assign AWB from response (handle different response structures)
          if (awbRes?.awb_code) {
            result.awb_code = awbRes.awb_code;
            result.courier_name = awbRes.courier_name || result.courier_name;
            console.log(`[Shiprocket] AWB assigned: ${result.awb_code}`);
          } else if (awbRes?.response?.awb_code) {
            result.awb_code = awbRes.response.awb_code;
            result.courier_name = awbRes.response.courier_name || result.courier_name;
            console.log(`[Shiprocket] AWB assigned from response: ${result.awb_code}`);
          } else {
            console.error('[Shiprocket] AWB generation succeeded but no AWB code in response:', awbRes);
          }
        } catch (awbError) {
          console.error('[Shiprocket] AWB generation failed:', awbError?.response?.data || awbError.message);
        }
      }
    }

    // Only schedule pickup if AWB is assigned
    if (result?.shipment_id && result?.awb_code) {
      try {
        console.log(`[Shiprocket] Scheduling pickup for shipment ${result.shipment_id} with AWB ${result.awb_code}`);
        await schedulePickup({ shipmentId: result.shipment_id });
        console.log('[Shiprocket] Pickup scheduled successfully');
      } catch (e) {
        console.error('[Shiprocket] Pickup scheduling failed:', e?.response?.data || e.message);
      }
    } else if (result?.shipment_id && !result?.awb_code) {
      console.error('[Shiprocket] Cannot schedule pickup - AWB not assigned for shipment:', result.shipment_id);
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
  getShiprocketOrderDetails,
  syncShipmentAwbFromShiprocket,
  cancelShiprocketOrders,
  buildOrderItemsFromOrder,
  buildAdhocOrderPayloadFromOrder,
  createShipmentForOrder,
};
