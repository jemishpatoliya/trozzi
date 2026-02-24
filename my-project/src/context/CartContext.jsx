import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
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

    const getUserId = useCallback(() => {
        const uid = user?._id || user?.id || user?.userId;
        return uid ? String(uid) : '';
    }, [user]);

    const getCartStorageKey = useCallback(() => {
        const uid = getUserId();
        return uid ? `classyshop_cart_${uid}` : 'classyshop_cart_guest';
    }, [getUserId]);

    const roundMoney = useCallback((v) => Math.round((Number(v ?? 0) || 0) * 100) / 100, []);

    const getComparableId = (item) => item?.product?._id || item?.product || item?._id;

    const normalizeDetails = (details) => (details && typeof details === 'object') ? details : {};

    const extractVariantPayload = (details) => {
        const detailObject = normalizeDetails(details);
        const allowedKeys = ['size', 'color', 'image', 'variantId', 'options'];
        return Object.fromEntries(
            Object.entries(detailObject).filter(([key]) => allowedKeys.includes(key))
        );
    };

    const makeLineKey = useCallback((item) => {
        const pid = String(getComparableId(item) || '');
        const size = String(item?.size || item?.product?.size || '').trim();
        const color = String(item?.color || item?.product?.color || '').trim();
        return `${pid}__${size}__${color}`;
    }, []);

    const calculateTotalAmount = useCallback((cartItems) => {
        return roundMoney(cartItems.reduce((sum, item) => {
            const qty = Number(item?.quantity ?? 0) || 0;
            const price = Number(item?.price ?? item?.product?.price ?? 0) || 0;
            return sum + (price * qty);
        }, 0));
    }, [roundMoney]);

    const loadCartFromStorage = useCallback(() => {
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
    }, [getCartStorageKey]);

    const saveCartToStorage = useCallback((itemsToSave, amountToSave) => {
        try {
            localStorage.setItem(getCartStorageKey(), JSON.stringify({ items: itemsToSave, totalAmount: amountToSave }));
        } catch (e) {
            console.warn('Failed to save cart to localStorage', e);
        }
    }, [getCartStorageKey]);

    useEffect(() => {
        const count = items.reduce((total, item) => total + (item.quantity || 0), 0);
        setItemCount(count);
    }, [items]);

    useEffect(() => {
        if (!isHydrated) return;
        saveCartToStorage(items, totalAmount);
    }, [items, totalAmount, isHydrated, saveCartToStorage]);

    const fetchCart = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/cart');
            const localItems = JSON.parse(localStorage.getItem(getCartStorageKey()) || '{}').items || [];
            const serverItems = response.data.items || [];
            const mergedItems = [...serverItems];

            const serverByKey = new Map(serverItems.map((it) => [makeLineKey(it), it]));

            localItems.forEach((localItem) => {
                const key = makeLineKey(localItem);
                const localId = getComparableId(localItem);

                const matchedServer = serverByKey.get(key) || (localId ? serverItems.find((s) => getComparableId(s) === localId) : null);

                if (matchedServer) {
                    // Upgrade local item with server product snapshot (contains codCharge/codAvailable)
                    const idx = mergedItems.findIndex((m) => makeLineKey(m) === key);
                    if (idx >= 0) {
                        const localPrice = localItem?.price ?? localItem?.product?.price;
                        const localSku = localItem?.sku ?? localItem?.product?.sku;
                        mergedItems[idx] = {
                            ...localItem,
                            ...matchedServer,
                            // Preserve variant-specific overrides from local cart when server snapshot doesn't have them.
                            price: localItem?.price ?? matchedServer?.price,
                            sku: localItem?.sku ?? matchedServer?.sku,
                            product: {
                                ...(matchedServer.product || localItem.product),
                                price: localPrice ?? (matchedServer?.product?.price ?? matchedServer?.price),
                                sku: localSku ?? (matchedServer?.product?.sku ?? matchedServer?.sku),
                            },
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
    }, [calculateTotalAmount, getCartStorageKey, loadCartFromStorage]);

    // Add item to cart (with localStorage fallback)
    // Signature supports both:
    // - addToCart(productId, qty, productMeta)
    // - addToCart(productId, qty, variant)
    // - addToCart(productId, qty, productMeta, variant)
    const addToCart = async (productId, quantity = 1, productMetaOrVariant = {}, variantArg) => {
        const candidate = (productMetaOrVariant && typeof productMetaOrVariant === 'object') ? productMetaOrVariant : {};
        const hasMetaFields = ['name', 'price', 'sku', 'brand', 'image'].some((k) => k in candidate);
        const hasVariantFields = ['size', 'color', 'variantId', 'options'].some((k) => k in candidate);

        // Common callsite passes a single object with BOTH meta + variant fields.
        // In that case we must keep meta (price/sku) instead of treating the object as a variant-only payload.
        if (!variantArg && hasMetaFields && hasVariantFields) {
            const detailObject = normalizeDetails(candidate);
            const variantPayload = extractVariantPayload(candidate);
            try {
                setLoading(true);
                const response = await apiClient.post('/cart/add', {
                    productId,
                    quantity,
                    name: detailObject.name,
                    sku: detailObject.sku,
                    image: detailObject.image,
                    ...variantPayload,
                    price: Number.isFinite(Number(detailObject.price)) ? Number(detailObject.price) : undefined,
                });

                const respItems = Array.isArray(response.data?.items) ? response.data.items : [];
                const lineKey = makeLineKey({ _id: productId, size: variantPayload?.size, color: variantPayload?.color });
                const patchedItems = respItems.map((it) => {
                    if (makeLineKey(it) !== lineKey) return it;
                    const next = { ...it };
                    if (Number.isFinite(Number(detailObject.price))) {
                        next.price = Number(detailObject.price);
                    }
                    if (typeof detailObject.sku === 'string' && detailObject.sku.trim()) {
                        next.sku = detailObject.sku.trim();
                    }
                    if (next.product && typeof next.product === 'object') {
                        next.product = {
                            ...next.product,
                            ...(Number.isFinite(Number(detailObject.price)) ? { price: Number(detailObject.price) } : {}),
                            ...(typeof detailObject.sku === 'string' && detailObject.sku.trim() ? { sku: detailObject.sku.trim() } : {}),
                        };
                    }
                    return next;
                });

                setItems(patchedItems);
                setTotalAmount(calculateTotalAmount(patchedItems));
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
                            price: Number.isFinite(Number(detailObject.price)) ? Number(detailObject.price) : 0,
                            image: detailObject.image || '',
                            brand: detailObject.brand || '',
                            sku: typeof detailObject.sku === 'string' ? detailObject.sku : '',
                            size: variantPayload.size,
                            color: variantPayload.color,
                        },
                        sku: typeof detailObject.sku === 'string' ? detailObject.sku : '',
                        price: Number.isFinite(Number(detailObject.price)) ? Number(detailObject.price) : 0,
                        quantity,
                        size: variantPayload.size || '',
                        color: variantPayload.color || '',
                        image: detailObject.image || '',
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
        }

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
                name: detailObject.name,
                sku: detailObject.sku,
                image: detailObject.image,
                ...variantPayload,
                price: (detailObject && typeof detailObject.price === 'number') ? detailObject.price : undefined,
            });

            const respItems = Array.isArray(response.data?.items) ? response.data.items : [];
            const lineKey = makeLineKey({ _id: productId, size: variantPayload?.size, color: variantPayload?.color });
            const patchedItems = respItems.map((it) => {
                if (makeLineKey(it) !== lineKey) return it;
                const next = { ...it };
                if (detailObject && typeof detailObject.price === 'number') {
                    next.price = detailObject.price;
                }
                if (detailObject && typeof detailObject.sku === 'string' && detailObject.sku.trim()) {
                    next.sku = detailObject.sku.trim();
                }
                if (next.product && typeof next.product === 'object') {
                    next.product = {
                        ...next.product,
                        ...(detailObject && typeof detailObject.price === 'number' ? { price: detailObject.price } : {}),
                        ...(detailObject && typeof detailObject.sku === 'string' && detailObject.sku.trim() ? { sku: detailObject.sku.trim() } : {}),
                    };
                }
                return next;
            });

            setItems(patchedItems);
            setTotalAmount(calculateTotalAmount(patchedItems));
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
                    sku: detailObject.sku || '',
                    price: detailObject.price ?? 0,
                    quantity,
                    size: variantPayload.size || '',
                    color: variantPayload.color || '',
                    image: detailObject.image || '',
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
    }, [user, fetchCart, loadCartFromStorage]);

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
