import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import ProductCard from "../../components/product/ProductCard";
import Pagination from "@mui/material/Pagination";

import { fetchCategories, fetchProducts } from "../../api/catalog";

const ProductListing = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [page, setPage] = useState(1);
    const [limit] = useState(12);
    const [category, setCategory] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("relevance");
    const [priceRange, setPriceRange] = useState([0, 10000]);
    const [selectedFilters, setSelectedFilters] = useState({
        availability: 'all',
        sizes: [],
        rating: 0,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [allItems, setAllItems] = useState([]);
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        const urlCategory = searchParams.get("category") || "";
        const urlSearch = searchParams.get("q") || "";
        setCategory(urlCategory);
        setSearchQuery(urlSearch);
        setPage(1);
    }, [searchParams]);

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            try {
                const data = await fetchCategories();
                if (!cancelled) setCategories(Array.isArray(data) ? data : []);
            } catch {
                if (!cancelled) setCategories([]);
            }
        };
        void run();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            try {
                setLoading(true);
                setError("");

                const queryParams = {
                    mode: "public",
                    page: 1,
                    limit: 200,
                    q: searchQuery || undefined,
                    sort: sortBy && sortBy !== "relevance" ? sortBy : undefined,
                };

                const data = await fetchProducts(queryParams);
                if (cancelled) return;
                const list = Array.isArray(data) ? data : (data?.items || []);
                setAllItems(Array.isArray(list) ? list : []);
            } catch {
                if (!cancelled) {
                    setAllItems([]);
                    setError("Failed to load products");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void run();
        return () => {
            cancelled = true;
        };
    }, [searchQuery, sortBy]);

    const normalizeSizeToken = (value) => {
        const raw = String(value ?? '').trim();
        if (!raw) return '';
        const lower = raw.toLowerCase();
        if (lower === 's' || lower === 'small') return 'S';
        if (lower === 'm' || lower === 'medium') return 'M';
        if (lower === 'l' || lower === 'large') return 'L';
        if (lower === 'xl' || lower === 'x-large' || lower === 'extra large' || lower === 'extra-large') return 'XL';
        if (lower === 'xxl' || lower === '2xl' || lower === 'xx-large' || lower === 'extra extra large' || lower === 'extra-extra-large') return 'XXL';
        return raw.toUpperCase();
    };

    const normalizedSelectedSizes = useMemo(() => {
        return (Array.isArray(selectedFilters.sizes) ? selectedFilters.sizes : [])
            .map(normalizeSizeToken)
            .filter(Boolean);
    }, [selectedFilters.sizes]);

    useEffect(() => {
        const normalize = (v) => String(v ?? '').trim().toLowerCase();
        const byId = new Map(categories.map((c) => [String(c?.id ?? ""), normalize(c?.name)]));
        const byName = new Map(categories.map((c) => [normalize(c?.name), normalize(c?.name)]));

        const resolveCategoryKey = (value) => {
            const raw = String(value ?? "").trim();
            if (!raw) return "";
            if (byId.has(raw)) return byId.get(raw) || "";
            const n = normalize(raw);
            if (byName.has(n)) return byName.get(n) || "";
            return n;
        };

        const selectedKey = resolveCategoryKey(category);

        const base = selectedKey
            ? allItems.filter((p) => resolveCategoryKey(p?.category) === selectedKey)
            : allItems;

        const filtered = base.filter((p) => {
            const stock = Number(p?.stock ?? 0) || 0;
            const price = Number(p?.price ?? 0) || 0;

            if (String(selectedFilters.availability || 'all') === 'in_stock' && stock <= 0) return false;
            if (String(selectedFilters.availability || 'all') === 'not_available' && stock > 0) return false;

            if (Array.isArray(priceRange) && priceRange.length === 2) {
                const min = Number(priceRange[0]) || 0;
                const max = Number(priceRange[1]) || 0;
                if (price < min || price > max) return false;
            }

            if (normalizedSelectedSizes.length > 0) {
                const sizes = Array.isArray(p?.sizes) ? p.sizes : [];
                const normalizedProductSizes = sizes.map(normalizeSizeToken).filter(Boolean);
                if (normalizedProductSizes.length > 0) {
                    const hasMatch = normalizedSelectedSizes.some((s) => normalizedProductSizes.includes(s));
                    if (!hasMatch) return false;
                }
            }

            const minRating = Number(selectedFilters.rating) || 0;
            if (minRating > 0) {
                const rating = Number(p?.rating ?? 0) || 0;
                if (rating > 0 && rating < minRating) return false;
            }

            return true;
        });

        const nextTotalItems = filtered.length;
        const nextTotalPages = Math.max(1, Math.ceil(nextTotalItems / limit));
        const safePage = Math.min(page, nextTotalPages);

        if (safePage !== page) {
            setPage(safePage);
            return;
        }
        const start = (safePage - 1) * limit;
        const pageItems = filtered.slice(start, start + limit);

        setTotalItems(nextTotalItems);
        setTotalPages(nextTotalPages);
        setItems(pageItems);
    }, [allItems, categories, category, limit, page, priceRange, normalizedSelectedSizes, selectedFilters.availability, selectedFilters.rating]);

    return (
        <section className="py-3 sm:py-5 bg-gray-50 min-h-screen">
            <div className="container mx-auto px-3 sm:px-4">
                <Breadcrumbs aria-label="breadcrumb" className="mb-4">
                    <Link underline="hover" color="inherit" href="/" className="link transition hover:text-blue-600">
                        Home
                    </Link>
                    <Link underline="hover" color="inherit" href="/ProductListing" className="link transition hover:text-blue-600">
                        Products
                    </Link>
                </Breadcrumbs>
            </div>

            <div className="container mx-auto px-3 sm:px-4">
                <div className="flex gap-6">
                    <div className="hidden lg:block w-64 flex-shrink-0">
                        <div className="bg-white rounded-lg shadow-sm p-4 sticky" style={{ top: 'calc(var(--app-header-height, 0px) + 1rem)' }}>
                            <Sidebar
                                selectedCategory={category}
                                categories={categories}
                                onChangeCategory={(next) => {
                                    setCategory(next);
                                    setPage(1);
                                    const nextParams = new URLSearchParams(searchParams);
                                    if (next) nextParams.set("category", next);
                                    else nextParams.delete("category");
                                    setSearchParams(nextParams, { replace: true });
                                }}
                                onFiltersChange={(sidebarFilters) => {
                                    setSelectedFilters((prev) => ({
                                        ...prev,
                                        availability: sidebarFilters.availability || 'all',
                                        sizes: sidebarFilters.sizes || [],
                                        rating: sidebarFilters.rating || 0,
                                    }));
                                    if (sidebarFilters.priceRange) setPriceRange(sidebarFilters.priceRange);
                                    setPage(1);
                                }}
                                initialFilters={{
                                    availability: selectedFilters.availability || 'all',
                                    sizes: selectedFilters.sizes,
                                    priceRange: priceRange,
                                    rating: selectedFilters.rating,
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex-1">
                        {loading && allItems.length === 0 ? (
                            <div className="py-16 text-center">
                                <p className="text-gray-600">Loading products...</p>
                            </div>
                        ) : error ? (
                            <div className="py-16 text-center">
                                <p className="text-red-600">{error}</p>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="py-16 text-center">
                                <p className="text-gray-600 text-base sm:text-lg">No products found</p>
                                <p className="text-gray-500 text-[13px] sm:text-sm mt-2">Try adjusting your filters</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4 lg:gap-6">
                                {items.map((product) => (
                                    <ProductCard key={product.id || product._id} product={product} view="grid" />
                                ))}
                            </div>
                        )}

                        {!loading && !error && totalPages > 1 && (
                            <div className="flex justify-center mt-8">
                                <Pagination
                                    count={totalPages}
                                    page={page}
                                    onChange={(_e, value) => setPage(value)}
                                    showFirstButton
                                    showLastButton
                                    size="large"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProductListing;