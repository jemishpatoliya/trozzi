import React, { useEffect, useState } from "react";
import ProductCard from "./ProductCard";

import { fetchCategories, fetchProducts } from "../../api/catalog";

const PopularProducts = ({ hideAddToCart = false }) => {
  const [activeCategoryId, setActiveCategoryId] = useState("");
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

        if (top.length > 0) {
          setActiveCategoryId((prev) => prev || top[0].id);
        }
      } catch (e) {
        if (cancelled) return;
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

  return (
    <section className="py-4 sm:py-8 bg-gray-100">
      <div className="px-3 sm:px-6">
        <div className="text-center">
          <h2 className="text-[16px] sm:text-[22px] md:text-[26px] font-bold text-gray-900 tracking-tight">Popular products</h2>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
          {products.map((product) => (
            <ProductCard key={product.id || product._id} product={product} hideAddToCart={hideAddToCart} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularProducts;
