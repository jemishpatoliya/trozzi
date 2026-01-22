import React, { useEffect, useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import ProductSlider from "./productslider";

import { fetchCategories, fetchProducts } from "../../api/catalog";

const PopularProducts = () => {
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchCategories();
        if (cancelled) return;

        const top = (Array.isArray(data) ? data : [])
          .filter((c) => c && c.active)
          .filter((c) => !c.parentId)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        setCategories(top);
        if (top.length > 0) {
          setActiveCategoryId((prev) => prev || top[0].id);
        }
      } catch (e) {
        if (cancelled) return;
        setCategories([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!activeCategoryId) return;
      setProducts([]);
      try {
        const data = await fetchProducts({ mode: "public", page: 1, limit: 60, category: activeCategoryId });
        if (cancelled) return;
        const items = Array.isArray(data) ? data : (data.items || []);
        setProducts(items);
      } catch (e) {
        if (!cancelled) setProducts([]);
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
  }, [activeCategoryId]);

  const visibleCategories = useMemo(() =>
    categories
      .map((c) => ({ id: c.id, name: c.name }))
      .filter((cat) => !['Footwear', 'Electronics', 'Bags'].includes(cat.name))
  , [categories]);

  return (
    <div className="py-4 sm:py-10 px-3 sm:px-6 bg-white">
      <div className="">
        <h2 className="text-lg sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1.5 sm:mb-4 text-center">Popular Products</h2>
        <p className="text-[13px] sm:text-lg text-gray-600 mb-4 sm:mb-12 text-center max-w-3xl mx-auto">
          Discover our most loved products. Handpicked favorites that customers can't get enough of.
        </p>

        {/* Categories */}
        <div className="flex overflow-x-auto scrollbar-hide justify-start md:justify-center gap-2 sm:gap-3 border-b border-gray-200 pb-2.5 sm:pb-4 mb-3.5 sm:mb-10">
          {visibleCategories.map((cat, i) => (
            <button
              key={cat.id || i}
              className={`px-3 sm:px-6 py-1.5 sm:py-1.5 text-[13px] sm:text-sm whitespace-nowrap rounded-full font-semibold transition-all ${activeCategoryId === cat.id
                ? "bg-red-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              onClick={() => setActiveCategoryId(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="md:hidden">
          <ProductSlider products={products} />
        </div>

        <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id || product._id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PopularProducts;
