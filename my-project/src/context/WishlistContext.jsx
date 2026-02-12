import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/client';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};

export const WishlistProvider = ({ children }) => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [itemCount, setItemCount] = useState(0);

    const userId = useMemo(() => {
        const uid = user?._id || user?.id || user?.userId;
        return uid ? String(uid) : '';
    }, [user?._id, user?.id, user?.userId]);

    const getWishlistStorageKey = useCallback(() => {
        return userId ? `classyshop_wishlist_${userId}` : 'classyshop_wishlist_guest';
    }, [userId]);

    // Load wishlist from localStorage on mount
    const loadWishlistFromStorage = useCallback(() => {
        try {
            const key = getWishlistStorageKey();

            const legacyKey = 'classyshop_wishlist';
            const legacy = localStorage.getItem(legacyKey);
            const stored = localStorage.getItem(key) || legacy;

            if (stored) {
                const parsed = JSON.parse(stored);
                setItems(parsed.items || []);

                if (!localStorage.getItem(key) && legacy) {
                    localStorage.setItem(key, stored);
                }
            }

            if (legacy && key !== legacyKey) {
                localStorage.removeItem(legacyKey);
            }
        } catch (e) {
            console.warn('Failed to load wishlist from localStorage', e);
        }
    }, [getWishlistStorageKey]);

    // Save wishlist to localStorage
    const saveWishlistToStorage = useCallback((items) => {
        try {
            localStorage.setItem(getWishlistStorageKey(), JSON.stringify({ items }));
        } catch (e) {
            console.warn('Failed to save wishlist to localStorage', e);
        }
    }, [getWishlistStorageKey]);

    // Calculate item count whenever items change
    useEffect(() => {
        setItemCount(items.length);
    }, [items]);

    // Sync to localStorage whenever items change
    useEffect(() => {
        saveWishlistToStorage(items);
    }, [items, saveWishlistToStorage]);

    // Fetch wishlist from server
    const fetchWishlist = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/wishlist');
            setItems(response.data.items || []);
        } catch (error) {
            console.error('Failed to fetch wishlist:', error);
            // If unauthorized or network error, fallback to localStorage
            loadWishlistFromStorage();
        } finally {
            setLoading(false);
        }
    }, [loadWishlistFromStorage]);

    // Add item to wishlist (with localStorage fallback)
    // Signature supports both:
    // - addToWishlist(productId, productMeta)
    // - addToWishlist(productId, variant)
    // - addToWishlist(productId, productMeta, variant)
    const addToWishlist = async (productId, productMetaOrVariant = {}, variantArg) => {
        const variant = (variantArg && typeof variantArg === 'object')
            ? variantArg
            : (productMetaOrVariant && typeof productMetaOrVariant === 'object' && ('size' in productMetaOrVariant || 'color' in productMetaOrVariant))
                ? productMetaOrVariant
                : null;

        const productMeta = (variantArg && typeof variantArg === 'object')
            ? (productMetaOrVariant && typeof productMetaOrVariant === 'object' ? productMetaOrVariant : {})
            : (!variant && productMetaOrVariant && typeof productMetaOrVariant === 'object')
                ? productMetaOrVariant
                : {};
        try {
            setLoading(true);
            const response = await apiClient.post('/wishlist/add', {
                productId,
                ...(productMeta && typeof productMeta === 'object' ? productMeta : {}),
            });
            setItems(response.data.items || []);
            toast.success('Added to Wishlist');
            return true;
        } catch (error) {
            console.error('Failed to add to wishlist:', error);
            // Fallback: add to localStorage wishlist
            const exists = items.some(item => (item.product?._id || item.product || item._id) === productId);
            if (!exists) {
                const newItem = {
                    _id: productId,
                    product: {
                        _id: productId,
                        name: productMeta.name || 'Product',
                        price: productMeta.price || 0,
                        image: productMeta.image || '',
                        brand: productMeta.brand || '',
                        sku: productMeta.sku || '',
                    },
                    price: productMeta.price || 0,
                    quantity: 1,
                };
                const newItems = [...items, newItem];
                setItems(newItems);
                toast.success('Added to Wishlist');
            }
            return true;
        } finally {
            setLoading(false);
        }
    };

    // Remove item from wishlist (with localStorage fallback)
    const removeFromWishlist = async (productId) => {
        try {
            setLoading(true);
            const response = await apiClient.delete(`/wishlist/remove/${productId}`);
            setItems(response.data.items || []);
            toast.success('Removed from Wishlist');
            return true;
        } catch (error) {
            console.error('Failed to remove from wishlist:', error);
            // Fallback: remove from localStorage wishlist
            const newItems = items.filter(item => (item.product?._id || item.product || item._id) !== productId);
            setItems(newItems);
            toast.success('Removed from Wishlist');
            return true;
        } finally {
            setLoading(false);
        }
    };

    // Check if item is in wishlist
    const isInWishlist = (productId) => {
        return items.some(item => (item.product?._id || item.product || item._id) === productId);
    };

    // Toggle wishlist item
    const toggleWishlist = async (productId, productMetaOrVariant = {}, variantArg) => {
        if (isInWishlist(productId)) {
            return await removeFromWishlist(productId);
        } else {
            return await addToWishlist(productId, productMetaOrVariant, variantArg);
        }
    };

    // Clear wishlist (with localStorage fallback)
    const clearWishlist = async () => {
        try {
            setLoading(true);
            await apiClient.delete('/wishlist/clear');
            setItems([]);
            toast.success('Wishlist cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear wishlist:', error);
            // Fallback: clear localStorage wishlist
            setItems([]);
            toast.success('Wishlist cleared');
            return true;
        } finally {
            setLoading(false);
        }
    };

    // Initialize wishlist on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        // Always load from localStorage first to ensure persistence
        loadWishlistFromStorage();
        if (token) {
            fetchWishlist();
        }
    }, [user, fetchWishlist, loadWishlistFromStorage]);

    const value = {
        items,
        itemCount,
        loading,
        fetchWishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
        clearWishlist,
    };

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
};

export default WishlistProvider;
