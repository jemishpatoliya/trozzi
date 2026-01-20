function escapeHtml(input) {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function baseLayout({ title, preheader, contentHtml }) {
  const safeTitle = escapeHtml(title);
  const safePreheader = escapeHtml(preheader);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7fb;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safePreheader}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f6f7fb;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px rgba(18, 23, 38, 0.08);">
            <tr>
              <td style="padding:22px 24px;background:#111827;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
                <div style="font-size:16px;font-weight:700;letter-spacing:0.2px;">TROZZY</div>
                <div style="font-size:13px;opacity:0.85;margin-top:4px;">${safeTitle}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.5;">
                ${contentHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;color:#6b7280;font-size:12px;line-height:1.4;">
                <div>If you didn’t request this, you can ignore this email.</div>
                <div style="margin-top:8px;">© ${new Date().getFullYear()} Trozzy</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function itemsTable(items) {
  const safeItems = Array.isArray(items) ? items : [];
  const rows = safeItems
    .map((it) => {
      const name = escapeHtml(it?.name || 'Item');
      const qty = Number(it?.quantity ?? 0) || 0;
      const price = Number(it?.price ?? 0) || 0;
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">${name}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${qty}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:right;">₹${price.toFixed(2)}</td>
        </tr>`;
    })
    .join('');

  if (!rows) return '';

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-top:14px;">
      <tr>
        <th align="left" style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280;">Item</th>
        <th align="right" style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280;">Qty</th>
        <th align="right" style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280;">Price</th>
      </tr>
      ${rows}
    </table>`;
}

function orderConfirmationEmail({ customerName, orderNumber, total, items }) {
  const contentHtml = `
    <div style="font-size:16px;font-weight:700;">Order confirmed</div>
    <div style="margin-top:8px;">Hi ${escapeHtml(customerName || 'Customer')},</div>
    <div style="margin-top:8px;">Your order <b>${escapeHtml(orderNumber)}</b> has been placed successfully.</div>
    ${itemsTable(items)}
    <div style="margin-top:14px;font-size:14px;">Total: <b>₹${Number(total ?? 0).toFixed(2)}</b></div>
  `;

  return baseLayout({
    title: 'Order Confirmation',
    preheader: `Order ${orderNumber} confirmed`,
    contentHtml,
  });
}

function orderCancellationEmail({ customerName, orderNumber, reason }) {
  const contentHtml = `
    <div style="font-size:16px;font-weight:700;">Order cancelled</div>
    <div style="margin-top:8px;">Hi ${escapeHtml(customerName || 'Customer')},</div>
    <div style="margin-top:8px;">Your order <b>${escapeHtml(orderNumber)}</b> has been cancelled.</div>
    ${reason ? `<div style="margin-top:8px;color:#6b7280;">Reason: ${escapeHtml(reason)}</div>` : ''}
  `;

  return baseLayout({
    title: 'Order Cancelled',
    preheader: `Order ${orderNumber} cancelled`,
    contentHtml,
  });
}

function orderShippedEmail({ customerName, orderNumber, courierName, awbNumber, trackingUrl }) {
  const safeTracking = escapeHtml(trackingUrl || '');
  const cta = trackingUrl
    ? `<a href="${safeTracking}" style="display:inline-block;margin-top:12px;background:#111827;color:#ffffff;padding:10px 14px;border-radius:10px;text-decoration:none;font-size:13px;">Track shipment</a>`
    : '';

  const contentHtml = `
    <div style="font-size:16px;font-weight:700;">Order shipped</div>
    <div style="margin-top:8px;">Hi ${escapeHtml(customerName || 'Customer')},</div>
    <div style="margin-top:8px;">Your order <b>${escapeHtml(orderNumber)}</b> has been shipped.</div>
    <div style="margin-top:10px;color:#374151;">
      <div>Courier: <b>${escapeHtml(courierName || '-') }</b></div>
      <div>AWB: <b>${escapeHtml(awbNumber || '-') }</b></div>
    </div>
    ${cta}
  `;

  return baseLayout({
    title: 'Order Shipped',
    preheader: `Order ${orderNumber} shipped`,
    contentHtml,
  });
}

function orderDeliveredEmail({ customerName, orderNumber }) {
  const contentHtml = `
    <div style="font-size:16px;font-weight:700;">Order delivered</div>
    <div style="margin-top:8px;">Hi ${escapeHtml(customerName || 'Customer')},</div>
    <div style="margin-top:8px;">Your order <b>${escapeHtml(orderNumber)}</b> has been delivered.</div>
  `;

  return baseLayout({
    title: 'Order Delivered',
    preheader: `Order ${orderNumber} delivered`,
    contentHtml,
  });
}

module.exports = {
  orderConfirmationEmail,
  orderCancellationEmail,
  orderShippedEmail,
  orderDeliveredEmail,
};
