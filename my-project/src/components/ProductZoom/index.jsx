import React, { useEffect, useState, useRef } from 'react';
import InnerImageZoom from 'react-inner-image-zoom';
import 'react-inner-image-zoom/lib/styles.min.css';
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
                                    className={`item rounded-md overflow-hidden cursor-pointer group  ${SlideIndex === idx ? 'opacity-1' : 'opacity-30'}`}
                                    onClick={() => goto(idx)}
                                >
                                    <img
                                        src={src}
                                        alt={product?.name ?? 'Product image'}
                                        className='w-full transition-all ease-in duration-300 group-hover:scale-105'
                                    />
                                </div>
                            </SwiperSlide>
                        )) : (
                            <SwiperSlide key="no-images">
                                <div className="h-[500px] flex items-center justify-center text-gray-500 text-sm">
                                    No images available for selected color
                                </div>
                            </SwiperSlide>
                        )}
                    </Swiper>
                </div>

                {/* Main Zoom Image */}
                <div className='zoomContainer w-full md:w-[85%] h-[320px] sm:h-[380px] md:h-[500px] overflow-hidden rounded-md'>
                    <Swiper
                        ref={zoomSliderBig}
                        slidesPerView={1}
                        spaceBetween={0}
                        navigation={false}
                    >
                        {finalImages.length > 0 ? finalImages.map((src, idx) => (
                            <SwiperSlide key={src + idx}>
                                <InnerImageZoom
                                    zoomType='hover'
                                    zoomScale={1.5}
                                    src={src}
                                />
                            </SwiperSlide>
                        )) : (
                            <SwiperSlide key="no-images-main">
                                <div className="h-[500px] flex items-center justify-center text-gray-500 text-sm">
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
