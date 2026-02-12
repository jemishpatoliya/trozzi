import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaGem, FaTshirt, FaUtensils } from 'react-icons/fa'
import Homeslider from '../../components/Homeslider'
import Adsbennerslider from '../../components/Adsbannerslider'
import PopularProducts from '../../components/product/popularproduct'
import LatestProducts from '../../components/Latestproduct/latestproduct'
import FeaturedSlider from '../../components/FeaturedSlider/FeaturedSlider'
import AdBannerSection from '../../components/aBanner/Banner'
import { fetchCategories } from '../../api/catalog'


// Main Home component
const Home = () => {
  const [apiCategories, setApiCategories] = useState([])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const data = await fetchCategories()
        if (cancelled) return
        setApiCategories(Array.isArray(data) ? data : [])
      } catch (_e) {
        if (!cancelled) setApiCategories([])
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  const resolveCategoryToParam = useMemo(() => {
    const list = Array.isArray(apiCategories) ? apiCategories : []
    return (name) => {
      const raw = String(name || '').trim()
      if (!raw) return ''
      const rawLower = raw.toLowerCase()
      const match = list.find((c) => {
        const n = String(c?.name || c?.title || '').trim().toLowerCase()
        const slug = String(c?.slug || '').trim().toLowerCase()
        return (n && n === rawLower) || (slug && slug === rawLower)
      })
      return String(match?.id || match?._id || raw)
    }
  }, [apiCategories])

  const categories = useMemo(() => {
    const buildTo = (name) => {
      const param = resolveCategoryToParam(name)
      return param ? `/ProductListing?category=${encodeURIComponent(param)}` : '/ProductListing'
    }

    return [
      { name: 'Kitchen', icon: FaUtensils, color: 'border-blue-600', bg: 'bg-blue-50', to: buildTo('Kitchen') },
      { name: 'Jewellery', icon: FaGem, color: 'border-purple-600', bg: 'bg-purple-50', to: buildTo('Jewellery') },
      { name: 'Fashion', icon: FaTshirt, color: 'border-pink-600', bg: 'bg-pink-50', to: buildTo('Fashion') },
    ]
  }, [resolveCategoryToParam])

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
      </section>
    </div>
  )
}

export default Home
