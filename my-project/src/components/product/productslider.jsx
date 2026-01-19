
// src/components/product/ProductSlider.jsx
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import ProductCard from "./ProductCard";
import "./Productslider.css";

const ProductSlider = ({ products }) => {
  return (
    <div className="product-slider">
      <Swiper
        slidesPerView={6}          // ek time ma 6 product
        slidesPerGroup={6}         // arrow click → 6 product shift
        spaceBetween={20}          // gap between cards
        navigation={true}          // arrows enable
        loop={true}                // infinite scroll
        modules={[Navigation]}
        className="pb-10"
      >
        {products.slice(0, 50).map((product, index) => (
          <SwiperSlide key={index}>
            <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ProductSlider;
