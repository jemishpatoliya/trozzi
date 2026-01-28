import React, { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import ProductZoom from '../../components/ProductZoom';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Rating from '@mui/material/Rating';
import LatestProducts from '../../components/Latestproduct/latestproduct';
import ProductDetalisComponent from '../../components/ProductDetalis';

import { fetchProductById } from '../../api/catalog';
import { fetchProductReviews, submitProductReview } from '../../api/productDetails';
import { normalizeColorKey, normalizeProductForColorVariants, normalizeToken } from '../../utils/colorVariants';

const Productsdetailsh = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [selectedColorVariant, setSelectedColorVariant] = useState(null);
    const [hasUserSelectedColor, setHasUserSelectedColor] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();

    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;

        const scrollToTop = () => {
            const main = document.querySelector('main');
            if (main && typeof main.scrollTo === 'function') {
                main.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            } else if (main) {
                main.scrollTop = 0;
            }

            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        };

        requestAnimationFrame(() => requestAnimationFrame(scrollToTop));
    }, [id]);

    // Reviews State
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', customerName: '', customerEmail: '' });
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewSuccess, setReviewSuccess] = useState(false);
    const [reviewError, setReviewError] = useState('');

    const sanitizeHtml = (input) => {
        const html = String(input ?? '').trim();
        if (!html) return '';
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            doc.querySelectorAll('script,style,iframe,object,embed').forEach((el) => el.remove());
            doc.querySelectorAll('*').forEach((el) => {
                [...el.attributes].forEach((attr) => {
                    const name = String(attr.name || '').toLowerCase();
                    const value = String(attr.value || '');
                    if (name.startsWith('on')) {
                        el.removeAttribute(attr.name);
                        return;
                    }
                    if ((name === 'href' || name === 'src') && /^\s*javascript:/i.test(value)) {
                        el.removeAttribute(attr.name);
                    }
                });
            });
            return doc.body.innerHTML;
        } catch (_e) {
            return '';
        }
    };

    useEffect(() => {
        let cancelled = false;
        async function load({ silent = false } = {}) {
            if (!id) return;
            try {
                if (!silent) {
                    setLoading(true);
                    setError('');
                }
                const data = await fetchProductById(id, { mode: 'public' });
                if (!cancelled) {
                    const normalized = normalizeProductForColorVariants(data);
                    setProduct(normalized);

                    const urlColor = String(searchParams.get('color') || '').trim();
                    if (urlColor) setHasUserSelectedColor(true);

                    setSelectedColorVariant((prevSelected) => {
                        const variants = normalized?.colorVariants || [];
                        if (variants.length === 0) return null;

                        const desired = urlColor || prevSelected?.colorName || prevSelected?.color || '';
                        const desiredKey = normalizeColorKey(desired);
                        const desiredToken = normalizeToken(desired);

                        const match = variants.find((v) => {
                            const vName = String(v?.colorName || '').trim();
                            const vColor = String(v?.color || '').trim();

                            return (
                                (desiredToken && normalizeToken(vName) === desiredToken) ||
                                (desiredToken && normalizeToken(vColor) === desiredToken) ||
                                (desiredKey && normalizeColorKey(vName) === desiredKey) ||
                                (desiredKey && normalizeColorKey(vColor) === desiredKey)
                            );
                        });

                        return match || prevSelected || variants[0];
                    });
                }
            } catch (e) {
                if (!cancelled && !silent) setError('Failed to load product');
            } finally {
                if (!cancelled && !silent) setLoading(false);
            }
        }

        void load({ silent: false });

        const onFocus = () => {
            void load({ silent: true });
        };
        const onVisibility = () => {
            if (document.visibilityState === 'visible') void load({ silent: true });
        };

        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            cancelled = true;
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [id, searchParams]);

    useEffect(() => {
        const v = selectedColorVariant;
        if (!v) return;
        const name = String(v.colorName || v.color || '').trim();
        if (!name) return;
        const current = String(searchParams.get('color') || '').trim();
        if (current === name) return;
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set('color', name);
            return next;
        }, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedColorVariant]);

    const loadReviews = useCallback(async () => {
        try {
            setReviewsLoading(true);
            const data = await fetchProductReviews(id);
            setReviews(data.reviews || []);
        } catch (error) {
            console.error('Failed to load reviews:', error);
        } finally {
            setReviewsLoading(false);
        }
    }, [id]);

    // Load Reviews when product is loaded
    useEffect(() => {
        if (!id) return;
        void loadReviews();
    }, [id, loadReviews]);

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!reviewForm.comment.trim() || !reviewForm.customerName.trim() || !reviewForm.customerEmail.trim()) {
            alert('Please fill in all fields');
            return;
        }

        setIsSubmittingReview(true);
        setReviewError('');
        setReviewSuccess(false);

        try {
            const newReview = await submitProductReview(id, {
                rating: reviewForm.rating,
                title: 'Customer Review',
                comment: reviewForm.comment,
                customerName: reviewForm.customerName,
                customerEmail: reviewForm.customerEmail
            });
            setReviews(prev => [newReview, ...prev]);
            setReviewForm({ rating: 5, comment: '', customerName: '', customerEmail: '' });
            setReviewSuccess(true);

            // Hide success message after 3 seconds
            setTimeout(() => setReviewSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to submit review:', error);
            setReviewError(error.message || 'Failed to submit review. Please try again.');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    return (
        <>
            <div className="py-3 sm:py-5 pb-0">
                <div className="container">
                    <Breadcrumbs aria-label="breadcrumb">
                        <Link underline="hover" color="inherit" href="/" className="link transition">
                            Home
                        </Link>
                        <Link underline="hover" color="inherit" href="/ProductListing" className="link transition">
                            {product?.category || 'Products'}
                        </Link>
                        <Link underline="hover" color="inherit" className="link transition">
                            {product?.name || 'Product Details'}
                        </Link>
                    </Breadcrumbs>
                </div>
            </div>

            <section className='bg-white py-3 sm:py-5'>
                {loading && (
                    <div className='container py-6 text-center text-gray-600'>Loading...</div>
                )}
                {error && (
                    <div className='container py-6 text-center text-red-600'>{error}</div>
                )}

                <div className='container flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 items-start min-w-0'>
                    <div className='productzoomcontainer w-full md:w-[40%] min-w-0'>
                        <ProductZoom product={product} selectedColorVariant={selectedColorVariant} useVariantImages={hasUserSelectedColor} />
                    </div>
                    <ProductDetalisComponent
                        product={product}
                        selectedColorVariant={selectedColorVariant}
                        useVariantImages={hasUserSelectedColor}
                        onColorSelect={(v) => {
                            setHasUserSelectedColor(true);
                            setSelectedColorVariant(v);
                        }}
                    />
                </div>

                <div className="container pt-4 sm:pt-10">
                    <div className="shadow-md w-full py-4 sm:py-5 px-3 sm:px-8 rounded-md bg-white">
                        {/* Tabs */}
                        <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-6 mb-5 sm:mb-6 border-b pb-2">
                            <span
                                className={`${activeTab === 0 ? 'text-blue-600 border-blue-600' : 'text-gray-700 hover:text-blue-600'} link block truncate text-[11px] sm:text-lg cursor-pointer font-semibold transition pb-2 -mb-2 border-b-2 border-transparent text-center leading-tight px-1 py-1`}
                                onClick={() => setActiveTab(0)}
                            >
                                Description
                            </span>
                            <span
                                className={`${activeTab === 1 ? 'text-blue-600 border-blue-600' : 'text-gray-700 hover:text-blue-600'} link block truncate text-[11px] sm:text-lg cursor-pointer font-semibold transition pb-2 -mb-2 border-b-2 border-transparent text-center leading-tight px-1 py-1`}
                                onClick={() => setActiveTab(1)}
                            >
                                Product Details
                            </span>
                            <span
                                className={`${activeTab === 2 ? 'text-blue-600 border-blue-600' : 'text-gray-700 hover:text-blue-600'} link block truncate text-[11px] sm:text-lg cursor-pointer font-semibold transition pb-2 -mb-2 border-b-2 border-transparent text-center leading-tight px-1 py-1`}
                                onClick={() => setActiveTab(2)}
                            >
                                Reviews ({reviews.length})
                            </span>
                        </div>

                        {/* Description */}
                        {activeTab === 0 && (
                            <div className="text-[13px] sm:text-base text-gray-700 leading-5 sm:leading-7">
                                <p>
                                    {product?.description || 'Lorem Ipsum is simply dummy text...'}
                                </p>
                            </div>
                        )}

                        {/* Product Details */}
                        {activeTab === 1 && (
                            <div className="relative overflow-x-auto">
                                {String(product?.descriptionHtml || '').trim() ? (
                                    <div
                                        className="prose prose-sm max-w-none text-gray-700 mb-4"
                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.descriptionHtml) }}
                                    />
                                ) : null}
                                {/* table same as your code */}
                            </div>
                        )}

                        {/* Reviews */}
                        {activeTab === 2 && (
                            <div className='w-full ProductReviewsContainer'>
                                <h3 className='text-[14px] sm:text-[18px] mb-4'>Customer Reviews ({reviews.length})</h3>

                                <div className='scroll w-full max-h-[300px] overflow-y-scroll overflow-x-hidden pr-5 mb-6'>
                                    {reviewsLoading ? (
                                        <div className="text-center py-8">Loading reviews...</div>
                                    ) : reviews.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">No reviews yet. Be the first to review!</div>
                                    ) : (
                                        reviews.map((review) => (
                                            <div key={review.id} className='pb-5 pt-5 border-b border-[#e0e0e0] w-full'>
                                                <div className='flex items-start gap-3'>
                                                    <div className='img w-[50px] h-[50px] overflow-hidden rounded-full flex-shrink-0'>
                                                        <img
                                                            src='https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg'
                                                            alt="user avatar"
                                                            className='w-full'
                                                        />
                                                    </div>
                                                    <div className='flex-1'>
                                                        <h4 className='text-[16px] font-medium'>{review.customerName}</h4>
                                                        <div className='flex items-center gap-2 mb-2'>
                                                            <Rating name={`rating-${review.id}`} value={review.rating} readOnly size="small" />
                                                            <span className='text-[13px] text-gray-500'>
                                                                {new Date(review.date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className='text-gray-700'>{review.comment}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className='reviewfrom bg-[#f1f1f1] p-4 rounded-md'>
                                    <h2 className='text-[18px] mb-4'>Add a Review</h2>

                                    {reviewSuccess && (
                                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                                            <strong>Success!</strong> Your review has been submitted successfully.
                                        </div>
                                    )}

                                    {reviewError && (
                                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                            <strong>Error:</strong> {reviewError}
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmitReview}>
                                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                                            <TextField
                                                label="Your Name"
                                                value={reviewForm.customerName}
                                                onChange={(e) => setReviewForm(prev => ({ ...prev, customerName: e.target.value }))}
                                                required
                                                disabled={isSubmittingReview}
                                            />
                                            <TextField
                                                label="Your Email"
                                                type="email"
                                                value={reviewForm.customerEmail}
                                                onChange={(e) => setReviewForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                                                required
                                                disabled={isSubmittingReview}
                                            />
                                        </div>
                                        <div className='mb-4'>
                                            <label className='block text-sm font-medium text-gray-700 mb-2'>Rating</label>
                                            <Rating
                                                name="review-rating"
                                                value={reviewForm.rating}
                                                onChange={(event, newValue) => setReviewForm(prev => ({ ...prev, rating: newValue || 5 }))}
                                                disabled={isSubmittingReview}
                                            />
                                        </div>
                                        <TextField
                                            id="review-comment"
                                            label="Write your review..."
                                            className='w-full mb-4'
                                            multiline
                                            rows={4}
                                            value={reviewForm.comment}
                                            onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                                            required
                                            disabled={isSubmittingReview}
                                        />
                                        <div className='flex items-center mt-5'>
                                            <Button
                                                type="submit"
                                                className='btn-org'
                                                disabled={isSubmittingReview}
                                            >
                                                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className='container pt-5'>
                    <LatestProducts title="Releted Products" className='pb-0' />
                </div>
            </section>
        </>
    )
}

export default Productsdetailsh
