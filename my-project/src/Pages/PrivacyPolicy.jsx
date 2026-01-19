import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow p-8">
                    <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
                        <FaArrowLeft className="mr-2" />
                        Back to Home
                    </Link>

                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>

                    <div className="prose max-w-none">
                        <p className="text-gray-600 mb-4">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1. Information We Collect</h2>
                        <p className="text-gray-600 mb-4">
                            We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us.
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>Name, email address, and phone number</li>
                            <li>Shipping and billing addresses</li>
                            <li>Payment information (processed securely by Razorpay)</li>
                            <li>Order history and preferences</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2. How We Use Your Information</h2>
                        <p className="text-gray-600 mb-4">
                            We use the information we collect to provide, maintain, and improve our services:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>Process and fulfill your orders</li>
                            <li>Provide customer support</li>
                            <li>Send you transactional emails</li>
                            <li>Personalize your shopping experience</li>
                            <li>Detect and prevent fraud</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3. Data Security</h2>
                        <p className="text-gray-600 mb-4">
                            We implement appropriate security measures to protect your personal information:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>Secure HTTPS encryption</li>
                            <li>Payment processing through Razorpay (PCI DSS compliant)</li>
                            <li>Regular security audits</li>
                            <li>Limited employee access to data</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4. Cookies and Tracking</h2>
                        <p className="text-gray-600 mb-4">
                            We use cookies to enhance your experience:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>Essential cookies for site functionality</li>
                            <li>Shopping cart persistence</li>
                            <li>User preferences and login status</li>
                            <li>Analytics cookies (optional)</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5. Third-Party Services</h2>
                        <p className="text-gray-600 mb-4">
                            We share information with trusted third parties:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>Razorpay for payment processing</li>
                            <li>Shipping partners for order delivery</li>
                            <li>Email service providers for communications</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6. Your Rights</h2>
                        <p className="text-gray-600 mb-4">
                            You have the right to:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>Access your personal information</li>
                            <li>Correct inaccurate information</li>
                            <li>Delete your account and data</li>
                            <li>Opt-out of marketing communications</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">7. Contact Us</h2>
                        <p className="text-gray-600 mb-4">
                            If you have questions about this Privacy Policy, please contact us:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>Email: privacy@trozzy.com</li>
                            <li>Phone: +91-XXXXXXXXXX</li>
                            <li>Address: Your Business Address</li>
                        </ul>

                        <div className="mt-8 p-4 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-600">
                                This Privacy Policy may be updated from time to time. We will notify you of any changes by posting the new policy on this page.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
