const { EventEmitter } = require('events');
const { NotificationService } = require('../services/notificationService');
const { createNotification, createAdminNotification } = require('./notificationCenter');
const { sendMail } = require('./mailer');
const {
  orderConfirmationEmail,
  orderCancellationEmail,
  orderShippedEmail,
  orderDeliveredEmail,
} = require('./emailTemplates');

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
    this.on('order:placed', async (data) => {
      await this.notifyOrderPlaced(data);
    });

    this.on('order:cancelled', async (data) => {
      await this.notifyOrderCancelled(data);
    });

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
    const { user, order, payment, io } = data;
    if (!user || !order) return;

    try {
      await createNotification({
        userId: user._id,
        title: 'Payment Successful',
        message: `Payment received for order ${String(order.orderNumber || '')}.`,
        type: 'payment_success',
        io,
      });
    } catch (e) {
      console.error('Payment success in-app notification error:', e);
    }

    try {
      const customerName = String(order.customer?.name || user.firstName || 'Customer');
      const to = String(order.customer?.email || user.email || '').trim();
      if (to) {
        await sendMail({
          to,
          subject: `Order Confirmed - ${String(order.orderNumber || '')}`,
          html: orderConfirmationEmail({
            customerName,
            orderNumber: String(order.orderNumber || ''),
            total: Number(order.total ?? 0),
            items: order.items || [],
          }),
        });
      }
    } catch (e) {
      console.error('Order confirmation email error:', e);
    }

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
    const { user, order, io } = data;
    if (!user || !order) return;

    try {
      await createNotification({
        userId: user._id,
        title: 'Payment Failed',
        message: `Payment failed for order ${String(order.orderNumber || '')}. Please try again.`,
        type: 'payment_failed',
        io,
      });
    } catch (e) {
      console.error('Payment failed in-app notification error:', e);
    }

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
    const { user, order, shipment, io } = data;
    if (!user || !order || !shipment) return;

    try {
      await createNotification({
        userId: user._id,
        title: 'Order Shipped',
        message: `Your order ${String(order.orderNumber || '')} has been shipped.`,
        type: 'order_shipped',
        io,
      });
    } catch (e) {
      console.error('Order shipped in-app notification error:', e);
    }

    try {
      const to = String(order.customer?.email || user.email || '').trim();
      if (to) {
        await sendMail({
          to,
          subject: `Order Shipped - ${String(order.orderNumber || '')}`,
          html: orderShippedEmail({
            customerName: String(order.customer?.name || user.firstName || 'Customer'),
            orderNumber: String(order.orderNumber || ''),
            courierName: String(shipment.courierName || ''),
            awbNumber: String(shipment.awbNumber || ''),
            trackingUrl: String(shipment.trackingUrl || ''),
          }),
        });
      }
    } catch (e) {
      console.error('Order shipped email error:', e);
    }

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
    const { user, order, io } = data;
    if (!user || !order) return;

    try {
      await createNotification({
        userId: user._id,
        title: 'Order Delivered',
        message: `Your order ${String(order.orderNumber || '')} has been delivered.`,
        type: 'order_delivered',
        io,
      });
    } catch (e) {
      console.error('Order delivered in-app notification error:', e);
    }

    try {
      const to = String(order.customer?.email || user.email || '').trim();
      if (to) {
        await sendMail({
          to,
          subject: `Order Delivered - ${String(order.orderNumber || '')}`,
          html: orderDeliveredEmail({
            customerName: String(order.customer?.name || user.firstName || 'Customer'),
            orderNumber: String(order.orderNumber || ''),
          }),
        });
      }
    } catch (e) {
      console.error('Order delivered email error:', e);
    }

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

  async notifyOrderPlaced(data) {
    const { user, order, io } = data;
    if (!order) return;

    try {
      if (user) {
        await createNotification({
          userId: user._id,
          title: 'Order Placed',
          message: `Your order ${String(order.orderNumber || '')} has been placed.`,
          type: 'order_placed',
          io,
        });
      }
    } catch (e) {
      console.error('Order placed user notification error:', e);
    }

    try {
      await createAdminNotification({
        title: 'New Order Placed',
        message: `New order ${String(order.orderNumber || '')} placed by ${String(order.customer?.name || '')}.`,
        type: 'new_order',
        io,
      });
    } catch (e) {
      console.error('Order placed admin notification error:', e);
    }

    try {
      const to = String(order.customer?.email || user?.email || '').trim();
      if (to) {
        await sendMail({
          to,
          subject: `Order Confirmed - ${String(order.orderNumber || '')}`,
          html: orderConfirmationEmail({
            customerName: String(order.customer?.name || user?.firstName || 'Customer'),
            orderNumber: String(order.orderNumber || ''),
            total: Number(order.total ?? 0),
            items: order.items || [],
          }),
        });
      }
    } catch (e) {
      console.error('Order placed email error:', e);
    }
  }

  async notifyOrderCancelled(data) {
    const { user, order, reason, by, io } = data;
    if (!order) return;

    const orderNumber = String(order.orderNumber || '');

    try {
      if (user) {
        await createNotification({
          userId: user._id,
          title: 'Order Cancelled',
          message: `Your order ${orderNumber} has been cancelled.`,
          type: 'order_cancelled',
          io,
        });
      }
    } catch (e) {
      console.error('Order cancelled user notification error:', e);
    }

    try {
      if (String(by || '').toLowerCase() === 'user') {
        await createAdminNotification({
          title: 'Order Cancelled (By User)',
          message: `Order ${orderNumber} cancelled by ${String(order.customer?.name || '')}.`,
          type: 'order_cancelled_by_user',
          io,
        });
      }
    } catch (e) {
      console.error('Order cancelled admin notification error:', e);
    }

    try {
      const to = String(order.customer?.email || user?.email || '').trim();
      if (to) {
        await sendMail({
          to,
          subject: `Order Cancelled - ${orderNumber}`,
          html: orderCancellationEmail({
            customerName: String(order.customer?.name || user?.firstName || 'Customer'),
            orderNumber,
            reason: reason ? String(reason) : '',
          }),
        });
      }
    } catch (e) {
      console.error('Order cancelled email error:', e);
    }
  }
}

// Singleton instance
const domainEvents = new DomainEvents();

module.exports = domainEvents;
