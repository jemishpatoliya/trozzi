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
        let cancelled = false;
        const run = async () => {
            try {
                setLoading(true);
                setError("");

                const minPrice = Array.isArray(priceRange) ? Number(priceRange[0]) : undefined;
                const maxPrice = Array.isArray(priceRange) ? Number(priceRange[1]) : undefined;
                const inStock = String(selectedFilters.availability || 'all') === 'in_stock' ? true : undefined;
                const rating = Number(selectedFilters.rating) > 0 ? Number(selectedFilters.rating) : undefined;

                const data = await fetchProducts({
                    mode: "public",
                    page,
                    limit,
                    category: category || undefined,
                    q: searchQuery || undefined,
                    sort: sortBy && sortBy !== "relevance" ? sortBy : undefined,
                    minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
                    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
                    inStock,
                    rating,
                    sizes: normalizedSelectedSizes.length > 0 ? normalizedSelectedSizes : undefined,
                });

                if (cancelled) return;
                const list = Array.isArray(data) ? data : (data?.items || []);
                setItems(Array.isArray(list) ? list : []);
                setTotalPages(Number(data?.totalPages) > 0 ? Number(data.totalPages) : 1);
                setTotalItems(Number(data?.totalItems ?? data?.total ?? 0) || 0);
            } catch {
                if (!cancelled) {
                    setItems([]);
                    setTotalPages(1);
                    setTotalItems(0);
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
    }, [category, limit, normalizedSelectedSizes, page, priceRange, searchQuery, selectedFilters.availability, selectedFilters.rating, sortBy]);

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

                    <div className="flex-1 min-w-0">
                        {loading && items.length === 0 ? (
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
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
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
                                    onChange={(_e, value) => {
                                        setPage(value);
                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                    }}
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