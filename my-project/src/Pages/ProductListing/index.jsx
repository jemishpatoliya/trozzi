// import React, { useEffect, useState } from "react";
// import { useSearchParams } from "react-router-dom";
// import Sidebar from "../../components/Sidebar";
// import Breadcrumbs from "@mui/material/Breadcrumbs";
// import Link from "@mui/material/Link";
// import ProductCard from "../../components/product/ProductCard";
// import Button from "@mui/material/Button";
// import { IoGrid } from "react-icons/io5";
// import { TfiMenuAlt } from "react-icons/tfi";
// import Menu from "@mui/material/Menu";
// import MenuItem from "@mui/material/MenuItem";
// import Pagination from '@mui/material/Pagination';
// import { FaFilter, FaTimes, FaSortAmountDown, FaSortAmountUp, FaSortAlphaDown, FaSortAlphaUp } from "react-icons/fa";

// import { fetchProducts } from "../../api/catalog";

// const ProductListing = () => {
//     const [searchParams, setSearchParams] = useSearchParams();

//     const [itemView, setItemView] = useState("grid");
//     const [anchorEl, setAnchorEl] = useState(null);
//     const [filterAnchorEl, setFilterAnchorEl] = useState(null);
//     const open = Boolean(anchorEl);
//     const filterOpen = Boolean(filterAnchorEl);

//     const [page, setPage] = useState(1);
//     const [limit] = useState(12);
//     const [category, setCategory] = useState("");
//     const [searchQuery, setSearchQuery] = useState("");
//     const [sortBy, setSortBy] = useState("relevance");
//     const [sortOrder, setSortOrder] = useState("desc");
//     const [priceRange, setPriceRange] = useState([0, 10000]);
//     const [selectedFilters, setSelectedFilters] = useState({
//         inStock: false,
//         freeShipping: false,
//         onSale: false,
//         availability: 'all', // all, available, not_available
//         sizes: [], // small, medium, large, xl, xxl
//         rating: 0 // 0-5 stars, 0 = all ratings
//     });

//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState("");
//     const [items, setItems] = useState([]);
//     const [totalPages, setTotalPages] = useState(1);
//     const [totalItems, setTotalItems] = useState(0);

//     const handleClick = (event) => setAnchorEl(event.currentTarget);
//     const handleClose = () => setAnchorEl(null);
//     const handleFilterClick = (event) => setFilterAnchorEl(event.currentTarget);
//     const handleFilterClose = () => setFilterAnchorEl(null);

//     const sortOptions = [
//         { value: 'relevance', label: 'Relevance', icon: null },
//         { value: 'price_asc', label: 'Price Low to High', icon: <FaSortAmountUp /> },
//         { value: 'price_desc', label: 'Price High to Low', icon: <FaSortAmountDown /> },
//         { value: 'name_asc', label: 'Name A-Z', icon: <FaSortAlphaDown /> },
//         { value: 'name_desc', label: 'Name Z-A', icon: <FaSortAlphaUp /> },
//         { value: 'rating_desc', label: 'Customer Rating', icon: null },
//         { value: 'newest', label: 'Newest First', icon: null }
//     ];

//     const getCurrentSortLabel = () => {
//         const currentSort = sortOptions.find(option => option.value === sortBy);
//         return currentSort ? currentSort.label : 'Sort by';
//     };

//     const handleSortChange = (sortValue) => {
//         setSortBy(sortValue);
//         handleClose();
//         setPage(1);
//     };

//     const handleFilterChange = (filterType, value) => {
//         setSelectedFilters(prev => ({
//             ...prev,
//             [filterType]: value
//         }));
//         setPage(1);
//     };

//     const clearAllFilters = () => {
//         setSelectedFilters({
//             inStock: false,
//             freeShipping: false,
//             onSale: false,
//             availability: 'all',
//             sizes: [],
//             rating: 0
//         });
//         setPriceRange([0, 10000]);
//         handleFilterClose();
//         setPage(1);
//     };

//     const getActiveFiltersCount = () => {
//         const booleanFilters = Object.values(selectedFilters).filter(value => value === true).length;
//         const sizeFilters = selectedFilters.sizes.length;
//         const priceFilterActive = priceRange[0] > 0 || priceRange[1] < 10000;
//         const ratingFilterActive = selectedFilters.rating > 0;
//         const availabilityFilterActive = selectedFilters.availability !== 'all';

//         return booleanFilters + sizeFilters + (priceFilterActive ? 1 : 0) +
//             (ratingFilterActive ? 1 : 0) + (availabilityFilterActive ? 1 : 0);
//     };

//     useEffect(() => {
//         const urlCategory = searchParams.get("category") || "";
//         const urlSearch = searchParams.get("q") || "";
//         setCategory(urlCategory);
//         setSearchQuery(urlSearch);
//         setPage(1);
//     }, [searchParams]);

//     useEffect(() => {
//         let cancelled = false;
//         async function load() {
//             try {
//                 setLoading(true);
//                 setError("");

//                 const queryParams = {
//                     mode: "public",
//                     page,
//                     limit,
//                     category: category || undefined,
//                     q: searchQuery || undefined,
//                     sort: sortBy,
//                     order: sortOrder,
//                     minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
//                     maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
//                     inStock: selectedFilters.inStock || undefined,
//                     onSale: selectedFilters.onSale || undefined,
//                     freeShipping: selectedFilters.freeShipping || undefined,
//                     rating: selectedFilters.rating > 0 ? selectedFilters.rating : undefined,
//                     availability: selectedFilters.availability !== 'all' ? selectedFilters.availability : undefined,
//                     sizes: selectedFilters.sizes.length > 0 ? selectedFilters.sizes : undefined,
//                 };

//                 const data = await fetchProducts(queryParams);
//                 if (cancelled) return;

//                 if (Array.isArray(data)) {
//                     setItems(data);
//                     setTotalPages(1);
//                     setTotalItems(data.length);
//                 } else {
//                     setItems(data.items || []);
//                     setTotalPages(data.totalPages || 1);
//                     setTotalItems(data.totalItems || 0);
//                 }
//             } catch (e) {
//                 if (cancelled) return;
//                 setError("Failed to load products");
//             } finally {
//                 if (!cancelled) setLoading(false);
//             }
//         }
//         load();
//         return () => {
//             cancelled = true;
//         };
//     }, [page, limit, category, searchQuery, sortBy, sortOrder, priceRange, selectedFilters]);

//     return (
//         <section className="py-5">
//             <div className="container">
//                 <Breadcrumbs aria-label="breadcrumb">
//                     <Link underline="hover" color="inherit" href="/" className="link transition">
//                         Home
//                     </Link>
//                     <Link underline="hover" color="inherit" href="/ProductListing" className="link transition">
//                         {searchQuery ? `Search: "${searchQuery}"` : (category || "Products")}
//                     </Link>
//                 </Breadcrumbs>
//             </div>

//             <div className="bg-white p-2 mt-4">
//                 <div className="container flex gap-3">
//                     <div className="Sidebarwrapper w-[20%] h-full bg-white">
//                         <Sidebar
//                             selectedCategory={category}
//                             onChangeCategory={(next) => {
//                                 setCategory(next);
//                                 setPage(1);
//                                 const nextParams = new URLSearchParams(searchParams);
//                                 if (next) {
//                                     nextParams.set("category", next);
//                                 } else {
//                                     nextParams.delete("category");
//                                 }
//                                 setSearchParams(nextParams, { replace: true });
//                             }}
//                         />
//                     </div>

//                     <div className="rightcontent w-[80%]">
//                         <div className="bg-[#f8f9fa] p-4 w-full mb-4 rounded-lg border border-gray-200">
//                             <div className="flex items-center justify-between">
//                                 <div className="flex items-center gap-4">
//                                     <div className="flex items-center bg-white rounded-lg border border-gray-300 p-1">
//                                         <Button
//                                             className={`!w-[36px] !h-[36px] !min-w-[36px] !rounded-md ${itemView === "grid" ? "!bg-blue-500 !text-white" : "!text-gray-600"}`}
//                                             onClick={() => setItemView("grid")}
//                                             title="Grid View"
//                                         >
//                                             <IoGrid className="text-sm" />
//                                         </Button>
//                                         <Button
//                                             className={`!w-[36px] !h-[36px] !min-w-[36px] !rounded-md ${itemView === "list" ? "!bg-blue-500 !text-white" : "!text-gray-600"}`}
//                                             onClick={() => setItemView("list")}
//                                             title="List View"
//                                         >
//                                             <TfiMenuAlt className="text-sm" />
//                                         </Button>
//                                     </div>

//                                     <div className="text-sm text-gray-700">
//                                         {loading ? (
//                                             <span>Loading...</span>
//                                         ) : (
//                                             <span>
//                                                 {searchQuery
//                                                     ? `Found ${totalItems} products for "${searchQuery}"`
//                                                     : category
//                                                         ? `${totalItems} products in ${category}`
//                                                         : `Showing ${totalItems} products`
//                                                 }
//                                             </span>
//                                         )}
//                                     </div>
//                                 </div>

//                                 <div className="flex items-center gap-3">
//                                     <Button
//                                         aria-controls={filterOpen ? "filter-menu" : undefined}
//                                         aria-haspopup="true"
//                                         aria-expanded={filterOpen ? "true" : undefined}
//                                         onClick={handleFilterClick}
//                                         className="!text-sm !text-gray-700 !bg-white !border-2 !border-gray-300 !rounded-lg !px-4 !py-2 flex items-center gap-2"
//                                     >
//                                         <FaFilter className="text-sm" />
//                                         Filters
//                                         {getActiveFiltersCount() > 0 && (
//                                             <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
//                                                 {getActiveFiltersCount()}
//                                             </span>
//                                         )}
//                                     </Button>

//                                     <Button
//                                         aria-controls={open ? "sort-menu" : undefined}
//                                         aria-haspopup="true"
//                                         aria-expanded={open ? "true" : undefined}
//                                         onClick={handleClick}
//                                         className="!text-sm !text-gray-700 !bg-white !border-2 !border-gray-300 !rounded-lg !px-4 !py-2 flex items-center gap-2"
//                                     >
//                                         <FaSortAmountDown className="text-sm" />
//                                         {getCurrentSortLabel()}
//                                     </Button>
//                                 </div>
//                             </div>

//                             {getActiveFiltersCount() > 0 && (
//                                 <div className="mt-3 flex items-center gap-2 flex-wrap">
//                                     <span className="text-sm text-gray-600">Active Filters:</span>
//                                     {selectedFilters.inStock && (
//                                         <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
//                                             In Stock
//                                             <FaTimes className="cursor-pointer" onClick={() => handleFilterChange('inStock', false)} />
//                                         </span>
//                                     )}
//                                     {selectedFilters.freeShipping && (
//                                         <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
//                                             Free Shipping
//                                             <FaTimes className="cursor-pointer" onClick={() => handleFilterChange('freeShipping', false)} />
//                                         </span>
//                                     )}
//                                     {selectedFilters.onSale && (
//                                         <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
//                                             On Sale
//                                             <FaTimes className="cursor-pointer" onClick={() => handleFilterChange('onSale', false)} />
//                                         </span>
//                                     )}
//                                     {selectedFilters.availability !== 'all' && (
//                                         <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
//                                             {selectedFilters.availability === 'available' ? 'Available' : 'Not Available'}
//                                             <FaTimes className="cursor-pointer" onClick={() => handleFilterChange('availability', 'all')} />
//                                         </span>
//                                     )}
//                                     {selectedFilters.sizes.map((size) => (
//                                         <span key={size} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
//                                             {size}
//                                             <FaTimes className="cursor-pointer" onClick={() => {
//                                                 const newSizes = selectedFilters.sizes.filter(s => s !== size);
//                                                 handleFilterChange('sizes', newSizes);
//                                             }} />
//                                         </span>
//                                     ))}
//                                     {selectedFilters.rating > 0 && (
//                                         <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
//                                             {selectedFilters.rating}+ Stars
//                                             <FaTimes className="cursor-pointer" onClick={() => handleFilterChange('rating', 0)} />
//                                         </span>
//                                     )}
//                                     {(priceRange[0] > 0 || priceRange[1] < 10000) && (
//                                         <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
//                                             ${priceRange[0]} - ${priceRange[1]}
//                                             <FaTimes className="cursor-pointer" onClick={() => setPriceRange([0, 10000])} />
//                                         </span>
//                                     )}
//                                     <Button
//                                         onClick={clearAllFilters}
//                                         className="!text-xs !text-red-600 !bg-transparent !border-none !p-0 !h-auto !min-w-0"
//                                     >
//                                         Clear All
//                                     </Button>
//                                 </div>
//                             )}
//                         </div>

//                         <Menu
//                             id="sort-menu"
//                             anchorEl={anchorEl}
//                             open={open}
//                             onClose={handleClose}
//                         >
//                             {sortOptions.map((option) => (
//                                 <MenuItem
//                                     key={option.value}
//                                     onClick={() => handleSortChange(option.value)}
//                                     className="flex items-center gap-2"
//                                 >
//                                     {option.icon && <span className="text-gray-500">{option.icon}</span>}
//                                     {option.label}
//                                     {sortBy === option.value && (
//                                         <span className="ml-auto text-blue-500">✓</span>
//                                     )}
//                                 </MenuItem>
//                             ))}
//                         </Menu>

//                         <Menu
//                             id="filter-menu"
//                             anchorEl={filterAnchorEl}
//                             open={filterOpen}
//                             onClose={handleFilterClose}
//                             PaperProps={{
//                                 style: { minWidth: '320px' }
//                             }}
//                         >
//                             <div className="p-4">
//                                 <h3 className="font-semibold mb-4">Filter Products</h3>

//                                 {/* Availability Filter */}
//                                 <div className="mb-4">
//                                     <label className="block text-sm font-medium mb-2">Availability</label>
//                                     <div className="grid grid-cols-3 gap-2">
//                                         <label className="flex items-center gap-2 cursor-pointer">
//                                             <input
//                                                 type="radio"
//                                                 name="availability"
//                                                 checked={selectedFilters.availability === 'all'}
//                                                 onChange={() => handleFilterChange('availability', 'all')}
//                                                 className="text-blue-500"
//                                             />
//                                             <span className="text-sm">All (17)</span>
//                                         </label>
//                                         <label className="flex items-center gap-2 cursor-pointer">
//                                             <input
//                                                 type="radio"
//                                                 name="availability"
//                                                 checked={selectedFilters.availability === 'available'}
//                                                 onChange={() => handleFilterChange('availability', 'available')}
//                                                 className="text-blue-500"
//                                             />
//                                             <span className="text-sm">Available (10)</span>
//                                         </label>
//                                         <label className="flex items-center gap-2 cursor-pointer">
//                                             <input
//                                                 type="radio"
//                                                 name="availability"
//                                                 checked={selectedFilters.availability === 'not_available'}
//                                                 onChange={() => handleFilterChange('availability', 'not_available')}
//                                                 className="text-blue-500"
//                                             />
//                                             <span className="text-sm">Not Available (1)</span>
//                                         </label>
//                                     </div>
//                                 </div>

//                                 {/* Size Filter */}
//                                 <div className="mb-4">
//                                     <label className="block text-sm font-medium mb-2">Size</label>
//                                     <div className="grid grid-cols-3 gap-2">
//                                         {['small', 'medium', 'large', 'xl', 'xxl'].map((size) => (
//                                             <label key={size} className="flex items-center gap-2 cursor-pointer">
//                                                 <input
//                                                     type="checkbox"
//                                                     checked={selectedFilters.sizes.includes(size)}
//                                                     onChange={(e) => {
//                                                         if (e.target.checked) {
//                                                             handleFilterChange('sizes', [...selectedFilters.sizes, size]);
//                                                         } else {
//                                                             handleFilterChange('sizes', selectedFilters.sizes.filter(s => s !== size));
//                                                         }
//                                                     }}
//                                                     className="text-blue-500"
//                                                 />
//                                                 <span className="text-sm capitalize">{size}</span>
//                                                 <span className="text-xs text-gray-500">({
//                                                     size === 'small' ? '6' :
//                                                         size === 'medium' ? '5' :
//                                                             size === 'large' ? '7' :
//                                                                 size === 'xl' ? '1' :
//                                                                     size === 'xxl' ? '3' : '0'
//                                                 })</span>
//                                             </label>
//                                         ))}
//                                     </div>
//                                 </div>

//                                 {/* Rating Filter */}
//                                 <div className="mb-4">
//                                     <label className="block text-sm font-medium mb-2">Filter By Rating</label>
//                                     <div className="grid grid-cols-3 gap-2">
//                                         {[0, 1, 2, 3, 4, 5].map((rating) => (
//                                             <label key={rating} className="flex items-center gap-2 cursor-pointer">
//                                                 <input
//                                                     type="radio"
//                                                     name="rating"
//                                                     checked={selectedFilters.rating === rating}
//                                                     onChange={() => handleFilterChange('rating', rating)}
//                                                     className="text-blue-500"
//                                                 />
//                                                 <span className="text-sm">
//                                                     {rating === 0 ? 'Empty' : `${rating} Star${rating > 1 ? 's' : ''}`}
//                                                 </span>
//                                             </label>
//                                         ))}
//                                     </div>
//                                 </div>

//                                 {/* Existing Filters */}
//                                 <div className="mb-4">
//                                     <label className="flex items-center gap-2 cursor-pointer">
//                                         <input
//                                             type="checkbox"
//                                             checked={selectedFilters.inStock}
//                                             onChange={(e) => handleFilterChange('inStock', e.target.checked)}
//                                             className="rounded text-blue-500"
//                                         />
//                                         <span className="text-sm">In Stock Only</span>
//                                     </label>
//                                 </div>

//                                 <div className="mb-4">
//                                     <label className="flex items-center gap-2 cursor-pointer">
//                                         <input
//                                             type="checkbox"
//                                             checked={selectedFilters.freeShipping}
//                                             onChange={(e) => handleFilterChange('freeShipping', e.target.checked)}
//                                             className="rounded text-blue-500"
//                                         />
//                                         <span className="text-sm">Free Shipping</span>
//                                     </label>
//                                 </div>

//                                 <div className="mb-4">
//                                     <label className="flex items-center gap-2 cursor-pointer">
//                                         <input
//                                             type="checkbox"
//                                             checked={selectedFilters.onSale}
//                                             onChange={(e) => handleFilterChange('onSale', e.target.checked)}
//                                             className="rounded text-blue-500"
//                                         />
//                                         <span className="text-sm">On Sale</span>
//                                     </label>
//                                 </div>

//                                 {/* Price Range Filter */}
//                                 <div className="mb-4">
//                                     <label className="block text-sm font-medium mb-2">Filter By Price</label>
//                                     <div className="grid grid-cols-2 gap-2">
//                                         <input
//                                             type="number"
//                                             value={priceRange[0]}
//                                             onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
//                                             className="w-full px-2 py-1 border rounded text-sm"
//                                             placeholder="Min: Rs: 100"
//                                         />
//                                         <input
//                                             type="number"
//                                             value={priceRange[1]}
//                                             onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 10000])}
//                                             className="w-full px-2 py-1 border rounded text-sm"
//                                             placeholder="Max: Rs: 5000"
//                                         />
//                                     </div>
//                                 </div>

//                                 {/* Clear Filters Button */}
//                                 <div className="flex justify-end mt-4">
//                                     <Button
//                                         onClick={clearAllFilters}
//                                         className="!text-sm !bg-red-500 !text-white !px-4 !py-2"
//                                     >
//                                         Clear All Filters
//                                     </Button>
//                                 </div>
//                             </div>
//                         </Menu>

//                         <div
//                             className={
//                                 itemView === "grid"
//                                     ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
//                                     : "flex flex-col gap-4"
//                             }
//                         >
//                             {items.map((product) => (
//                                 <ProductCard
//                                     key={product.id || product._id}
//                                     product={product}
//                                     view={itemView}
//                                 />
//                             ))}
//                         </div>

//                         {loading && (
//                             <div className="py-4 text-center text-gray-600">Loading...</div>
//                         )}

//                         {error && (
//                             <div className="py-4 text-center text-red-600">{error}</div>
//                         )}

//                         <div className="flex justify-center py-8">
//                             <Pagination
//                                 count={totalPages}
//                                 page={page}
//                                 onChange={(_e, value) => setPage(value)}
//                                 showFirstButton
//                                 showLastButton
//                                 size="large"
//                                 siblingCount={1}
//                                 boundaryCount={1}
//                                 className="pagination"
//                             />
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </section>
//     );
// };

// export default ProductListing;


import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import ProductCard from "../../components/product/ProductCard";
import Button from "@mui/material/Button";
import { IoGrid } from "react-icons/io5";
import { TfiMenuAlt } from "react-icons/tfi";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Pagination from '@mui/material/Pagination';
import Slider from '@mui/material/Slider';
import { FaFilter, FaTimes, FaSortAmountDown, FaSortAmountUp, FaSortAlphaDown, FaSortAlphaUp } from "react-icons/fa";

import { fetchCategories, fetchProducts } from "../../api/catalog";

const ProductListing = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [itemView, setItemView] = useState("grid");
    const [anchorEl, setAnchorEl] = useState(null);
    const [filterAnchorEl, setFilterAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const filterOpen = Boolean(filterAnchorEl);

    const [page, setPage] = useState(1);
    const [limit] = useState(12);
    const [category, setCategory] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("relevance");
    const [priceRange, setPriceRange] = useState([0, 10000]);
    const [tempPriceRange, setTempPriceRange] = useState([0, 10000]);
    const [selectedFilters, setSelectedFilters] = useState({
        inStock: false,
        freeShipping: false,
        onSale: false,
        sizes: [],
        colors: [],
        brands: [],
        rating: 0
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [allItems, setAllItems] = useState([]);
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Available filter options (these would ideally come from API)
    const availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];
    const availableColors = [
        { name: 'Black', code: '#000000' },
        { name: 'White', code: '#FFFFFF' },
        { name: 'Blue', code: '#0000FF' },
        { name: 'Red', code: '#FF0000' },
        { name: 'Green', code: '#00FF00' },
        { name: 'Yellow', code: '#FFFF00' }
    ];
    const availableBrands = ['NovaTrend', 'TechPro', 'StyleHub', 'EliteWear'];

    const handleClick = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);
    const handleFilterClick = (event) => setFilterAnchorEl(event.currentTarget);
    const handleFilterClose = () => setFilterAnchorEl(null);

    const sortOptions = [
        { value: 'relevance', label: 'Relevance', icon: null },
        { value: 'price_asc', label: 'Price: Low to High', icon: <FaSortAmountUp /> },
        { value: 'price_desc', label: 'Price: High to Low', icon: <FaSortAmountDown /> },
        { value: 'name_asc', label: 'Name: A-Z', icon: <FaSortAlphaDown /> },
        { value: 'name_desc', label: 'Name: Z-A', icon: <FaSortAlphaUp /> },
        { value: 'rating_desc', label: 'Customer Rating', icon: null },
        { value: 'newest', label: 'Newest First', icon: null }
    ];

    const getCurrentSortLabel = () => {
        const currentSort = sortOptions.find(option => option.value === sortBy);
        return currentSort ? currentSort.label : 'Sort by';
    };

    const handleSortChange = (sortValue) => {
        setSortBy(sortValue);
        handleClose();
        setPage(1);
    };

    const handleFilterChange = (filterType, value) => {
        setSelectedFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
        setPage(1);
    };

    const toggleArrayFilter = (filterType, value) => {
        setSelectedFilters(prev => {
            const currentArray = prev[filterType] || [];
            const newArray = currentArray.includes(value)
                ? currentArray.filter(item => item !== value)
                : [...currentArray, value];
            return { ...prev, [filterType]: newArray };
        });
        setPage(1);
    };

    const clearAllFilters = () => {
        setSelectedFilters({
            inStock: false,
            freeShipping: false,
            onSale: false,
            sizes: [],
            colors: [],
            brands: [],
            rating: 0
        });
        setPriceRange([0, 10000]);
        setTempPriceRange([0, 10000]);
        setPage(1);
    };

    const applyFilters = () => {
        setPriceRange(tempPriceRange);
        handleFilterClose();
        setPage(1);
    };

    const getActiveFiltersCount = () => {
        let count = 0;

        if (selectedFilters.inStock) count++;
        if (selectedFilters.freeShipping) count++;
        if (selectedFilters.onSale) count++;
        if (selectedFilters.rating > 0) count++;
        if (priceRange[0] > 0 || priceRange[1] < 10000) count++;

        count += selectedFilters.sizes.length;
        count += selectedFilters.colors.length;
        count += selectedFilters.brands.length;

        return count;
    };

    useEffect(() => {
        const urlCategory = searchParams.get("category") || "";
        const urlSearch = searchParams.get("q") || "";
        setCategory(urlCategory);
        setSearchQuery(urlSearch);
        setPage(1);
    }, [searchParams]);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const data = await fetchCategories();
                if (!cancelled) setCategories(Array.isArray(data) ? data : []);
            } catch (e) {
                if (!cancelled) setCategories([]);
            }
        }
        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        async function load({ silent = false } = {}) {
            try {
                if (!silent) {
                    setLoading(true);
                    setError("");
                }

                const API_LIMIT = 100;
                const queryParams = {
                    mode: "public",
                    page: 1,
                    limit: API_LIMIT,
                    q: searchQuery || undefined,
                    sort: sortBy,
                    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
                    maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
                    inStock: selectedFilters.inStock || undefined,
                    onSale: selectedFilters.onSale || undefined,
                    freeShipping: selectedFilters.freeShipping || undefined,
                    rating: selectedFilters.rating > 0 ? selectedFilters.rating : undefined,
                    sizes: selectedFilters.sizes.length > 0 ? selectedFilters.sizes : undefined,
                    colors: selectedFilters.colors.length > 0 ? selectedFilters.colors : undefined,
                    brands: selectedFilters.brands.length > 0 ? selectedFilters.brands : undefined,
                };

                const extractItems = (data) => (Array.isArray(data) ? data : (data?.items || []));
                const extractTotalPages = (data) => (Array.isArray(data) ? 1 : (data?.totalPages || 1));

                const first = await fetchProducts(queryParams);
                if (cancelled) return;

                const firstItems = extractItems(first);
                const remoteTotalPages = extractTotalPages(first);

                let nextAll = [...firstItems];

                if (remoteTotalPages > 1) {
                    const pageNumbers = Array.from({ length: remoteTotalPages - 1 }, (_v, i) => i + 2);
                    const rest = await Promise.all(
                        pageNumbers.map((p) => fetchProducts({ ...queryParams, page: p }))
                    );
                    if (cancelled) return;
                    for (const r of rest) {
                        nextAll = nextAll.concat(extractItems(r));
                    }
                }

                setAllItems(nextAll);
            } catch (e) {
                if (!cancelled) setError("Failed to load products");
                setAllItems([]);
            } finally {
                if (!cancelled && !silent) setLoading(false);
            }
        }
        void load({ silent: false });

        const onFocus = () => {
            void load({ silent: true });
        };
        const onVisibility = () => {
            if (document.visibilityState === "visible") void load({ silent: true });
        };

        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onVisibility);

        const intervalId = window.setInterval(() => {
            void load({ silent: true });
        }, 10000);

        return () => {
            cancelled = true;
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("visibilitychange", onVisibility);
            window.clearInterval(intervalId);
        };
    }, [searchQuery, sortBy, priceRange, selectedFilters]);

useEffect(() => {
    const normalize = (value) => String(value ?? "").trim().toLowerCase();
    const byId = new Map(categories.map((c) => [String(c?.id ?? ""), normalize(c?.name)]));
    const byName = new Map(categories.map((c) => [normalize(c?.name), normalize(c?.name)]));
    const byNameToId = new Map(categories.map((c) => [normalize(c?.name), String(c?.id ?? "")]));

    const childrenByParent = new Map();
    for (const c of categories) {
        const parentId = c?.parentId ? String(c.parentId) : "";
        if (!parentId) continue;
        const next = childrenByParent.get(parentId) || [];
        next.push(String(c?.id ?? ""));
        childrenByParent.set(parentId, next);
    }

    const resolveCategoryKey = (value) => {
        const raw = String(value ?? "").trim();
        if (!raw) return "";
        if (byId.has(raw)) return byId.get(raw) || "";
        const n = normalize(raw);
        if (byName.has(n)) return byName.get(n) || "";
        return n;
    };

    const resolveCategoryId = (value) => {
        const raw = String(value ?? "").trim();
        if (!raw) return "";
        if (byId.has(raw)) return raw;
        const n = normalize(raw);
        return byNameToId.get(n) || "";
    };

    const selectedId = resolveCategoryId(category);
    const allowedKeys = new Set();
    const allowedIds = new Set();

    if (selectedId) {
        const stack = [selectedId];
        const visited = new Set();
        while (stack.length > 0) {
            const id = stack.pop();
            if (!id || visited.has(id)) continue;
            visited.add(id);
            allowedIds.add(id);
            const nameKey = byId.get(id);
            if (nameKey) allowedKeys.add(nameKey);
            const children = childrenByParent.get(id) || [];
            for (const childId of children) stack.push(childId);
        }
    } else {
        const selectedKey = resolveCategoryKey(category);
        if (selectedKey) allowedKeys.add(selectedKey);
    }

    const filtered = (allowedKeys.size === 0 && allowedIds.size === 0)
        ? allItems
        : allItems.filter((p) => {
            if (allowedIds.size > 0) {
                const ids = p?.management?.basic?.categoryIds;
                if (Array.isArray(ids) && ids.some((id) => allowedIds.has(String(id)))) return true;

                const catId = resolveCategoryId(p?.category);
                if (catId && allowedIds.has(catId)) return true;
            }

            return allowedKeys.has(resolveCategoryKey(p?.category));
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
}, [allItems, category, page, limit, categories]);

return (
    <section className="py-5 bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4">
            <Breadcrumbs aria-label="breadcrumb" className="mb-4">
                <Link underline="hover" color="inherit" href="/" className="link transition hover:text-blue-600">
                    Home
                </Link>
                <Link underline="hover" color="inherit" href="/ProductListing" className="link transition hover:text-blue-600">
                    {searchQuery ? `Search: "${searchQuery}"` : (category || "Products")}
                </Link>
            </Breadcrumbs>
        </div>

        <div className="container mx-auto px-4">
            <div className="flex gap-6">
                {/* Sidebar */}
                <div className="hidden lg:block w-64 flex-shrink-0">
                    <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
                        <Sidebar
                            selectedCategory={category}
                            categories={categories}
                            onChangeCategory={(next) => {
                                setCategory(next);
                                setPage(1);
                                const nextParams = new URLSearchParams(searchParams);
                                if (next) {
                                    nextParams.set("category", next);
                                } else {
                                    nextParams.delete("category");
                                }
                                setSearchParams(nextParams, { replace: true });
                            }}
                            onFiltersChange={(sidebarFilters) => {
                                // Update selectedFilters with sidebar filters
                                setSelectedFilters(prev => ({
                                    ...prev,
                                    sizes: sidebarFilters.sizes || [],
                                    rating: sidebarFilters.rating || 0,
                                    inStock: sidebarFilters.availability === 'in_stock',
                                    // Add other sidebar filter mappings as needed
                                }));

                                // Update price range
                                if (sidebarFilters.priceRange) {
                                    setPriceRange(sidebarFilters.priceRange);
                                    setTempPriceRange(sidebarFilters.priceRange);
                                }

                                setPage(1);
                            }}
                            initialFilters={{
                                availability: selectedFilters.inStock ? 'in_stock' : 'all',
                                sizes: selectedFilters.sizes,
                                priceRange: priceRange,
                                rating: selectedFilters.rating
                            }}
                        />
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    {/* Toolbar */}
                    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                    <Button
                                        className={`!w-10 !h-10 !min-w-0 !rounded-md transition-all ${itemView === "grid" ? "!bg-blue-600 !text-white shadow-sm" : "!text-gray-600 hover:!bg-gray-200"}`}
                                        onClick={() => setItemView("grid")}
                                        title="Grid View"
                                    >
                                        <IoGrid className="text-lg" />
                                    </Button>
                                    <Button
                                        className={`!w-10 !h-10 !min-w-0 !rounded-md transition-all ${itemView === "list" ? "!bg-blue-600 !text-white shadow-sm" : "!text-gray-600 hover:!bg-gray-200"}`}
                                        onClick={() => setItemView("list")}
                                        title="List View"
                                    >
                                        <TfiMenuAlt className="text-lg" />
                                    </Button>
                                </div>

                                <div className="text-sm text-gray-600 font-medium">
                                    {loading ? (
                                        <span>Loading products...</span>
                                    ) : (
                                        <span>
                                            {searchQuery
                                                ? `${totalItems} results for "${searchQuery}"`
                                                : category
                                                    ? `${totalItems} products in ${category}`
                                                    : `${totalItems} products`
                                            }
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <Button
                                    aria-controls={filterOpen ? "filter-menu" : undefined}
                                    aria-haspopup="true"
                                    aria-expanded={filterOpen ? "true" : undefined}
                                    onClick={handleFilterClick}
                                    className="!text-sm !text-gray-700 !bg-white !border-2 !border-gray-300 hover:!border-blue-500 !rounded-lg !px-4 !py-2.5 flex items-center gap-2 transition-all"
                                >
                                    <FaFilter className="text-sm" />
                                    <span className="hidden sm:inline">Filters</span>
                                    {getActiveFiltersCount() > 0 && (
                                        <span className="bg-blue-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 font-semibold">
                                            {getActiveFiltersCount()}
                                        </span>
                                    )}
                                </Button>

                                <Button
                                    aria-controls={open ? "sort-menu" : undefined}
                                    aria-haspopup="true"
                                    aria-expanded={open ? "true" : undefined}
                                    onClick={handleClick}
                                    className="!text-sm !text-gray-700 !bg-white !border-2 !border-gray-300 hover:!border-blue-500 !rounded-lg !px-4 !py-2.5 flex items-center gap-2 transition-all"
                                >
                                    <FaSortAmountDown className="text-sm" />
                                    <span className="hidden sm:inline">{getCurrentSortLabel()}</span>
                                    <span className="sm:hidden">Sort</span>
                                </Button>
                            </div>
                        </div>

                        {/* Active Filters Display */}
                        {getActiveFiltersCount() > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm text-gray-600 font-medium">Active Filters:</span>

                                    {selectedFilters.inStock && (
                                        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full border border-blue-200 font-medium">
                                            In Stock
                                            <FaTimes className="cursor-pointer hover:text-blue-900" onClick={() => handleFilterChange('inStock', false)} />
                                        </span>
                                    )}

                                    {selectedFilters.freeShipping && (
                                        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full border border-blue-200 font-medium">
                                            Free Shipping
                                            <FaTimes className="cursor-pointer hover:text-blue-900" onClick={() => handleFilterChange('freeShipping', false)} />
                                        </span>
                                    )}

                                    {selectedFilters.onSale && (
                                        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full border border-blue-200 font-medium">
                                            On Sale
                                            <FaTimes className="cursor-pointer hover:text-blue-900" onClick={() => handleFilterChange('onSale', false)} />
                                        </span>
                                    )}

                                    {selectedFilters.sizes.map((size) => (
                                        <span key={size} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full border border-blue-200 font-medium">
                                            Size: {size}
                                            <FaTimes className="cursor-pointer hover:text-blue-900" onClick={() => toggleArrayFilter('sizes', size)} />
                                        </span>
                                    ))}

                                    {selectedFilters.colors.map((color) => (
                                        <span key={color} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full border border-blue-200 font-medium">
                                            Color: {color}
                                            <FaTimes className="cursor-pointer hover:text-blue-900" onClick={() => toggleArrayFilter('colors', color)} />
                                        </span>
                                    ))}

                                    {selectedFilters.brands.map((brand) => (
                                        <span key={brand} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full border border-blue-200 font-medium">
                                            Brand: {brand}
                                            <FaTimes className="cursor-pointer hover:text-blue-900" onClick={() => toggleArrayFilter('brands', brand)} />
                                        </span>
                                    ))}

                                    {selectedFilters.rating > 0 && (
                                        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full border border-blue-200 font-medium">
                                            {selectedFilters.rating}+ Stars
                                            <FaTimes className="cursor-pointer hover:text-blue-900" onClick={() => handleFilterChange('rating', 0)} />
                                        </span>
                                    )}

                                    {(priceRange[0] > 0 || priceRange[1] < 10000) && (
                                        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full border border-blue-200 font-medium">
                                            ₹{priceRange[0]} - ₹{priceRange[1]}
                                            <FaTimes className="cursor-pointer hover:text-blue-900" onClick={() => {
                                                setPriceRange([0, 10000]);
                                                setTempPriceRange([0, 10000]);
                                            }} />
                                        </span>
                                    )}

                                    <Button
                                        onClick={clearAllFilters}
                                        className="!text-xs !text-red-600 hover:!text-red-700 !bg-transparent !border-none !p-0 !h-auto !min-w-0 !font-semibold !underline"
                                    >
                                        Clear All Filters
                                    </Button>
                                </div>
                            </div>
                        )}
                        {/* Sort Menu */}
                        <Menu
                            id="sort-menu"
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleClose}
                            MenuListProps={{
                                'aria-labelledby': 'sort-button',
                            }}
                        >
                            {sortOptions.map((option) => (
                                <MenuItem
                                    key={option.value}
                                    onClick={() => handleSortChange(option.value)}
                                    className="flex items-center gap-2 min-w-[200px]"
                                    selected={sortBy === option.value}
                                >
                                    {option.icon && <span className="text-gray-500">{option.icon}</span>}
                                    <span className="flex-1">{option.label}</span>
                                    {sortBy === option.value && (
                                        <span className="text-blue-600 font-bold">✓</span>
                                    )}
                                </MenuItem>
                            ))}
                        </Menu>

                        {/* Filter Menu */}
                        <Menu
                            id="filter-menu"
                            anchorEl={filterAnchorEl}
                            open={filterOpen}
                            onClose={handleFilterClose}
                            PaperProps={{
                                style: {
                                    minWidth: '380px',
                                    maxHeight: '600px',
                                    borderRadius: '12px'
                                }
                            }}
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                                    <button
                                        onClick={handleFilterClose}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>

                                {/* Price Range Filter */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        Price Range
                                    </label>
                                    <Slider
                                        value={tempPriceRange}
                                        onChange={(e, newValue) => setTempPriceRange(newValue)}
                                        valueLabelDisplay="auto"
                                        min={0}
                                        max={10000}
                                        step={100}
                                        valueLabelFormat={(value) => `₹${value}`}
                                        className="!text-blue-600"
                                    />
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-sm text-gray-600 font-medium">₹{tempPriceRange[0]}</span>
                                        <span className="text-sm text-gray-600 font-medium">₹{tempPriceRange[1]}</span>
                                    </div>
                                </div>

                                {/* Size Filter */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        Size
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableSizes.map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => toggleArrayFilter('sizes', size)}
                                                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${selectedFilters.sizes.includes(size)
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Color Filter */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        Color
                                    </label>
                                    <div className="flex flex-wrap gap-3">
                                        {availableColors.map((color) => (
                                            <button
                                                key={color.name}
                                                onClick={() => toggleArrayFilter('colors', color.name)}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${selectedFilters.colors.includes(color.name)
                                                    ? 'bg-blue-50 border-blue-600'
                                                    : 'bg-white border-gray-300 hover:border-blue-400'
                                                    }`}
                                                title={color.name}
                                            >
                                                <span
                                                    className="w-5 h-5 rounded-full border-2 border-gray-300"
                                                    style={{ backgroundColor: color.code }}
                                                />
                                                <span className="text-xs">{color.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Brand Filter */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        Brand
                                    </label>
                                    <div className="space-y-2">
                                        {availableBrands.map((brand) => (
                                            <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFilters.brands.includes(brand)}
                                                    onChange={() => toggleArrayFilter('brands', brand)}
                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                                                    {brand}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Rating Filter */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        Minimum Rating
                                    </label>
                                    <div className="space-y-2">
                                        {[4, 3, 2, 1].map((rating) => (
                                            <label key={rating} className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="radio"
                                                    name="rating"
                                                    checked={selectedFilters.rating === rating}
                                                    onChange={() => handleFilterChange('rating', rating)}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                                                    {rating}+ Stars
                                                </span>
                                            </label>
                                        ))}
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="rating"
                                                checked={selectedFilters.rating === 0}
                                                onChange={() => handleFilterChange('rating', 0)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                                                All Ratings
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* Quick Filters */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        Quick Filters
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={selectedFilters.inStock}
                                                onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                                                In Stock Only
                                            </span>
                                        </label>

                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={selectedFilters.freeShipping}
                                                onChange={(e) => handleFilterChange('freeShipping', e.target.checked)}
                                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                                                Free Shipping
                                            </span>
                                        </label>

                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={selectedFilters.onSale}
                                                onChange={(e) => handleFilterChange('onSale', e.target.checked)}
                                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                                                On Sale
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4 border-t border-gray-200">
                                    <Button
                                        onClick={clearAllFilters}
                                        className="!flex-1 !text-sm !bg-gray-100 !text-gray-700 hover:!bg-gray-200 !px-4 !py-2.5 !rounded-lg !font-semibold transition-all"
                                    >
                                        Clear All
                                    </Button>
                                    <Button
                                        onClick={applyFilters}
                                        className="!flex-1 !text-sm !bg-blue-600 !text-white hover:!bg-blue-700 !px-4 !py-2.5 !rounded-lg !font-semibold transition-all"
                                    >
                                        Apply Filters
                                    </Button>
                                </div>
                            </div>
                        </Menu>

                        {/* Products Grid/List */}
                        <div
                            className={
                                itemView === "grid"
                                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                    : "flex flex-col gap-4"
                            }
                        >
                            {loading && items.length === 0 ? (
                                <div className="col-span-full py-20 text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="mt-4 text-gray-600">Loading products...</p>
                                </div>
                            ) : error ? (
                                <div className="col-span-full py-20 text-center">
                                    <p className="text-red-600 text-lg">{error}</p>
                                </div>
                            ) : items.length === 0 ? (
                                <div className="col-span-full py-20 text-center">
                                    <p className="text-gray-600 text-lg">No products found</p>
                                    <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
                                </div>
                            ) : (
                                items.map((product) => (
                                    <ProductCard
                                        key={product.id || product._id}
                                        product={product}
                                        view={itemView}
                                    />
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {!loading && !error && totalPages > 1 && (
                            <div className="flex justify-center mt-8">
                                <Pagination
                                    count={totalPages}
                                    page={page}
                                    onChange={(_e, value) => setPage(value)}
                                    showFirstButton
                                    showLastButton
                                    size="large"
                                    siblingCount={1}
                                    boundaryCount={1}
                                    className="pagination"
                                    sx={{
                                        '& .MuiPaginationItem-root': {
                                            '&.Mui-selected': {
                                                backgroundColor: '#2563eb',
                                                color: 'white',
                                                '&:hover': {
                                                    backgroundColor: '#1d4ed8',
                                                },
                                            },
                                        },
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </section>
);
};

export default ProductListing;