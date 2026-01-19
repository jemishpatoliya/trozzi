import React, { useState } from 'react';
import ColorPicker from './ColorPicker';

const ColorVariantSelector = ({
    product,
    selectedVariant,
    onVariantSelect,
    className = ""
}) => {
    const [currentVariant, setCurrentVariant] = useState(selectedVariant);

    const handleColorSelect = (color) => {
        const variant = product.colorVariants?.find(v => v.color === color.color);
        if (variant) {
            setCurrentVariant(variant);
            onVariantSelect(variant);
        }
    };

    const getMainImage = () => {
        if (currentVariant?.images?.length > 0) {
            return currentVariant.images[0];
        }
        return product.image;
    };

    const getGalleryImages = () => {
        if (currentVariant?.images?.length > 0) {
            return currentVariant.images;
        }
        return product.galleryImages || [];
    };

    const getPrice = () => {
        if (currentVariant?.price) {
            return currentVariant.price;
        }
        return product.price;
    };

    const getStock = () => {
        if (currentVariant?.stock !== undefined) {
            return currentVariant.stock;
        }
        return product.stock;
    };

    const getSku = () => {
        if (currentVariant?.sku) {
            return currentVariant.sku;
        }
        return product.sku;
    };

    if (!product.colorVariants || product.colorVariants.length === 0) {
        return null;
    }

    return (
        <div className={`color-variant-selector ${className}`}>
            {/* Color Selection */}
            <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Color: {currentVariant?.colorName || 'Select a color'}</h3>
                <ColorPicker
                    colors={product.colorVariants}
                    selectedColor={currentVariant?.color}
                    onColorSelect={handleColorSelect}
                    size="medium"
                    showLabels={true}
                />
            </div>

            {/* Variant Information */}
            {currentVariant && (
                <div className="variant-info bg-gray-50 p-3 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500">Price:</span>
                            <span className="ml-2 font-medium text-green-600">${getPrice().toFixed(2)}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Stock:</span>
                            <span className={`ml-2 font-medium ${getStock() > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {getStock() > 0 ? `${getStock()} available` : 'Out of stock'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500">SKU:</span>
                            <span className="ml-2 font-medium">{getSku()}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Color:</span>
                            <span className="ml-2 font-medium">{currentVariant.colorName}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden data for parent components */}
            <div className="hidden">
                <div data-main-image={getMainImage()} />
                <div data-gallery-images={JSON.stringify(getGalleryImages())} />
                <div data-price={getPrice()} />
                <div data-stock={getStock()} />
                <div data-sku={getSku()} />
            </div>
        </div>
    );
};

export default ColorVariantSelector;
