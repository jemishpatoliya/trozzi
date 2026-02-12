// Backward-compatible facade.
// The production-ready implementation lives in shiprocket.service.js
const {
  getShiprocketToken,
  createAdhocOrder,
  shiprocketRequest,
} = require('./shiprocket.service');

async function createShiprocketOrder(orderData) {
  return createAdhocOrder(orderData);
}

async function trackShipment(awbNumber) {
  const url = `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${encodeURIComponent(String(awbNumber || ''))}`;
  const res = await shiprocketRequest({ method: 'GET', url });
  return res.data;
}

module.exports = {
  getShiprocketToken,
  createShiprocketOrder,
  trackShipment,
};
