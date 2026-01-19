import React, { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
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
    <div className='py-5 w-full'>
      <Swiper slidesPerView={props.items} spaceBetween={10} navigation={true} modules={[Navigation]} className="smlbtn">
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
