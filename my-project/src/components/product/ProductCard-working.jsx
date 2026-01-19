import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBolt, FaCheck, FaHeart, FaRegHeart, FaShoppingCart, FaStar } from "react-icons/fa";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";

const FALLBACK_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

const ProductCard = ({ product, view = "grid" }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [justAdded, setJustAdded] = useState(false);
    const [hoveredImage, setHoveredImage] = useState(null);

    const normalized = useMemo(() => {
        if (!product) return null;
        const id = product.id || product._id;
        const name = product.name ?? product.title ?? "";
        const image = product.image || product.img || product.galleryImages?.[0] || "";

        const price = Number(product.price ?? 0);
        const brand = product.brand || product.category || "";

        const saleEnabled = !!product.saleEnabled;
        const saleDiscount = Number(product.saleDiscount ?? product.discount ?? 0);
        const saleStart = product.saleStartDate ? new Date(product.saleStartDate) : null;
        const saleEnd = product.saleEndDate ? new Date(product.saleEndDate) : null;

        const now = new Date();
        const isSaleActive =
            saleEnabled &&
            saleDiscount > 0 &&
            (!saleStart || Number.isNaN(saleStart.getTime()) || saleStart <= now) &&
            (!saleEnd || Number.isNaN(saleEnd.getTime()) || saleEnd >= now);

        const displayPrice = isSaleActive ? price - (price * saleDiscount) / 100 : price;

        const rating = Number(product.rating ?? 4.2);
        const reviews = Number(product.reviews ?? 0);

        return {
            id,
            name,
            brand,
            price,
            image,
            galleryImages: Array.isArray(product.galleryImages) ? product.galleryImages : [],
            isSaleActive,
            saleDiscount,
            displayPrice,
            rating,
            reviews,
            stock: Number(product.stock ?? 0),
            sku: product.sku ?? "",
            description: product.description ?? "",
            category: product.category ?? "",
            tags: Array.isArray(product.tags) ? product.tags : [],
            keyFeatures: Array.isArray(product.keyFeatures) ? product.keyFeatures : [],
            warranty: product.warranty ?? "",
            dimensions: product.dimensions ?? { length: 0, width: 0, height: 0 },
            weight: product.weight ?? 0,
            colors: Array.isArray(product.colors) ? product.colors : [],
            sizes: Array.isArray(product.sizes) ? product.sizes : [],
            colorVariants: Array.isArray(product.colorVariants) ? product.colorVariants : [],
        };
    }, [product]);

    if (!normalized) return null;

    const handleAddToCart = async () => {
        if (normalized.stock <= 0) return;

        try {
            setIsAddingToCart(true);

            // Add to cart logic
            await addToCart(normalized.id, 1);

            setJustAdded(true);
            setTimeout(() => setJustAdded(false), 2000);
        } catch (error) {
            console.error("Failed to add to cart:", error);
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleWishlistToggle = () => {
        toggleWishlist(normalized.id);
    };

    const handleProductClick = () => {
        navigate(`/product/${normalized.id}`);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    if (view === "list") {
        return (
            <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer group">
                <div className="flex gap-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                            src={hoveredImage || normalized.image}
                            alt={normalized.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = FALLBACK_IMAGE;
                            }}
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {normalized.name}
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">{normalized.brand}</p>

                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-lg font-bold text-gray-900">
                                {formatPrice(normalized.displayPrice)}
                            </span>
                            {normalized.isSaleActive && (
                                <>
                                    <span className="text-sm text-gray-400 line-through">
                                        {formatPrice(normalized.price)}
                                    </span>
                                    <span className="text-sm text-green-600 font-semibold">
                                        {normalized.saleDiscount}% off
                                    </span>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                <FaStar className="h-4 w-4 text-yellow-400 fill-current" />
                                <span>{normalized.rating.toFixed(1)}</span>
                                <span>({normalized.reviews})</span>
                            </div>

                            {normalized.stock > 0 ? (
                                <span className="text-sm text-green-600 font-medium">In Stock</span>
                            ) : (
                                <span className="text-sm text-red-600 font-semibold">Out of Stock</span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleWishlistToggle}
                            className="p-2 rounded-lg border border-gray-300 hover:border-red-500 hover:text-red-500 transition-colors"
                        >
                            {isInWishlist(normalized.id) ? <FaHeart /> : <FaRegHeart />}
                        </button>

                        <button
                            onClick={handleAddToCart}
                            disabled={isAddingToCart || normalized.stock <= 0}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isAddingToCart ? "Adding..." : "Add to Cart"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer">
            <div className="relative">
                {/* Product Image */}
                <div className="aspect-square bg-gray-100 overflow-hidden" onClick={handleProductClick}>
                    <img
                        src={hoveredImage || normalized.image}
                        alt={normalized.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                    />
                </div>

                {/* Wishlist Button */}
                <button
                    onClick={handleWishlistToggle}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
                >
                    {isInWishlist(normalized.id) ? (
                        <FaHeart className="h-4 w-4 text-red-500" />
                    ) : (
                        <FaRegHeart className="h-4 w-4 text-gray-600 hover:text-red-500" />
                    )}
                </button>

                {/* Sale Badge */}
                {normalized.isSaleActive && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                        -{normalized.saleDiscount}%
                    </div>
                )}

                {/* Quick Actions */}
                <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        onClick={handleAddToCart}
                        disabled={isAddingToCart || normalized.stock <= 0}
                        className="flex-1 bg-green-600 text-white text-sm py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-1"
                    >
                        {isAddingToCart ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Adding...
                            </>
                        ) : justAdded ? (
                            <>
                                <FaCheck />
                                Added!
                            </>
                        ) : (
                            <>
                                <FaShoppingCart />
                                Add to Cart
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Product Info */}
            <div className="p-4">
                {/* Product Title */}
                <h3
                    className="font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors cursor-pointer"
                    onClick={handleProductClick}
                >
                    {normalized.name}
                </h3>

                {/* Brand */}
                {normalized.brand && (
                    <div className="text-xs text-gray-500 mt-1">{normalized.brand}</div>
                )}

                {/* Price */}
                <div className="flex items-center gap-2 flex-wrap mt-2">
                    <span className="text-lg font-bold text-gray-900">
                        {formatPrice(normalized.displayPrice)}
                    </span>

                    {normalized.isSaleActive && (
                        <>
                            <span className="text-sm text-gray-400 line-through">
                                {formatPrice(normalized.price)}
                            </span>
                            <span className="text-sm text-green-600 font-semibold">
                                {normalized.saleDiscount}% off
                            </span>
                        </>
                    )}
                </div>

                {/* Rating and Stock */}
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                        <FaStar className="h-4 w-4 text-yellow-400 fill-current" />
                        <span>{normalized.rating.toFixed(1)}</span>
                        <span>({normalized.reviews})</span>
                    </div>

                    {normalized.stock > 0 ? (
                        <span className="text-xs text-green-600 font-medium">In Stock</span>
                    ) : (
                        <span className="text-xs text-red-600 font-semibold">Out of Stock</span>
                    )}
                </div>

                {/* Special Offers */}
                <div className="mt-2 text-xs text-gray-600">
                    🚚 Free Delivery
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
