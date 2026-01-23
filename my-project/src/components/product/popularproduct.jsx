import React, { useEffect, useMemo, useState } from "react";
import ProductCard from "./ProductCard";

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

    return () => {
      cancelled = true;
    };
  }, [activeCategoryId]);

  const visibleCategories = useMemo(() =>
    categories
      .map((c) => ({ id: c.id, name: c.name }))
      .filter((cat) => !['Footwear', 'Electronics', 'Bags'].includes(cat.name))
  , [categories]);

  return (
    <section className="py-4 sm:py-8 bg-gray-100">
      <div className="px-3 sm:px-6">
        <div className="text-center">
          <h2 className="text-[18px] sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Popular</h2>
          <p className="text-[13px] sm:text-base text-gray-600 mt-1 max-w-2xl mx-auto">
              Discover our most loved products. Handpicked favorites that customers can't get enough of.
          </p>
        </div>

        {/* Categories (Text-only, centered) */}
        <div className="-mx-3 sm:mx-0 mt-4">
          <div className="flex gap-2 px-3 sm:px-0 pb-2 overflow-x-auto scrollbar-hide sm:overflow-visible sm:flex-wrap sm:justify-center">
            {visibleCategories.map((cat, i) => (
              <button
                key={cat.id || i}
                type="button"
                onClick={() => setActiveCategoryId(cat.id)}
                className={
                  activeCategoryId === cat.id
                    ? "px-4 py-2 text-[13px] font-semibold whitespace-nowrap rounded-lg bg-orange-500 text-white shadow-sm"
                    : "px-4 py-2 text-[13px] font-semibold whitespace-nowrap rounded-lg bg-white text-gray-800 border border-gray-200 hover:bg-orange-50"
                }
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {products.map((product) => (
            <ProductCard key={product.id || product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularProducts;
