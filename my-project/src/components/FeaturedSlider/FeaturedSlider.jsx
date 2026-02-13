import React, { useEffect, useState } from "react";
import ProductCard from "../product/ProductCard";

import { fetchProducts } from "../../api/catalog";

const FeaturedSlider = ({ hideAddToCart = false }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchProducts({ mode: "public", page: 1, limit: 20, featured: true });
        if (cancelled) return;
        const list = Array.isArray(data) ? data : (data.items || []);
        setItems(list);
      } catch (e) {
        if (!cancelled) setItems([]);
      }
    }
    void load();

    const onFocus = () => {
      void load();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void load();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <section className="py-4 sm:py-10 px-3 sm:px-6 bg-gray-50">
      <div className="">
        <h2 className="text-[16px] sm:text-[22px] md:text-[26px] font-bold text-gray-900 mb-1.5 sm:mb-4 text-center">Featured Products</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-4 lg:gap-6">
          {items.map((item) => (
            <ProductCard key={item.id || item._id} product={item} hideAddToCart={hideAddToCart} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSlider;
