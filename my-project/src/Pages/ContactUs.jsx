import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

const ContactUs = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitMessage('');

        try {
            // TODO: Implement actual contact form submission
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
            setSubmitMessage('Thank you for contacting us! We will get back to you within 24 hours.');
            setFormData({
                name: '',
                email: '',
                phone: '',
                subject: '',
                message: '',
            });
        } catch (error) {
            setSubmitMessage('Sorry, something went wrong. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 mt-40 py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
                    <FaArrowLeft className="mr-2" />
                    Back to Home
                </Link>

                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
                    <p className="text-lg text-gray-600">
                        We're here to help! Reach out to us through any of the following channels.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contact Information */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Get in Touch</h2>

                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <FaPhone className="h-5 w-5 text-indigo-600 mt-1" />
                                    <div>
                                        <h3 className="font-medium text-gray-900">Phone</h3>
                                        <p className="text-gray-600">+91 90231 14886</p>
                                        <p className="text-sm text-gray-500">Mon-Sat, 9 AM - 6 PM IST</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <FaEnvelope className="h-5 w-5 text-indigo-600 mt-1" />
                                    <div>
                                        <h3 className="font-medium text-gray-900">Email</h3>
                                        <p className="text-gray-600">care.trozzi@gmail.com</p>
                                        <p className="text-sm text-gray-500">We respond within 24 hours</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <FaMapMarkerAlt className="h-5 w-5 text-indigo-600 mt-1" />
                                    <div>
                                        <h3 className="font-medium text-gray-900">Address</h3>
                                        <p className="text-gray-600">
                                            First floor, plot no 61,<br />
                                            Bajarang industrial area,<br />
                                            behind Lilavati party plot,<br />
                                            Rajkot - 360002
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <FaClock className="h-5 w-5 text-indigo-600 mt-1" />
                                    <div>
                                        <h3 className="font-medium text-gray-900">Business Hours</h3>
                                        <p className="text-gray-600">
                                            Monday - Saturday: 9 AM - 6 PM<br />
                                            Sunday: Closed
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-1">How can I track my order?</h3>
                                    <p className="text-gray-600 text-sm">
                                        You can track your order through the link in your confirmation email or by logging into your account.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-medium text-gray-900 mb-1">What is your return policy?</h3>
                                    <p className="text-gray-600 text-sm">
                                        We offer a 7-day return policy for unused items in original packaging.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-medium text-gray-900 mb-1">Do you ship internationally?</h3>
                                    <p className="text-gray-600 text-sm">
                                        Currently, we ship within India only. International shipping coming soon!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow p-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Send us a Message</h2>

                            {submitMessage && (
                                <div className={`mb-6 p-4 rounded-md ${submitMessage.includes('Thank you') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                    {submitMessage}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                            Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Your full name"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="your.email@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="+91 90231 14886"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                                            Subject *
                                        </label>
                                        <select
                                            id="subject"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="">Select a subject</option>
                                            <option value="order">Order Related</option>
                                            <option value="payment">Payment Issue</option>
                                            <option value="technical">Technical Support</option>
                                            <option value="general">General Inquiry</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                        Message *
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows={6}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Tell us more about your inquiry..."
                                    ></textarea>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="agree"
                                        required
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="agree" className="ml-2 text-sm text-gray-600">
                                        I agree to be contacted regarding this inquiry *
                                    </label>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Sending...' : 'Send Message'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="mt-12 text-center">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6">Quick Links</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link to="/privacy-policy" className="text-indigo-600 hover:text-indigo-800">
                            Privacy Policy
                        </Link>
                        <Link to="/terms-of-service" className="text-indigo-600 hover:text-indigo-800">
                            Terms of Service
                        </Link>
                        <Link to="/about" className="text-indigo-600 hover:text-indigo-800">
                            About
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactUs;
