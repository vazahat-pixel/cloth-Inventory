import { useState, useEffect } from 'react';
import { Box, Divider, Typography, Stack, CircularProgress } from '@mui/material';
import api from '../../services/api';

const ThermalInvoicePrint = ({ sale }) => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrintConfig = async () => {
            try {
                const [compRes, invRes] = await Promise.all([
                    api.get('/settings/company'),
                    api.get('/settings/invoicing')
                ]);
                setConfig({
                    company: compRes.data?.company || {},
                    invoicing: invRes.data?.config || {}
                });
            } catch (err) {
                console.warn('Failed to fetch print settings, using defaults');
            } finally {
                setLoading(false);
            }
        };
        fetchPrintConfig();
    }, []);

    if (!sale || loading) return (
        <Box sx={{ p: 5, textAlign: 'center' }}>
            <CircularProgress size={20} />
            <Typography sx={{ mt: 1, fontSize: '10px' }}>Preparing...</Typography>
        </Box>
    );

    const store = sale.storeId || sale.warehouseId || {};
    const company = config?.company || {};
    const invoicing = config?.invoicing || {};
    
    const rawItems = sale.items || sale.products || [];
    const normalizedItems = rawItems.map((item) => {
        const qty = Number(item.quantity ?? item.qty ?? 0);
        const rate = Number(item.rate ?? item.price ?? 0);
        return {
            ...item,
            quantity: qty,
            rate,
            total: Number(item.total ?? (qty * rate)),
            itemName: (item.itemName || item.variantId?.itemName || item.itemId?.itemName || item.name || 'Item').substring(0, 20),
            sku: item.sku || item.variantId?.sku || item.barcode || '-',
            size: item.size || item.variantId?.size || '-',
        };
    });

    const subTotal = Number(sale.subTotal || normalizedItems.reduce((acc, i) => acc + (i.rate * i.quantity), 0));
    const tax = Number(sale.totalTax ?? sale.tax ?? 0);
    // Combine all discounts for display
    const discount = Number(sale.discount || 0) + Number(sale.schemeDiscount || 0) + Number(sale.couponDiscount || 0);
    const grandTotal = Number(sale.grandTotal || (subTotal + tax - discount));

    return (
        <Box 
            sx={{ 
                width: '100%',
                maxWidth: '300px', 
                mx: 'auto', 
                p: 1, 
                bgcolor: '#fff', 
                color: '#000', 
                fontFamily: '"Courier New", Courier, monospace', // Typical for thermal
                '@media print': {
                    width: '72mm', // Standard 80mm roll printable area
                    p: 0,
                    m: 0
                }
            }}
        >
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 1 }}>
                <Typography sx={{ fontWeight: 900, fontSize: '16px', textTransform: 'uppercase' }}>
                    {company.legalName || 'REBEL MASS EXPORT'}
                </Typography>
                <Typography sx={{ fontSize: '10px', fontWeight: 700 }}>
                    {store.name || 'Store Receipt'}
                </Typography>
                <Typography sx={{ fontSize: '9px' }}>
                    {store.location?.address || company.address?.address}
                </Typography>
                <Typography sx={{ fontSize: '9px' }}>
                    GST: {company.gstin} | PH: {store.phone || company.phone}
                </Typography>
            </Box>

            <Divider sx={{ borderStyle: 'dashed', my: 1, borderColor: '#000' }} />

            {/* Info */}
            <Box sx={{ fontSize: '10px', mb: 1 }}>
                <Stack direction="row" justifyContent="space-between">
                    <Typography fontSize="inherit">Bill No: {sale.invoiceNumber || sale.saleNumber}</Typography>
                    <Typography fontSize="inherit">{new Date(sale.saleDate || sale.createdAt).toLocaleDateString()}</Typography>
                </Stack>
                <Typography fontSize="inherit">Cust: {sale.customerName || 'Walk-in'}</Typography>
            </Box>

            <Divider sx={{ borderStyle: 'dashed', mb: 1, borderColor: '#000' }} />

            {/* Items Table - Minimalistic */}
            <Box sx={{ mb: 1 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ fontWeight: 900, fontSize: '10px', mb: 0.5 }}>
                    <Typography fontSize="inherit" sx={{ flex: 2 }}>ITEM</Typography>
                    <Typography fontSize="inherit" sx={{ flex: 1, textAlign: 'center' }}>QTY</Typography>
                    <Typography fontSize="inherit" sx={{ flex: 1, textAlign: 'right' }}>PRICE</Typography>
                    <Typography fontSize="inherit" sx={{ flex: 1, textAlign: 'right' }}>TOTAL</Typography>
                </Stack>
                {normalizedItems.map((item, idx) => (
                    <Box key={idx} sx={{ fontSize: '10px', mb: 0.5 }}>
                        <Typography fontSize="inherit" fontWeight={700}>{item.itemName}</Typography>
                        <Stack direction="row" justifyContent="space-between" sx={{ fontSize: '10px' }}>
                            <Typography fontSize="inherit" sx={{ flex: 2, color: '#555' }}>{item.sku}/{item.size}</Typography>
                            <Typography fontSize="inherit" sx={{ flex: 1, textAlign: 'center' }}>{item.quantity}</Typography>
                            <Typography fontSize="inherit" sx={{ flex: 1, textAlign: 'right' }}>{item.rate.toFixed(0)}</Typography>
                            <Typography fontSize="inherit" sx={{ flex: 1, textAlign: 'right' }}>{(item.amount || item.total || 0).toFixed(0)}</Typography>
                        </Stack>
                    </Box>
                ))}
            </Box>

            <Divider sx={{ borderStyle: 'dashed', mb: 1, borderColor: '#000' }} />

            {/* Calculations */}
            <Box sx={{ fontSize: '11px', fontWeight: 700 }}>
                <Stack direction="row" justifyContent="space-between">
                    <Typography fontSize="inherit">Sub Total:</Typography>
                    <Typography fontSize="inherit">₹{subTotal.toFixed(2)}</Typography>
                </Stack>
                {tax > 0 && (
                    <Stack direction="row" justifyContent="space-between">
                        <Typography fontSize="inherit">Tax:</Typography>
                        <Typography fontSize="inherit">₹{tax.toFixed(2)}</Typography>
                    </Stack>
                )}
                {discount > 0 && (
                    <Stack direction="row" justifyContent="space-between" sx={{ color: 'red' }}>
                        <Typography fontSize="inherit">Discount:</Typography>
                        <Typography fontSize="inherit">-₹{discount.toFixed(2)}</Typography>
                    </Stack>
                )}
                {sale.adjustments?.map((adj, index) => (
                    <Stack key={index} direction="row" justifyContent="space-between">
                        <Typography fontSize="inherit">{adj.label}:</Typography>
                        <Typography fontSize="inherit">₹{Number(adj.amount).toFixed(2)}</Typography>
                    </Stack>
                ))}
                <Divider sx={{ my: 0.5, borderStyle: 'solid', borderColor: '#000' }} />
                <Stack direction="row" justifyContent="space-between" sx={{ fontSize: '14px', fontWeight: 900 }}>
                    <Typography fontSize="inherit">NET PAYABLE:</Typography>
                    <Typography fontSize="inherit">₹{grandTotal.toFixed(2)}</Typography>
                </Stack>
            </Box>

            <Divider sx={{ borderStyle: 'dashed', my: 1, borderColor: '#000' }} />

            {/* Footer */}
            <Box sx={{ textAlign: 'center', fontSize: '9px', fontStyle: 'italic' }}>
                <Typography fontSize="inherit">Thank you for shopping!</Typography>
                <Typography fontSize="inherit">Visit us again.</Typography>
                <Typography fontSize="inherit" sx={{ mt: 1, fontSize: '8px' }}>
                    {invoicing.termsAndConditions?.substring(0, 50) || 'Fixed Price. No Returns without tag.'}
                </Typography>
            </Box>
        </Box>
    );
};

export default ThermalInvoicePrint;
