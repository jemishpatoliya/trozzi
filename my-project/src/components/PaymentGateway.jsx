import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    FiCreditCard,
    FiSmartphone,
    FiDollarSign,
    FiX,
    FiCheck,
    FiAlertCircle,
    FiRefreshCw,
} from 'react-icons/fi';

const PaymentGateway = ({
    amount,
    orderId,
    customerInfo,
    onPaymentSuccess,
    onPaymentFailure,
    onCancel
}) => {
    const location = useLocation();
    const navigate = useNavigate();

    const resolved = useMemo(() => {
        const state = (location && location.state) ? location.state : {};
        const resolvedAmount = Number(amount ?? state.amount ?? state.totalAmount ?? state.total ?? 0) || 0;
        const resolvedOrderId = String(orderId ?? state.orderId ?? state.order?.id ?? state.order?._id ?? '') || '';
        const resolvedCustomerInfo = customerInfo ?? state.customerInfo ?? state.customer ?? null;
        return {
            amount: resolvedAmount,
            orderId: resolvedOrderId,
            customerInfo: resolvedCustomerInfo,
        };
    }, [amount, orderId, customerInfo, location]);

    const safeOnPaymentSuccess = typeof onPaymentSuccess === 'function' ? onPaymentSuccess : () => {};
    const safeOnPaymentFailure = typeof onPaymentFailure === 'function' ? onPaymentFailure : () => {};
    const safeOnCancel = typeof onCancel === 'function' ? onCancel : () => navigate(-1);

    const [selectedMethod, setSelectedMethod] = useState('');
    const [upiId, setUpiId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('idle');
    const [paymentError, setPaymentError] = useState('');
    const [retryCount, setRetryCount] = useState(0);

    const paymentMethods = [
        {
            id: 'phonepe',
            name: 'PhonePe',
            icon: <FiSmartphone className="w-6 h-6" />,
            badgeClass: 'bg-purple-100 text-purple-700',
            description: 'Pay using PhonePe UPI'
        },
        {
            id: 'paytm',
            name: 'Paytm',
            icon: <FiDollarSign className="w-6 h-6" />,
            badgeClass: 'bg-sky-100 text-sky-700',
            description: 'Pay using Paytm Wallet or UPI'
        },
        {
            id: 'googlepay',
            name: 'Google Pay',
            icon: <FiCreditCard className="w-6 h-6" />,
            badgeClass: 'bg-emerald-100 text-emerald-700',
            description: 'Pay using Google Pay UPI'
        },
        {
            id: 'upi',
            name: 'UPI',
            icon: <FiSmartphone className="w-6 h-6" />,
            badgeClass: 'bg-orange-100 text-orange-700',
            description: 'Pay using any UPI app'
        }
    ];

    const processPhonePePayment = async (paymentData) => {
        try {
            console.log('Processing PhonePe payment:', paymentData);
            return {
                success: true,
                data: {
                    transactionId: `PHONEPE${Date.now()}`,
                    paymentUrl: `upi://pay?pa=phonepe&pn=Merchant&am=${paymentData.amount}&cu=INR&tn=${paymentData.orderId}`,
                    qrCode: 'data:image/png;base64,mock-phonepe-qr-code'
                }
            };
        } catch (error) {
            console.error('PhonePe payment error:', error);
            setPaymentError(error.message || 'Payment initiation failed');
            return {
                success: false,
                message: error.message || 'Payment initiation failed'
            };
        }
    };

    const processPaytmPayment = async (paymentData) => {
        try {
            console.log('Processing Paytm payment:', paymentData);
            return {
                success: true,
                data: {
                    transactionId: `PAYTM${Date.now()}`,
                    paymentUrl: `upi://pay?pa=paytm&pn=Merchant&am=${paymentData.amount}&cu=INR&tn=${paymentData.orderId}`,
                    qrCode: 'data:image/png;base64,mock-paytm-qr-code'
                }
            };
        } catch (error) {
            console.error('Paytm payment error:', error);
            setPaymentError(error.message || 'Payment initiation failed');
            return {
                success: false,
                message: error.message || 'Payment initiation failed'
            };
        }
    };

    const processGooglePayPayment = async (paymentData) => {
        try {
            console.log('Processing GooglePay payment:', paymentData);
            return {
                success: true,
                data: {
                    transactionId: `GOOGLEPAY${Date.now()}`,
                    paymentUrl: `upi://pay?pa=googlepay&pn=Merchant&am=${paymentData.amount}&cu=INR&tn=${paymentData.orderId}`,
                    qrCode: 'data:image/png;base64,mock-googlepay-qr-code'
                }
            };
        } catch (error) {
            console.error('GooglePay payment error:', error);
            setPaymentError(error.message || 'Payment initiation failed');
            return {
                success: false,
                message: error.message || 'Payment initiation failed'
            };
        }
    };

    const processUPIPayment = async (paymentData) => {
        try {
            console.log('Processing UPI payment:', paymentData);
            return {
                success: true,
                data: {
                    transactionId: `UPI${Date.now()}`,
                    paymentUrl: `upi://pay?pa=${paymentData.upiId}&pn=Merchant&am=${paymentData.amount}&cu=INR&tn=${paymentData.orderId}`,
                    qrCode: 'data:image/png;base64,mock-upi-qr-code'
                }
            };
        } catch (error) {
            console.error('UPI payment error:', error);
            setPaymentError(error.message || 'Payment initiation failed');
            return {
                success: false,
                message: error.message || 'Payment initiation failed'
            };
        }
    };

    const handlePayment = async () => {
        if (!selectedMethod || (selectedMethod === 'upi' && !upiId.trim())) {
            return;
        }

        if (!resolved.amount) {
            setPaymentStatus('failed');
            setPaymentError('Missing amount. Please go back and try again.');
            return;
        }

        setIsProcessing(true);
        setPaymentStatus('processing');
        setPaymentError('');

        try {
            let response;
            switch (selectedMethod) {
                case 'phonepe':
                    response = await processPhonePePayment({
                        amount: resolved.amount,
                        orderId: resolved.orderId,
                        customerInfo: resolved.customerInfo,
                        upiId
                    });
                    break;
                case 'paytm':
                    response = await processPaytmPayment({
                        amount: resolved.amount,
                        orderId: resolved.orderId,
                        customerInfo: resolved.customerInfo
                    });
                    break;
                case 'googlepay':
                    response = await processGooglePayPayment({
                        amount: resolved.amount,
                        orderId: resolved.orderId,
                        customerInfo: resolved.customerInfo
                    });
                    break;
                case 'upi':
                    response = await processUPIPayment({
                        amount: resolved.amount,
                        orderId: resolved.orderId,
                        customerInfo: resolved.customerInfo,
                        upiId
                    });
                    break;
                default:
                    throw new Error('Unsupported payment method');
            }

            if (response.success) {
                setPaymentUrl(response.data.paymentUrl);
                setQrCode(response.data.qrCode);
                setShowPaymentModal(true);
                setPaymentStatus('awaiting');

                // Start polling for payment status
                pollPaymentStatus(response.data.transactionId);
            } else {
                throw new Error(response.message || 'Payment initiation failed');
            }
        } catch (error) {
            console.error('Payment error:', error);
            setPaymentStatus('failed');
            setPaymentError(error.message || 'Payment failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const pollPaymentStatus = async (transactionId) => {
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/payments/status/${transactionId}`).then(res => res.json());

                if (response.success) {
                    const { status } = response.data;
                    let newStatus;

                    // Map PhonePe status codes to your system
                    switch (status) {
                        case 'PAYMENT_SUCCESS':
                            newStatus = 'completed';
                            break;
                        case 'PAYMENT_PENDING':
                            newStatus = 'processing';
                            break;
                        case 'PAYMENT_FAILED':
                            newStatus = 'failed';
                            break;
                        case 'AUTHORIZATION_FAILED':
                            newStatus = 'failed';
                            break;
                        case 'AUTO_REFUNDED':
                            newStatus = 'refunded';
                            break;
                        default:
                            newStatus = 'pending';
                    }

                    // Update payment status in database
                    console.log('Updating payment status:', {
                        merchantTransactionId: transactionId,
                        status: newStatus,
                        amount: amount / 100, // Convert to rupees
                        transactionId,
                        phonepeResponse: response.data
                    });

                    setPaymentStatus(newStatus);
                    setRetryCount(0);

                    if (newStatus === 'completed') {
                        clearInterval(pollInterval);
                        setPaymentStatus('success');
                        setTimeout(() => {
                            setShowPaymentModal(false);
                            safeOnPaymentSuccess(response.data);
                        }, 2000);
                    } else if (newStatus === 'failed') {
                        clearInterval(pollInterval);
                        setPaymentStatus('failed');
                        setTimeout(() => {
                            setShowPaymentModal(false);
                            safeOnPaymentFailure('Payment failed');
                        }, 2000);
                    }
                }
            } catch (error) {
                console.error('Error polling payment status:', error);
                setRetryCount(prev => prev + 1);
                if (retryCount >= 3) {
                    clearInterval(pollInterval);
                    setPaymentStatus('timeout');
                    setShowPaymentModal(false);
                    safeOnPaymentFailure('Payment timeout. Please try again.');
                }
            }
        }, 3000);

        // Stop polling after 5 minutes
        setTimeout(() => {
            clearInterval(pollInterval);
            if (paymentStatus === 'awaiting') {
                setPaymentStatus('timeout');
                setShowPaymentModal(false);
                safeOnPaymentFailure('Payment timeout. Please check your payment app.');
            }
        }, 300000);
    };

    const getStatusIcon = () => {
        switch (paymentStatus) {
            case 'processing': return <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>;
            case 'awaiting': return <div className="animate-pulse"><FiCheck className="w-8 h-8 text-orange-500" /></div>;
            case 'success': return <FiCheck className="w-8 h-8 text-green-500" />;
            case 'failed': return <FiAlertCircle className="w-8 h-8 text-red-500" />;
            case 'timeout': return <FiAlertCircle className="w-8 h-8 text-orange-500" />;
            default: return null;
        }
    };

    const getStatusMessage = () => {
        switch (paymentStatus) {
            case 'processing': return 'Processing payment...';
            case 'awaiting': return 'Payment initiated. Please complete in your payment app.';
            case 'success': return 'Payment successful! Redirecting...';
            case 'failed': return 'Payment failed. Please try again.';
            case 'timeout': return 'Payment timeout. Please check your payment app.';
            default: return '';
        }
    };

    const handleRetry = () => {
        setShowPaymentModal(false);
        setPaymentStatus('idle');
        setPaymentError('');
        setRetryCount(0);
    };

    return (
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold text-gray-900">Payment</div>
                        <div className="text-xs text-gray-500 mt-0.5">Order {resolved.orderId ? `#${resolved.orderId}` : ''}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-500">Amount</div>
                        <div className="text-lg font-extrabold text-gray-900">₹{Number(resolved.amount || 0).toLocaleString()}</div>
                    </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={safeOnCancel}
                        className="text-sm font-semibold text-gray-700 hover:text-gray-900"
                    >
                        Cancel
                    </button>
                    <div className="text-xs text-gray-500">Secure payment</div>
                </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-base font-extrabold text-gray-900">Select payment method</h3>
                <p className="text-xs text-gray-500 mt-1">Choose an option to complete your payment.</p>
                <div className="grid gap-4 md:grid-cols-2">
                    {paymentMethods.map((method) => (
                        <button
                            key={method.id}
                            onClick={() => setSelectedMethod(method.id)}
                            className={`p-4 border rounded-lg transition-all ${selectedMethod === method.id
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl ${method.badgeClass} flex items-center justify-center`}>
                                    {method.icon}
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-gray-900">{method.name}</p>
                                    <p className="text-xs text-gray-500">{method.description}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* UPI ID Input for UPI method */}
                {selectedMethod === 'upi' && (
                    <div className="mt-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            UPI ID
                        </label>
                        <input
                            type="text"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="Enter your UPI ID (e.g., username@ybl)"
                            className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                        />
                    </div>
                )}

                {/* Error Display */}
                {paymentError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-center gap-2">
                            <FiAlertCircle className="w-5 h-5 text-red-600" />
                            <p className="text-sm text-red-700">{paymentError}</p>
                        </div>
                    </div>
                )}

                {/* Pay Button */}
                <button
                    onClick={handlePayment}
                    disabled={!selectedMethod || (selectedMethod === 'upi' && !upiId.trim()) || isProcessing}
                    className="w-full mt-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:cursor-not-allowed"
                >
                    {isProcessing ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Processing...
                        </div>
                    ) : (
                        `Pay ₹${Number(resolved.amount || 0).toLocaleString()}`
                    )}
                </button>
            </div>

            {/* Payment Status Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[3000]">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-extrabold text-gray-900">Complete payment</h3>
                            <button
                                onClick={() => {
                                    setShowPaymentModal(false);
                                    setPaymentStatus('idle');
                                    setPaymentError('');
                                }}
                                className="text-gray-500 hover:text-gray-900"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="text-center space-y-4">
                            {getStatusIcon()}
                            <p className="text-sm text-gray-600">
                                {getStatusMessage()}
                            </p>

                            {qrCode && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Scan QR Code</p>
                                    <img
                                        src={qrCode}
                                        alt="Payment QR Code"
                                        className="w-48 h-48 mx-auto border border-gray-200 rounded-2xl"
                                    />
                                </div>
                            )}

                            {paymentUrl && paymentStatus === 'awaiting' && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Or click to pay</p>
                                    <a
                                        href={paymentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
                                    >
                                        Open Payment App
                                    </a>
                                </div>
                            )}

                            {paymentStatus === 'success' && (
                                <div className="text-green-600 dark:text-green-400">
                                    <FiCheck className="w-16 h-16 mx-auto mb-2" />
                                    <p className="font-medium">Payment Successful!</p>
                                </div>
                            )}

                            {(paymentStatus === 'failed' || paymentStatus === 'timeout') && (
                                <div className="text-red-600 dark:text-red-400">
                                    <FiAlertCircle className="w-16 h-16 mx-auto mb-2" />
                                    <p className="font-medium">
                                        {paymentStatus === 'timeout' ? 'Payment Timeout' : 'Payment Failed'}
                                    </p>
                                    {paymentError && (
                                        <p className="text-sm text-red-600 dark:text-red-400 mt-2">{paymentError}</p>
                                    )}
                                    <div className="mt-4 space-y-2">
                                        <button
                                            onClick={handleRetry}
                                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
                                        >
                                            <FiRefreshCw className="w-4 h-4 mr-2 inline" />
                                            Try Again
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowPaymentModal(false);
                                                setPaymentStatus('idle');
                                                setPaymentError('');
                                                safeOnCancel();
                                            }}
                                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-2.5 px-4 rounded-xl transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentGateway;
