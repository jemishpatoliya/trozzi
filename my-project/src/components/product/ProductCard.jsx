//         </div>

//         <button
//           type="button"
//           onClick={handleAddToCart}
//           disabled={isAddingToCart || normalized.stock <= 0}
//           className={
//             isList
//               ? "mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
//               : "mt-auto w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
//           }
//         >
//           {justAdded ? (
//             <>
//               <FaCheck />
//               Added
//             </>
//           ) : (
//             <>
//               <FaShoppingCart />
//               {isAddingToCart ? "Adding..." : "Add to cart"}
//             </>
//           )}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default ProductCard;


import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaBolt, FaCheck, FaHeart, FaRegHeart, FaShoppingCart, FaStar } from "react-icons/fa";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import ColorPicker from "./ColorPicker";
import { normalizeProductForColorVariants } from "../../utils/colorVariants";

const ProductCard = ({ product, view = "grid" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [hoveredImage, setHoveredImage] = useState(null);
  const [selectedColorVariant, setSelectedColorVariant] = useState(null);

  const normalized = useMemo(() => {
    try {
      if (!product) return null;
      const baseProduct = normalizeProductForColorVariants(product);
      const id = baseProduct.id || baseProduct._id;
      const name = baseProduct.name ?? baseProduct.title ?? "";

      // Handle color variants
      const hasColorVariants = baseProduct.colorVariants && baseProduct.colorVariants.length > 0;
      const defaultVariant = hasColorVariants ? baseProduct.colorVariants[0] : null;
      const currentVariant = selectedColorVariant || defaultVariant;

      // Get image from variant or fallback to product image
      const image = currentVariant?.images?.[0] || baseProduct.image || baseProduct.img || baseProduct.galleryImages?.[0] || "";

      // Get price from variant or fallback to product price
      const price = Number(currentVariant?.price ?? baseProduct.price ?? 0);

      const originalPrice = Number(baseProduct?.originalPrice ?? baseProduct?.management?.pricing?.originalPrice ?? 0);

      // Get stock from variant or fallback to product stock
      const stock = Number(currentVariant?.stock ?? baseProduct.stock ?? 0);

      // Get SKU from variant or fallback to product SKU
      const sku = currentVariant?.sku || baseProduct.sku || "";

      const brand = baseProduct.brand || baseProduct.category || "";

      const saleEnabled = !!baseProduct.saleEnabled;
      const saleDiscount = Number(baseProduct.saleDiscount ?? baseProduct.discount ?? 0);
      const saleStart = baseProduct.saleStartDate ? new Date(baseProduct.saleStartDate) : null;
      const saleEnd = baseProduct.saleEndDate ? new Date(baseProduct.saleEndDate) : null;

      const now = new Date();
      const isSaleActive =
        saleEnabled &&
        saleDiscount > 0 &&
        (!saleStart || Number.isNaN(saleStart.getTime()) || saleStart <= now) &&
        (!saleEnd || Number.isNaN(saleEnd.getTime()) || saleEnd >= now);

      const displayPrice = isSaleActive ? price - (price * saleDiscount) / 100 : price;

      const displayMrp = originalPrice > 0 ? originalPrice : price;

      const reviewsArray = Array.isArray(baseProduct.reviews) ? baseProduct.reviews : [];
      const reviewsCount = Number.isFinite(Number(baseProduct.reviews))
        ? Number(baseProduct.reviews)
        : reviewsArray.length;

      const ratingNumber = Number(baseProduct.rating);
      const avgFromReviews = reviewsArray.length
        ? reviewsArray.reduce((sum, r) => sum + Number(r?.rating ?? 0), 0) / reviewsArray.length
        : 0;
      const rating = Number.isFinite(ratingNumber) && ratingNumber > 0 ? ratingNumber : avgFromReviews;
      const reviews = Number.isFinite(reviewsCount) ? reviewsCount : 0;

      return {
        id,
        name,
        brand,
        price,
        originalPrice: displayMrp,
        image,
        galleryImages: currentVariant?.images ?? (Array.isArray(baseProduct.galleryImages) ? baseProduct.galleryImages : []),
        isSaleActive,
        saleDiscount,
        displayPrice,
        rating,
        reviews,
        stock,
        sku,
        hasColorVariants,
        colorVariants: baseProduct.colorVariants || [],
        currentVariant,
      };
    } catch (_e) {
      return null;
    }
  }, [product, selectedColorVariant]);

  if (!normalized) return null;

  const displayImage = hoveredImage || normalized.image;
  const wishlisted = isInWishlist(normalized.id);

  const formatPrice = (value) => `₹${Number(value || 0).toLocaleString()}`;

  const handleProductClick = (e) => {
    e.stopPropagation();
    navigate(`/product/${normalized.id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!normalized.id) return;
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search || ''}`)}`);
      return;
    }

    setIsAddingToCart(true);
    try {
      const result = await addToCart(normalized.id, 1, {
        name: normalized.name,
        image: normalized.image,
        price: normalized.displayPrice,
        brand: normalized.brand,
        sku: normalized.sku,
      });
      if (result?.success) {
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 2000);
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlistToggle = async (e) => {
    e.stopPropagation();
    if (!normalized.id) return;
    await toggleWishlist(normalized.id);
  };

  const isList = view === "list";
  const safeRating = Number.isFinite(Number(normalized.rating)) ? Number(normalized.rating) : 0;

  return (
    <div className="animate-fade-in">
      <div
        role="button"
        tabIndex={0}
        onClick={handleProductClick}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleProductClick();
        }}
        className={
          isList
            ? "group cursor-pointer overflow-hidden rounded-lg bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 flex h-[280px]"
            : "group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_24px_rgba(0,0,0,0.10)] transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] h-full"
        }
      >
        <div className="transition-transform duration-300 flex flex-col h-full">
          {/* Image Section */}
          <div
            className={
              isList
                ? "aspect-square bg-gray-50 overflow-hidden relative w-[220px] min-w-[220px]"
                : "aspect-square sm:aspect-[4/3] bg-gray-50 overflow-hidden relative"
            }
          >
            <div className={isList ? "relative overflow-hidden w-full h-full p-2" : "relative overflow-hidden w-full h-full p-2"}>
              <img
                src={displayImage}
                alt={normalized.name}
                className={
                  isList
                    ? "w-full h-full object-contain transition-all duration-500 group-hover:scale-105"
                    : "w-full h-full object-contain transition-all duration-500 group-hover:scale-105"
                }
                loading="lazy"
              />
            </div>

            <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/35 to-transparent" />

            {/* Discount Badge */}
            {normalized.isSaleActive && normalized.saleDiscount > 0 && (
              <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-md font-bold shadow-md animate-bounce-in">
                {normalized.saleDiscount}% OFF
              </div>
            )}

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={handleWishlistToggle}
              className="absolute top-2 right-2 h-9 w-9 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white transition-all"
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              {wishlisted ? (
                <FaHeart className="text-pink-600" />
              ) : (
                <FaRegHeart className="text-gray-700" />
              )}
            </button>

            <div className="absolute left-2 bottom-2 flex items-center gap-2">
              <div className="flex items-center gap-1 bg-green-600/95 px-2 py-1 rounded-lg text-white text-[11px] font-semibold">
                <span className="font-bold">{safeRating.toFixed(1)}</span>
                <FaStar className="h-3 w-3 fill-current" />
              </div>

              {normalized.isSaleActive && normalized.saleDiscount > 0 && (
                <div className="bg-white/95 backdrop-blur px-2 py-1 rounded-lg text-[11px] font-semibold text-orange-700">
                  {normalized.saleDiscount}% OFF
                </div>
              )}
            </div>

            {/* Gallery Thumbnails */}
            {normalized.galleryImages?.length > 1 && !isList && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1">
                {normalized.galleryImages.slice(0, 4).map((url, idx) => (
                  <button
                    key={`${normalized.id}-thumb-${idx}`}
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      setHoveredImage(url);
                    }}
                    onMouseLeave={(e) => {
                      e.stopPropagation();
                      setHoveredImage(null);
                    }}
                    className={
                      hoveredImage === url
                        ? "h-6 w-6 sm:h-7 sm:w-7 rounded-full border-2 border-blue-600 overflow-hidden"
                        : "h-6 w-6 sm:h-7 sm:w-7 rounded-full border border-white/60 overflow-hidden"
                    }
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-2.5 sm:p-3 space-y-1.5 sm:space-y-2 flex flex-col flex-1">
            {/* Product Title */}
            <h3 className="font-semibold text-[14px] sm:text-[15px] text-gray-900 line-clamp-2 leading-snug">
              {normalized.name}
            </h3>

            {/* Brand */}

            {/* Price Section */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[15px] sm:text-lg font-extrabold text-gray-900">
                {formatPrice(normalized.displayPrice)}
              </span>

              {normalized.originalPrice > normalized.displayPrice && (
                <span className="text-xs sm:text-sm text-gray-400 line-through">
                  {formatPrice(normalized.originalPrice)}
                </span>
              )}

              {normalized.isSaleActive && (
                <span className="text-xs sm:text-sm text-green-600 font-semibold">
                  {normalized.saleDiscount}% off
                </span>
              )}
            </div>

            {normalized.stock <= 0 ? (
              <div className="text-xs font-semibold text-red-600">Out of stock</div>
            ) : null}

            {/* Add to Cart Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAddingToCart || normalized.stock <= 0}
              className="w-full mt-auto inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-[12px] sm:text-sm font-semibold bg-white border border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
            >
              {justAdded ? (
                <>
                  <FaCheck />
                  Added to Cart
                </>
              ) : (
                <>
                  <FaShoppingCart className="hidden sm:inline" />
                  {isAddingToCart ? (
                    "Adding..."
                  ) : (
                    <>
                      <span className="sm:hidden">ADD</span>
                      <span className="hidden sm:inline">Add to Cart</span>
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;