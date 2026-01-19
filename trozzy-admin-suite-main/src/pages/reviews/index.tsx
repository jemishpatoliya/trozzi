import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Eye, Edit, Trash2, ThumbsUp, MessageSquare, Search } from 'lucide-react';
import { toast } from 'sonner';
import { fetchAllReviews, getReviewStats, updateReviewStatus, deleteReview } from '../../api/reviews';
import axios from 'axios';

interface ReviewsPageProps {
  defaultFilter?: string;
}

const ReviewsPage: React.FC<ReviewsPageProps> = ({ defaultFilter }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [filterStatus, setFilterStatus] = useState(defaultFilter || 'all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    pendingReviews: 0,
    approvedReviews: 0,
    rejectedReviews: 0
  });
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Load reviews and stats from API
  useEffect(() => {
    loadReviews();
    loadStats();
  }, [currentPage, filterStatus, filterRating, searchTerm]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params: any = {
        page: currentPage,
        limit: 10,
        sortBy: 'date',
        sortOrder: 'desc'
      };

      if (searchTerm) params.search = searchTerm;
      if (filterRating !== 'all') params.rating = parseInt(filterRating);
      if (filterStatus !== 'all') params.status = filterStatus;

      // Use real API
      const data = await fetchAllReviews(params);
      setReviews(data.reviews || []);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      console.error('Failed to load reviews:', err);
      setError(err.response?.data?.message || 'Failed to load reviews');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Use real API
      const data = await getReviewStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
      // Set default stats if API fails
      setStats({
        totalReviews: 0,
        averageRating: 0,
        pendingReviews: 0,
        approvedReviews: 0,
        rejectedReviews: 0
      });
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    try {
      // Use real API
      await deleteReview(reviewId);
      
      setReviews(prev => prev.filter(review => review.id !== reviewId));
      toast.success('Review deleted successfully');
      // Reload stats after deletion
      loadStats();
    } catch (error: any) {
      console.error('Failed to delete review:', error);
      toast.error(error.response?.data?.message || 'Failed to delete review');
    }
  };

  const handleStatusUpdate = async (reviewId: string, status: string) => {
    try {
      // Use real API
      await updateReviewStatus(reviewId, { status });
      
      setReviews(prev => prev.map(review => 
        review.id === reviewId ? { ...review, status } : review
      ));
      toast.success(`Review ${status} successfully`);
      // Reload stats after status update
      loadStats();
    } catch (error: any) {
      console.error('Failed to update review status:', error);
      toast.error(error.response?.data?.message || 'Failed to update review status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={statusStyles[status] || 'bg-gray-100 text-gray-800'}>
        {status || 'pending'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
            <Button onClick={loadReviews} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Reviews</h1>
          <p className="text-gray-600">Manage and moderate customer reviews</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Total Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalReviews}</div>
              <p className="text-sm text-gray-500">All customer reviews</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Average Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</span>
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
              </div>
              <p className="text-sm text-gray-500">Customer satisfaction</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-yellow-500" />
                Pending Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingReviews}</div>
              <p className="text-sm text-gray-500">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ThumbsUp className="h-5 w-5 text-green-500" />
                Approved Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approvedReviews}</div>
              <p className="text-sm text-gray-500">Published reviews</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-500" />
                Rejected Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejectedReviews}</div>
              <p className="text-sm text-gray-500">Not published</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

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

              <Button
                onClick={() => {
                  setSearchTerm('');
                  setFilterRating('all');
                  setFilterStatus('all');
                  setCurrentPage(1);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Table */}
        <Card>
          <CardHeader>
            <CardTitle>Reviews List ({reviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No reviews found
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews.map((review) => (
                    <TableRow key={review.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
                            <img
                              src="https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg"
                              alt={review.customerName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{review.customerName}</div>
                            <div className="text-sm text-gray-500">{review.customerEmail}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">{review.productName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-600">({review.rating})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900 truncate max-w-xs" title={review.title}>
                          {review.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {formatDate(review.date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(review.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedReview(review);
                              setShowDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {review.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(review.id, 'approved')}
                                className="text-green-600 hover:text-green-900 text-sm"
                                title="Approve"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(review.id, 'rejected')}
                                className="text-red-600 hover:text-red-900 text-sm"
                                title="Reject"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          
                          {review.status !== 'pending' && (
                            <button
                              onClick={() => handleDeleteReview(review.id)}
                              className="text-red-600 hover:text-red-900 text-sm"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, reviews.length)} of {reviews.length} reviews
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
          </CardContent>
        </Card>

        {/* Review Details Modal */}
        {showDetailsModal && selectedReview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Review Details</CardTitle>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  ×
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
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
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < selectedReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
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
                          setShowDetailsModal(false);
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        <Edit className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedReview.id, 'rejected');
                          setShowDetailsModal(false);
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Reject
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => {
                      handleDeleteReview(selectedReview.id);
                      setShowDetailsModal(false);
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsPage;