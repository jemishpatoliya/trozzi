import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { FaStar, FaShoppingCart, FaHeart, FaRegHeart, FaTruck, FaShieldAlt, FaUndo, FaCheck, FaShareAlt } from 'react-icons/fa';
import { fetchProductDetails, fetchProductReviews, submitProductReview } from '../../api/productDetails';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { normalizeColorKey, normalizeProductForColorVariants, normalizeToken } from '../../utils/colorVariants';

const ProductDetail = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const { addToCart } = useCart();
    const { user } = useAuth();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [hasUserSelectedColor, setHasUserSelectedColor] = useState(false);

    // Reviews State
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '', customerName: '', customerEmail: '' });
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewSuccess, setReviewSuccess] = useState(false);
    const [reviewError, setReviewError] = useState('');

    // Add to cart state
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [justAdded, setJustAdded] = useState(false);

    const productDocId = product?._id || product?.id;
    const isJewellery = String(product?.category || '').toLowerCase().includes('jewel');
    const sizeOptions = (product?.sizes && product.sizes.length > 0) ? product.sizes : (isJewellery ? ['Free Size'] : []);
    const colorOptions = (product?.colors && product.colors.length > 0) ? product.colors : [];

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

    const handleShare = async () => {
        if (!productDocId) return;

        const url = `${window.location.origin}${location.pathname}${location.search || ''}`;
        const title = String(product?.name || 'Product');

        try {
            if (navigator.share) {
                await navigator.share({ title, text: title, url });
                return;
            }
        } catch (_e) {
            // ignore
        }

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(url);
            } else {
                window.prompt('Copy this link:', url);
            }
        } catch (_e) {
            window.prompt('Copy this link:', url);
        }
    };

    useEffect(() => {
        if (productId) {
            loadProductDetails();
            loadReviews();
        }
    }, [productId]);

    const loadProductDetails = async ({ silent = false } = {}) => {
        try {
            if (!silent) setLoading(true);
            const data = await fetchProductDetails(productId);
            const normalized = normalizeProductForColorVariants(data);
            setProduct(normalized);

            const urlColor = String(searchParams.get('color') || '').trim();
            if (urlColor) setHasUserSelectedColor(true);

            if (normalized.sizes?.length > 0) {
                setSelectedSize((prev) => (prev && normalized.sizes.includes(prev) ? prev : normalized.sizes[0]));
            }

            const variants = normalized?.colorVariants || [];
            if (variants.length > 0) {
                setSelectedColor((prev) => {
                    const desired = urlColor || prev;
                    const desiredKey = normalizeColorKey(desired);
                    const desiredToken = normalizeToken(desired);

                    const match = variants.find((v) => {
                        const vName = v?.colorName ? String(v.colorName) : '';
                        const vKey = v?.color ? String(v.color) : '';
                        return (desiredToken && normalizeToken(vName) === desiredToken) || (desiredKey && normalizeToken(vKey) === normalizeToken(desiredKey));
                    });

                    return (match ? match.colorName : variants[0].colorName);
                });
            } else if (normalized.colors?.length > 0) {
                setSelectedColor((prev) => {
                    const desired = urlColor || prev;
                    return (desired && normalized.colors.includes(desired) ? desired : normalized.colors[0]);
                });
            }
        } catch (err) {
            if (!silent) setError('Failed to load product details');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const variants = product?.colorVariants || [];
    const selectedVariant = variants.length > 0
        ? (
            variants.find((v) => {
                const selectedKey = normalizeColorKey(selectedColor);
                const selectedToken = normalizeToken(selectedColor);
                const vName = String(v?.colorName || '').trim();
                const vColor = String(v?.color || '').trim();

                return (
                    (selectedToken && normalizeToken(vName) === selectedToken) ||
                    (selectedToken && normalizeToken(vColor) === selectedToken) ||
                    (selectedKey && normalizeColorKey(vName) === selectedKey) ||
                    (selectedKey && normalizeColorKey(vColor) === selectedKey)
                );
            }) || variants[0]
        )
        : null;

    const pricing = (() => {
        const pickBestPrice = (...values) => {
            const nums = values.map((v) => Number(v)).filter((n) => Number.isFinite(n));
            const good = nums.find((n) => n > 1);
            if (good !== undefined) return good;
            return nums.length ? nums[0] : 0;
        };

        const price = pickBestPrice(
            selectedVariant?.price,
            product?.price,
            product?.management?.pricing?.sellingPrice,
        );

        const original = pickBestPrice(
            product?.originalPrice,
            product?.management?.pricing?.originalPrice,
            product?.management?.pricing?.mrp,
        );
        const displayMrp = original > 0 ? original : price;

        const saleEnabled = Boolean(product?.saleEnabled);
        const saleDiscount = Number(product?.saleDiscount ?? product?.discount ?? 0) || 0;
        const saleStart = product?.saleStartDate ? new Date(product.saleStartDate) : null;
        const saleEnd = product?.saleEndDate ? new Date(product.saleEndDate) : null;
        const now = new Date();

        const isSaleActive =
            saleEnabled &&
            saleDiscount > 0 &&
            (!saleStart || Number.isNaN(saleStart.getTime()) || saleStart <= now) &&
            (!saleEnd || Number.isNaN(saleEnd.getTime()) || saleEnd >= now);

        const displaySelling = isSaleActive ? price - (price * saleDiscount) / 100 : price;

        return {
            price,
            displayMrp,
            displaySelling,
            isSaleActive,
            saleDiscount,
        };
    })();

    const baseImages = [product?.image, ...((product?.galleryImages ?? []) || [])].filter(Boolean);
    const selectedImages = variants.length > 0
        ? (hasUserSelectedColor ? (Array.isArray(selectedVariant?.images) ? selectedVariant.images.filter(Boolean) : []) : baseImages)
        : baseImages;

    useEffect(() => {
        setSelectedImage(0);
    }, [selectedColor]);

    useEffect(() => {
        if (!selectedColor) return;
        const current = String(searchParams.get('color') || '').trim();
        if (current === selectedColor) return;
        setSearchParams((prevParams) => {
            const next = new URLSearchParams(prevParams);
            next.set('color', selectedColor);
            return next;
        }, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedColor]);

    useEffect(() => {
        if (!productId) return;

        let cancelled = false;
        const refresh = async () => {
            if (cancelled) return;
            await loadProductDetails({ silent: true });
        };

        const onFocus = () => {
            void refresh();
        };
        const onVisibility = () => {
            if (document.visibilityState === 'visible') void refresh();
        };

        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            cancelled = true;
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [productId]);

    const loadReviews = async () => {
        try {
            setReviewsLoading(true);
            const data = await fetchProductReviews(productId);
            setReviews(data.reviews || []);
        } catch (err) {
            console.error('Failed to load reviews:', err);
        } finally {
            setReviewsLoading(false);
        }
    };

    const handleAddToCart = async () => {
        const stock = Number(product?.stock ?? 0);
        if (!productDocId || !product || stock <= 0) return;
        if (!user) {
            navigate(`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search || ''}`)}`);
            return;
        }

        try {
            setIsAddingToCart(true);
            const cartImage = variants.length > 0
                ? (hasUserSelectedColor
                    ? (selectedImages?.[selectedImage] || selectedImages?.[0] || '')
                    : (baseImages?.[0] || ''))
                : (selectedImages?.[selectedImage] || selectedImages?.[0] || product?.image || product?.galleryImages?.[0] || '');
            const cartPrice = pricing.displaySelling;
            const cartSku = selectedVariant?.sku ?? product?.sku;
            const cartName = product?.name;

            await addToCart(productDocId, quantity, {
                name: cartName,
                image: cartImage,
                price: cartPrice,
                brand: product?.brand,
                sku: cartSku,
                size: selectedSize,
                color: selectedColor,
            });

            setJustAdded(true);
            setTimeout(() => setJustAdded(false), 2000);
        } catch (error) {
            console.error('Failed to add to cart:', error);
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setIsSubmittingReview(true);
        setReviewError('');
        setReviewSuccess(false);

        try {
            const newReview = await submitProductReview(productId, reviewForm);
            setReviews(prev => [newReview, ...prev]);
            setReviewForm({ rating: 5, title: '', comment: '', customerName: '', customerEmail: '' });
            setShowReviewForm(false);
            setReviewSuccess(true);

            // Update product rating
            if (product) {
                const allRatings = reviews.map(r => r.rating).concat(reviewForm.rating);
                const averageRating = allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length;
                setProduct(prev => ({ ...prev, rating: Math.round(averageRating * 10) / 10 }));
            }

            // Hide success message after 3 seconds
            setTimeout(() => setReviewSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to submit review:', error);
            setReviewError(error.message || 'Failed to submit review. Please try again.');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/products')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Back to Products
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4" style={{ marginTop: '250px' }}>
                {/* Product Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Product Images */}
                        <div>
                            <div className="aspect-square bg-white rounded-lg overflow-hidden mb-4">
                                {selectedImages.length > 0 ? (
                                    <img
                                        src={selectedImages[selectedImage] || selectedImages[0]}
                                        alt={product.name}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                                        No images available for selected color
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {selectedImages.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 ${selectedImage === index ? 'border-blue-600' : 'border-transparent'
                                            }`}
                                    >
                                        <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-contain" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product Info */}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

                            {/* Rating */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar
                                            key={i}
                                            className={`h-5 w-5 ${i < Math.floor(product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <span className="text-lg font-semibold">{(product.rating || 0).toFixed(1)}</span>
                                <span className="text-gray-600">({reviews.length} reviews)</span>
                            </div>

                            {/* Price */}
                            <div className="flex items-center gap-4 mb-6">
                                <span className="text-3xl font-bold text-gray-900">{formatPrice(pricing.displaySelling)}</span>
                                {Number(pricing.displayMrp ?? 0) > Number(pricing.displaySelling ?? 0) && (
                                    <span className="text-xl text-gray-400 line-through">{formatPrice(pricing.displayMrp)}</span>
                                )}
                                {pricing.isSaleActive && (
                                    <span className="bg-red-500 text-white px-2 py-1 rounded-full text-sm font-semibold">
                                        -{pricing.saleDiscount}%
                                    </span>
                                )}
                            </div>

                            {/* Description */}
                            <p className="text-gray-600 mb-6">{product.description}</p>

                            {/* Product Options */}
                            <div className="space-y-4 mb-6">
                                {/* Size Selection */}
                                {sizeOptions.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                                        <div className="flex gap-2">
                                            {sizeOptions.map((size) => (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`px-4 py-2 rounded-lg border-2 ${selectedSize === size
                                                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                                                        : 'border-gray-300 hover:border-gray-400'
                                                        }`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {Array.isArray(product?.sizeGuide) && product.sizeGuide.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Size Guide</label>
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                                                {product.sizeGuide.map((item, idx) => (
                                                    <li key={`${idx}-${item}`}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* Color Selection */}
                                {variants.length > 0 ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                                        <div className="flex gap-2">
                                            {variants.map((v, idx) => (
                                                <button
                                                    key={`${String(v?.color || v?.colorName || 'color')}-${idx}`}
                                                    onClick={() => {
                                                        setHasUserSelectedColor(true);
                                                        setSelectedColor(v?.colorName || v?.color || '');
                                                    }}
                                                    className={`px-4 py-2 rounded-lg border-2 capitalize ${selectedColor === v.colorName
                                                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                                                        : 'border-gray-300 hover:border-gray-400'
                                                        }`}
                                                >
                                                    {v.colorName}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : colorOptions.length > 0 ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                                        <div className="flex gap-2">
                                            {colorOptions.map((c) => (
                                                <button
                                                    key={c}
                                                    onClick={() => {
                                                        setHasUserSelectedColor(true);
                                                        setSelectedColor(c);
                                                    }}
                                                    className={`px-4 py-2 rounded-lg border-2 capitalize ${selectedColor === c
                                                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                                                        : 'border-gray-300 hover:border-gray-400'
                                                        }`}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                {/* Quantity */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                        >
                                            -
                                        </button>
                                        <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(Math.min(Number(product.stock ?? 0) || 1, quantity + 1))}
                                            className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Stock Status */}
                            <div className="mb-6">
                                {Number(product.stock ?? 0) > 0 ? (
                                    <span className="text-green-600 font-medium">In Stock ({Number(product.stock ?? 0)} available)</span>
                                ) : (
                                    <span className="text-red-600 font-medium">Out of Stock</span>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 mb-6">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={isAddingToCart || Number(product.stock ?? 0) <= 0}
                                    className="flex-1 bg-[#FF9F00] text-gray-900 py-3 rounded-lg hover:bg-[#fb8c00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-md"
                                >
                                    {isAddingToCart ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Adding...
                                        </>
                                    ) : justAdded ? (
                                        <>
                                            <FaCheck />
                                            Added to Cart!
                                        </>
                                    ) : (
                                        <>
                                            <FaShoppingCart />
                                            Add to Cart
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => productDocId && toggleWishlist(productDocId, { size: selectedSize, color: selectedColor })}
                                    className="p-3 rounded-lg border border-gray-300 hover:border-red-500 hover:text-red-500 transition-colors"
                                >
                                    {productDocId && isInWishlist(productDocId) ? <FaHeart /> : <FaRegHeart />}
                                </button>

                                <button
                                    onClick={handleShare}
                                    className="p-3 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
                                >
                                    <FaShareAlt />
                                </button>
                            </div>

                            {/* Product Features */}
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg">
                                    <FaTruck className="h-6 w-6 text-blue-600" />
                                    <span className="text-sm font-medium">Free Delivery</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg">
                                    <FaShieldAlt className="h-6 w-6 text-blue-600" />
                                    <span className="text-sm font-medium">Secure Payment</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg">
                                    <FaUndo className="h-6 w-6 text-blue-600" />
                                    <span className="text-sm font-medium">Easy Returns</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
                        <button
                            onClick={() => setShowReviewForm(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Write a Review
                        </button>
                    </div>

                    {/* Review Form */}
                    {showReviewForm && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <h3 className="font-semibold mb-4">Write a Review</h3>

                            {/* Success Message */}
                            {reviewSuccess && (
                                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                                    <strong>Success!</strong> Your review has been submitted successfully.
                                </div>
                            )}

                            {/* Error Message */}
                            {reviewError && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                    <strong>Error:</strong> {reviewError}
                                </div>
                            )}

                            <form onSubmit={handleSubmitReview}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <input
                                        type="text"
                                        placeholder="Your Name"
                                        value={reviewForm.customerName}
                                        onChange={(e) => setReviewForm(prev => ({ ...prev, customerName: e.target.value }))}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                        disabled={isSubmittingReview}
                                    />
                                    <input
                                        type="email"
                                        placeholder="Your Email"
                                        value={reviewForm.customerEmail}
                                        onChange={(e) => setReviewForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                        disabled={isSubmittingReview}
                                    />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Review Title"
                                    value={reviewForm.title}
                                    onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                                    required
                                    disabled={isSubmittingReview}
                                />
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                                    <div className="flex gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setReviewForm(prev => ({ ...prev, rating: i + 1 }))}
                                                className="text-2xl disabled:opacity-50"
                                                disabled={isSubmittingReview}
                                            >
                                                <FaStar
                                                    className={`h-6 w-6 ${i < reviewForm.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <textarea
                                    placeholder="Your Review"
                                    value={reviewForm.comment}
                                    onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                                    rows={4}
                                    required
                                    disabled={isSubmittingReview}
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={isSubmittingReview}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isSubmittingReview ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Submitting...
                                            </>
                                        ) : (
                                            'Submit Review'
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowReviewForm(false);
                                            setReviewError('');
                                            setReviewSuccess(false);
                                        }}
                                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                                        disabled={isSubmittingReview}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Reviews List */}
                    <div className="space-y-4">
                        {reviews.length === 0 ? (
                            <p className="text-gray-600 text-center py-8">No reviews yet. Be the first to review!</p>
                        ) : (
                            reviews.map((review) => (
                                <div key={review.id} className="border-b border-gray-200 pb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex items-center">
                                            {[...Array(5)].map((_, i) => (
                                                <FaStar
                                                    key={i}
                                                    className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="font-medium">{review.customerName}</span>
                                        <span className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString()}</span>
                                        {review.verifiedPurchase && (
                                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">Verified Purchase</span>
                                        )}
                                    </div>
                                    <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>
                                    <p className="text-gray-700 mb-2">{review.comment}</p>
                                    <button className="text-sm text-blue-600 hover:text-blue-700">
                                        Helpful ({review.helpful})
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
