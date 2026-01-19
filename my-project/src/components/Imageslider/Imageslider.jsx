import React, { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";

import { Link } from 'react-router-dom';

import { fetchBanners } from '../../api/catalog';

const Home = () => {
  const [sliderItems, setSliderItems] = useState([]);
  const [sideItems, setSideItems] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [slider, side] = await Promise.all([
          fetchBanners({ position: 'home_mid_slider' }),
          fetchBanners({ position: 'home_mid_banners' }),
        ]);
        if (cancelled) return;
        setSliderItems(Array.isArray(slider) ? slider : []);
        setSideItems(Array.isArray(side) ? side : []);
      } catch (e) {
        if (cancelled) return;
        setSliderItems([]);
        setSideItems([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const fallbackSliderItems = [
    {
      id: 'fallback-1',
      imageUrl: 'https://serviceapi.spicezgold.com/download/1756273096312_1737036773579_sample-1.jpg',
      linkUrl: '/ProductListing',
    },
    {
      id: 'fallback-2',
      imageUrl: 'https://serviceapi.spicezgold.com/download/1742441193376_1737037654953_New_Project_45.jpg',
      linkUrl: '/ProductListing',
    },
  ];

  const fallbackSideItems = [
    {
      id: 'fallback-side-1',
      imageUrl: 'https://serviceapi.spicezgold.com/download/1741664496923_1737020250515_New_Project_47.jpg',
      linkUrl: '/ProductListing',
    },
    {
      id: 'fallback-side-2',
      imageUrl: 'https://serviceapi.spicezgold.com/download/1741664665391_1741497254110_New_Project_50.jpg',
      linkUrl: '/ProductListing',
    },
  ];

  const finalSliderItems = sliderItems.length ? sliderItems : fallbackSliderItems;
  const finalSideItems = sideItems.length ? sideItems : fallbackSideItems;

  return (
    <>
      {/* Slider + Banners Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-12 gap-6">

            {/* LEFT SIDE SLIDER */}
            <div className="col-span-12 lg:col-span-8">
              <Swiper
                modules={[Navigation]}
                navigation
                slidesPerView={1}
                spaceBetween={20}
                loop={true}
              >
                {finalSliderItems.map((b) => (
                  <SwiperSlide key={b.id}>
                    <Link to={b.linkUrl || '/ProductListing'} className="block">
                      <img
                        src={b.imageUrl}
                        alt="img"
                        className="rounded-xl shadow-md"
                      />
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* RIGHT SIDE BANNERS */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              {finalSideItems.slice(0, 2).map((b, idx) => (
                <div key={b.id || idx} className="banner h-[200px] rounded-xl overflow-hidden relative">
                  <Link to={b.linkUrl || '/ProductListing'} className="block w-full h-full">
                    <img
                      src={b.imageUrl}
                      alt={`banner-${idx}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <button className="bg-red-500 text-white px-4 py-2 rounded-lg shadow">
                        Shop Now
                      </button>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>
    </>
  )
}

export default Home
