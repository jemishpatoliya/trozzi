
// src/components/product/ProductSlider.jsx
import React from "react";
import ProductCard from "./ProductCard";
import "./Productslider.css";

const ProductSlider = ({ products }) => {
  const list = Array.isArray(products) ? products : [];

  return (
    <div className="product-slider">
      <div className="product-slider__track scrollbar-hide">
        {list.slice(0, 50).map((product, index) => (
          <div className="product-slider__item" key={product?.id || product?._id || index}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductSlider;
