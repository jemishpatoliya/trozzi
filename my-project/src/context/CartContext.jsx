import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [itemCount, setItemCount] = useState(0);
    const [isHydrated, setIsHydrated] = useState(false);

    const getUserId = () => {
        const uid = user?._id || user?.id || user?.userId;
        return uid ? String(uid) : '';
    };

    const getCartStorageKey = () => {
        const uid = getUserId();
        return uid ? `classyshop_cart_${uid}` : 'classyshop_cart_guest';
    };

    const roundMoney = (v) => Math.round((Number(v ?? 0) || 0) * 100) / 100;

    const getComparableId = (item) => item?.product?._id || item?.product || item?._id;

    const normalizeDetails = (details) => (details && typeof details === 'object') ? details : {};

    const extractVariantPayload = (details) => {
        const detailObject = normalizeDetails(details);
        const allowedKeys = ['size', 'color', 'image', 'variantId', 'options'];
        return Object.fromEntries(
            Object.entries(detailObject).filter(([key]) => allowedKeys.includes(key))
        );
    };

    const calculateTotalAmount = (cartItems) => {
        return roundMoney(cartItems.reduce((sum, item) => {
            const qty = Number(item?.quantity ?? 0) || 0;
            const price = Number(item?.price ?? item?.product?.price ?? 0) || 0;
            return sum + (price * qty);
        }, 0));
    };

    const loadCartFromStorage = () => {
        try {
            const key = getCartStorageKey();

            const legacyKey = 'classyshop_cart';
            const legacy = localStorage.getItem(legacyKey);
            const stored = localStorage.getItem(key) || legacy;

            if (stored) {
                const parsed = JSON.parse(stored);
                setItems(parsed.items || []);
                setTotalAmount(parsed.totalAmount || 0);

                if (!localStorage.getItem(key) && legacy) {
                    localStorage.setItem(key, stored);
                }
            }

            if (legacy && key !== legacyKey) {
                localStorage.removeItem(legacyKey);
            }
        } catch (e) {
            console.warn('Failed to load cart from localStorage', e);
        }
    };

    const saveCartToStorage = (itemsToSave, amountToSave) => {
        try {
            localStorage.setItem(getCartStorageKey(), JSON.stringify({ items: itemsToSave, totalAmount: amountToSave }));
        } catch (e) {
            console.warn('Failed to save cart to localStorage', e);
        }
    };

    useEffect(() => {
        const count = items.reduce((total, item) => total + (item.quantity || 0), 0);
        setItemCount(count);
    }, [items]);

    useEffect(() => {
        if (!isHydrated) return;
        saveCartToStorage(items, totalAmount);
    }, [items, totalAmount, isHydrated]);

    const fetchCart = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/cart');
            const localItems = JSON.parse(localStorage.getItem(getCartStorageKey()) || '{}').items || [];
            const serverItems = response.data.items || [];
            const mergedItems = [...serverItems];

            const makeLineKey = (item) => {
                const pid = String(getComparableId(item) || '');
                const size = String(item?.size || item?.product?.size || '').trim();
                const color = String(item?.color || item?.product?.color || '').trim();
                return `${pid}__${size}__${color}`;
            };

            const serverByKey = new Map(serverItems.map((it) => [makeLineKey(it), it]));

            localItems.forEach((localItem) => {
                const key = makeLineKey(localItem);
                const localId = getComparableId(localItem);

                const matchedServer = serverByKey.get(key) || (localId ? serverItems.find((s) => getComparableId(s) === localId) : null);

                if (matchedServer) {
                    // Upgrade local item with server product snapshot (contains codCharge/codAvailable)
                    const idx = mergedItems.findIndex((m) => makeLineKey(m) === key);
                    if (idx >= 0) {
                        mergedItems[idx] = {
                            ...localItem,
                            ...matchedServer,
                            product: matchedServer.product || localItem.product,
                        };
                    }
                    return;
                }

                if (!mergedItems.some((item) => makeLineKey(item) === key)) {
                    mergedItems.push(localItem);
                }
            });
            setItems(mergedItems);
            setTotalAmount(calculateTotalAmount(mergedItems));
        } catch (error) {
            console.error('Failed to fetch cart:', error);
            loadCartFromStorage();
        } finally {
            setLoading(false);
        }
    };

    // Add item to cart (with localStorage fallback)
    // Signature supports both:
    // - addToCart(productId, qty, productMeta)
    // - addToCart(productId, qty, variant)
    // - addToCart(productId, qty, productMeta, variant)
    const addToCart = async (productId, quantity = 1, productMetaOrVariant = {}, variantArg) => {
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

        const detailObject = normalizeDetails(productMeta);
        const variantPayload = extractVariantPayload(variant);
        try {
            setLoading(true);
            const response = await apiClient.post('/cart/add', {
                productId,
                quantity,
                ...variantPayload,
                price: (detailObject && typeof detailObject.price === 'number') ? detailObject.price : undefined,
            });
            setItems(response.data.items || []);
            setTotalAmount(calculateTotalAmount(response.data.items || []));
            toast.success('Item added to cart');
            return { success: true, message: response.data.message };
        } catch (error) {
            console.error('Failed to add to cart:', error);
            const existingItem = items.find(item => getComparableId(item) === productId);
            let newItems;
            if (existingItem) {
                newItems = items.map(item =>
                    getComparableId(item) === productId
                        ? { ...item, quantity: (item.quantity || 0) + quantity }
                        : item
                );
            } else {
                const newItem = {
                    _id: productId,
                    product: {
                        _id: productId,
                        name: detailObject.name || 'Product',
                        price: detailObject.price ?? 0,
                        image: detailObject.image || '',
                        brand: detailObject.brand || '',
                        sku: detailObject.sku || '',
                        size: variantPayload.size,
                        color: variantPayload.color,
                    },
                    price: detailObject.price ?? 0,
                    quantity,
                    size: productMeta.size || '',
                    color: productMeta.color || '',
                    image: productMeta.image || '',
                };
                newItems = [...items, newItem];
            }
            const newTotal = calculateTotalAmount(newItems);
            setItems(newItems);
            setTotalAmount(newTotal);
            toast.success('Item added to cart');
            return { success: true, message: 'Item added to cart' };
        } finally {
            setLoading(false);
        }
    };

    // Helper to calculate total amount
    const newTotalAmount = (cartItems) => {
        return cartItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
    };

    // Update cart item quantity (with localStorage fallback)
    const updateQuantity = async (productId, quantity, variant) => {
        const variantPayload = extractVariantPayload(variant);
        try {
            setLoading(true);
            const response = await apiClient.put('/cart/update', {
                productId,
                quantity,
                ...variantPayload,
            });
            setItems(response.data.items || []);
            setTotalAmount(calculateTotalAmount(response.data.items || []));
            return { success: true, message: response.data.message };
        } catch (error) {
            console.error('Failed to update cart:', error);
            const newItems = items.map(item =>
                getComparableId(item) === productId
                    ? { ...item, quantity }
                    : item
            );
            const newTotal = calculateTotalAmount(newItems);
            setItems(newItems);
            setTotalAmount(newTotal);
            return { success: true, message: 'Cart updated' };
        } finally {
            setLoading(false);
        }
    };

    // Remove item from cart (with localStorage fallback)
    const removeFromCart = async (productId, variant) => {
        const variantPayload = extractVariantPayload(variant);
        try {
            setLoading(true);

            const hasVariant = Object.keys(variantPayload).length > 0;

            const shouldUseBodyRemove =
                !productId ||
                typeof productId !== 'string' ||
                productId === '[object Object]' ||
                hasVariant;

            const response = shouldUseBodyRemove
                ? await apiClient.delete('/cart/remove', { data: { productId, ...(hasVariant ? variantPayload : {}) } })
                : await apiClient.delete(`/cart/remove/${productId}`);

            setItems(response.data.items || []);
            setTotalAmount(calculateTotalAmount(response.data.items || []));
            return { success: true, message: response.data.message };
        } catch (error) {
            console.error('Failed to remove from cart:', error);
            const newItems = items.filter(item => getComparableId(item) !== productId);
            const newTotal = calculateTotalAmount(newItems);
            setItems(newItems);
            setTotalAmount(newTotal);
            return { success: true, message: 'Item removed' };
        } finally {
            setLoading(false);
        }
    };

    const clearCart = async () => {
        try {
            setLoading(true);
            const response = await apiClient.delete('/cart/clear');
            setItems([]);
            setTotalAmount(0);
            return { success: true, message: response.data.message };
        } catch (error) {
            console.error('Failed to clear cart:', error);
            setItems([]);
            setTotalAmount(0);
            return { success: true, message: 'Cart cleared' };
        } finally {
            setLoading(false);
        }
    };

    const getItemQuantity = (productId) => {
        const item = items.find(item => getComparableId(item) === productId);
        return item ? item.quantity : 0;
    };

    const isInCart = (productId) => {
        return items.some(item => getComparableId(item) === productId);
    };

    useEffect(() => {
        setIsHydrated(false);
        loadCartFromStorage();
        setIsHydrated(true);
        const token = localStorage.getItem('token');
        if (token) {
            fetchCart();
        }
    }, [user]);

    const value = {
        items,
        totalAmount,
        loading,
        itemCount,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getItemQuantity,
        isInCart,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
