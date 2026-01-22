import React, { useEffect, useState } from "react";
import "./Banner.css";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Autoplay, Pagination } from "swiper/modules";

import { fetchBanners } from "../../api/catalog";

const AdBannerSection = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchBanners({ position: "home_ad_grid" });
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setItems([]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="container banner-section">
      <div className="md:hidden -mx-3">
        <Swiper
          slidesPerView={1.15}
          spaceBetween={10}
          pagination={{ clickable: true }}
          autoplay={{ delay: 2500, disableOnInteraction: false }}
          modules={[Autoplay, Pagination]}
        >
          {items.map((item) => (
            <SwiperSlide key={item.id}>
              <div className="banner-card px-3">
                <img src={item.imageUrl} alt={`banner-${item.id}`} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className="hidden md:block">
        <div className="banner-container">
          {items.map((item) => (
            <div className="banner-card" key={item.id}>
              <img src={item.imageUrl} alt={`banner-${item.id}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdBannerSection;
