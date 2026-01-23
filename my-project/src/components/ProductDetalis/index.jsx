import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Qtybox from '../QtyBox';
import Rating from '@mui/material/Rating';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { FaCartShopping } from "react-icons/fa6";
import { FaRegHeart } from "react-icons/fa";
import { IoIosGitCompare } from "react-icons/io";
import ColorPicker from '../product/ColorPicker';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import { normalizeColorKey, normalizeToken } from '../../utils/colorVariants';
import { fetchSizeGuide } from '../../api/sizeGuides';

const ProductDetalisComponent = ({ product, selectedColorVariant, onColorSelect, useVariantImages = true }) => {
  const [productActionsIndex, setProductActionsIndex] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0] || 'M');
  const [selectedSimpleColor, setSelectedSimpleColor] = useState(product?.colors?.[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [sizeGuideData, setSizeGuideData] = useState(null);

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
  const { toggleCompare } = useCompare();

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

  const handleBuyNow = async () => {
    if (isAdding || !productId) return;
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search || ''}`)}`);
      return;
    }
    setIsAdding(true);
    try {
      await addToCart(productId, quantity, {
        name: product?.name,
        image: currentImages?.[0],
        price: currentPrice,
        brand: product?.brand,
        sku: currentSku,
        color: hasColorVariants ? currentVariant?.colorName : selectedSimpleColor,
        size: selectedSize,
      });
      navigate('/checkout');
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

  const handleCompare = async () => {
    if (isAdding || !productId) return;
    setIsAdding(true);
    try {
      await toggleCompare(productId, {
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

  const handleProductActions = (index) => {
    setProductActionsIndex(index);
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
        <Rating name="size-small" defaultValue={4} size="small" readOnly />
        <span className="text-gray-500 text-[12px] md:text-[14px] cursor-pointer hover:underline">
          Review (5)
        </span>
      </div>

      {/* Price */}
      <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-1 md:mt-2 mb-4 md:mb-6">
        {Number(product?.originalPrice ?? 0) > Number(currentPrice ?? product?.price ?? 0) && (
          <span className="oldprice line-through text-gray-400 text-[16px] md:text-[20px] font-[500]">
            Rs. {product?.originalPrice ?? 999}
          </span>
        )}
        <span className="newprice text-[18px] md:text-[22px] font-[700] text-red-600">
          Rs. {currentPrice ?? 799}
        </span>
        <span className="text-gray-500 text-[12px] md:text-[14px] cursor-pointer mt-1">
          Available In Stock:{" "}
          <span className="text-green-600 text-[13px] md:text-[16px] font-bold">
            {typeof currentStock === "number" ? `${currentStock} Items` : "147 Items"}
          </span>
        </span>
        {hasColorVariants && currentVariant && (
          <span className="text-gray-500 text-[12px] md:text-[14px]">
            SKU: <span className="font-medium">{currentSku}</span>
          </span>
        )}
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

      {sizeGuideRows.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-600 text-[16px] font-[500]">Size Guide</span>
            <button
              type="button"
              onClick={() => setIsSizeGuideOpen(true)}
              className="text-[14px] font-[500] text-blue-600 hover:underline"
            >
              View
            </button>
          </div>

          <Dialog open={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Size Guide</DialogTitle>
            <DialogContent>
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
        <div className="QtyBoxWrapper w-[80px]">
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full h-10 px-2 border border-gray-300 rounded-md text-center"
          />
        </div>
        <Button
          variant="contained"
          disabled={isAdding || !productId}
          onClick={handleAddToCart}
          className="!bg-red-600 !text-white !px-6 !py-3 !rounded-md hover:!bg-black transition-all duration-300 flex items-center gap-2"
        >
          <FaCartShopping className="text-[20px]" /> {isAdding ? 'Adding...' : 'Add To Cart'}
        </Button>

        <Button
          variant="contained"
          disabled={isAdding || !productId}
          onClick={handleBuyNow}
          className="!bg-black !text-white !px-6 !py-3 !rounded-md hover:!bg-red-600 transition-all duration-300"
        >
          {isAdding ? 'Please wait...' : 'Buy Now'}
        </Button>
      </div>


      <div className="flex flex-wrap items-center gap-4 mt-5 md:mt-6">
        <button
          type="button"
          disabled={isAdding || !productId}
          onClick={handleWishlist}
          className="flex items-center gap-2 text-[13px] md:text-[15px] font-[500] text-gray-700 hover:text-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaRegHeart className="text-[16px] md:text-[18px]" /> {isAdding ? 'Adding...' : 'Add to Wishlist'}
        </button>
        <button
          type="button"
          disabled={isAdding || !productId}
          onClick={handleCompare}
          className="flex items-center gap-2 text-[13px] md:text-[15px] font-[500] text-gray-700 hover:text-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IoIosGitCompare className="text-[16px] md:text-[18px]" /> {isAdding ? 'Adding...' : 'Add to Compare'}
        </button>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-3 sm:px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <div className="flex gap-3">
          <button
            type="button"
            disabled={isAdding || !productId}
            onClick={handleAddToCart}
            className="flex-1 h-11 rounded-lg border border-green-600 text-green-700 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? 'Please wait...' : 'Add to Cart'}
          </button>
          <button
            type="button"
            disabled={isAdding || !productId}
            onClick={handleBuyNow}
            className="flex-1 h-11 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? 'Please wait...' : 'Buy Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetalisComponent;
