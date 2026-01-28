import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaTruck, FaShieldAlt, FaHeadset, FaAward } from 'react-icons/fa';

const FALLBACK_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

const AboutUs = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
                    <FaArrowLeft className="mr-2" />
                    Back to Home
                </Link>

                {/* Hero Section */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">About Trozzy</h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Your trusted online shopping destination for quality products, great prices, and exceptional service.
                    </p>
                </div>

                {/* Our Story */}
                <div className="bg-white rounded-lg shadow p-8 mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div>
                            <p className="text-gray-600 mb-4">
                                Founded in 2024, Trozzy started with a simple mission: to make online shopping accessible, affordable, and enjoyable for everyone across India.
                            </p>
                            <p className="text-gray-600 mb-4">
                                What began as a small operation has grown into a comprehensive e-commerce platform serving thousands of customers nationwide. We believe in the power of technology to transform the shopping experience.
                            </p>
                            <p className="text-gray-600">
                                Today, Trozzy offers a curated selection of products across fashion, electronics, home goods, and more - all carefully selected to meet our high standards for quality and value.
                            </p>
                        </div>
                        <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
                            <img
                                src={FALLBACK_IMAGE}
                                alt="Our Story"
                                className="rounded-lg"
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = FALLBACK_IMAGE;
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Our Values */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Our Values</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-lg shadow p-6 text-center">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaTruck className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Fast Delivery</h3>
                            <p className="text-gray-600 text-sm">
                                Quick and reliable delivery across India with real-time tracking
                            </p>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6 text-center">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaShieldAlt className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Secure Shopping</h3>
                            <p className="text-gray-600 text-sm">
                                100% secure payments with Razorpay and data protection
                            </p>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6 text-center">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaHeadset className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">24/7 Support</h3>
                            <p className="text-gray-600 text-sm">
                                Dedicated customer support to help you with any queries
                            </p>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6 text-center">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaAward className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Quality Assured</h3>
                            <p className="text-gray-600 text-sm">
                                Handpicked products with strict quality control measures
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mission */}
                <div className="bg-white rounded-lg shadow p-8 mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Our Vision</h3>
                            <p className="text-gray-600 mb-4">
                                To become India's most trusted online shopping destination by providing exceptional customer experiences and quality products at affordable prices.
                            </p>

                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Our Mission</h3>
                            <p className="text-gray-600">
                                To make quality products accessible to every Indian home through technology, innovation, and customer-centric approach.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">What We Stand For</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start">
                                    <span className="text-indigo-600 mr-2">✓</span>
                                    <span className="text-gray-600">Customer satisfaction above all else</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-indigo-600 mr-2">✓</span>
                                    <span className="text-gray-600">Transparency in all our dealings</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-indigo-600 mr-2">✓</span>
                                    <span className="text-gray-600">Continuous innovation and improvement</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-indigo-600 mr-2">✓</span>
                                    <span className="text-gray-600">Building long-term customer relationships</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-indigo-600 mr-2">✓</span>
                                    <span className="text-gray-600">Empowering local businesses and communities</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Call to Action */}
                <div className="text-center bg-gray-100 rounded-lg p-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Join Our Journey</h2>
                    <p className="text-lg text-gray-600 mb-6">
                        Be part of our growing community of satisfied customers
                    </p>
                    <div className="space-x-4">
                        <Link
                            to="/ProductListing"
                            className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
                        >
                            Start Shopping
                        </Link>
                        <Link
                            to="/contact"
                            className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-md hover:bg-indigo-50"
                        >
                            Contact Us
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutUs;
