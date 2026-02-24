import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow p-8">
                    <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
                        <FaArrowLeft className="mr-2" />
                        Back to Home
                    </Link>

                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>

                    <div className="prose max-w-none">
                        <p className="text-gray-600 mb-4">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>
                        <p className="text-gray-600 mb-4">
                            This website is operated by GURUDEV INDUSTRIES
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1. Acceptance of Terms</h2>
                        <p className="text-gray-600 mb-4">
                            By accessing and using Trozzi, you accept and agree to be bound by the terms and provision of this agreement.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2. Use License</h2>
                        <p className="text-gray-600 mb-4">
                            Permission is granted to temporarily download one copy of the materials on Trozzi for personal, non-commercial transitory view only.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3. Products and Services</h2>
                        <p className="text-gray-600 mb-4">
                            We strive to provide accurate product descriptions and pricing. However, we do not warrant that:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>Product descriptions or colors are accurate, complete, reliable, current, or error-free</li>
                            <li>The website will operate without interruption or be error-free</li>
                            <li>The results of using the website will meet your requirements</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4. Pricing and Payment</h2>
                        <p className="text-gray-600 mb-4">
                            All prices are displayed in Indian Rupees (INR) and are inclusive of applicable taxes unless otherwise stated.
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>Prices are subject to change without notice</li>
                            <li>Payment is processed securely through Razorpay</li>
                            <li>All payments are final and non-refundable except as specified in our Refund Policy</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5. Shipping and Delivery</h2>
                        <p className="text-gray-600 mb-4">
                            We aim to deliver your orders in a timely manner:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>Standard delivery: 5-7 business days</li>
                            <li>Express delivery: 2-3 business days (additional charges apply)</li>
                            <li>We are not responsible for delays caused by shipping carriers</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6. Returns and Refunds</h2>
                        <p className="text-gray-600 mb-4">
                            Our return policy allows for returns within 7 days of delivery:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>Products must be unused and in original packaging</li>
                            <li>Shipping charges for returns are borne by the customer</li>
                            <li>Refunds are processed within 7-10 business days</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">7. User Account</h2>
                        <p className="text-gray-600 mb-4">
                            If you create an account on our website, you are responsible for:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>Maintaining the confidentiality of your account password</li>
                            <li>All activities that occur under your account</li>
                            <li>Notifying us of unauthorized use of your account</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8. Intellectual Property</h2>
                        <p className="text-gray-600 mb-4">
                            All content included on this site, such as text, graphics, logos, images, and software, is the property of Trozzi or its content suppliers.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">9. Limitation of Liability</h2>
                        <p className="text-gray-600 mb-4">
                            In no event shall Trozzi, nor any of its officers, directors and employees, be liable for anything arising out of or in any way connected with:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>Your use of the website</li>
                            <li>Products purchased through the website</li>
                            <li>Any errors or omissions in content</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">10. Indemnification</h2>
                        <p className="text-gray-600 mb-4">
                            You agree to indemnify and hold Trozzi and its affiliates harmless from any claim or demand, including reasonable attorneys' fees.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">11. Termination</h2>
                        <p className="text-gray-600 mb-4">
                            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">12. Governing Law</h2>
                        <p className="text-gray-600 mb-4">
                            These terms and conditions are governed by and construed in accordance with the laws of India.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">13. Changes to Terms</h2>
                        <p className="text-gray-600 mb-4">
                            We reserve the right to modify these terms at any time. If we make material changes, we will notify you by email or prominent notice on our site.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">14. Contact Information</h2>
                        <p className="text-gray-600 mb-4">
                            Questions about the Terms of Service should be sent to us at:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>Email: care.trozzi@gmail.com</li>
                            <li>Phone: +91 90231 14886</li>
                            <li>
                                Address: First floor, plot no 61, Bajarang industrial area, behind Lilavati party plot, Rajkot - 360002
                            </li>
                        </ul>

                        <div className="mt-8 p-4 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-600">
                                By using this website, you signify your acceptance of these Terms of Service. If you do not agree to these terms, please do not use our website.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
