const { EventEmitter } = require('events');
const { NotificationService } = require('../services/notificationService');

class DomainEvents extends EventEmitter {
  constructor() {
    super();
    this.notificationService = new NotificationService();
    this.bindEvents();
  }

  bindEvents() {
    // Payment events
    this.on('payment:completed', async (data) => {
      await this.notifyPaymentSuccess(data);
    });

    this.on('payment:failed', async (data) => {
      await this.notifyPaymentFailed(data);
    });

    // Order/Shipping events
    this.on('order:shipped', async (data) => {
      await this.notifyOrderShipped(data);
    });

    this.on('order:out_for_delivery', async (data) => {
      await this.notifyOutOfDelivery(data);
    });

    this.on('order:delivered', async (data) => {
      await this.notifyOrderDelivered(data);
    });

    // Refund events
    this.on('payment:refunded', async (data) => {
      await this.notifyRefundProcessed(data);
    });
  }

  async notifyPaymentSuccess(data) {
    const { user, order, payment } = data;
    if (!user || !order) return;
    const variables = {
      amount: payment.amount,
      orderNumber: order.orderNumber,
      customerName: order.customer?.name || 'Customer',
      orderUrl: `${process.env.FRONTEND_URL}/orders/${order._id}`,
    };
    try {
      await Promise.all([
        this.notificationService.sendSms({ to: user.phone, templateId: 'PAYMENT_SUCCESS', variables }),
        this.notificationService.sendEmail({ to: user.email, templateId: 'PAYMENT_SUCCESS', variables }),
      ]);
    } catch (e) {
      console.error('Payment success notification error:', e);
    }
  }

  async notifyPaymentFailed(data) {
    const { user, order } = data;
    if (!user || !order) return;
    const variables = {
      orderNumber: order.orderNumber,
      customerName: order.customer?.name || 'Customer',
      orderUrl: `${process.env.FRONTEND_URL}/orders/${order._id}`,
    };
    try {
      await Promise.all([
        this.notificationService.sendSms({ to: user.phone, templateId: 'PAYMENT_FAILED', variables }),
        this.notificationService.sendEmail({ to: user.email, templateId: 'PAYMENT_FAILED', variables }),
      ]);
    } catch (e) {
      console.error('Payment failed notification error:', e);
    }
  }

  async notifyOrderShipped(data) {
    const { user, order, shipment } = data;
    if (!user || !order || !shipment) return;
    const variables = {
      orderNumber: order.orderNumber,
      customerName: order.customer?.name || 'Customer',
      awbNumber: shipment.awbNumber,
      courierName: shipment.courierName,
      trackingUrl: shipment.trackingUrl,
    };
    try {
      await Promise.all([
        this.notificationService.sendSms({ to: user.phone, templateId: 'ORDER_SHIPPED', variables }),
        this.notificationService.sendEmail({ to: user.email, templateId: 'ORDER_SHIPPED', variables }),
      ]);
    } catch (e) {
      console.error('Order shipped notification error:', e);
    }
  }

  async notifyOutOfDelivery(data) {
    const { user, order } = data;
    if (!user || !order) return;
    const variables = {
      orderNumber: order.orderNumber,
      customerName: order.customer?.name || 'Customer',
    };
    try {
      await Promise.all([
        this.notificationService.sendSms({ to: user.phone, templateId: 'OUT_FOR_DELIVERY', variables }),
        this.notificationService.sendEmail({ to: user.email, templateId: 'OUT_FOR_DELIVERY', variables }),
      ]);
    } catch (e) {
      console.error('Out for delivery notification error:', e);
    }
  }

  async notifyOrderDelivered(data) {
    const { user, order } = data;
    if (!user || !order) return;
    const variables = {
      orderNumber: order.orderNumber,
      customerName: order.customer?.name || 'Customer',
      reviewUrl: `${process.env.FRONTEND_URL}/review/${order._id}`,
    };
    try {
      await Promise.all([
        this.notificationService.sendSms({ to: user.phone, templateId: 'DELIVERED', variables }),
        this.notificationService.sendEmail({ to: user.email, templateId: 'DELIVERED', variables }),
      ]);
    } catch (e) {
      console.error('Order delivered notification error:', e);
    }
  }

  async notifyRefundProcessed(data) {
    const { user, order, payment } = data;
    if (!user || !order) return;
    const variables = {
      amount: payment.amount,
      orderNumber: order.orderNumber,
      customerName: order.customer?.name || 'Customer',
    };
    try {
      await Promise.all([
        this.notificationService.sendSms({ to: user.phone, templateId: 'REFUND_PROCESSED', variables }),
        this.notificationService.sendEmail({ to: user.email, templateId: 'REFUND_PROCESSED', variables }),
      ]);
    } catch (e) {
      console.error('Refund processed notification error:', e);
    }
  }
}

// Singleton instance
const domainEvents = new DomainEvents();

module.exports = domainEvents;
