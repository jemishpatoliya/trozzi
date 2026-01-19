import React, { useContext, useEffect, useState } from "react";
import ProductCard from "../product/ProductCard";
import { MyContext } from "../../App";

import { fetchProducts } from "../../api/catalog";

const WellnessSection = () => {
  const { handleClickOpenProductDetailsModal } = useContext(MyContext);
  const [hoverId, setHoverId] = useState(null); // hover track માટે

  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchProducts({ mode: "public", page: 1, limit: 6, category: "Wellness" });
        const list = Array.isArray(data) ? data : (data.items || []);
        if (cancelled) return;
        if (list.length > 0) {
          setItems(list);
          return;
        }

        const fallback = await fetchProducts({ mode: "public", page: 1, limit: 6 });
        const fallbackList = Array.isArray(fallback) ? fallback : (fallback.items || []);
        if (!cancelled) setItems(fallbackList);
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
    <section className="py-16 px-6 bg-gray-50">
      <div className="">
        <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">Wellness</h2>
        <p className="text-lg text-gray-600 mb-12 text-center max-w-3xl mx-auto">
          Elevate your well-being with our curated wellness collection. From yoga to nutrition, we've got you covered.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {items.map((item) => (
            <ProductCard key={item.id || item._id} product={item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WellnessSection;
