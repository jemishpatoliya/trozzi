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
import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaCheck, FaCheckCircle, FaHeart, FaRegHeart, FaShareAlt, FaShoppingCart, FaStar, FaTruck } from "react-icons/fa";
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

      const featured = Boolean(baseProduct.featured ?? baseProduct?.management?.marketing?.featured);
      const badge = String(baseProduct.badge ?? baseProduct?.management?.marketing?.badge ?? '').trim();
      const freeShipping = typeof baseProduct?.freeShipping === 'boolean'
        ? baseProduct.freeShipping
        : Boolean(baseProduct?.management?.shipping?.freeShipping);

      const salePageEnabled = Boolean(baseProduct?.salePageEnabled ?? baseProduct?.management?.salePage?.enabled);
      const salePageBannerText = String(baseProduct?.salePageBannerText ?? baseProduct?.management?.salePage?.bannerText ?? '');

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

      const discountPercent = displayMrp > 0 && displayPrice > 0 && displayMrp > displayPrice
        ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100)
        : 0;

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
        discountPercent,
        featured,
        badge,
        freeShipping,
        salePageEnabled,
        salePageBannerText,
        management: baseProduct?.management,
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

  const handleWishlistToggle = async (e) => {
    e.stopPropagation();
    if (!normalized.id) return;
    await toggleWishlist(normalized.id);
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    if (!normalized.id) return;

    const url = `${window.location.origin}/product/${normalized.id}`;
    const title = String(normalized.name || 'Product');

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

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (isAddingToCart || normalized.stock <= 0 || !normalized.id) return;

    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search || ""}`)}`);
      return;
    }

    try {
      setIsAddingToCart(true);

      await addToCart(normalized.id, 1, {
        name: normalized.name,
        image: displayImage,
        price: displaySelling,
        brand: normalized.brand,
        sku: normalized.sku,
      });

      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const isList = view === "list";
  const safeRating = Number.isFinite(Number(normalized.rating)) ? Number(normalized.rating) : 0;
  const displayMrp = Number(normalized.originalPrice ?? 0) || 0;
  const displaySelling = Number(normalized.displayPrice ?? 0) || 0;

  const shouldShowDiscount = (String(normalized?.badge || '').toLowerCase() === 'sale') || Boolean(normalized?.isSaleActive);
  const shouldShowOffers = Boolean(normalized?.salePageEnabled) || Boolean(String(normalized?.salePageBannerText || '').trim());
  const shouldShowFreeDelivery = Boolean(normalized?.freeShipping);
  const shouldShowRating = safeRating > 0 || Number(normalized?.reviews || 0) > 0;
  const shouldShowTrusted = Boolean(normalized?.featured) || (String(normalized?.badge || '').toLowerCase() === 'trusted');

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
            ? "group cursor-pointer overflow-hidden rounded-lg bg-white border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex h-[280px]"
            : "group cursor-pointer overflow-hidden rounded-xl bg-white border border-gray-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] h-[410px] sm:h-[430px]"
        }
      >
        <div className="transition-transform duration-300 flex flex-col h-full">
          {/* Image Section */}
          <div
            className={
              isList
                ? "aspect-square bg-gray-50 overflow-hidden relative w-[220px] min-w-[220px]"
                : "bg-gray-50 overflow-hidden relative h-[180px] sm:h-[200px]"
            }
          >
            <div className={isList ? "relative overflow-hidden w-full h-full p-2" : "relative overflow-hidden w-full h-full p-2"}>
              <img
                src={displayImage}
                alt={normalized.name}
                width={480}
                height={480}
                className={
                  isList
                    ? "w-full h-full object-contain transition-all duration-500 group-hover:scale-105"
                    : "w-full h-full object-contain transition-all duration-500 group-hover:scale-105"
                }
                loading="lazy"
              />
            </div>

          {/* Discount Badge */}
          {shouldShowDiscount && normalized.discountPercent > 0 && (
            <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-md font-bold shadow-md animate-bounce-in">
              {normalized.discountPercent}% OFF
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

          <button
            type="button"
            onClick={handleShare}
            className="absolute top-2 right-12 h-9 w-9 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white transition-all"
            aria-label="Share product"
          >
            <FaShareAlt className="text-gray-700" />
          </button>

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
                      ? "h-6 w-6 sm:h-7 sm:w-7 rounded-full border-2 border-[#2874F0] overflow-hidden"
                      : "h-6 w-6 sm:h-7 sm:w-7 rounded-full border border-white/60 overflow-hidden"
                  }
                >
                  <img src={url} alt="" width={64} height={64} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-2.5 sm:p-3 space-y-1.5 sm:space-y-2 flex flex-col flex-1">
          {/* Product Title */}
          <h3 className="font-semibold text-[14px] sm:text-[15px] text-[#1A237E] line-clamp-2 leading-snug">
            {normalized.name}
          </h3>

          {/* Price Section */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[18px] sm:text-[20px] font-extrabold text-gray-900">
              {formatPrice(displaySelling)}
            </span>
            {displayMrp > displaySelling ? (
              <span className="text-[13px] sm:text-sm text-gray-400 line-through">
                {formatPrice(displayMrp)}
              </span>
            ) : null}
            {normalized.discountPercent > 0 ? (
              <span className="text-[13px] sm:text-sm text-green-600 font-semibold">
                {normalized.discountPercent}% off
              </span>
            ) : null}
          </div>

          <div className="mt-1 min-h-[28px]">
            {shouldShowOffers ? (
              <div className="inline-flex items-center rounded-md border border-green-300 bg-green-50 text-green-700 px-2 py-1 text-[12px] font-semibold">
                ₹{Math.max(1, Math.round(displaySelling * 0.055))} with 2 Special Offers
              </div>
            ) : null}
          </div>

          <div className="mt-1 min-h-[18px]">
            {shouldShowFreeDelivery ? (
              <div className="flex items-center gap-2 text-[12px] text-gray-600">
                <span className="inline-flex items-center gap-1">
                  <FaTruck className="text-[14px] text-gray-500" />
                  Free Delivery
                </span>
              </div>
            ) : null}
          </div>

          {normalized.stock <= 0 ? (
            <div className="text-xs font-semibold text-red-600">Out of stock</div>
          ) : null}

          <div className="mt-auto">
            <div className="flex items-center justify-between pt-2">
              {shouldShowRating ? (
                <div className="inline-flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded-md text-[12px] font-semibold">
                  <span>{safeRating.toFixed(1)}</span>
                  <FaStar className="h-3 w-3 fill-current" />
                  <span className="text-white/90">({Number(normalized.reviews || 0)})</span>
                </div>
              ) : <span />}

              {shouldShowTrusted ? (
                <div className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#7B1FA2]">
                  <FaCheckCircle className="text-[14px]" />
                  Trusted
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAddingToCart || normalized.stock <= 0}
              className={
                "mt-2 w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold bg-white text-[#2874F0] border border-[#2874F0] hover:bg-[#EAF2FF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              }
            >
              {justAdded ? (
                <>
                  <FaCheck />
                  Added
                </>
              ) : (
                <>
                  <FaShoppingCart />
                  {isAddingToCart ? "Adding..." : "Add to Cart"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ProductCard;