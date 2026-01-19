const express = require('express');
const { PaymentModel } = require('../../models/Payment');
const { OrderModel } = require('../../models/Order');
const { auth } = require('../../middleware/auth');
const { Types } = require('mongoose');

const router = express.Router();

function makeProviderOrderId(provider) {
    const part = Math.random().toString(16).slice(2, 10);
    return `${provider}_${Date.now()}_${part}`;
}

router.post('/create-order', auth, async (req, res, next) => {
    try {
        const { amount, currency = 'INR', provider = 'upi', orderId } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid amount is required'
            });
        }

        const providerOrderId = makeProviderOrderId(provider);

        const orderObjectId = orderId && Types.ObjectId.isValid(orderId) ? new Types.ObjectId(orderId) : undefined;

        const payment = await PaymentModel.create({
            order: orderObjectId,
            user: req.user._id,
            provider,
            providerOrderId,
            amount,
            currency,
            status: 'pending',
            paymentMethod: provider,
        });

        res.json({
            success: true,
            paymentId: String(payment._id),
            provider,
            amount,
            currency,
            providerOrderId,
            status: payment.status,
            supportedProviders: ['phonepe', 'paytm', 'upi'],
            nextAction: {
                type: provider === 'upi' ? 'upi_intent' : 'redirect_url',
                url: `https://example.invalid/pay/${providerOrderId}`,
            },
            message: 'Payment initiation is mocked (providers not integrated yet).',
        });
    } catch (error) {
        next(error);
    }
});

router.post('/initiate', auth, async (req, res, next) => {
    try {
        const { amount, currency = 'INR', provider = 'upi', orderId } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid amount is required'
            });
        }

        const providerOrderId = makeProviderOrderId(provider);

        const orderObjectId = orderId && Types.ObjectId.isValid(orderId) ? new Types.ObjectId(orderId) : undefined;

        const payment = await PaymentModel.create({
            order: orderObjectId,
            user: req.user._id,
            provider,
            providerOrderId,
            amount,
            currency,
            status: 'pending',
            paymentMethod: provider,
        });

        res.json({
            success: true,
            paymentId: String(payment._id),
            provider,
            amount,
            currency,
            providerOrderId,
            status: payment.status,
            supportedProviders: ['phonepe', 'paytm', 'upi'],
            nextAction: {
                type: provider === 'upi' ? 'upi_intent' : 'redirect_url',
                url: `https://example.invalid/pay/${providerOrderId}`,
            },
            message: 'Payment initiation is mocked (providers not integrated yet).',
        });
    } catch (error) {
        next(error);
    }
});

router.post('/verify', auth, async (req, res, next) => {
    try {
        const { paymentId, status, providerPaymentId, providerSignature, orderData } = req.body;

        if (!paymentId || !status) {
            return res.status(400).json({
                success: false,
                error: 'Payment ID and status are required'
            });
        }

        const payment = await PaymentModel.findOne({ _id: paymentId, user: req.user._id });
        if (!payment) {
            return res.status(404).json({ 
                success: false,
                error: 'Payment not found' 
            });
        }

        payment.status = status;
        if (providerPaymentId) payment.providerPaymentId = providerPaymentId;
        if (providerSignature) payment.providerSignature = providerSignature;

        if (status === 'completed') {
            if (!payment.order && orderData) {
                const part = Math.random().toString(16).slice(2, 8).toUpperCase();
                const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${part}`;

                const createdOrder = await OrderModel.create({
                    user: req.user._id,
                    orderNumber,
                    status: 'paid',
                    currency: orderData.currency,
                    subtotal: orderData.subtotal,
                    shipping: orderData.shipping,
                    tax: orderData.tax,
                    total: orderData.total,
                    items: orderData.items,
                    customer: orderData.customer,
                    address: orderData.address,
                    createdAtIso: new Date().toISOString(),
                });

                payment.order = createdOrder._id;
            }

            if (payment.order) {
                await OrderModel.updateOne({ _id: payment.order }, { $set: { status: 'paid' } });
            }
        }

        await payment.save();

        res.json({
            success: true,
            paymentId: String(payment._id),
            status: payment.status,
            provider: payment.provider,
            orderId: payment.order ? String(payment.order) : undefined,
            message: 'Payment verification is mocked (providers not integrated yet).',
        });
    } catch (error) {
        next(error);
    }
});

router.post('/webhook/:provider', async (req, res, next) => {
    try {
        const provider = String(req.params.provider || '').toLowerCase();
        
        res.status(501).json({
            success: false,
            error: 'Webhooks not implemented yet',
            provider,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
