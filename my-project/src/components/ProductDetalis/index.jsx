import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Rating from '@mui/material/Rating';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { FaCartShopping } from "react-icons/fa6";
import { FaRegHeart, FaShareAlt } from "react-icons/fa";
import ColorPicker from '../product/ColorPicker';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { normalizeColorKey, normalizeToken } from '../../utils/colorVariants';
import { fetchSizeGuide } from '../../api/sizeGuides';

const ProductDetalisComponent = ({ product, selectedColorVariant, onColorSelect, useVariantImages = true }) => {
  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0] || 'M');
  const [selectedSimpleColor, setSelectedSimpleColor] = useState(product?.colors?.[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [sizeGuideData, setSizeGuideData] = useState(null);

  const materialValues = useMemo(() => {
    const sets = Array.isArray(product?.attributeSets)
      ? product.attributeSets
      : (Array.isArray(product?.management?.attributes?.sets) ? product.management.attributes.sets : []);

    const match = sets.find((s) => {
      const name = typeof s?.name === 'string' ? s.name.trim().toLowerCase() : '';
      return name === 'material' || name.includes('material');
    });

    const raw = match?.values;
    const vals = Array.isArray(raw) ? raw : (raw === undefined || raw === null ? [] : [raw]);
    return vals
      .map((v) => String(v ?? '').trim())
      .filter((v) => v.length > 0);
  }, [product?.attributeSets, product?.management?.attributes?.sets]);

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    setSelectedSimpleColor(product?.colors?.[0] || '');
  }, [product?.id, product?._id, product?.colors]);

  useEffect(() => {
    const sizes = Array.isArray(product?.sizes) ? product.sizes.filter(Boolean) : [];
    if (sizes.length === 0) return;
    setSelectedSize((prev) => (prev && sizes.includes(prev) ? prev : sizes[0]));
  }, [product?.id, product?._id, product?.sizes]);

  const sizesList = useMemo(() => {
    return Array.isArray(product?.sizes) ? product.sizes.filter(Boolean) : [];
  }, [product?.sizes]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const explicitKey = String(product?.sizeGuideKey || '').trim();
        // Fallback mapping: if product.category is a name ("Accessories"), map to a default key.
        const raw = String(product?.category || '').trim().toLowerCase();
        const fallbackKey = raw.includes('shoe') ? 'shoes' : (raw.includes('accessor') ? 'accessories' : 'apparel');
        const categoryKey = explicitKey || fallbackKey;
        const data = await fetchSizeGuide(categoryKey);
        if (!cancelled) setSizeGuideData(data);
      } catch {
        if (!cancelled) setSizeGuideData(null);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [product?.id, product?._id, product?.category, product?.sizeGuideKey]);

  const sizeGuideColumns = useMemo(() => {
    const cols = Array.isArray(sizeGuideData?.columns) ? sizeGuideData.columns : [];
    return cols.length > 0 ? cols : [{ key: 'size', label: 'Size' }, { key: 'measurements', label: 'Measurements' }];
  }, [sizeGuideData]);

  const sizeGuideRows = useMemo(() => {
    const rows = Array.isArray(sizeGuideData?.rows) ? sizeGuideData.rows : [];
    if (rows.length === 0) return [];

    const available = new Set(sizesList.map((s) => String(s).trim().toLowerCase()));
    const filtered = rows.filter((r) => {
      const size = String(r?.size ?? '').trim().toLowerCase();
      if (!size) return true;
      if (available.size === 0) return true;
      return available.has(size);
    });

    return filtered;
  }, [sizeGuideData, sizesList]);

  const { addToCart } = useCart();
  const { toggleWishlist } = useWishlist();

  const hasSizeGuideImage = useMemo(() => {
    return String(product?.sizeGuideImageUrl || '').trim().length > 0;
  }, [product?.sizeGuideImageUrl]);

  const handleShare = async () => {
    if (!productId) return;

    const url = `${window.location.origin}/product/${productId}${location.search || ''}`;
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

  // Handle color variant selection
  const handleColorSelect = (color) => {
    const variants = Array.isArray(product?.colorVariants) ? product.colorVariants : [];
    // If ColorPicker passes a full variant object, use it directly.
    if (color && typeof color === 'object' && (typeof color.colorName === 'string' || typeof color.color === 'string')) {
      const images = Array.isArray(color?.images) ? color.images.filter(Boolean) : [];
      if (variants.length > 0 && images.length > 0) {
        if (onColorSelect) onColorSelect(color);
        return;
      }
    }

    const desired = String(color?.colorName || color?.color || color || '').trim();
    const desiredKey = normalizeColorKey(desired);
    const desiredToken = normalizeToken(desired);

    const variant = variants.find((v) => {
      const vName = String(v?.colorName || '').trim();
      const vColor = String(v?.color || '').trim();
      return (
        (desiredToken && normalizeToken(vName) === desiredToken) ||
        (desiredToken && normalizeToken(vColor) === desiredToken) ||
        (desiredKey && normalizeColorKey(vName) === desiredKey) ||
        (desiredKey && normalizeColorKey(vColor) === desiredKey)
      );
    });
    if (onColorSelect) {
      onColorSelect(variant || null);
    }
  };

  // Get current variant info
  const currentVariant = selectedColorVariant || (product?.colorVariants?.[0]);
  const hasColorVariants = product?.colorVariants && product.colorVariants.length > 0;
  const colorOptions = (product?.colors && product.colors.length > 0) ? product.colors : [];
  const currentPrice = currentVariant?.price || product?.price;
  const currentStock = currentVariant?.stock || product?.stock;
  const currentSku = currentVariant?.sku || product?.sku;
  const currentName = product?.name;
  const baseImages = [product?.image, ...((product?.galleryImages ?? []) || [])].filter(Boolean);
  const currentImages = hasColorVariants
    ? (useVariantImages ? (Array.isArray(currentVariant?.images) ? currentVariant.images.filter(Boolean) : []) : baseImages)
    : [product?.image].filter(Boolean);
  const productId = product?.id || product?._id;

  // Debounce: disable actions for 1s after any action
  const handleAddToCart = async () => {
    if (isAdding || !productId) return;
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search || ''}`)}`);
      return;
    }
    setIsAdding(true);
    try {
      await addToCart(productId, quantity, {
        name: currentName,
        image: currentImages?.[0],
        price: currentPrice,
        brand: product?.brand,
        sku: currentSku,
        color: hasColorVariants ? currentVariant?.colorName : selectedSimpleColor,
        size: selectedSize,
      });
    } finally {
      setTimeout(() => setIsAdding(false), 1000);
    }
  };

  const handleBuyNow = async () => {
    if (isAdding || !productId) return;
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search || ''}`)}`);
      return;
    }
    setIsAdding(true);
    try {
      const codAvailable = typeof product?.codAvailable === 'boolean'
        ? product.codAvailable
        : Boolean(product?.management?.shipping?.codAvailable);
      const codCharge = Number(product?.codCharge ?? product?.management?.shipping?.codCharge ?? 0) || 0;

      const buyNowItem = {
        _id: productId,
        product: {
          _id: productId,
          name: product?.name || 'Product',
          price: currentPrice ?? product?.price ?? 0,
          image: currentImages?.[0] || '',
          brand: product?.brand || '',
          sku: currentSku || product?.sku || '',
          size: selectedSize || '',
          color: hasColorVariants ? (currentVariant?.colorName || '') : (selectedSimpleColor || ''),
          codAvailable,
          codCharge,
          management: product?.management,
        },
        price: currentPrice ?? product?.price ?? 0,
        quantity: Number(quantity ?? 1) || 1,
        size: selectedSize || '',
        color: hasColorVariants ? (currentVariant?.colorName || '') : (selectedSimpleColor || ''),
        image: currentImages?.[0] || '',
      };

      try {
        sessionStorage.setItem('trozzy_buy_now', JSON.stringify({ items: [buyNowItem] }));
      } catch (_e) {
        // ignore
      }

      navigate('/checkout?mode=buynow');
    } finally {
      setTimeout(() => setIsAdding(false), 1000);
    }
  };

  const handleWishlist = async () => {
    if (isAdding || !productId) return;
    setIsAdding(true);
    try {
      await toggleWishlist(productId, {
        name: product?.name,
        image: currentImages?.[0],
        price: currentPrice,
        brand: product?.brand,
        sku: currentSku,
        color: hasColorVariants ? currentVariant?.colorName : selectedSimpleColor,
        size: selectedSize,
      });
    } finally {
      setTimeout(() => setIsAdding(false), 1000);
    }
  };

  return (
    <div className="productContanet w-full md:w-[60%] px-3 sm:px-4 md:px-10 pb-24 md:pb-0">
      {/* Title */}
      <h1 className="text-[18px] md:text-[28px] font-[600] mb-2 md:mb-3 leading-snug line-clamp-2">
        {product?.name ?? (
          <>
            Siril Poly White & Beign Color Saree With Blouse Piece <br />
            | Sarees for Women | Saree | Saree
          </>
        )}
      </h1>

      {/* Brand + Rating + Review */}
      <div className="flex flex-wrap items-center gap-3 mb-3 md:mb-4">
        <span className="text-gray-400 text-[12px] md:text-[14px]">
          Brands:{" "}
          <span className="font-[500] text-black opacity-75">
            {product?.brand || product?.category || "House of Chikankari"}
          </span>
        </span>
        {Number(product?.rating ?? 0) > 0 ? (
          <Rating name="size-small" value={Number(product?.rating ?? 0)} size="small" readOnly />
        ) : null}
        {Number(product?.reviews ?? 0) > 0 ? (
          <span className="text-gray-500 text-[12px] md:text-[14px] cursor-pointer hover:underline">
            Review ({Number(product?.reviews ?? 0)})
          </span>
        ) : null}
      </div>

      {/* Price */}
      <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-1 md:mt-2 mb-4 md:mb-6">
        {Number(product?.originalPrice ?? 0) > Number(currentPrice ?? product?.price ?? 0) && (
          <span className="oldprice line-through text-gray-400 text-[16px] md:text-[20px] font-[500]">
            Rs. {product?.originalPrice ?? 999}
          </span>
        )}
        <span className="newprice text-[18px] md:text-[22px] font-[700] text-[#2874F0]">
          Rs. {currentPrice ?? 799}
        </span>
        <span className="text-gray-500 text-[12px] md:text-[14px] cursor-pointer mt-1">
          Available In Stock:{" "}
          <span className="text-green-600 text-[13px] md:text-[16px] font-bold">
            {typeof currentStock === "number" ? `${currentStock} Items` : "147 Items"}
          </span>
        </span>
        {currentSku ? (
          <span className="text-gray-500 text-[12px] md:text-[14px]">
            SKU: <span className="font-medium">{currentSku}</span>
          </span>
        ) : null}
      </div>

      {/* Description */}
      <p className="text-gray-600 text-[13px] md:text-[15px] leading-5 md:leading-6 mb-4 md:mb-6">
        {product?.description ?? (
          <>
            Our Chikankari kurta is a beautiful example of Lucknowi craftsmanship.
            Made from soft cotton fabric, it features intricate chikan hand embroidery
            that adds elegance and charm. Perfect for casual outings or festive occasions,
            this kurta blends comfort with style.
          </>
        )}
      </p>

      {materialValues.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4 md:mb-6">
          <span className="text-gray-600 text-[14px] md:text-[16px] font-[500]">Material:</span>
          <span className="text-gray-700 text-[13px] md:text-[15px]">
            {materialValues.join(', ')}
          </span>
        </div>
      )}

      {/* Sizes */}
      <div className="flex flex-wrap items-center gap-3 mb-4 md:mb-6">
        <span className="text-gray-600 text-[14px] md:text-[16px] font-[500]">Size:</span>
        <div className="flex flex-wrap items-center gap-2">
          {sizesList.map((size) => (
            <Button
              key={size}
              className={`!min-w-[38px] md:!min-w-[50px] !rounded-md !py-0.5 md:!py-1 !px-2 md:!px-3 !text-xs md:!text-sm border ${selectedSize === size
                ? "!bg-black !text-white"
                : "!bg-gray-100 !text-gray-700 hover:!bg-black hover:!text-white"
                }`}
              onClick={() => setSelectedSize(size)}
            >
              {size}
            </Button>
          ))}
        </div>
      </div>

      {/* Size Guide */}
      {(hasSizeGuideImage || sizeGuideRows.length > 0) && (
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-600 text-[16px] font-[500]">Size Guide</span>
            <button
              type="button"
              onClick={() => setIsSizeGuideOpen(true)}
              className="h-9 px-3 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-[13px] font-[600] text-[#2874F0] hover:bg-[#EAF2FF] hover:border-[#2874F0]/40 focus:outline-none focus:ring-2 focus:ring-[#2874F0]/30 transition-colors"
            >
              View
            </button>
          </div>

          <Dialog open={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Size Guide</DialogTitle>
            <DialogContent>
              {hasSizeGuideImage ? (
                <div className="mb-4">
                  <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 flex items-center justify-center">
                    <img
                      src={String(product?.sizeGuideImageUrl)}
                      alt="Size guide"
                      className="max-h-[320px] w-auto object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>
              ) : null}

              {sizeGuideRows.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        {sizeGuideColumns.map((c, i) => (
                          <th
                            key={c.key}
                            className={`text-left text-sm font-semibold text-gray-700 border-b py-2 ${i === 0 ? 'pr-3' : ''}`}
                          >
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sizeGuideRows.map((row, idx) => (
                        <tr key={`${idx}-${String(row?.size ?? 'row')}`} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                          {sizeGuideColumns.map((c, i) => (
                            <td
                              key={`${idx}-${c.key}`}
                              className={`${i === 0 ? 'text-sm text-gray-800 py-2 pr-3 align-top font-medium whitespace-nowrap' : 'text-sm text-gray-700 py-2 align-top'}`}
                            >
                              {String(row?.[c.key] ?? '') || (i === 0 ? '-' : '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Color Selection */}
      {(hasColorVariants || colorOptions.length > 0) && (
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="text-gray-600 text-[14px] md:text-[16px] font-[500]">Color:</span>
            <span className="text-gray-500 text-[12px] md:text-[14px]">
              {hasColorVariants ? (currentVariant?.colorName || 'Select a color') : (selectedSimpleColor || 'Select a color')}
            </span>
          </div>
          {hasColorVariants ? (
            <ColorPicker
              colors={product.colorVariants}
              selectedColor={currentVariant?.color}
              onColorSelect={handleColorSelect}
              size="medium"
              showLabels={true}
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((c) => (
                <Button
                  key={c}
                  className={`!min-w-[38px] md:!min-w-[50px] !rounded-md !py-0.5 md:!py-1 !px-2 md:!px-3 !text-xs md:!text-sm border ${String(c) === String(selectedSimpleColor || '')
                    ? "!bg-black !text-white"
                    : "!bg-gray-100 !text-gray-700 hover:!bg-black hover:!text-white"
                    }`}
                  onClick={() => {
                    setSelectedSimpleColor(String(c));
                  }}
                >
                  {c}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quantity + Add to Cart */}
      <div className="hidden md:flex items-center gap-4 py-4">
        <div className="QtyBoxWrapper">
          <div className="inline-flex items-center rounded-md border border-gray-300 overflow-hidden">
            <button
              type="button"
              onClick={() => setQuantity((prev) => Math.max(1, Number(prev || 1) - 1))}
              className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 text-gray-700"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => {
                const raw = parseInt(e.target.value);
                const desired = Number.isFinite(raw) ? raw : 1;
                const max = Number(currentStock ?? 0);
                const capped = Number.isFinite(max) && max > 0 ? Math.min(max, desired) : desired;
                setQuantity(Math.max(1, capped));
              }}
              className="w-[70px] h-10 px-2 text-center outline-none"
            />
            <button
              type="button"
              onClick={() =>
                setQuantity((prev) => {
                  const next = Number(prev || 1) + 1;
                  const max = Number(currentStock ?? 0);
                  if (Number.isFinite(max) && max > 0) return Math.min(max, next);
                  return next;
                })
              }
              className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 text-gray-700"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
        <Button
          variant="contained"
          disabled={isAdding || !productId}
          onClick={handleAddToCart}
          className="!bg-[#FF9F00] !text-gray-900 !px-6 !py-3 !rounded-md hover:!bg-[#fb8c00] transition-all duration-300 flex items-center gap-2 shadow-md"
        >
          <FaCartShopping className="text-[20px]" /> {isAdding ? 'Adding...' : 'Add To Cart'}
        </Button>

        <Button
          variant="contained"
          disabled={isAdding || !productId}
          onClick={handleBuyNow}
          className="!bg-[#2874F0] !text-white !px-6 !py-3 !rounded-md hover:!bg-[#1f5fc6] transition-all duration-300 shadow-md"
        >
          {isAdding ? 'Please wait...' : 'Buy Now'}
        </Button>
      </div>


      <div className="flex flex-wrap items-center gap-4 mt-5 md:mt-6">
        <button
          type="button"
          disabled={isAdding || !productId}
          onClick={handleWishlist}
          className="flex items-center gap-2 text-[13px] md:text-[15px] font-[500] text-gray-700 hover:text-[#2874F0] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaRegHeart className="text-[16px] md:text-[18px]" /> {isAdding ? 'Adding...' : 'Add to Wishlist'}
        </button>

        <button
          type="button"
          disabled={!productId}
          onClick={handleShare}
          className="flex items-center gap-2 text-[13px] md:text-[15px] font-[500] text-gray-700 hover:text-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaShareAlt className="text-[16px] md:text-[18px]" /> Share
        </button>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-3 sm:px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <div className="flex gap-3">
          <button
            type="button"
            disabled={isAdding || !productId}
            onClick={handleAddToCart}
            className="flex-1 h-11 rounded-lg bg-[#FF9F00] text-gray-900 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isAdding ? 'Please wait...' : 'Add to Cart'}
          </button>
          <button
            type="button"
            disabled={isAdding || !productId}
            onClick={handleBuyNow}
            className="flex-1 h-11 rounded-lg bg-[#2874F0] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isAdding ? 'Please wait...' : 'Buy Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetalisComponent;
