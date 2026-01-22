
// src/components/product/ProductSlider.jsx
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { FreeMode, Navigation } from "swiper/modules";
import ProductCard from "./ProductCard";
import "./Productslider.css";

const ProductSlider = ({ products }) => {
  return (
    <div className="product-slider">
      <Swiper
        slidesPerView={1.9}
        spaceBetween={10}
        navigation={false}
        loop={false}
        freeMode
        grabCursor
        modules={[Navigation, FreeMode]}
        breakpoints={{
          360: { slidesPerView: 1.9, spaceBetween: 10 },
          430: { slidesPerView: 2.1, spaceBetween: 10 },
          640: { slidesPerView: 3.2, spaceBetween: 14 },
          768: { slidesPerView: 4, spaceBetween: 16, freeMode: false },
          1024: { slidesPerView: 6, spaceBetween: 20, freeMode: false },
        }}
      >
        {products.slice(0, 50).map((product, index) => (
          <SwiperSlide key={product?.id || product?._id || index}>
            <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ProductSlider;
