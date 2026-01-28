import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const ShippingPolicy = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow p-8">
                    <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
                        <FaArrowLeft className="mr-2" />
                        Back to Home
                    </Link>

                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Shipping Policy</h1>

                    <div className="prose max-w-none">
                        <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>

                        <p className="text-gray-600 mb-4">We provide free shipping all over India.</p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Estimated Delivery</h2>
                        <p className="text-gray-600 mb-4">
                            Ready products will be delivered in approximately 15 working days. Made-to-order/customized items will also be shipped in approximately 15 working days.
                            A tentative delivery date will be shared in the order confirmation email. The exact delivery date will be provided once your order is ready for dispatch.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Shipping Methods</h2>
                        <p className="text-gray-600 mb-4">Trozzy offers standard and expedited shipping options. You can choose your preferred method at checkout.</p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Processing Times</h2>
                        <p className="text-gray-600 mb-4">Orders typically ship within approximately 15 business days of being placed, unless otherwise noted on the product page or at checkout.</p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Shipping Rates</h2>
                        <p className="text-gray-600 mb-4">Shipping costs (if applicable) are calculated at checkout based on the destination and chosen shipping method.</p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Delivery Timeframes</h2>
                        <p className="text-gray-600 mb-4">
                            Estimated delivery times vary based on the shipping method selected and the destination. You will receive a tentative delivery date along with the order confirmation,
                            and exact delivery dates will be provided once the order is ready for dispatch.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">International Shipping</h2>
                        <p className="text-gray-600 mb-4">
                            If international shipping is available for your destination, delivery times and rates will vary by location. International orders may be subject to customs duties and taxes,
                            which are the responsibility of the customer.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Order Tracking</h2>
                        <p className="text-gray-600 mb-4">You will receive tracking information via email once your order has shipped, allowing you to monitor shipment status until delivery.</p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Shipping Restrictions</h2>
                        <p className="text-gray-600 mb-4">Some items may have shipping restrictions due to size, weight, or destination limitations. You will be notified of any such restrictions during checkout.</p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Need Help?</h2>
                        <p className="text-gray-600 mb-4">
                            If you have any questions about shipping, please visit our Contact page.
                        </p>
                        <Link to="/contact" className="text-indigo-600 hover:text-indigo-800">Contact Us</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShippingPolicy;
