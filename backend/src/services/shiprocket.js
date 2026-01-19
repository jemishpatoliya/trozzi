const axios = require('axios');

let shiprocketToken = null;
let tokenExpiresAt = null;

async function getShiprocketToken() {
  if (shiprocketToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    return shiprocketToken;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error('Missing SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD');
  }

  try {
    const res = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
      email,
      password,
    });
    const token = res.data.token;
    if (!token) throw new Error('No token returned from Shiprocket');
    shiprocketToken = token;
    tokenExpiresAt = Date.now() + 8 * 60 * 60 * 1000; // 8 hours
    return token;
  } catch (e) {
    console.error('Shiprocket auth error:', e.response?.data || e.message);
    throw new Error('Shiprocket authentication failed');
  }
}

async function createShiprocketOrder(orderData) {
  const token = await getShiprocketToken();
  try {
    const res = await axios.post('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', orderData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (e) {
    console.error('Shiprocket create order error:', e.response?.data || e.message);
    throw new Error('Shiprocket order creation failed');
  }
}

async function trackShipment(awbNumber) {
  const token = await getShiprocketToken();
  try {
    const res = await axios.get(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awbNumber}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (e) {
    console.error('Shiprocket tracking error:', e.response?.data || e.message);
    throw new Error('Shiprocket tracking failed');
  }
}

module.exports = {
  getShiprocketToken,
  createShiprocketOrder,
  trackShipment,
};
