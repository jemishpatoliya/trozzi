const nodemailer = require('nodemailer');

let cachedTransport = null;

function getTransport() {
  if (cachedTransport) return cachedTransport;

  const host = String(process.env.MAIL_HOST || '').trim();
  const port = Number(process.env.MAIL_PORT || 0) || 0;
  const secure = String(process.env.MAIL_SECURE || '').trim();
  const service = String(process.env.MAIL_SERVICE || '').trim();

  const user = String(process.env.MAIL_USER || '').trim();
  const pass = String(process.env.MAIL_PASS || '').trim();

  if (!user || !pass) {
    throw new Error('Missing MAIL_USER or MAIL_PASS');
  }

  if (host || port) {
    cachedTransport = nodemailer.createTransport({
      host: host || undefined,
      port: port || undefined,
      secure: secure ? String(secure).toLowerCase() === 'true' : port === 465,
      auth: { user, pass },
    });
  } else {
    cachedTransport = nodemailer.createTransport({
      service: service || 'gmail',
      auth: { user, pass },
    });
  }

  return cachedTransport;
}

async function sendMail({ to, subject, html }) {
  const from = String(process.env.MAIL_FROM || process.env.MAIL_USER || '').trim();
  if (!from) throw new Error('Missing MAIL_FROM/MAIL_USER');

  const transport = getTransport();
  return transport.sendMail({
    from,
    to,
    subject,
    html,
  });
}

module.exports = { sendMail };
