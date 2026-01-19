const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const router = express.Router();

// PhonePe configuration
const PHONEPE_CONFIG = {
    merchantId: process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT',
    saltKey: process.env.PHONEPE_SALT_KEY || '3947f84b-8c4f-4222-8c4f-4222',
    environment: process.env.NODE_ENV === 'production' ? 'PROD' : 'UAT',
    apiEndpoint: process.env.PHONEPE_API_ENDPOINT || 'https://api.phonepe.com/hermes/pg/v1/v1',
    redirectUrl: process.env.PHONEPE_REDIRECT_URL || 'https://your-domain.com/payment/phonepe/success',
    callbackUrl: process.env.PHONEPE_CALLBACK_URL || 'https://your-domain.com/api/payments/phonepe/webhook'
};

// Generate checksum for PhonePe API
function generateChecksum(payload) {
    const data = Object.keys(payload)
        .sort()
        .map(key => `${key}=${payload[key]}`)
        .join('&');

    return crypto
        .createHash('sha256')
        .update(data + PHONEPE_CONFIG.saltKey)
        .digest('hex');
}

// Verify PhonePe webhook signature
function verifyWebhookSignature(body, signature) {
    const receivedSignature = signature;
    const calculatedSignature = crypto
        .createHash('sha256')
        .update(JSON.stringify(body) + PHONEPE_CONFIG.saltKey)
        .digest('hex');

    return receivedSignature === calculatedSignature;
}

// POST /api/payments/phonepe - Initiate PhonePe payment
router.post('/phonepe', async (req, res) => {
    try {
        const { amount, orderId, customerInfo, upiId } = req.body;

        if (!amount || !orderId || !customerInfo) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: amount, orderId, customerInfo'
            });
        }

        // Generate unique merchant transaction ID
        const merchantTransactionId = `M${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Prepare payment payload
        const paymentPayload = {
            merchantId: PHONEPE_CONFIG.merchantId,
            merchantTransactionId,
            amount: amount * 100, // Convert to paise
            instrumentType: 'UPI',
            merchantUserId: customerInfo.userId,
            redirectUrl: PHONEPE_CONFIG.redirectUrl,
            redirectMode: 'REDIRECT',
            callbackUrl: PHONEPE_CONFIG.callbackUrl,
            paymentInstrument: {
                type: 'UPI',
                upiId: upiId
            },
            deviceContext: {
                deviceOs: 'ANDROID',
                deviceType: 'APP'
            },
            mobileNumber: customerInfo.phone,
            email: customerInfo.email,
            firstName: customerInfo.name.split(' ')[0],
            lastName: customerInfo.name.split(' ').slice(1).join(' ')
        };

        // Generate checksum
        const checksum = generateChecksum(paymentPayload);

        // Prepare PhonePe API request
        const phonepeRequest = {
            request: paymentPayload,
            checksum: checksum,
            endpoint: PHONEPE_CONFIG.apiEndpoint + '/pg/v1/pay',
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': PHONEPE_CONFIG.saltKey
            }
        };

        // Make API call to PhonePe
        const response = await axios(phonepeRequest);

        if (response.data && response.data.success) {
            // Store transaction in database
            const paymentData = {
                order: orderId,
                user: customerInfo.userId,
                provider: 'phonepe',
                providerOrderId: merchantTransactionId,
                providerPaymentId: response.data.data.transactionId,
                providerSignature: checksum,
                amount: amount,
                currency: 'INR',
                status: 'pending',
                paymentMethod: 'phonepe',
                metadata: {
                    customerInfo,
                    phonepeResponse: response.data
                }
            };

            // Save to database (you'll need to implement this)
            console.log('Payment data to save:', paymentData);

            res.json({
                success: true,
                data: {
                    transactionId: response.data.data.transactionId,
                    paymentUrl: response.data.data.instrumentResponse.redirectInfo.url,
                    qrCode: response.data.data.instrumentResponse.redirectInfo.url,
                    upiIntent: `upi://pay?pa=phonepe&pn=${PHONEPE_CONFIG.merchantId}&am=${amount * 100}&cu=INR&tn=${orderId}`
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: response.data ? response.data.message : 'Failed to initiate PhonePe payment'
            });
        }
    } catch (error) {
        console.error('PhonePe payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// GET /api/payments/phonepe/validate/:merchantTransactionId - Validate payment status
router.get('/phonepe/validate/:merchantTransactionId', async (req, res) => {
    try {
        const { merchantTransactionId } = req.params;

        if (!merchantTransactionId) {
            return res.status(400).json({
                success: false,
                message: 'Merchant transaction ID is required'
            });
        }

        // Prepare PhonePe status check request
        const statusPayload = {
            merchantId: PHONEPE_CONFIG.merchantId,
            merchantTransactionId,
            originalTransactionId: merchantTransactionId
        };

        const checksum = generateChecksum(statusPayload);

        const statusRequest = {
            request: statusPayload,
            checksum: checksum,
            endpoint: PHONEPE_CONFIG.apiEndpoint + '/pg/v1/status',
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': PHONEPE_CONFIG.saltKey
            }
        };

        const response = await axios(statusRequest);

        if (response.data && response.data.success) {
            const paymentStatus = response.data.data.code;
            let status;

            // Map PhonePe status codes to your system
            switch (paymentStatus) {
                case 'PAYMENT_SUCCESS':
                    status = 'completed';
                    break;
                case 'PAYMENT_PENDING':
                    status = 'processing';
                    break;
                case 'PAYMENT_FAILED':
                    status = 'failed';
                    break;
                case 'AUTHORIZATION_FAILED':
                    status = 'failed';
                    break;
                case 'AUTO_REFUNDED':
                    status = 'refunded';
                    break;
                default:
                    status = 'pending';
            }

            // Update payment status in database
            console.log('Updating payment status:', {
                merchantTransactionId,
                status,
                phonepeResponse: response.data
            });

            res.json({
                success: true,
                data: {
                    status,
                    transactionId: response.data.data.transactionId,
                    amount: response.data.data.amount / 100, // Convert back to rupees
                    paymentMethod: 'phonepe',
                    phonepeResponse: response.data
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: response.data ? response.data.message : 'Failed to check payment status'
            });
        }
    } catch (error) {
        console.error('PhonePe status check error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// POST /api/payments/phonepe/webhook - PhonePe webhook handler
router.post('/phonepe/webhook', async (req, res) => {
    try {
        const signature = req.headers['x-verify'];
        const body = req.body;

        // Verify webhook signature
        if (!verifyWebhookSignature(body, signature)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid signature'
            });
        }

        const { merchantTransactionId, amount, paymentMode, responseCode, transactionId } = body;

        // Update payment status based on webhook response
        let status;
        switch (responseCode) {
            case 'PAYMENT_SUCCESS':
                status = 'completed';
                break;
            case 'PAYMENT_PENDING':
                status = 'processing';
                break;
            case 'PAYMENT_FAILED':
                status = 'failed';
                break;
            case 'AUTHORIZATION_FAILED':
                status = 'failed';
                break;
            case 'AUTO_REFUNDED':
                status = 'refunded';
                break;
            default:
                status = 'pending';
        }

        // Update payment in database
        console.log('Webhook payment update:', {
            merchantTransactionId,
            status,
            amount: amount / 100, // Convert to rupees
            transactionId,
            phonepeResponse: body
        });

        res.json({
            success: true,
            message: 'Webhook processed successfully'
        });
    } catch (error) {
        console.error('PhonePe webhook error:', error);
        res.status(500).json({
            success: false,
            message: 'Webhook processing failed',
            error: error.message
        });
    }
});

module.exports = router;
