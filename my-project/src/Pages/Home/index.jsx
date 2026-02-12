import React from 'react'
import { Link } from 'react-router-dom'
import { FaGem, FaTshirt, FaUtensils } from 'react-icons/fa'
import Homeslider from '../../components/Homeslider'
import Adsbennerslider from '../../components/Adsbannerslider'
import PopularProducts from '../../components/product/popularproduct'
import LatestProducts from '../../components/Latestproduct/latestproduct'
import FeaturedSlider from '../../components/FeaturedSlider/FeaturedSlider'
import AdBannerSection from '../../components/aBanner/Banner'
import WellnessSection from '../../components/welness/welness'


// Main Home component
const Home = () => {
  const categories = [
    { name: 'Kitchen', icon: FaUtensils, color: 'border-blue-600', bg: 'bg-blue-50', to: '/ProductListing?category=Kitchen' },
    { name: 'Jewellery', icon: FaGem, color: 'border-purple-600', bg: 'bg-purple-50', to: '/ProductListing?category=Jewellery' },
    { name: 'Fashion', icon: FaTshirt, color: 'border-pink-600', bg: 'bg-pink-50', to: '/ProductListing?category=Fashion' },
  ]

  return (
    <div className="home-page bg-[#f7f7f7]">
      {/* Hero Section */}
      <section className="hero-section pt-1">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="px-2 sm:px-4 py-1 sm:py-2 mb-1">
            <div className="flex items-start gap-3 overflow-x-auto whitespace-nowrap sm:justify-center sm:overflow-x-visible sm:whitespace-normal">
              {categories.map((c) => {
                const Icon = c.icon
                return (
                  <Link
                    key={c.name}
                    to={c.to}
                    className="flex flex-col items-center min-w-[78px] sm:min-w-[96px]"
                  >
                    <div className={`h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 ${c.color} ${c.bg} flex items-center justify-center overflow-hidden`}>
                      <Icon className="text-gray-800 text-2xl sm:text-3xl" />
                    </div>
                    <div className="mt-2 text-[12px] sm:text-sm font-semibold text-gray-900 text-center">
                      {c.name}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
        <Homeslider />
        {/* <Homecatslider /> */}
      </section>

      {/* Products Section */}
      <section className="products-section">
        <PopularProducts />
        {/* 👇 AdBanner added below PopularProducts */}
        <div className="mt-2">
          <AdBannerSection />
        </div>
        <LatestProducts title="Latest Products" />
        <FeaturedSlider />
      </section>

      {/* Promotions Section */}
      <section className="promotions-section py-4 sm:py-10">
        <div className="container mx-auto px-3 sm:px-4">
          {/* <FreeShippingBanner /> */}
          <Adsbennerslider items={4} />
        </div>
      </section>

      {/* Content Sections */}
      <section className="content-sections">
        <WellnessSection />
      </section>
    </div>
  )
}

export default Home
