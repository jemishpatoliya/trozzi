import React, { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation } from 'swiper/modules';
import { FreeMode } from 'swiper/modules';
import { Autoplay, Pagination } from 'swiper/modules';
import BannerBox from '../BannerBox';

import { fetchBanners } from '../../api/catalog';

const Adsbennerslider = (props) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchBanners({ position: 'home_promo_slider' });
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
    <div className='py-2 sm:py-4 w-full -mx-3 sm:mx-0'>
      <Swiper
        slidesPerView={1}
        spaceBetween={12}
        centeredSlides={false}
        freeMode={false}
        autoplay={{ delay: 2500, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation={false}
        modules={[Navigation, FreeMode, Autoplay, Pagination]}
        breakpoints={{
          360: { slidesPerView: 1.05, spaceBetween: 10, pagination: { clickable: true }, autoplay: { delay: 2500, disableOnInteraction: false } },
          430: { slidesPerView: 1.1, spaceBetween: 10, pagination: { clickable: true }, autoplay: { delay: 2500, disableOnInteraction: false } },
          640: { slidesPerView: 3, freeMode: true, autoplay: false, pagination: false },
          768: { slidesPerView: 4, freeMode: true, autoplay: false, pagination: false },
          1024: { slidesPerView: props.items || 4, navigation: true, freeMode: false, autoplay: false, pagination: false },
        }}
        className="smlbtn w-full"
      >
        {items.map((b) => (
          <SwiperSlide key={b.id}>
            <BannerBox img={b.imageUrl} link={b.linkUrl} />
          </SwiperSlide>
        ))}

      </Swiper>
    </div>
  )
}

export default Adsbennerslider
