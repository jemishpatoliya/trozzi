module.exports = {
  SMS: {
    PAYMENT_SUCCESS: {
      text: 'Your payment of ₹{{amount}} for order {{orderNumber}} was successful. Thank you!',
      variables: ['amount', 'orderNumber'],
    },
    PAYMENT_FAILED: {
      text: 'Payment failed for order {{orderNumber}}. Please try again or contact support.',
      variables: ['orderNumber'],
    },
    ORDER_SHIPPED: {
      text: 'Your order {{orderNumber}} has been shipped! AWB: {{awbNumber}} via {{courierName}}. Track: {{trackingUrl}}',
      variables: ['orderNumber', 'awbNumber', 'courierName', 'trackingUrl'],
    },
    OUT_FOR_DELIVERY: {
      text: 'Your order {{orderNumber}} is out for delivery! Expect it soon.',
      variables: ['orderNumber'],
    },
    DELIVERED: {
      text: 'Your order {{orderNumber}} was delivered! Thank you for shopping with us.',
      variables: ['orderNumber'],
    },
    REFUND_PROCESSED: {
      text: 'Refund of ₹{{amount}} for order {{orderNumber}} has been processed. It will reflect in your account soon.',
      variables: ['amount', 'orderNumber'],
    },
  },
  EMAIL: {
    PAYMENT_SUCCESS: {
      subject: 'Payment Successful – Order {{orderNumber}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #28a745;">Payment Successful</h2>
          <p>Dear {{customerName}},</p>
          <p>Your payment of <strong>₹{{amount}}</strong> for order <strong>{{orderNumber}}</strong> was successful.</p>
          <p>Thank you for your purchase!</p>
          <p>View order details: <a href="{{orderUrl}}" style="color: #007bff;">Track Order</a></p>
        </div>
      `,
      variables: ['amount', 'orderNumber', 'customerName', 'orderUrl'],
    },
    PAYMENT_FAILED: {
      subject: 'Payment Failed – Order {{orderNumber}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #dc3545;">Payment Failed</h2>
          <p>Dear {{customerName}},</p>
          <p>Unfortunately, payment for order <strong>{{orderNumber}}</strong> failed.</p>
          <p>Please try again or contact support.</p>
          <p><a href="{{orderUrl}}" style="color: #007bff;">Try Payment Again</a></p>
        </div>
      `,
      variables: ['orderNumber', 'customerName', 'orderUrl'],
    },
    ORDER_SHIPPED: {
      subject: 'Order Shipped – {{orderNumber}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #007bff;">Your Order is on its way!</h2>
          <p>Dear {{customerName}},</p>
          <p>Good news! Your order <strong>{{orderNumber}}</strong> has been shipped.</p>
          <p><strong>AWB:</strong> {{awbNumber}}</p>
          <p><strong>Courier:</strong> {{courierName}}</p>
          <p><a href="{{trackingUrl}}" style="color: #007bff;">Track Your Package</a></p>
        </div>
      `,
      variables: ['orderNumber', 'customerName', 'awbNumber', 'courierName', 'trackingUrl'],
    },
    OUT_FOR_DELIVERY: {
      subject: 'Out for Delivery – {{orderNumber}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #ffc107;">Out for Delivery</h2>
          <p>Dear {{customerName}},</p>
          <p>Your order <strong>{{orderNumber}}</strong> is out for delivery and will arrive soon.</p>
        </div>
      `,
      variables: ['orderNumber', 'customerName'],
    },
    DELIVERED: {
      subject: 'Order Delivered – {{orderNumber}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #28a745;">Order Delivered</h2>
          <p>Dear {{customerName}},</p>
          <p>Your order <strong>{{orderNumber}}</strong> has been delivered.</p>
          <p>Thank you for shopping with us!</p>
          <p><a href="{{reviewUrl}}" style="color: #007bff;">Leave a Review</a></p>
        </div>
      `,
      variables: ['orderNumber', 'customerName', 'reviewUrl'],
    },
    REFUND_PROCESSED: {
      subject: 'Refund Processed – {{orderNumber}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #6c757d;">Refund Processed</h2>
          <p>Dear {{customerName}},</p>
          <p>A refund of <strong>₹{{amount}}</strong> for order <strong>{{orderNumber}}</strong> has been processed.</p>
          <p>It will reflect in your account within 3-5 business days.</p>
        </div>
      `,
      variables: ['amount', 'orderNumber', 'customerName'],
    },
  },
  WHATSAPP: {
    ORDER_SHIPPED: {
      text: 'Your order {{orderNumber}} has been shipped! AWB: {{awbNumber}} via {{courierName}}.',
      variables: ['orderNumber', 'awbNumber', 'courierName'],
    },
    DELIVERED: {
      text: 'Your order {{orderNumber}} was delivered! Thank you.',
      variables: ['orderNumber'],
    },
  },
};
