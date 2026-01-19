const crypto = require('crypto');
const https = require('https');

function phonePeXVerify({ base64Payload, apiPath }) {
  const saltKey = process.env.PHONEPE_SALT_KEY;
  const saltIndex = process.env.PHONEPE_SALT_INDEX;
  if (!saltKey || !saltIndex) return { ok: false, value: '' };
  const checksum = crypto.createHash('sha256').update(`${base64Payload}${apiPath}${saltKey}`).digest('hex');
  return { ok: true, value: `${checksum}###${saltIndex}` };
}

async function httpPostPhonePeJson({ baseUrl, path, headers, body }) {
  return new Promise((resolve) => {
    try {
      const normalized = String(baseUrl || '').replace(/\/$/, '');
      const url = new URL(`${normalized}${path}`);
      const payload = JSON.stringify(body ?? {});
      const req = https.request(
        {
          method: 'POST',
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: `${url.pathname}${url.search}`,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            ...(headers || {}),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body: data });
          });
        },
      );
      req.on('error', () => resolve({ ok: false, status: 0, body: '' }));
      req.write(payload);
      req.end();
    } catch (_e) {
      resolve({ ok: false, status: 0, body: '' });
    }
  });
}

async function initiatePhonePeRefund({ payment, amount, reason }) {
  const phonepeBaseUrl = process.env.PHONEPE_BASE_URL;
  if (!phonepeBaseUrl) throw new Error('Missing PHONEPE_BASE_URL');

  const merchantTransactionId = payment.providerOrderId;
  const refundRequestId = `REFUND_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

  const payload = {
    merchantId: process.env.PHONEPE_MERCHANT_ID,
    merchantTransactionId,
    merchantUserId: payment.user ? String(payment.user) : '',
    originalTransactionId: payment.transactionId || '',
    amount: Math.round(amount * 100), // in paise
    currency: 'INR',
    refundRequestId,
    refundNote: reason || 'Admin refund',
  };

  const apiPath = '/pg/v1/refund';
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const xVerify = phonePeXVerify({ base64Payload, apiPath });
  if (!xVerify.ok) throw new Error('PhonePe X-VERIFY generation failed');

  const resp = await httpPostPhonePeJson({
    baseUrl: phonepeBaseUrl,
    path: apiPath,
    headers: {
      'X-VERIFY': xVerify.value,
      'X-ACCEPT': 'application/json',
    },
    body: { request: base64Payload },
  });

  const parsed = JSON.parse(resp.body || '{}');
  if (!resp.ok || !parsed.success) {
    throw new Error(parsed.message || 'Refund initiation failed');
  }

  return parsed;
}

module.exports = { initiatePhonePeRefund };
