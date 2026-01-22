import React, { useContext, useEffect, useState } from "react";
import ProductCard from "../product/ProductCard";
import ProductSlider from "../product/productslider";
import { MyContext } from "../../App";

import { fetchProducts } from "../../api/catalog";

const FeaturedSlider = ({ title }) => {
  const { handleClickOpenProductDetailsModal } = useContext(MyContext);

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

    const onFocus = () => {
      void load();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void load();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    const intervalId = window.setInterval(() => {
      void load();
    }, 5000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <section className="py-4 sm:py-10 px-3 sm:px-6 bg-white">
      <div className="">
        <h2 className="text-lg sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1.5 sm:mb-4 text-center">{title}</h2>
        <p className="text-[13px] sm:text-lg text-gray-600 mb-4 sm:mb-12 text-center max-w-3xl mx-auto">
          Fresh arrivals and new additions to our collection. Be the first to own the latest trends.
        </p>

        <div className="md:hidden">
          <ProductSlider products={items} />
        </div>

        <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
          {items.map((item) => (
            <ProductCard key={item.id || item._id} product={item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSlider;
