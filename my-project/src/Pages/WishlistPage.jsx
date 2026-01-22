import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaShoppingCart, FaTrash } from 'react-icons/fa';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

const FALLBACK_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

const WishlistPage = () => {
    const { items, removeFromWishlist, loading, fetchWishlist } = useWishlist();
    const { addToCart } = useCart();

    useEffect(() => {
        fetchWishlist();
    }, []);

    const handleAddToCart = async (productId) => {
        try {
            const result = await addToCart(productId, 1);
            if (result.success) {
                // Show success message
                const successMessage = document.createElement('div');
                successMessage.textContent = 'Added to cart from wishlist!';
                successMessage.style.cssText = `
                  position: fixed;
                  top: 20px;
                  right: 20px;
                  background: #4CAF50;
                  color: white;
                  padding: 12px 20px;
                  border-radius: 4px;
                  z-index: 9999;
                  font-weight: 500;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                `;
                document.body.appendChild(successMessage);

                // Remove message after 3 seconds
                setTimeout(() => {
                    if (successMessage.parentNode) {
                        successMessage.parentNode.removeChild(successMessage);
                    }
                }, 3000);
            } else {
                // Show error message
                const errorMessage = document.createElement('div');
                errorMessage.textContent = result.error || 'Failed to add to cart';
                errorMessage.style.cssText = `
                  position: fixed;
                  top: 20px;
                  right: 20px;
                  background: #f44336;
                  color: white;
                  padding: 12px 20px;
                  border-radius: 4px;
                  z-index: 9999;
                  font-weight: 500;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                `;
                document.body.appendChild(errorMessage);

                // Remove message after 3 seconds
                setTimeout(() => {
                    if (errorMessage.parentNode) {
                        errorMessage.parentNode.removeChild(errorMessage);
                    }
                }, 3000);
            }
        } catch (error) {
            console.error('Failed to add to cart:', error);
            // Show error message
            const errorMessage = document.createElement('div');
            errorMessage.textContent = 'Failed to add to cart';
            errorMessage.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: #f44336;
              color: white;
              padding: 12px 20px;
              border-radius: 4px;
              z-index: 9999;
              font-weight: 500;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            `;
            document.body.appendChild(errorMessage);

            // Remove message after 3 seconds
            setTimeout(() => {
                if (errorMessage.parentNode) {
                    errorMessage.parentNode.removeChild(errorMessage);
                }
            }, 3000);
        }
    };

    const handleRemoveFromWishlist = async (productId) => {
        try {
            const result = await removeFromWishlist(productId);
            if (result) {
                // Show success message
                const successMessage = document.createElement('div');
                successMessage.textContent = 'Removed from wishlist!';
                successMessage.style.cssText = `
                  position: fixed;
                  top: 20px;
                  right: 20px;
                  background: #4CAF50;
                  color: white;
                  padding: 12px 20px;
                  border-radius: 4px;
                  z-index: 9999;
                  font-weight: 500;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                `;
                document.body.appendChild(successMessage);

                // Remove message after 3 seconds
                setTimeout(() => {
                    if (successMessage.parentNode) {
                        successMessage.parentNode.removeChild(successMessage);
                    }
                }, 3000);
            }
        } catch (error) {
            console.error('Failed to remove from wishlist:', error);
            // Show error message
            const errorMessage = document.createElement('div');
            errorMessage.textContent = 'Failed to remove from wishlist';
            errorMessage.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: #f44336;
              color: white;
              padding: 12px 20px;
              border-radius: 4px;
              z-index: 9999;
              font-weight: 500;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            `;
            document.body.appendChild(errorMessage);

            // Remove message after 3 seconds
            setTimeout(() => {
                if (errorMessage.parentNode) {
                    errorMessage.parentNode.removeChild(errorMessage);
                }
            }, 3000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <p className="mt-2 text-gray-600">Loading wishlist...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">My Wishlist</h1>
                    <p className="text-lg text-gray-600">
                        {items.length === 0
                            ? "Your wishlist is empty"
                            : `You have ${items.length} item${items.length !== 1 ? 's' : ''} in your wishlist`
                        }
                    </p>
                </div>

                {/* Wishlist Items */}
                {items.length === 0 ? (
                    <div className="text-center bg-white rounded-lg shadow p-12">
                        <FaHeart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
                        <p className="text-gray-600 mb-6">
                            Start adding items to your wishlist to keep track of products you love.
                        </p>
                        <Link
                            to="/ProductListing"
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map((item) => {
                            const product = item.product || item;
                            const productId = product._id || product.id;
                            const image = product.image || product.img || FALLBACK_IMAGE;
                            const name = product.name || product.title;
                            const price = product.price || 0;
                            const oldPrice = product.oldPrice;
                            const discount = product.discount || 0;

                            return (
                                <div key={productId} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                    {/* Product Image */}
                                    <div className="relative">
                                        <Link to={`/product/${productId}`}>
                                            <img
                                                src={image}
                                                alt={name}
                                                className="w-full h-48 object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null;
                                                    e.currentTarget.src = FALLBACK_IMAGE;
                                                }}
                                            />
                                        </Link>

                                        {/* Discount Badge */}
                                        {discount > 0 && (
                                            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                                                -{discount}%
                                            </span>
                                        )}

                                        {/* Remove Button */}
                                        <button
                                            onClick={() => handleRemoveFromWishlist(productId)}
                                            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                                        >
                                            <FaTrash className="h-4 w-4 text-red-500" />
                                        </button>
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-4">
                                        <Link to={`/product/${productId}`}>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-indigo-600 line-clamp-2">
                                                {name}
                                            </h3>
                                        </Link>

                                        {/* Price */}
                                        <div className="mb-4">
                                            {oldPrice && (
                                                <span className="text-gray-400 line-through mr-2">₹{oldPrice}</span>
                                            )}
                                            <span className="text-xl font-bold text-red-600">₹{price}</span>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAddToCart(productId)}
                                                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <FaShoppingCart className="h-4 w-4" />
                                                Add to Cart
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Continue Shopping Link */}
                {items.length > 0 && (
                    <div className="text-center mt-12">
                        <Link
                            to="/ProductListing"
                            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WishlistPage;
