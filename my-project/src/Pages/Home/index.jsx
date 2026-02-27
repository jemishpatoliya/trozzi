import React, { useEffect, useMemo, useRef, useState } from 'react'
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
  const categoryStripRef = useRef(null)
  const [canScrollCategories, setCanScrollCategories] = useState(false)

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

  useEffect(() => {
    const el = categoryStripRef.current
    if (!el) return

    const compute = () => {
      try {
        setCanScrollCategories(el.scrollWidth > el.clientWidth + 2)
      } catch (_e) {
        setCanScrollCategories(false)
      }
    }

    compute()
    window.addEventListener('resize', compute)
    return () => {
      window.removeEventListener('resize', compute)
    }
  }, [apiCategories.length])

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
    const list = Array.isArray(apiCategories) ? apiCategories : []

    const COLORS = [
      { color: 'border-blue-600', bg: 'bg-blue-50' },
      { color: 'border-purple-600', bg: 'bg-purple-50' },
      { color: 'border-pink-600', bg: 'bg-pink-50' },
      { color: 'border-green-600', bg: 'bg-green-50' },
      { color: 'border-orange-600', bg: 'bg-orange-50' },
    ]

    const apiItems = list
      .filter((c) => c && (c.active === undefined || Boolean(c.active)))
      .filter((c) => !c.parentId)
      .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
      .map((c, index) => {
        const rawName = String(c?.name || c?.title || '').trim()
        const id = String(c?.id || c?._id || rawName)
        const url = String(c?.imageUrl || c?.image || '').trim()
        const img = url ? (url.startsWith('http') ? url : `http://localhost:5050${url}`) : ''
        const colorPair = COLORS[index % COLORS.length]

        return {
          name: rawName || id,
          icon: null,
          img,
          color: colorPair.color,
          bg: colorPair.bg,
          to: id ? `/ProductListing?category=${encodeURIComponent(id)}` : '/ProductListing',
        }
      })

    if (apiItems.length) return apiItems

    const buildTo = (name) => {
      const param = resolveCategoryToParam(name)
      return param ? `/ProductListing?category=${encodeURIComponent(param)}` : '/ProductListing'
    }

    return [
      {
        name: 'Kitchen',
        icon: FaUtensils,
        img: 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRFdI3ATGFPb2lunhXsbYK6wK0olgpZpdLOta5nANWUicn5JDx6727CDwv1fPr2K_bIeEb1lcTw3AHHbkBXMELGMcM2V0YGqXASHk9yFGTjUW6rv840QKcflg',
        color: 'border-blue-600',
        bg: 'bg-blue-50',
        to: buildTo('Kitchen'),
      },
      {
        name: 'Jewellery',
        icon: FaGem,
        img: 'https://stylia.in/cdn/shop/files/a_remove_crease_from_t_2.png?v=1767615306&width=800',
        color: 'border-purple-600',
        bg: 'bg-purple-50',
        to: buildTo('Jewellery'),
      },
      {
        name: 'Fashion',
        icon: FaTshirt,
        img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQE2Dz7mEITlAqH6kezKmNnjzecmOa73VOiaw&s',
        color: 'border-pink-600',
        bg: 'bg-pink-50',
        to: buildTo('Fashion'),
      },
    ]
  }, [apiCategories, resolveCategoryToParam])

  return (
    <div className="home-page bg-[#f7f7f7] mt-40">
      {/* Hero Section */}
      <section className="hero-section pt-1">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="px-2 sm:px-4 py-1 sm:py-2 mb-1">
            <div className="relative">
              <button
                type="button"
                aria-label="Scroll categories left"
                onClick={() => categoryStripRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
                className={`${canScrollCategories ? 'hidden sm:flex' : 'hidden'} absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white shadow border border-gray-200 hover:bg-gray-50`}
              >
                <span className="text-xl leading-none">‹</span>
              </button>

              <button
                type="button"
                aria-label="Scroll categories right"
                onClick={() => categoryStripRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                className={`${canScrollCategories ? 'hidden sm:flex' : 'hidden'} absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white shadow border border-gray-200 hover:bg-gray-50`}
              >
                <span className="text-xl leading-none">›</span>
              </button>

              <div
                ref={categoryStripRef}
                className={`flex w-full items-start gap-3 overflow-x-auto whitespace-nowrap scrollbar-hide ${canScrollCategories ? 'sm:px-12' : 'sm:justify-center sm:overflow-x-visible sm:px-0 sm:whitespace-normal'}`}
                style={{ scrollSnapType: 'x mandatory' }}
              >
              {categories.map((c) => {
                const Icon = c.icon
                return (
                  <Link
                    key={c.name}
                    to={c.to}
                    className="flex flex-col items-center min-w-[78px] sm:min-w-[96px]"
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <div className={`h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 ${c.color} ${c.bg} flex items-center justify-center overflow-hidden`}>
                      {c.img ? (
                        <img
                          src={c.img}
                          alt={c.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Icon className="text-gray-800 text-2xl sm:text-3xl" />
                      )}
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
        </div>
        <Homeslider />
        <div data-scroll-top-trigger="1" />
        {/* <Homecatslider /> */}
      </section>

      {/* Products Section */}
      <section className="products-section">
        <PopularProducts hideAddToCart />
        {/* 👇 AdBanner added below PopularProducts */}
        <div className="mt-2">
          <AdBannerSection />
        </div>
        <LatestProducts title="Latest Products" hideAddToCart />
        <FeaturedSlider hideAddToCart />
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
