const nodemailer = require('nodemailer');

let cachedTransport = null;

function getTransport() {
  if (cachedTransport) return cachedTransport;

  const user = String(process.env.MAIL_USER || '').trim();
  const pass = String(process.env.MAIL_PASS || '').trim();

  if (!user || !pass) {
    throw new Error('Missing MAIL_USER or MAIL_PASS');
  }

  cachedTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

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
