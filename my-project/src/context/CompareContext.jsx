import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { toast } from 'react-toastify';

const CompareContext = createContext();

export const useCompare = () => {
    const context = useContext(CompareContext);
    if (!context) {
        throw new Error('useCompare must be used within a CompareProvider');
    }
    return context;
};

export const CompareProvider = ({ children }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [itemCount, setItemCount] = useState(0);

    // Load compare from localStorage on mount
    const loadCompareFromStorage = () => {
        try {
            const stored = localStorage.getItem('classyshop_compare');
            if (stored) {
                const parsed = JSON.parse(stored);
                setItems(parsed.items || []);
            }
        } catch (e) {
            console.warn('Failed to load compare from localStorage', e);
        }
    };

    // Save compare to localStorage
    const saveCompareToStorage = (items) => {
        try {
            localStorage.setItem('classyshop_compare', JSON.stringify({ items }));
        } catch (e) {
            console.warn('Failed to save compare to localStorage', e);
        }
    };

    // Calculate item count whenever items change
    useEffect(() => {
        setItemCount(items.length);
    }, [items]);

    // Sync to localStorage whenever items change
    useEffect(() => {
        saveCompareToStorage(items);
    }, [items]);

    // Fetch compare from server (disabled: backend does not provide /api/compare)
    const fetchCompare = async () => {
        setLoading(true);
        try {
            loadCompareFromStorage();
        } finally {
            setLoading(false);
        }
    };

    // Add item to compare (with localStorage fallback)
    const addToCompare = async (productId, productMeta = {}) => {
        try {
            setLoading(true);
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
                setItems([...items, newItem]);
            }
            toast.success('Added to Compare');
            return true;
        } finally {
            setLoading(false);
        }
    };

    // Remove item from compare (with localStorage fallback)
    const removeFromCompare = async (productId) => {
        setLoading(true);
        try {
            const newItems = items.filter(item => (item.product?._id || item.product || item._id) !== productId);
            setItems(newItems);
            toast.success('Removed from Compare');
            return true;
        } finally {
            setLoading(false);
        }
    };

    // Check if item is in compare
    const isInCompare = (productId) => {
        return items.some(item => (item.product?._id || item.product || item._id) === productId);
    };

    // Toggle compare item
    const toggleCompare = async (productId, productMeta = {}) => {
        if (isInCompare(productId)) {
            return await removeFromCompare(productId);
        } else {
            return await addToCompare(productId, productMeta);
        }
    };

    // Clear compare (with localStorage fallback)
    const clearCompare = async () => {
        setLoading(true);
        try {
            setItems([]);
            toast.success('Compare cleared');
            return true;
        } finally {
            setLoading(false);
        }
    };

    // Initialize compare on mount
    useEffect(() => {
        // Always localStorage-only
        loadCompareFromStorage();
    }, []);

    const value = {
        items,
        itemCount,
        loading,
        fetchCompare,
        addToCompare,
        removeFromCompare,
        isInCompare,
        toggleCompare,
        clearCompare,
    };

    return (
        <CompareContext.Provider value={value}>
            {children}
        </CompareContext.Provider>
    );
};

export default CompareProvider;
