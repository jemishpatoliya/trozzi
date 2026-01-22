import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoSearchSharp, IoClose } from 'react-icons/io5';
import { fetchProducts } from '../../api/catalog';

const FALLBACK_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

const GlobalSearch = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const navigate = useNavigate();
    const searchRef = useRef(null);

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }
    }, []);

    // Save recent searches to localStorage
    const saveRecentSearch = (query) => {
        if (!query.trim()) return;

        const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    // Search products
    const searchProducts = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        const normalizeProduct = (p) => {
            if (!p || typeof p !== 'object') return null;
            const id = p.id || p._id || '';
            return {
                ...p,
                id,
            };
        };

        setIsLoading(true);
        try {
            const results = await fetchProducts({ q: query, limit: 10 });
            const items = Array.isArray(results) ? results : (results && Array.isArray(results.items) ? results.items : []);
            setSearchResults(items.map(normalizeProduct).filter(Boolean));
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) {
                searchProducts(searchQuery);
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle search submit
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            saveRecentSearch(searchQuery);
            navigate(`/ProductListing?q=${encodeURIComponent(searchQuery)}`);
            setIsSearchOpen(false);
            setSearchQuery('');
        }
    };

    // Handle product click
    const handleProductClick = (product) => {
        saveRecentSearch(searchQuery);
        setIsSearchOpen(false);
        setSearchQuery('');
        const id = product?.id || product?._id;
        if (id) {
            navigate(`/product/${id}`);
        }
    };

    // Handle recent search click
    const handleRecentSearchClick = (query) => {
        setSearchQuery(query);
        navigate(`/ProductListing?q=${encodeURIComponent(query)}`);
        setIsSearchOpen(false);
        setSearchQuery('');
    };

    // Close search on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={searchRef}>
            {/* Search Input */}
            <div className="relative">
                <form onSubmit={handleSearch}>
                    <div className={`flex items-center bg-surface-50 dark:bg-surface-800 rounded-xl border transition-all duration-200 ${isSearchOpen ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800 shadow-lg' : 'border-border-200 dark:border-border-700 hover:border-border-300 dark:hover:border-border-600 shadow-sm'
                        }`}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchOpen(true)}
                            placeholder="Search products, brands, categories..."
                            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-transparent outline-none text-sm text-text-900 dark:text-text-100 placeholder-text-500 dark:placeholder-text-400"
                        />
                        <button
                            type="submit"
                            className="p-2.5 sm:p-3 text-text-500 dark:text-text-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                            <IoSearchSharp className="text-xl" />
                        </button>
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="p-2.5 sm:p-3 text-text-400 dark:text-text-500 hover:text-text-600 dark:hover:text-text-300 transition-colors"
                            >
                                <IoClose className="text-lg" />
                            </button>
                        )}
                    </div>
                </form>

                {/* Search Results Dropdown */}
                {isSearchOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-surface-900 rounded-xl shadow-xl border border-border-200 dark:border-border-700 max-h-96 overflow-hidden z-50 animate-in slide-in-from-top-1 duration-200">
                        {/* Loading State */}
                        {isLoading && (
                            <div className="p-4 text-center text-text-500 dark:text-text-400">
                                <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-primary-500 border-t-transparent"></div>
                                <span className="ml-2 text-sm font-medium">Searching...</span>
                            </div>
                        )}

                        {/* Search Results */}
                        {!isLoading && searchResults.length > 0 && (
                            <div>
                                <div className="px-4 py-3 border-b border-border-200 dark:border-border-700 bg-surface-50 dark:bg-surface-800">
                                    <p className="text-xs font-semibold text-text-600 dark:text-text-300 uppercase tracking-wider">Products</p>
                                </div>
                                {searchResults.map((product) => (
                                    <div
                                        key={product.id || product._id || product.slug || product.name}
                                        onClick={() => handleProductClick(product)}
                                        className="flex items-center p-4 hover:bg-surface-50 dark:hover:bg-surface-800 cursor-pointer transition-colors duration-150 border-b border-border-100 dark:border-border-800 last:border-b-0"
                                    >
                                        <img
                                            src={product.image || FALLBACK_IMAGE}
                                            alt={product.name}
                                            className="w-12 h-12 object-cover rounded-lg mr-3 border border-border-200 dark:border-border-700"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = FALLBACK_IMAGE;
                                            }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-text-900 dark:text-text-100 truncate">
                                                {product.name}
                                            </h4>
                                            <p className="text-xs text-text-500 dark:text-text-400 truncate mt-0.5">
                                                {product.description}
                                            </p>
                                            <p className="text-sm font-bold text-success-600 dark:text-success-400 mt-1">
                                                ${product.price?.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div className="p-3 border-t border-border-200 dark:border-border-700 bg-surface-50 dark:bg-surface-800">
                                    <button
                                        onClick={() => handleSearch({ preventDefault: () => { } })}
                                        className="w-full text-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                                    >
                                        View all results for "{searchQuery}"
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Recent Searches */}
                        {!isLoading && searchResults.length === 0 && searchQuery.length === 0 && recentSearches.length > 0 && (
                            <div>
                                <div className="px-4 py-3 border-b border-border-200 dark:border-border-700 bg-surface-50 dark:bg-surface-800">
                                    <p className="text-xs font-semibold text-text-600 dark:text-text-300 uppercase tracking-wider">Recent Searches</p>
                                </div>
                                {recentSearches.map((query, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleRecentSearchClick(query)}
                                        className="flex items-center p-3 hover:bg-surface-50 dark:hover:bg-surface-800 cursor-pointer transition-colors duration-150 border-b border-border-100 dark:border-border-800 last:border-b-0"
                                    >
                                        <IoSearchSharp className="text-text-400 dark:text-text-500 mr-3" />
                                        <span className="text-sm text-text-700 dark:text-text-200">{query}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* No Results */}
                        {!isLoading && searchQuery.length > 0 && searchResults.length === 0 && (
                            <div className="p-4 text-center text-text-500 dark:text-text-400">
                                <IoSearchSharp className="text-2xl text-text-300 dark:text-text-600 mx-auto mb-2" />
                                <p className="text-sm font-medium">No products found for "{searchQuery}"</p>
                                <p className="text-xs text-text-400 dark:text-text-500 mt-1">Try different keywords</p>
                            </div>
                        )}

                        {/* Search Suggestions */}
                        {!isLoading && searchResults.length === 0 && searchQuery.length === 0 && recentSearches.length === 0 && (
                            <div className="p-4">
                                <p className="text-xs font-semibold text-text-600 dark:text-text-300 uppercase tracking-wider mb-3">Popular Searches</p>
                                <div className="flex flex-wrap gap-2">
                                    {['Fashion', 'Electronics', 'Footwear', 'Bags', 'Medicine'].map((term) => (
                                        <button
                                            key={term}
                                            onClick={() => handleRecentSearchClick(term)}
                                            className="px-3 py-1.5 text-xs bg-surface-100 dark:bg-surface-800 text-text-700 dark:text-text-200 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-150 border border-border-200 dark:border-border-700"
                                        >
                                            {term}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlobalSearch;
