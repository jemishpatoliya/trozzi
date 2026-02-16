import React, { useEffect, useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';

// Install Swiper Navigation module
SwiperCore.use([Navigation]);

const ProductZoom = ({ product, selectedColorVariant, useVariantImages = true }) => {
    const [SlideIndex, setSlideIndex] = useState(0);
    const zoomSliderBig = useRef();
    const zoomSliderSml = useRef();

    const finalImages = (useVariantImages && selectedColorVariant)
        ? ((selectedColorVariant?.images ?? []).filter(Boolean))
        : [
            ...(product?.image ? [product.image] : []),
            ...((product?.galleryImages ?? []).filter(Boolean)),
        ];

    const goto = (index) => {
        setSlideIndex(index);
        zoomSliderBig.current?.swiper?.slideTo(index);
        zoomSliderSml.current?.swiper?.slideTo(index);
    }

    useEffect(() => {
        goto(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useVariantImages, selectedColorVariant?.color, selectedColorVariant?.colorName, finalImages.length]);

    return (
        <>
            <div className='flex flex-col md:flex-row gap-3 max-w-full'>
                {/* Thumbnail Slider */}
                <div className='slider hidden md:block md:w-[15%]'>
                    <Swiper
                        ref={zoomSliderSml} // ✅ moved here
                        direction="vertical"
                        slidesPerView={5}
                        spaceBetween={0}
                        navigation={true}
                        modules={[Navigation]}
                        className="zoomContainerSliderThumbs h-[500px] overflow-hidden"
                    >
                        {finalImages.length > 0 ? finalImages.map((src, idx) => (
                            <SwiperSlide key={src + idx}>
                                <div
                                    className={`item h-[130px] rounded-md overflow-hidden cursor-pointer bg-white flex items-center justify-center ${SlideIndex === idx ? 'opacity-1' : 'opacity-30'}`}
                                    onClick={() => goto(idx)}
                                >
                                    <img
                                        src={src}
                                        alt={product?.name ?? 'Product image'}
                                        className='w-full h-full object-contain bg-white'
                                    />
                                </div>
                            </SwiperSlide>
                        )) : (
                            <SwiperSlide key="no-images">
                                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                                    No images available for selected color
                                </div>
                            </SwiperSlide>
                        )}
                    </Swiper>
                </div>

                {/* Main Zoom Image */}
                <div className='zoomContainer w-full md:w-[85%] h-[320px] sm:h-[380px] md:h-[500px] overflow-hidden rounded-md bg-white'>
                    <Swiper
                        ref={zoomSliderBig}
                        slidesPerView={1}
                        spaceBetween={0}
                        navigation={false}
                        className="h-full"
                    >
                        {finalImages.length > 0 ? finalImages.map((src, idx) => (
                            <SwiperSlide key={src + idx} className="h-full">
                                <div className="w-full h-full flex items-center justify-center bg-white">
                                    <img
                                        src={src}
                                        alt={product?.name ?? 'Product image'}
                                        className="max-w-full max-h-full w-auto h-auto object-contain"
                                    />
                                </div>
                            </SwiperSlide>
                        )) : (
                            <SwiperSlide key="no-images-main">
                                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                                    No images available for selected color
                                </div>
                            </SwiperSlide>
                        )}
                    </Swiper>
                </div>
            </div>
        </>
    )
}

export default ProductZoom;
