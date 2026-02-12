const crypto = require('crypto');

// PhonePe checksum verification (X-VERIFY header)
function verifyPhonePeChecksum({ base64Payload, apiPath, xVerify }) {
  const saltKey = process.env.PHONEPE_SALT_KEY;
  const saltIndex = process.env.PHONEPE_SALT_INDEX;
  if (!saltKey || !saltIndex) {
    return { ok: false, reason: 'Missing PHONEPE_SALT_KEY or PHONEPE_SALT_INDEX' };
  }

  const expectedChecksum = crypto.createHash('sha256').update(`${base64Payload}${apiPath}${saltKey}`).digest('hex');
  const expectedHeader = `${expectedChecksum}###${saltIndex}`;

  const isValid = xVerify === expectedHeader;
  if (!isValid) {
    console.error('PhonePe checksum mismatch:', { expected: expectedHeader, got: xVerify });
  }
  return { ok: isValid, reason: isValid ? null : 'Checksum mismatch' };
}

// PhonePe basic auth validation (username:password SHA256)
function verifyPhonePeBasicAuth(req) {
  const username = process.env.PHONEPE_WEBHOOK_USERNAME;
  const password = process.env.PHONEPE_WEBHOOK_PASSWORD;
  if (!username || !password) {
    return { ok: false, reason: 'Missing PHONEPE_WEBHOOK_USERNAME or PHONEPE_WEBHOOK_PASSWORD' };
  }

  const expectedHash = crypto.createHash('sha256').update(`${username}:${password}`).digest('hex');
  const authHeader = req.headers.authorization || '';
  const [scheme, hash] = authHeader.split(' ');
  if (scheme !== 'SHA256' || hash !== expectedHash) {
    console.error('PhonePe auth failed:', { scheme, hash, expected: expectedHash });
    return { ok: false, reason: 'Invalid Authorization header' };
  }
  return { ok: true };
}

// Shiprocket webhook signature verification
function verifyShiprocketSignature({ rawBody, signature, secret, apiKey }) {
  // 1) Preferred: HMAC signature verification (x-shiprocket-signature)
  if (secret && signature) {
    const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
    const isValid = crypto.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(signature, 'hex'));
    if (!isValid) {
      console.error('Shiprocket signature mismatch:', { expected: expectedSignature, got: signature });
    }
    return { ok: isValid, reason: isValid ? null : 'Signature mismatch' };
  }

  // 2) Fallback: Shiprocket dashboard "Token" header verification (x-api-key)
  const expectedToken = String(process.env.SHIPROCKET_WEBHOOK_TOKEN || '').trim();
  if (expectedToken) {
    if (!apiKey) return { ok: false, reason: 'Missing x-api-key header' };
    const ok = crypto.timingSafeEqual(Buffer.from(String(expectedToken)), Buffer.from(String(apiKey)));
    return { ok, reason: ok ? null : 'Invalid x-api-key token' };
  }

  // If neither mechanism is configured, reject.
  if (!secret) {
    return { ok: false, reason: 'Missing SHIPROCKET_WEBHOOK_SECRET (HMAC) and SHIPROCKET_WEBHOOK_TOKEN (x-api-key)' };
  }
  return { ok: false, reason: 'Missing X-Shiprocket-Signature header' };
}

// Idempotency: reject duplicate events using event_id
async function ensureIdempotency({ db, collection, eventId, orderId }) {
  if (!eventId) return { ok: true };
  const existing = await db.collection(collection).findOne({
    'webhookEvents.eventId': eventId,
  });
  if (existing) {
    return { ok: false, reason: 'Duplicate event', duplicate: true };
  }
  // Mark this event to prevent duplicates
  await db.collection(collection).updateOne(
    { _id: orderId },
    { $push: { 'webhookEvents': { eventId, receivedAt: new Date() } } },
    { upsert: true }
  );
  return { ok: true };
}

// Log failed verification attempts
function logWebhookFailure(provider, reason, ip, body) {
  console.error(`[WEBHOOK-${provider}] Verification failed:`, {
    reason,
    ip,
    timestamp: new Date().toISOString(),
    body: typeof body === 'object' ? JSON.stringify(body) : body,
  });
}

module.exports = {
  verifyPhonePeChecksum,
  verifyPhonePeBasicAuth,
  verifyShiprocketSignature,
  ensureIdempotency,
  logWebhookFailure,
};
