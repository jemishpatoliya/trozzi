import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const RefundPolicy = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow p-8">
                    <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
                        <FaArrowLeft className="mr-2" />
                        Back to Home
                    </Link>

                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Refund & Cancellation Policy</h1>

                    <div className="prose max-w-none">
                        <p className="text-gray-600 mb-4">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1. Cancellation Policy</h2>
                        <p className="text-gray-600 mb-4">
                            You can cancel your order before it has been shipped:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>Within 24 hours of order placement: Full refund</li>
                            <li>24-48 hours after order placement: 90% refund</li>
                            <li>After 48 hours: No cancellation (order will be processed)</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2. Return Policy</h2>
                        <p className="text-gray-600 mb-4">
                            We offer a 7-day return policy from the date of delivery:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>Products must be unused and in original condition</li>
                            <li>All original tags, labels, and packaging must be intact</li>
                            <li>Return request must be raised within 7 days of delivery</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3. Non-Returnable Items</h2>
                        <p className="text-gray-600 mb-4">
                            The following items cannot be returned or exchanged:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>Items damaged due to misuse</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4. Refund Process</h2>
                        <p className="text-gray-600 mb-4">
                            Once we receive your returned item:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>We will inspect the item within 2-3 business days</li>
                            <li>Approved refunds will be processed within 7-10 business days</li>
                            <li>Refunds will be credited to your original payment method</li>
                            <li>You will receive a confirmation email once processed</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5. Shipping Costs</h2>
                        <p className="text-gray-600 mb-4">
                            Regarding shipping costs for returns:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>Return shipping costs are borne by the customer</li>
                            <li>Original shipping charges are non-refundable</li>
                            <li>If we ship a replacement, we cover the shipping costs</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6. Exchange Policy</h2>
                        <p className="text-gray-600 mb-4">
                            Exchanges are available for:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>Wrong item delivered</li>
                            <li>Defective or damaged products</li>
                            <li>Size issues (within 7 days of delivery)</li>
                        </ul>
                        <p className="text-gray-600 mb-4">
                            If approved, a replacement will be delivered within 7-10 business days.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">7. Damaged or Defective Items</h2>
                        <p className="text-gray-600 mb-4">
                            If you receive a damaged or defective item:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>Notify us within 48 hours of delivery</li>
                            <li>Provide photos of the damage/defect</li>
                            <li>We will arrange for a replacement or full refund</li>
                            <li>No return shipping costs for defective items</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8. Late or Lost Shipments</h2>
                        <p className="text-gray-600 mb-4">
                            For delayed or lost shipments:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>Contact us if your order hasn't arrived within 10 business days</li>
                            <li>We will track the shipment with the shipping carrier</li>
                            <li>If confirmed lost, we will reship or refund your order</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">9. How to Initiate a Return</h2>
                        <p className="text-gray-600 mb-4">
                            To return an item, follow these steps:
                        </p>
                        <ol className="list-decimal list-inside text-gray-600 mb-4">
                            <li>Contact our customer support at care.trozzi@gmail.com</li>
                            <li>Provide your order number and reason for return</li>
                            <li>We will send you a return authorization and shipping instructions</li>
                            <li>Pack the item securely in original packaging</li>
                            <li>Ship the item to the address provided</li>
                            <li>Share the tracking number with us</li>
                        </ol>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">10. Refund Methods</h2>
                        <p className="text-gray-600 mb-4">
                            Refunds are processed using the same method as original payment:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>Credit/Debit Cards: 7-10 business days to appear in your account</li>
                            <li>Net Banking: 5-7 business days</li>
                            <li>Wallets: 2-3 business days</li>
                            <li>Cash on Delivery: Bank transfer (customer must provide bank details)</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">11. Exceptions</h2>
                        <p className="text-gray-600 mb-4">
                            We reserve the right to refuse returns or exchanges in certain circumstances:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>Items returned after the 7-day window</li>
                            <li>Items not in their original condition</li>
                            <li>Suspicious or fraudulent return claims</li>
                            <li>Items damaged due to customer misuse</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">12. Contact Information</h2>
                        <p className="text-gray-600 mb-4">
                            For any questions about our refund policy, please contact:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>Email: care.trozzi@gmail.com</li>
                            <li>Phone: +91 90231 14886 (Mon-Sat, 9 AM - 6 PM IST)</li>
                            <li>WhatsApp: +91 90231 14886</li>
                        </ul>

                        <div className="mt-8 p-4 bg-blue-50 rounded-md">
                            <h3 className="font-semibold text-blue-900 mb-2">Important Notes:</h3>
                            <ul className="list-disc list-inside text-blue-800 text-sm">
                                <li>Always keep your order receipt and original packaging</li>
                                <li>Document any damage with photos immediately upon receipt</li>
                                <li>Read product descriptions carefully before purchasing</li>
                                <li>Contact us promptly if you have any issues with your order</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefundPolicy;
