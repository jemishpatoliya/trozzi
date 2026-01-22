import React, { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
// import "App.css";

import { Autoplay, Navigation } from 'swiper/modules';

import { fetchBanners } from '../../api/catalog';

const Homeslider = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchBanners({ position: 'home_hero' });
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
    <>
      <div className='homesilder py-3 md:py-4'>
        <div className='container'>
          <Swiper spaceBetween={10} navigation={true} modules={[Navigation, Autoplay]} autoplay={{ delay: 2500, disableOnInteraction: false }} className="silderhome">
            {items.map((b) => (
              <SwiperSlide key={b.id}>
                <div className='item rounded-2xl overflow-hidden'>
                  <div className='w-full aspect-[16/9] sm:aspect-[16/6] bg-gray-100'>
                    <img src={b.imageUrl} alt='Banner silder' className='w-full h-full object-cover' />
                  </div>
                </div>
              </SwiperSlide>
            ))}


          </Swiper>
        </div>
      </div>
    </>
  )
}

export default Homeslider
