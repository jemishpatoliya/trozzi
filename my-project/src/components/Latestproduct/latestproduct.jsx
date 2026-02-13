import React, { useEffect, useState } from "react";
import ProductCard from "../product/ProductCard";

import { fetchProducts } from "../../api/catalog";

const FeaturedSlider = ({ title, hideAddToCart = false }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchProducts({ mode: "public", page: 1, limit: 12 });
        if (cancelled) return;
        const list = Array.isArray(data) ? data : (data.items || []);
        setItems(list);
      } catch (e) {
        if (!cancelled) setItems([]);
      }
    }
    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="py-4 sm:py-10 px-3 sm:px-6 bg-white">
      <div className="">
        <h2 className="text-[16px] sm:text-[22px] md:text-[26px] font-bold text-gray-900 mb-1.5 sm:mb-4 text-center">{title}</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
          {items.map((item) => (
            <ProductCard key={item.id || item._id} product={item} hideAddToCart={hideAddToCart} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSlider;
