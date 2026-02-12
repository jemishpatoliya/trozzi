import React, { useCallback, useEffect, useState } from 'react';
import { FaStar, FaTrash, FaEdit, FaSearch, FaEye } from 'react-icons/fa';
import { fetchAllReviews, deleteReview, updateReviewStatus } from '../../api/adminReviews';
import AdminSidebar from '../../components/AdminSidebar';

const AdminReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRating, setFilterRating] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedReview, setSelectedReview] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    const loadReviews = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                limit: 10,
                search: searchTerm || undefined,
                rating: filterRating !== 'all' ? parseInt(filterRating) : undefined,
                status: filterStatus !== 'all' ? filterStatus : undefined
            };

            const data = await fetchAllReviews(params);
            setReviews(data.reviews || []);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            setError('Failed to load reviews');
            console.error('Error loading reviews:', err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, filterRating, filterStatus, searchTerm]);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Are you sure you want to delete this review?')) return;

        try {
            await deleteReview(reviewId);
            setReviews(prev => prev.filter(review => review.id !== reviewId));
        } catch (error) {
            console.error('Failed to delete review:', error);
            setError('Failed to delete review');
        }
    };

    const handleStatusUpdate = async (reviewId, status) => {
        try {
            await updateReviewStatus(reviewId, { status });
            setReviews(prev => prev.map(review =>
                review.id === reviewId ? { ...review, status } : review
            ));
        } catch (error) {
            console.error('Failed to update review status:', error);
            setError('Failed to update review status');
        }
    };

    const filteredReviews = reviews.filter(review => {
        const matchesSearch = review.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.title.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRating = filterRating === 'all' || review.rating === parseInt(filterRating);
        const matchesStatus = filterStatus === 'all' || review.status === filterStatus;

        return matchesSearch && matchesRating && matchesStatus;
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusStyles = {
            approved: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            rejected: 'bg-red-100 text-red-800'
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
                {status || 'pending'}
            </span>
        );
    };

    if (loading && reviews.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <AdminSidebar>
            <div className="p-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Customer Reviews</h1>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>Total Reviews: {reviews.length}</span>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {/* Search */}
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search reviews..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Rating Filter */}
                        <select
                            value={filterRating}
                            onChange={(e) => setFilterRating(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>

                        {/* Clear Filters */}
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterRating('all');
                                setFilterStatus('all');
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                            Clear Filters
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {/* Reviews Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Rating
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Title
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredReviews.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                            No reviews found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReviews.map((review) => (
                                        <tr key={review.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{review.customerName}</div>
                                                    <div className="text-sm text-gray-500">{review.customerEmail}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{review.productName}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {[...Array(5)].map((_, i) => (
                                                        <FaStar
                                                            key={i}
                                                            className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                                                }`}
                                                        />
                                                    ))}
                                                    <span className="ml-2 text-sm text-gray-600">({review.rating})</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 truncate max-w-xs" title={review.title}>
                                                    {review.title}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(review.date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(review.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedReview(review);
                                                            setShowDetails(true);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="View Details"
                                                    >
                                                        <FaEye />
                                                    </button>

                                                    {review.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusUpdate(review.id, 'approved')}
                                                                className="text-green-600 hover:text-green-900"
                                                                title="Approve"
                                                            >
                                                                <FaEdit />
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(review.id, 'rejected')}
                                                                className="text-red-600 hover:text-red-900"
                                                                title="Reject"
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </>
                                                    )}

                                                    {review.status !== 'pending' && (
                                                        <button
                                                            onClick={() => handleDeleteReview(review.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Delete"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                            <div className="text-sm text-gray-700">
                                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, filteredReviews.length)} of {filteredReviews.length} reviews
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-1">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Review Details Modal */}
                {showDetails && selectedReview && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-900">Review Details</h2>
                                    <button
                                        onClick={() => setShowDetails(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Customer Info */}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p><strong>Name:</strong> {selectedReview.customerName}</p>
                                            <p><strong>Email:</strong> {selectedReview.customerEmail}</p>
                                            <p><strong>Date:</strong> {formatDate(selectedReview.date)}</p>
                                            <p><strong>Status:</strong> {getStatusBadge(selectedReview.status)}</p>
                                        </div>
                                    </div>

                                    {/* Product Info */}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Product Information</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p><strong>Product:</strong> {selectedReview.productName}</p>
                                            <p><strong>Product ID:</strong> {selectedReview.productId}</p>
                                        </div>
                                    </div>

                                    {/* Rating */}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Rating</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <FaStar
                                                        key={i}
                                                        className={`h-5 w-5 ${i < selectedReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                                            }`}
                                                    />
                                                ))}
                                                <span className="text-lg font-semibold">({selectedReview.rating}/5)</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Review Content */}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Review Content</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="font-medium text-gray-900 mb-2">{selectedReview.title}</h4>
                                            <p className="text-gray-700 whitespace-pre-wrap">{selectedReview.comment}</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        {selectedReview.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        handleStatusUpdate(selectedReview.id, 'approved');
                                                        setShowDetails(false);
                                                    }}
                                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        handleStatusUpdate(selectedReview.id, 'rejected');
                                                        setShowDetails(false);
                                                    }}
                                                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => {
                                                handleDeleteReview(selectedReview.id);
                                                setShowDetails(false);
                                            }}
                                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                                        >
                                            Delete
                                        </button>
                                        <button
                                            onClick={() => setShowDetails(false)}
                                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminSidebar>
    );
};

export default AdminReviews;
