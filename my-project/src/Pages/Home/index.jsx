import React from 'react'
import Homeslider from '../../components/Homeslider'
import Adsbennerslider from '../../components/Adsbannerslider'
import PopularProducts from '../../components/product/popularproduct'
import Imageslider from '../../components/Imageslider/Imageslider'
import LatestProducts from '../../components/Latestproduct/latestproduct'
import FeaturedSlider from '../../components/FeaturedSlider/FeaturedSlider'
import AdBannerSection from '../../components/aBanner/Banner'
import WellnessSection from '../../components/welness/welness'
import BlogSection from '../../components/Blog/Blog'


// Main Home component
const Home = () => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <Homeslider />
        {/* <Homecatslider /> */}
      </section>

      {/* Products Section */}
      <section className="products-section">
        <PopularProducts />
        {/* 👇 AdBanner added below PopularProducts */}
        <AdBannerSection />
        <Imageslider />
        <LatestProducts title="Latest Products" />
        <FeaturedSlider />
      </section>

      {/* Promotions Section */}
      <section className="promotions-section py-6 sm:py-12 bg-white">
        <div className="container mx-auto px-3 sm:px-4">
          {/* <FreeShippingBanner /> */}
          <Adsbennerslider items={4} />
        </div>
      </section>

      {/* Content Sections */}
      <section className="content-sections">
        <WellnessSection />
        <BlogSection />
      </section>
    </div>
  )
}

export default Home
