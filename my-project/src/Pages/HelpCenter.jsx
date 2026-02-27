import React, { useState, useEffect } from 'react';
import { IoMdArrowDropdown, IoMdArrowDropup } from 'react-icons/io';
import { FiSend, FiHelpCircle, FiPackage, FiCreditCard, FiTruck, FiUser, FiClock, FiCheckCircle, FiMessageCircle } from 'react-icons/fi';

const HelpCenter = () => {
    const [activeCategory, setActiveCategory] = useState('orders');
    const [expandedFAQ, setExpandedFAQ] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [showContactForm, setShowContactForm] = useState(false);
    const [formData, setFormData] = useState({
        issueType: '',
        orderId: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);

    const categories = [
        {
            id: 'orders',
            name: 'Orders',
            icon: <FiPackage className="text-xl" />,
            faqs: [
                {
                    question: 'How do I track my order?',
                    answer: 'You can track your order by visiting the Order Tracking page in your profile. Enter your order ID to see real-time status updates.'
                },
                {
                    question: 'Can I cancel my order?',
                    answer: 'Orders can be cancelled within 2 hours of placement. After that, please contact our support team for assistance.'
                },
                {
                    question: 'How do I return an item?',
                    answer: 'You can initiate a return from your order details page within 30 days of delivery. Follow the return instructions provided.'
                }
            ]
        },
        {
            id: 'payments',
            name: 'Payments & Refunds',
            icon: <FiCreditCard className="text-xl" />,
            faqs: [
                {
                    question: 'What payment methods do you accept?',
                    answer: 'We accept all major credit cards, debit cards, PayPal, and various digital payment methods.'
                },
                {
                    question: 'How long do refunds take?',
                    answer: 'Refunds are typically processed within 5-7 business days after we receive the returned item.'
                },
                {
                    question: 'Is my payment information secure?',
                    answer: 'Yes, we use industry-standard encryption and security measures to protect your payment information.'
                }
            ]
        },
        {
            id: 'shipping',
            name: 'Shipping & Delivery',
            icon: <FiTruck className="text-xl" />,
            faqs: [
                {
                    question: 'What are the shipping charges?',
                    answer: 'Standard shipping is free for orders above $100. For orders below $100, shipping charges apply based on your location.'
                },
                {
                    question: 'How long does delivery take?',
                    answer: 'Standard delivery takes 5-7 business days. Express delivery options are available at checkout.'
                },
                {
                    question: 'Do you ship internationally?',
                    answer: 'Yes, we ship to most countries worldwide. International shipping times and charges vary by location.'
                }
            ]
        },
        {
            id: 'account',
            name: 'Account & Login',
            icon: <FiUser className="text-xl" />,
            faqs: [
                {
                    question: 'How do I reset my password?',
                    answer: 'Click on "Forgot Password" on the login page. Enter your email address and follow the instructions sent to your email.'
                },
                {
                    question: 'How do I update my profile information?',
                    answer: 'Go to your profile settings and click on "Edit Profile". Update your information and save changes.'
                },
                {
                    question: 'Can I have multiple delivery addresses?',
                    answer: 'Yes, you can save multiple delivery addresses in your profile for convenience during checkout.'
                }
            ]
        }
    ];

    const issueTypes = [
        'Order Issue',
        'Payment Problem',
        'Shipping Delay',
        'Product Quality',
        'Return Request',
        'Account Access',
        'Other'
    ];

    const ticketStatuses = {
        open: { label: 'Open', color: 'text-warning-600 bg-warning-50', icon: <FiClock /> },
        in_progress: { label: 'In Progress', color: 'text-info-600 bg-info-50', icon: <FiMessageCircle /> },
        resolved: { label: 'Resolved', color: 'text-success-600 bg-success-50', icon: <FiCheckCircle /> }
    };

    useEffect(() => {
        // Load user tickets (mock data for now)
        const mockTickets = [
            {
                id: 'TKT001',
                category: 'Order Issue',
                orderId: 'ORD12345',
                message: 'My order hasn\'t been delivered yet',
                status: 'open',
                createdAt: '2024-01-15T10:30:00Z',
                adminReply: null
            },
            {
                id: 'TKT002',
                category: 'Payment Problem',
                orderId: 'ORD12346',
                message: 'I was charged twice for my order',
                status: 'resolved',
                createdAt: '2024-01-14T14:20:00Z',
                adminReply: 'We have processed your refund. You should see it in your account within 3-5 business days.'
            }
        ];
        setTickets(mockTickets);
    }, []);

    const handleSubmitTicket = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Mock API call
            const newTicket = {
                id: `TKT${Date.now()}`,
                ...formData,
                status: 'open',
                createdAt: new Date().toISOString(),
                adminReply: null
            };

            setTickets([newTicket, ...tickets]);
            setFormData({ issueType: '', orderId: '', message: '' });
            setShowContactForm(false);

            // Show success message
            alert('Support ticket created successfully!');
        } catch (error) {
            console.error('Error creating ticket:', error);
            alert('Failed to create ticket. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleFAQ = (index) => {
        setExpandedFAQ(expandedFAQ === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-900 mt-40 py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full mb-4">
                        <FiHelpCircle className="text-3xl text-primary-600 dark:text-primary-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-text-900 dark:text-text-100 mb-3">
                        Help Center
                    </h1>
                    <p className="text-lg text-text-600 dark:text-text-400 max-w-2xl mx-auto">
                        Find answers to common questions or contact our support team for assistance
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* FAQ Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-border-200 dark:border-border-700 p-6">
                            {/* Category Tabs */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => setActiveCategory(category.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeCategory === category.id
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-surface-100 dark:bg-surface-700 text-text-700 dark:text-text-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                                            }`}
                                    >
                                        {category.icon}
                                        {category.name}
                                    </button>
                                ))}
                            </div>

                            {/* FAQ Items */}
                            <div className="space-y-4">
                                {categories
                                    .find(cat => cat.id === activeCategory)
                                    ?.faqs.map((faq, index) => (
                                        <div
                                            key={index}
                                            className="border border-border-200 dark:border-border-700 rounded-lg overflow-hidden"
                                        >
                                            <button
                                                onClick={() => toggleFAQ(index)}
                                                className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                                            >
                                                <span className="font-medium text-text-900 dark:text-text-100">
                                                    {faq.question}
                                                </span>
                                                {expandedFAQ === index ? (
                                                    <IoMdArrowDropup className="text-xl text-text-500" />
                                                ) : (
                                                    <IoMdArrowDropdown className="text-xl text-text-500" />
                                                )}
                                            </button>
                                            {expandedFAQ === index && (
                                                <div className="px-4 pb-4 text-text-600 dark:text-text-400">
                                                    {faq.answer}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        {/* Contact Support Button */}
                        <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-border-200 dark:border-border-700 p-6">
                            <h3 className="text-lg font-semibold text-text-900 dark:text-text-100 mb-4">
                                Still need help?
                            </h3>
                            <p className="text-text-600 dark:text-text-400 mb-4">
                                Can't find what you're looking for? Our support team is here to help.
                            </p>
                            <button
                                onClick={() => setShowContactForm(true)}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <FiSend />
                                Contact Support
                            </button>
                        </div>

                        {/* My Tickets */}
                        <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-border-200 dark:border-border-700 p-6">
                            <h3 className="text-lg font-semibold text-text-900 dark:text-text-100 mb-4">
                                My Tickets
                            </h3>
                            {tickets.length === 0 ? (
                                <p className="text-text-500 dark:text-text-400 text-center py-4">
                                    No support tickets yet
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {tickets.map((ticket) => (
                                        <div
                                            key={ticket.id}
                                            className="border border-border-200 dark:border-border-700 rounded-lg p-3 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-semibold text-text-500">
                                                            {ticket.id}
                                                        </span>
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${ticketStatuses[ticket.status].color}`}>
                                                            {ticketStatuses[ticket.status].icon}
                                                            {ticketStatuses[ticket.status].label}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-medium text-text-900 dark:text-text-100 line-clamp-2">
                                                        {ticket.message}
                                                    </p>
                                                    <p className="text-xs text-text-500 dark:text-text-400 mt-1">
                                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            {ticket.adminReply && (
                                                <div className="mt-2 pt-2 border-t border-border-200 dark:border-border-700">
                                                    <p className="text-xs text-text-600 dark:text-text-400">
                                                        <strong>Admin Reply:</strong> {ticket.adminReply}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Contact Form Modal */}
                {showContactForm && (
                    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-surface-800 rounded-xl shadow-xl max-w-md w-full p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-text-900 dark:text-text-100">
                                    Contact Support
                                </h3>
                                <button
                                    onClick={() => setShowContactForm(false)}
                                    className="text-text-500 hover:text-text-700 dark:hover:text-text-300"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmitTicket} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-700 dark:text-text-300 mb-2">
                                        Issue Type
                                    </label>
                                    <select
                                        value={formData.issueType}
                                        onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                                        className="w-full px-3 py-2 border border-border-300 dark:border-border-600 rounded-lg bg-white dark:bg-surface-700 text-text-900 dark:text-text-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        required
                                    >
                                        <option value="">Select issue type</option>
                                        {issueTypes.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-700 dark:text-text-300 mb-2">
                                        Order ID (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.orderId}
                                        onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                                        placeholder="e.g., ORD12345"
                                        className="w-full px-3 py-2 border border-border-300 dark:border-border-600 rounded-lg bg-white dark:bg-surface-700 text-text-900 dark:text-text-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-700 dark:text-text-300 mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        rows={4}
                                        placeholder="Describe your issue in detail..."
                                        className="w-full px-3 py-2 border border-border-300 dark:border-border-600 rounded-lg bg-white dark:bg-surface-700 text-text-900 dark:text-text-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        required
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowContactForm(false)}
                                        className="flex-1 px-4 py-2 border border-border-300 dark:border-border-600 text-text-700 dark:text-text-300 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <FiSend />
                                                Submit Ticket
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HelpCenter;
