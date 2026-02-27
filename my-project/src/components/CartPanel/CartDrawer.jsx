import React from 'react';
import { Drawer, Button, IconButton, Typography, Box, Divider } from '@mui/material';
import { MdDelete, MdClose } from 'react-icons/md';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';

const FALLBACK_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

const CartDrawer = ({ open, onClose }) => {
    const { items, removeFromCart, updateQuantity, loading } = useCart();
    const navigate = useNavigate();

    const roundMoney = (v) => Math.round((Number(v ?? 0) || 0) * 100) / 100;
    const formatCurrency = (v) => `₹${roundMoney(v).toFixed(2)}`;

    const handleCheckout = () => {
        onClose();
        navigate('/checkout');
    };

    const handleViewCart = () => {
        onClose();
        navigate('/cart');
    };

    const calculateSubtotal = () => {
        return items.reduce((total, item) => {
            const price = Number(item?.price ?? item?.product?.price ?? 0) || 0;
            const qty = Number(item?.quantity ?? 0) || 0;
            return total + (price * qty);
        }, 0);
    };

    const totalQty = items.reduce((sum, item) => sum + (Number(item?.quantity ?? 0) || 0), 0);

    const calculateCodChargeTotal = () => {
        return items.reduce((sum, item) => {
            const qty = Number(item?.quantity ?? 0) || 0;
            const p = item?.product || {};
            const codEnabled = typeof p?.codAvailable === 'boolean' ? p.codAvailable : Boolean(p?.management?.shipping?.codAvailable);
            if (!codEnabled) return sum;
            const charge = Number(p?.codCharge ?? p?.management?.shipping?.codCharge ?? 0) || 0;
            return sum + (charge * qty);
        }, 0);
    };

    const calculateShippingTotal = () => {
        const minBase = 4.99;
        return items.reduce((sum, item) => {
            const qty = Number(item?.quantity ?? 0) || 0;
            const p = item?.product || {};
            const free = typeof p?.freeShipping === 'boolean' ? p.freeShipping : Boolean(p?.management?.shipping?.freeShipping);
            if (free) return sum;

            // Use custom shipping charge if set, otherwise calculate based on weight/dimensions
            const customShippingCharge = Number(p?.shippingCharge ?? p?.management?.shipping?.shippingCharge ?? 0) || 0;
            if (customShippingCharge > 0) {
                return sum + customShippingCharge * qty;
            }

            const weightKg = Number(p?.weight ?? p?.management?.shipping?.weightKg ?? 0) || 0;
            const dims = p?.dimensions ?? p?.management?.shipping?.dimensionsCm ?? { length: 0, width: 0, height: 0 };
            const length = Number(dims?.length ?? 0) || 0;
            const width = Number(dims?.width ?? 0) || 0;
            const height = Number(dims?.height ?? 0) || 0;
            const volumetric = (length * width * height) / 5000;
            const chargeable = Math.max(weightKg, volumetric);
            const costPerItem = Math.max(minBase, chargeable * 1.2);
            return sum + costPerItem * qty;
        }, 0);
    };

    const shipping = calculateShippingTotal();
    const subtotal = calculateSubtotal();
    const codChargeTotal = calculateCodChargeTotal();
    const shippingMoney = roundMoney(shipping);
    const subtotalMoney = roundMoney(subtotal);
    const codChargeMoney = roundMoney(codChargeTotal);
    const taxMoney = roundMoney(subtotalMoney * 0.18); // 18% GST
    const totalOnline = roundMoney(subtotalMoney + shippingMoney + taxMoney);
    const totalCod = roundMoney(totalOnline + (codChargeMoney > 0 ? codChargeMoney : 0));

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            sx={{
                '& .MuiDrawer-paper': {
                    width: 400,
                    maxWidth: '100%',
                },
            }}
        >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" component="div">
                        Shopping Cart ({totalQty})
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <MdClose />
                    </IconButton>
                </Box>

                {/* Cart Items */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <Typography>Loading...</Typography>
                        </Box>
                    ) : items.length === 0 ? (
                        <Box sx={{ textAlign: 'center', p: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                                Your cart is empty
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {items.map((item) => (
                                (() => {
                                    const productId = item?.product?._id || item?.product || item?._id;
                                    const variant = { size: item?.size || '', color: item?.color || '' };
                                    const lineKey = `${String(productId)}-${variant.size || ''}-${variant.color || ''}`;

                                    return (
                                        <Box key={lineKey} sx={{
                                            display: 'flex',
                                            gap: 2,
                                            p: 2,
                                            border: 1,
                                            borderColor: 'divider',
                                            borderRadius: 2,
                                            position: 'relative'
                                        }}>
                                            {/* Product Image */}
                                            <Box sx={{ width: 80, height: 80, overflow: 'hidden', borderRadius: 1 }}>
                                                <img
                                                    src={item.image || item.product?.image || FALLBACK_IMAGE}
                                                    alt={item.product?.name || item.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        e.currentTarget.onerror = null;
                                                        e.currentTarget.src = FALLBACK_IMAGE;
                                                    }}
                                                />
                                            </Box>

                                            {/* Product Details */}
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, lineHeight: 1.2 }}>
                                                    {item.product?.name || item.name}
                                                </Typography>

                                                {(item?.size || item?.color) ? (
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                        {item?.size ? `Size: ${item.size}` : ''}{item?.size && item?.color ? ' | ' : ''}{item?.color ? `Color: ${item.color}` : ''}
                                                    </Typography>
                                                ) : null}

                                                {/* Quantity Controls */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    <Typography variant="body2" color="text.secondary">Qty:</Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => updateQuantity(productId, Math.max(1, item.quantity - 1), variant)}
                                                            sx={{ p: 0.5 }}
                                                        >
                                                            -
                                                        </IconButton>
                                                        <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>
                                                            {item.quantity}
                                                        </Typography>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => updateQuantity(productId, item.quantity + 1, variant)}
                                                            sx={{ p: 0.5 }}
                                                        >
                                                            +
                                                        </IconButton>
                                                    </Box>
                                                </Box>

                                                {/* Price */}
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                                    {(() => {
                                                        const price = Number(item?.price ?? item?.product?.price ?? 0) || 0;
                                                        const qty = Number(item?.quantity ?? 0) || 0;
                                                        return formatCurrency(price * qty);
                                                    })()}
                                                </Typography>
                                            </Box>

                                            {/* Delete Button */}
                                            <IconButton
                                                size="small"
                                                onClick={() => removeFromCart(productId, variant)}
                                                sx={{ position: 'absolute', top: 8, right: 8 }}
                                            >
                                                <MdDelete fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    );
                                })()
                            ))}
                        </Box>
                    )}
                </Box>

                {/* Footer */}
                {items.length > 0 && (
                    <Box sx={{ borderTop: 1, borderColor: 'divider', p: 2 }}>
                        {/* Price Summary */}
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Items ({totalQty})</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(subtotalMoney)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Shipping</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {shippingMoney === 0 ? 'Free' : formatCurrency(shippingMoney)}
                                </Typography>
                            </Box>
                            {codChargeMoney > 0 && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2">COD charge (if COD selected)</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(codChargeMoney)}</Typography>
                                </Box>
                            )}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Tax (18%)</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(taxMoney)}</Typography>
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Total (online)</Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                    {formatCurrency(totalOnline)}
                                </Typography>
                            </Box>
                            {codChargeMoney > 0 && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Total (COD)</Typography>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                        {formatCurrency(totalCod)}
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {/* Action Buttons */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={handleViewCart}
                                sx={{ borderColor: 'orange', color: 'orange', '&:hover': { borderColor: 'darkorange', backgroundColor: 'orange.50' } }}
                            >
                                View Cart
                            </Button>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={handleCheckout}
                                sx={{ backgroundColor: 'green', '&:hover': { backgroundColor: 'darkgreen' } }}
                            >
                                Checkout
                            </Button>
                        </Box>
                    </Box>
                )}
            </Box>
        </Drawer>
    );
};

export default CartDrawer;
