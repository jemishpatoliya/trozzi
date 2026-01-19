// Mock API service for reviews - provides sample data when backend is not available
import { ReviewQueryParams, ExportParams, ProductReviewParams, ReviewData, StatusData } from './reviews';

// Mock data
const mockReviews = [
  {
    id: '1',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    productName: 'Premium Wireless Headphones',
    productId: 'prod-1',
    rating: 5,
    title: 'Excellent Sound Quality!',
    comment: 'These headphones have amazing sound quality. The noise cancellation is top-notch and the battery life lasts all day. Highly recommend!',
    date: '2024-01-15T10:30:00Z',
    status: 'approved',
    helpful: 24,
    verified: true
  },
  {
    id: '2',
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    productName: 'Smart Watch Pro',
    productId: 'prod-2',
    rating: 4,
    title: 'Great Features, Minor Issues',
    comment: 'Love the fitness tracking and notifications. Battery could be better but overall satisfied with the purchase.',
    date: '2024-01-14T14:22:00Z',
    status: 'pending',
    helpful: 12,
    verified: true
  },
  {
    id: '3',
    customerName: 'Mike Johnson',
    customerEmail: 'mike@example.com',
    productName: 'Laptop Stand Adjustable',
    productId: 'prod-3',
    rating: 3,
    title: 'Decent but Overpriced',
    comment: 'It does the job but feels a bit flimsy for the price. The adjustable height is nice though.',
    date: '2024-01-13T09:15:00Z',
    status: 'rejected',
    helpful: 5,
    verified: false
  },
  {
    id: '4',
    customerName: 'Sarah Williams',
    customerEmail: 'sarah@example.com',
    productName: 'Premium Wireless Headphones',
    productId: 'prod-1',
    rating: 5,
    title: 'Best Headphones Ever!',
    comment: 'I\'ve tried many headphones but these are by far the best. The comfort and sound quality are unmatched.',
    date: '2024-01-12T16:45:00Z',
    status: 'approved',
    helpful: 31,
    verified: true
  },
  {
    id: '5',
    customerName: 'David Brown',
    customerEmail: 'david@example.com',
    productName: 'USB-C Hub Multi-Port',
    productId: 'prod-4',
    rating: 4,
    title: 'Very Useful Adapter',
    comment: 'Works perfectly with my MacBook. All ports function as expected. Compact design is a plus.',
    date: '2024-01-11T11:30:00Z',
    status: 'approved',
    helpful: 18,
    verified: true
  },
  {
    id: '6',
    customerName: 'Emily Davis',
    customerEmail: 'emily@example.com',
    productName: 'Smart Watch Pro',
    productId: 'prod-2',
    rating: 2,
    title: 'Disappointing Experience',
    comment: 'The watch stopped working after 2 weeks. Customer service was not helpful. Would not recommend.',
    date: '2024-01-10T13:20:00Z',
    status: 'pending',
    helpful: 3,
    verified: false
  },
  {
    id: '7',
    customerName: 'Robert Wilson',
    customerEmail: 'robert@example.com',
    productName: 'Mechanical Keyboard RGB',
    productId: 'prod-5',
    rating: 5,
    title: 'Perfect for Gaming!',
    comment: 'The tactile feedback is amazing. RGB lighting is customizable and the build quality is solid.',
    date: '2024-01-09T20:15:00Z',
    status: 'approved',
    helpful: 42,
    verified: true
  },
  {
    id: '8',
    customerName: 'Lisa Anderson',
    customerEmail: 'lisa@example.com',
    productName: 'Laptop Stand Adjustable',
    productId: 'prod-3',
    rating: 4,
    title: 'Good Value for Money',
    comment: 'Sturdy construction and easy to adjust. Made my home office setup much more ergonomic.',
    date: '2024-01-08T15:30:00Z',
    status: 'approved',
    helpful: 15,
    verified: true
  }
];

// Mock API functions
export const fetchAllReviews = async (params: ReviewQueryParams = {}) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let filteredReviews = [...mockReviews];
  
  // Apply filters
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filteredReviews = filteredReviews.filter(review => 
      review.customerName.toLowerCase().includes(searchLower) ||
      review.productName.toLowerCase().includes(searchLower) ||
      review.title.toLowerCase().includes(searchLower) ||
      review.comment.toLowerCase().includes(searchLower)
    );
  }
  
  if (params.rating) {
    filteredReviews = filteredReviews.filter(review => review.rating === params.rating);
  }
  
  if (params.status) {
    filteredReviews = filteredReviews.filter(review => review.status === params.status);
  }
  
  // Sort
  const sortBy = params.sortBy || 'date';
  const sortOrder = params.sortOrder || 'desc';
  
  filteredReviews.sort((a, b) => {
    let aVal: any = a[sortBy as keyof typeof a];
    let bVal: any = b[sortBy as keyof typeof b];
    
    if (sortBy === 'date') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    
    if (sortOrder === 'desc') {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    } else {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    }
  });
  
  // Pagination
  const page = params.page || 1;
  const limit = params.limit || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedReviews = filteredReviews.slice(startIndex, endIndex);
  
  return {
    reviews: paginatedReviews,
    totalPages: Math.ceil(filteredReviews.length / limit),
    currentPage: page,
    totalReviews: filteredReviews.length,
    hasNextPage: endIndex < filteredReviews.length,
    hasPrevPage: page > 1
  };
};

export const getReviewStats = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const totalReviews = mockReviews.length;
  const approvedReviews = mockReviews.filter(r => r.status === 'approved').length;
  const pendingReviews = mockReviews.filter(r => r.status === 'pending').length;
  const rejectedReviews = mockReviews.filter(r => r.status === 'rejected').length;
  
  const averageRating = mockReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
  
  return {
    totalReviews,
    averageRating: Math.round(averageRating * 10) / 10,
    pendingReviews,
    approvedReviews,
    rejectedReviews,
    ratingDistribution: {
      5: mockReviews.filter(r => r.rating === 5).length,
      4: mockReviews.filter(r => r.rating === 4).length,
      3: mockReviews.filter(r => r.rating === 3).length,
      2: mockReviews.filter(r => r.rating === 2).length,
      1: mockReviews.filter(r => r.rating === 1).length
    }
  };
};

export const updateReviewStatus = async (reviewId: string, statusData: StatusData) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const reviewIndex = mockReviews.findIndex(r => r.id === reviewId);
  if (reviewIndex === -1) {
    throw new Error('Review not found');
  }
  
  mockReviews[reviewIndex].status = statusData.status;
  
  return {
    success: true,
    message: `Review ${statusData.status} successfully`,
    review: mockReviews[reviewIndex]
  };
};

export const deleteReview = async (reviewId: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const reviewIndex = mockReviews.findIndex(r => r.id === reviewId);
  if (reviewIndex === -1) {
    throw new Error('Review not found');
  }
  
  const deletedReview = mockReviews.splice(reviewIndex, 1)[0];
  
  return {
    success: true,
    message: 'Review deleted successfully',
    review: deletedReview
  };
};

export const bulkUpdateReviews = async (reviewIds: string[], statusData: StatusData) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const updatedReviews = [];
  
  for (const reviewId of reviewIds) {
    const reviewIndex = mockReviews.findIndex(r => r.id === reviewId);
    if (reviewIndex !== -1) {
      mockReviews[reviewIndex].status = statusData.status;
      updatedReviews.push(mockReviews[reviewIndex]);
    }
  }
  
  return {
    success: true,
    message: `${updatedReviews.length} reviews ${statusData.status} successfully`,
    updatedReviews
  };
};

export const exportReviews = async (params: ExportParams = {}) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  let filteredReviews = [...mockReviews];
  
  if (params.status) {
    filteredReviews = filteredReviews.filter(review => review.status === params.status);
  }
  
  if (params.rating) {
    filteredReviews = filteredReviews.filter(review => review.rating === params.rating);
  }
  
  // Create CSV content
  const headers = ['ID', 'Customer Name', 'Email', 'Product', 'Rating', 'Title', 'Comment', 'Date', 'Status'];
  const csvContent = [
    headers.join(','),
    ...filteredReviews.map(review => [
      review.id,
      review.customerName,
      review.customerEmail,
      review.productName,
      review.rating,
      `"${review.title}"`,
      `"${review.comment.replace(/"/g, '""')}"`,
      review.date,
      review.status
    ].join(','))
  ].join('\n');
  
  return new Blob([csvContent], { type: 'text/csv' });
};

export const getReviewById = async (reviewId: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const review = mockReviews.find(r => r.id === reviewId);
  if (!review) {
    throw new Error('Review not found');
  }
  
  return review;
};

// Product Reviews API (for customer-facing)
export const fetchProductReviews = async (productId: string, params: ProductReviewParams = {}) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  let productReviews = mockReviews.filter(review => review.productId === productId && review.status === 'approved');
  
  // Sort
  const sortBy = params.sortBy || 'date';
  const sortOrder = params.sortOrder || 'desc';
  
  productReviews.sort((a, b) => {
    let aVal: any = a[sortBy as keyof typeof a];
    let bVal: any = b[sortBy as keyof typeof b];
    
    if (sortBy === 'date') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    
    if (sortOrder === 'desc') {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    } else {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    }
  });
  
  // Pagination
  const page = params.page || 1;
  const limit = params.limit || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedReviews = productReviews.slice(startIndex, endIndex);
  
  return {
    reviews: paginatedReviews,
    totalPages: Math.ceil(productReviews.length / limit),
    currentPage: page,
    totalReviews: productReviews.length
  };
};

export const submitProductReview = async (productId: string, reviewData: ReviewData) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const newReview = {
    id: (mockReviews.length + 1).toString(),
    customerName: reviewData.customerName,
    customerEmail: reviewData.customerEmail,
    productName: 'Product Name', // Would normally fetch from product
    productId,
    rating: reviewData.rating,
    title: reviewData.title,
    comment: reviewData.comment,
    date: new Date().toISOString(),
    status: 'pending',
    helpful: 0,
    verified: false
  };
  
  mockReviews.unshift(newReview);
  
  return {
    success: true,
    message: 'Review submitted successfully',
    review: newReview
  };
};

export const upvoteReview = async (reviewId: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const review = mockReviews.find(r => r.id === reviewId);
  if (!review) {
    throw new Error('Review not found');
  }
  
  review.helpful += 1;
  
  return {
    success: true,
    message: 'Review upvoted successfully',
    helpful: review.helpful
  };
};

export const reportReview = async (reviewId: string, reason: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const review = mockReviews.find(r => r.id === reviewId);
  if (!review) {
    throw new Error('Review not found');
  }
  
  return {
    success: true,
    message: 'Review reported successfully',
    reviewId,
    reason
  };
};
