import React, { useState } from 'react';
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
            color: 'bg-purple-500',
            description: 'Pay using PhonePe UPI'
        },
        {
            id: 'paytm',
            name: 'Paytm',
            icon: <FiDollarSign className="w-6 h-6" />,
            color: 'bg-blue-500',
            description: 'Pay using Paytm Wallet or UPI'
        },
        {
            id: 'googlepay',
            name: 'Google Pay',
            icon: <FiCreditCard className="w-6 h-6" />,
            color: 'bg-green-500',
            description: 'Pay using Google Pay UPI'
        },
        {
            id: 'upi',
            name: 'UPI',
            icon: <FiSmartphone className="w-6 h-6" />,
            color: 'bg-orange-500',
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

        setIsProcessing(true);
        setPaymentStatus('processing');
        setPaymentError('');

        try {
            let response;
            switch (selectedMethod) {
                case 'phonepe':
                    response = await processPhonePePayment({
                        amount,
                        orderId,
                        customerInfo,
                        upiId
                    });
                    break;
                case 'paytm':
                    response = await processPaytmPayment({
                        amount,
                        orderId,
                        customerInfo
                    });
                    break;
                case 'googlepay':
                    response = await processGooglePayPayment({
                        amount,
                        orderId,
                        customerInfo
                    });
                    break;
                case 'upi':
                    response = await processUPIPayment({
                        amount,
                        orderId,
                        customerInfo,
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
                            onPaymentSuccess(response.data);
                        }, 2000);
                    } else if (newStatus === 'failed') {
                        clearInterval(pollInterval);
                        setPaymentStatus('failed');
                        setTimeout(() => {
                            setShowPaymentModal(false);
                            onPaymentFailure('Payment failed');
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
                    onPaymentFailure('Payment timeout. Please try again.');
                }
            }
        }, 3000);

        // Stop polling after 5 minutes
        setTimeout(() => {
            clearInterval(pollInterval);
            if (paymentStatus === 'awaiting') {
                setPaymentStatus('timeout');
                setShowPaymentModal(false);
                onPaymentFailure('Payment timeout. Please check your payment app.');
            }
        }, 300000);
    };

    const getStatusIcon = () => {
        switch (paymentStatus) {
            case 'processing': return <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>;
            case 'awaiting': return <div className="animate-pulse"><FiCheck className="w-8 h-8 text-blue-500" /></div>;
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
        <div className="space-y-6">
            {/* Payment Method Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
                <div className="grid gap-4 md:grid-cols-2">
                    {paymentMethods.map((method) => (
                        <button
                            key={method.id}
                            onClick={() => setSelectedMethod(method.id)}
                            className={`p-4 border rounded-lg transition-all ${selectedMethod === method.id
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-lg ${method.color} flex items-center justify-center text-white`}>
                                    {method.icon}
                                </div>
                                <div className="text-left">
                                    <p className="font-medium">{method.name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{method.description}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* UPI ID Input for UPI method */}
                {selectedMethod === 'upi' && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            UPI ID
                        </label>
                        <input
                            type="text"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="Enter your UPI ID (e.g., username@ybl)"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                )}

                {/* Error Display */}
                {paymentError && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center gap-2">
                            <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            <p className="text-sm text-red-600 dark:text-red-400">{paymentError}</p>
                        </div>
                    </div>
                )}

                {/* Pay Button */}
                <button
                    onClick={handlePayment}
                    disabled={!selectedMethod || (selectedMethod === 'upi' && !upiId.trim()) || isProcessing}
                    className="w-full mt-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                    {isProcessing ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Processing...
                        </div>
                    ) : (
                        `Pay ₹${amount}`
                    )}
                </button>
            </div>

            {/* Payment Status Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Complete Payment</h3>
                            <button
                                onClick={() => {
                                    setShowPaymentModal(false);
                                    setPaymentStatus('idle');
                                    setPaymentError('');
                                }}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="text-center space-y-4">
                            {getStatusIcon()}
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {getStatusMessage()}
                            </p>

                            {qrCode && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Scan QR Code</p>
                                    <img
                                        src={qrCode}
                                        alt="Payment QR Code"
                                        className="w-48 h-48 mx-auto border border-gray-200 dark:border-gray-700 rounded-lg"
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
                                        className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
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
                                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                                        >
                                            <FiRefreshCw className="w-4 h-4 mr-2 inline" />
                                            Try Again
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowPaymentModal(false);
                                                setPaymentStatus('idle');
                                                setPaymentError('');
                                                onCancel();
                                            }}
                                            className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-lg transition-colors"
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
