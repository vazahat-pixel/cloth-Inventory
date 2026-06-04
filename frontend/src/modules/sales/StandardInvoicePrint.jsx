import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Box, Divider, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Stack, CircularProgress } from '@mui/material';
import api from '../../services/api';
import { calculateGST } from '../../utils/taxCalculator';

const getFallbackHsn = (category = '') => {
    const cat = String(category).toUpperCase().trim();
    if (cat.includes('T-SHIRT') || cat.includes('T SHIRT') || cat.includes('TSHIRT')) return '6109';
    if (cat.includes('SHORT SET') || cat.includes('SHORTSET')) return '6204';
    if (cat.includes('SHIRT')) return '6205';
    if (cat.includes('JEANS') || cat.includes('DENIM') || cat.includes('TROUSER')) return '6203';
    return '6203'; // Default fallback for garments
};

const StandardInvoicePrint = ({ sale, store: providedStore, title: providedTitle, isTransfer = false }) => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const taxRules = useSelector((state) => state.masters.taxRules || []);
    const warehouses = useSelector((state) => state.masters.warehouses || []);
    const stores = useSelector((state) => state.masters.stores || []);

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
            <CircularProgress size={30} />
            <Typography sx={{ mt: 1, fontSize: '12px' }}>Preparing Document...</Typography>
        </Box>
    );

    const saleStoreId = typeof sale.storeId === 'object' ? sale.storeId?.id || sale.storeId?._id : sale.storeId;
    const saleWarehouseId = typeof sale.warehouseId === 'object' ? sale.warehouseId?.id || sale.warehouseId?._id : sale.warehouseId;
    const resolvedStoreId = saleStoreId || saleWarehouseId;
    const reduxStore = warehouses.find(w => w.id === resolvedStoreId) || stores.find(s => s.id === resolvedStoreId);

    const store = providedStore || reduxStore || (typeof sale.storeId === 'object' ? sale.storeId : null) || (typeof sale.warehouseId === 'object' ? sale.warehouseId : null) || {};
    const sourceWarehouse = sale.sourceWarehouseId || store || {};
    const destinationStore = sale.destinationStoreId || {};
    const company = config?.company || {};
    const invoicing = config?.invoicing || {};
    
    const isStockTransfer = isTransfer || sale.isTransfer || sale.type === 'TRANSFER' || sale.type === 'STOCK_TRANSFER' || sale.saleType === 'TRANSFER' || sale.saleType === 'STOCK_TRANSFER';

    const saleItems = sale.items || sale.products || [];
    const normalizedItems = saleItems.map((item) => {
        const qty = Number(item.quantity ?? item.qty ?? 0);
        const rate = Number(item.rate ?? item.price ?? 0);
        const mrp = Number(item.mrp ?? rate);
        
        const sku = item.sku || item.variantId?.sku || item.barcode || '-';
        const barcode = item.barcode || item.variantId?.barcode || sku;
        const category = item.category || item.itemId?.categoryId?.name || item.itemId?.category || item.name || '';
        
        let taxPercentage = Number(item.taxPercentage ?? item.gstPercent ?? 5);
        if (!isStockTransfer) {
            const slabInfo = calculateGST(rate, sku || barcode, category, taxRules);
            const itemRule = calculateGST(0, sku || barcode, category, taxRules);
            taxPercentage = (itemRule.type === 'FLAT') ? itemRule.rate : slabInfo.rate;
        }
        
        // Determine if the original source was inclusive or exclusive
        const isInclusiveSource = sale.type === 'RETAIL' && !sale.dispatchNumber;
        
        let taxable, taxAmount, lineTotal, displayGross, displayDiscount, displayRate;
        
        if (isInclusiveSource) {
            // Manual discount + Promo/Scheme discount
            const manualDiscountAmt = (rate * qty * Number(item.discountPercent ?? item.discount ?? 0)) / 100;
            const promoDiscountAmt = Number(item.promoDiscount ?? item.schemeDiscount ?? 0);
            const totalDiscountAmt = item.discountAmount !== undefined ? Number(item.discountAmount) : (manualDiscountAmt + promoDiscountAmt);
            
            lineTotal = Number(item.total ?? (rate * qty - totalDiscountAmt));
            taxable = lineTotal / (1 + (taxPercentage / 100));
            taxAmount = lineTotal - taxable;
            
            const baseInclusive = Math.max(mrp, rate);
            displayGross = baseInclusive * qty;
            displayDiscount = Math.max(0, displayGross - lineTotal);
            displayRate = baseInclusive;
        } else {
            // B2B Dispatch / Stock Transfer
            // In dispatch, 'mrp' is saved as the base rate, 'rate' is the discounted rate
            taxable = rate * qty;
            const effectiveTaxRate = isStockTransfer ? 0 : taxPercentage;
            taxAmount = (taxable * effectiveTaxRate) / 100;
            lineTotal = taxable + taxAmount;
            
            displayGross = mrp * qty;
            displayDiscount = Math.max(0, (mrp - rate) * qty);
            displayRate = mrp;
        }

        return {
            ...item,
            quantity: qty,
            rate: displayRate,
            mrp,
            discountAmount: displayDiscount,
            grossLine: displayGross,
            taxable,
            taxPercentage: isStockTransfer ? 0 : taxPercentage,
            taxAmount,
            lineTotal,
            itemName: item.itemName || item.variantId?.itemName || item.itemId?.itemName || item.name || 'Item',
            sku: item.sku || item.variantId?.sku || item.barcode || '-',
            size: item.size || item.variantId?.size || '-',
            color: item.color || item.variantId?.color || '-',
            hsnCode: item.hsnCode || item.itemId?.hsCodeId?.code || item.itemId?.hsnCode || getFallbackHsn(item.category || item.itemId?.categoryId?.name || item.itemId?.category || item.name || '')
        };
    });

    // Aggregate items by SKU, Category, HSN, and Rate
    const aggregatedItems = [];
    normalizedItems.forEach((item) => {
        const cat = (item.category || item.itemId?.categoryId?.name || item.categoryId?.name || item.itemId?.category || 'OTHERS').toUpperCase();
        const hsn = item.hsnCode || 'N/A';
        const rate = Number(item.rate || 0);
        const gst = Number(item.taxPercentage || 0);
        const sku = item.sku || '-';
        const name = item.itemName || 'Item';

        // Find existing aggregated item with same SKU, category, hsn, rate, and gst
        const existing = aggregatedItems.find(
            (x) => x.sku === sku && x.category === cat && x.hsnCode === hsn && Math.abs(x.rate - rate) < 0.01 && Math.abs(x.taxPercentage - gst) < 0.01
        );

        if (existing) {
            existing.quantity += item.quantity;
            existing.grossLine += item.grossLine;
            existing.discountAmount += item.discountAmount;
            existing.taxable += item.taxable;
            existing.taxAmount += item.taxAmount;
            existing.lineTotal += item.lineTotal;
        } else {
            aggregatedItems.push({
                sku,
                itemName: name,
                category: cat,
                hsnCode: hsn,
                rate,
                quantity: item.quantity,
                grossLine: item.grossLine,
                discountAmount: item.discountAmount,
                taxable: item.taxable,
                taxPercentage: gst,
                taxAmount: item.taxAmount,
                lineTotal: item.lineTotal
            });
        }
    });

    // Group aggregated items by Category for separate tables
    const categoryGroups = {};
    aggregatedItems.forEach((item) => {
        const cat = item.category || 'OTHERS';
        if (!categoryGroups[cat]) {
            categoryGroups[cat] = [];
        }
        categoryGroups[cat].push(item);
    });

    const hsnSummaryMap = sale.hsnSummary && sale.hsnSummary.length > 0 
        ? sale.hsnSummary.reduce((acc, h) => {
            acc[h.hsnCode] = { hsn: h.hsnCode, gst: h.gstPercent, qty: h.totalQty, taxable: h.taxableAmount, tax: (h.cgst + h.sgst + h.igst) };
            return acc;
        }, {})
        : normalizedItems.reduce((acc, item) => {
            const hsn = item.hsnCode || 'N/A';
            const gst = item.taxPercentage || 0;
            const key = `${hsn}-${gst}`;
            
            if (!acc[key]) {
                acc[key] = { hsn, gst, qty: 0, taxable: 0, tax: 0 };
            }
            acc[key].qty += item.quantity;
            acc[key].taxable += item.taxable;
            acc[key].tax += item.taxAmount;
            return acc;
        }, {});

    const sourceLocation = sourceWarehouse.location || {};
    const destinationLocation = destinationStore.location || {};
    const sourceAddress = [
        sourceLocation.address,
        sourceLocation.city,
        sourceLocation.state,
        sourceLocation.pincode
    ].filter(Boolean).join(', ');
    const destinationAddress = [
        destinationLocation.address,
        destinationLocation.city,
        destinationLocation.state,
        destinationLocation.pincode
    ].filter(Boolean).join(', ');
    
    const sourceGstin = (sourceWarehouse.gstNumber || sourceWarehouse.gstin || company.gstin || '06AAJCR6675A1ZB').toUpperCase();
    const destinationGstin = (destinationStore.gstNumber || destinationStore.gstin || sale.customerGst || sale.consigneeGst || 'N/A').toUpperCase();
    const sourceStateCode = sourceGstin?.slice(0, 2) || '06';
    const destinationStateCode = destinationGstin !== 'N/A' ? destinationGstin.slice(0, 2) : (sale.customerStateCode || '--');

    // State determination
    const storeState = (company.address?.state || store.location?.state || 'HARYANA').trim().toUpperCase();
    const destinationState = sale.destinationStoreId?.location?.state || sale.destinationStoreId?.state || sale.customerState || 'HARYANA';
    const customerState = destinationState.trim().toUpperCase();
    const isInterState = customerState !== storeState;

    const subTotal = normalizedItems.reduce((acc, i) => acc + i.taxable, 0);
    const totalTax = normalizedItems.reduce((acc, i) => acc + i.taxAmount, 0);
    const totalDiscount = normalizedItems.reduce((acc, i) => acc + i.discountAmount, 0) + Number(sale.billDiscount || 0);
    const grandTotal = subTotal + totalTax;
    const isInclusiveSource = sale.type === 'RETAIL' && !sale.dispatchNumber;
    
    const isB2B = Boolean(destinationGstin !== 'N/A' || sale.customerGst || sale.consigneeGst);
    const isRetailStoreSale =
        (sale.type === 'RETAIL' || String(sale.saleType || '').toLowerCase() === 'retail')
        && !isStockTransfer
        && !sale.dispatchNumber;
    const displayTitle = providedTitle
        || (isStockTransfer ? 'STOCK TRANSFER INVOICE' : isRetailStoreSale ? 'RETAIL INVOICE' : 'TAX INVOICE');

    const finalNetPayable = Number(sale.totals?.netPayable ?? sale.netPayable ?? sale.grandTotal ?? grandTotal);
    const roundOff = finalNetPayable - grandTotal;

    const tableHeaderStyle = { 
        bgcolor: '#E5E7EB', 
        border: '1px solid #000',
        '& .MuiTableCell-root': {
            color: '#000',
            fontWeight: 900,
            fontSize: '9px',
            py: 0.3,
            border: '1px solid #000',
            textTransform: 'uppercase',
            textAlign: 'center'
        }
    };

    const tableCellStyle = {
        fontSize: '9px',
        py: 0.3,
        border: '1px solid #000',
        fontWeight: 600,
        color: '#000',
        textAlign: 'center'
    };

    const categoryRowStyle = {
        bgcolor: '#f1f5f9',
        '& .MuiTableCell-root': {
            fontWeight: 900,
            fontSize: '10px',
            border: '1px solid #000',
            py: 0.5,
            textAlign: 'center'
        }
    };

    return (
        <Paper 
            className="printable-invoice-container"
            elevation={0} 
            sx={{ 
                p: 2, 
                bgcolor: '#fff', 
                color: '#000', 
                width: '100%', 
                maxWidth: '800px', 
                minHeight: '210mm',
                mx: 'auto', 
                borderRadius: 0,
                border: '1px solid #000',
                boxSizing: 'border-box',
                fontFamily: '"Arial", sans-serif',
                position: 'relative',
                '@media print': {
                    p: '0mm',
                    width: '100% !important',
                    height: 'auto !important',
                    maxWidth: 'none !important',
                    border: 'none',
                    '@page': {
                        size: 'A4 portrait',
                        margin: '10mm'
                    }
                }
            }}
        >
            {/* Main Header */}
            <Box sx={{ 
                textAlign: 'center', 
                mb: 1, 
                border: '2px solid #000', 
                p: 1.5, 
                bgcolor: '#f8fafc',
                borderRadius: '4px'
            }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, textDecoration: 'underline', fontSize: '10px', mb: 0.5, color: '#000', '@media print': { fontSize: '11px' } }}>
                    {displayTitle}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 950, mt: 0, letterSpacing: 1, textTransform: 'uppercase', fontSize: '22px', color: '#0f172a' }}>
                    {store.name || company.legalName || 'REBEL MASS EXPORT PVT LTD'}
                </Typography>
                <Typography sx={{ fontSize: '12px', fontWeight: 800, lineHeight: 1.4, mt: 0.5, color: '#1e293b' }}>
                    {store.location?.address || store.address || company.address?.address || 'PLOT NO 418 PHASE 3 SECTOR - 53 HSIIDC KUNDLI'}<br />
                    {store.location?.city || store.city || company.address?.city || 'SONIPAT'}, {store.location?.state || store.state || company.address?.state || 'HARYANA'} - {store.location?.pincode || store.pincode || company.address?.pincode || '131028'}<br />
                    <Box component="span" sx={{ fontWeight: 900, fontSize: '12px', color: '#000', bgcolor: '#e2e8f0', px: 1, borderRadius: 1, display: 'inline-block', mt: 0.5 }}>
                        GSTIN: {store.gstNumber || store.gstin || company.gstin || '06AAJCR6675A1ZB'}
                    </Box>
                    <Box sx={{ mt: 0.5, fontSize: '11px', fontWeight: 700 }}>
                        PH: {store.phone || store.managerPhone || company.phone || '9999999999'} | Email: support@billmarkclothing.com
                    </Box>
                </Typography>
            </Box>

            <style>
                {`
                @media print {
                    /* Hide the entire background React application */
                    #root, header, nav, footer, sidebar, aside, button, .MuiDialogActions-root, .MuiButton-root, .no-print {
                        display: none !important;
                    }
                    
                    /* Hide dialog backdrops and eliminate container spacing/shadows */
                    .MuiBackdrop-root, .MuiDialog-backdrop {
                        display: none !important;
                        background: transparent !important;
                        background-color: transparent !important;
                    }
                    
                    .MuiDialog-container {
                        display: block !important;
                        position: static !important;
                        background: transparent !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    
                    .MuiDialog-paper, .MuiPaper-root {
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        max-width: none !important;
                        max-height: none !important;
                        width: 100% !important;
                        position: static !important;
                        background: transparent !important;
                        overflow: visible !important;
                        border: none !important;
                    }
                    
                    /* Reset body styles for print */
                    body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                    }
                    
                    /* Position printable container absolutely at the top-left */
                    .printable-invoice-container {
                        display: block !important;
                        visibility: visible !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                        page-break-inside: avoid !important;
                    }
                    
                    .printable-invoice-container * {
                        visibility: visible !important;
                    }
                    
                    /* Page breaks */
                    @page {
                        size: A4 portrait;
                        margin: 10mm;
                    }
                }
                `}
            </style>

            {/* Invoice Meta info Bar */}
            <Grid container sx={{ mb: 1, border: '1px solid #000' }}>
                <Grid item xs={3} sx={{ p: 0.5, borderRight: '1px solid #000', bgcolor: '#00FFFF' }}>
                    <Typography sx={{ fontSize: '11px', fontWeight: 900, color: '#000' }}>INVOICE NO.</Typography>
                </Grid>
                <Grid item xs={3} sx={{ p: 0.5, borderRight: '1px solid #000', bgcolor: '#fff' }}>
                    <Typography sx={{ fontSize: '11px', fontWeight: 900, color: '#000' }}>{invoicing.invoicePrefix}{sale.invoiceNumber || sale.saleNumber || sale.dispatchNumber || '25-26/DAP-1'}</Typography>
                </Grid>
                <Grid item xs={3} sx={{ p: 0.5, borderRight: '1px solid #000', bgcolor: '#00FFFF' }}>
                    <Typography sx={{ fontSize: '11px', fontWeight: 900, color: '#000' }}>INVOICE DATE</Typography>
                </Grid>
                <Grid item xs={3} sx={{ p: 0.5, bgcolor: '#fff' }}>
                    <Typography sx={{ fontSize: '11px', fontWeight: 900, color: '#000' }}>{new Date(sale.saleDate || sale.createdAt).toLocaleDateString('en-GB')}</Typography>
                </Grid>
            </Grid>

            <Grid container sx={{ mb: 1, border: '1px solid #000' }}>
                <Grid item xs={4} sx={{ p: 0.5, borderRight: '1px solid #000' }}>
                    <Typography sx={{ fontSize: '10px' }}><strong>ORDER NO.</strong> {sale.orderNo || '-'}</Typography>
                </Grid>
                <Grid item xs={4} sx={{ p: 0.5, borderRight: '1px solid #000' }}>
                    <Typography sx={{ fontSize: '10px' }}><strong>Transport:</strong> {sale.transportName || 'BY ROAD'}</Typography>
                </Grid>
                <Grid item xs={4} sx={{ p: 0.5 }}>
                    <Typography sx={{ fontSize: '10px' }}><strong>Vehicle No:</strong> {sale.vehicleNo || '-'}</Typography>
                </Grid>
            </Grid>

            {/* Customer & Store Details side-by-side */}
            <Grid container sx={{ border: '1px solid #000', mb: 1 }}>
                <Grid item xs={6} sx={{ p: 0.5, borderRight: '1px solid #000' }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, display: 'block', borderBottom: '1px solid #000', mb: 0.5, fontSize: '10px', bgcolor: '#00FFFF', color: '#000', px: 0.5 }}>
                        Details Of Receiver (Billed to)
                    </Typography>
                    <Box sx={{ minHeight: 80, px: 0.5 }}>
                        <Typography sx={{ fontSize: '11px', fontWeight: 900 }}>{destinationStore.name || destinationStore.storeName || sale.customerName || 'Walk-in Customer'}</Typography>
                        <Typography sx={{ fontSize: '10px' }}>{destinationAddress || sale.consigneeAddress || sale.customerAddress || 'N/A'}</Typography>
                        <Typography sx={{ fontSize: '10px', mt: 0.5 }}><strong>GSTIN:</strong> {destinationGstin}</Typography>
                        <Typography sx={{ fontSize: '10px' }}><strong>State Name:</strong> {customerState}</Typography>
                        <Typography sx={{ fontSize: '10px' }}><strong>State Code:</strong> {destinationStateCode}</Typography>
                    </Box>
                </Grid>
                <Grid item xs={6} sx={{ p: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, display: 'block', borderBottom: '1px solid #000', mb: 0.5, fontSize: '10px', bgcolor: '#00FFFF', color: '#000', px: 0.5 }}>
                        Details Of Consignee (Shipped to)
                    </Typography>
                    <Box sx={{ minHeight: 80, px: 0.5 }}>
                        <Typography sx={{ fontSize: '11px', fontWeight: 900 }}>{destinationStore.name || destinationStore.storeName || sale.customerName || 'Walk-in Customer'}</Typography>
                        <Typography sx={{ fontSize: '10px' }}>{destinationAddress || sale.consigneeAddress || sale.customerAddress || 'N/A'}</Typography>
                        <Typography sx={{ fontSize: '10px', mt: 0.5 }}><strong>GSTIN:</strong> {destinationGstin}</Typography>
                        <Typography sx={{ fontSize: '10px' }}><strong>State Name:</strong> {customerState}</Typography>
                        <Typography sx={{ fontSize: '10px' }}><strong>State Code:</strong> {destinationStateCode}</Typography>
                    </Box>
                </Grid>
            </Grid>

            {/* Category-wise Grouped Tables */}
            {Object.keys(categoryGroups).map((catName) => {
                const groupItems = categoryGroups[catName];
                const catQty = groupItems.reduce((sum, i) => sum + i.quantity, 0);
                const catGross = groupItems.reduce((sum, i) => sum + i.grossLine, 0);
                const catDisc = groupItems.reduce((sum, i) => sum + i.discountAmount, 0);
                const catNet = groupItems.reduce((sum, i) => sum + i.lineTotal, 0);

                return (
                    <TableContainer component={Box} key={catName} sx={{ border: '1px solid #000', mb: 1, borderRadius: 0 }}>
                        <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                            <TableHead sx={tableHeaderStyle}>
                                <TableRow>
                                    <TableCell width="30">S.No</TableCell>
                                    <TableCell width="120">ITEM DESCRIPTION</TableCell>
                                    <TableCell width="70">HSN CODE</TableCell>
                                    <TableCell width="50">TOTAL QTY</TableCell>
                                    <TableCell width="70">RATE</TableCell>
                                    <TableCell width="80">GROSS AMOUNT</TableCell>
                                    <TableCell width="70">DISC</TableCell>
                                    <TableCell width="50">GST(%)</TableCell>
                                    <TableCell width="80">NET AMOUNT</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {groupItems.map((item, index) => (
                                    <TableRow key={index} sx={{ '& .MuiTableCell-root': tableCellStyle }}>
                                        <TableCell width="30">{index + 1}</TableCell>
                                        <TableCell width="120" sx={{ textAlign: 'left !important', pl: 1 }}>
                                            <Typography sx={{ fontSize: '9px', fontWeight: 900, color: '#000' }}>
                                                {item.itemName}
                                            </Typography>
                                            {item.sku && item.sku !== '-' && (
                                                <Typography sx={{ fontSize: '8px', color: '#475569', fontWeight: 700 }}>
                                                    Code: {item.sku}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell width="70">{item.hsnCode}</TableCell>
                                        <TableCell width="50">{item.quantity}</TableCell>
                                        <TableCell width="70">{item.rate.toFixed(2)}</TableCell>
                                        <TableCell width="80">{item.grossLine.toFixed(2)}</TableCell>
                                        <TableCell width="70">{item.discountAmount.toFixed(2)}</TableCell>
                                        <TableCell width="50">{item.taxPercentage.toFixed(2)}%</TableCell>
                                        <TableCell width="80" sx={{ fontWeight: 900 }}>{item.lineTotal.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                                {/* Category Totals Row */}
                                <TableRow sx={categoryRowStyle}>
                                    <TableCell colSpan={3} align="left" sx={{ textAlign: 'left !important', pl: 2, fontWeight: 900 }}>TOTALS</TableCell>
                                    <TableCell width="50" sx={{ fontWeight: 900 }}>{catQty}</TableCell>
                                    <TableCell width="70">-</TableCell>
                                    <TableCell width="80" sx={{ fontWeight: 900 }}>{catGross.toFixed(2)}</TableCell>
                                    <TableCell width="70" sx={{ fontWeight: 900 }}>{catDisc.toFixed(2)}</TableCell>
                                    <TableCell width="50">-</TableCell>
                                    <TableCell width="80" sx={{ fontWeight: 900 }}>{catNet.toFixed(2)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                );
            })}

            {/* Grand Total Table */}
            <TableContainer component={Box} sx={{ border: '1px solid #000', mb: 1, borderRadius: 0 }}>
                <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                    <TableBody>
                        <TableRow sx={{ 
                            bgcolor: '#cbd5e1', 
                            '& .MuiTableCell-root': {
                                fontWeight: 950,
                                fontSize: '10px',
                                border: '1px solid #000',
                                py: 0.5,
                                textAlign: 'center',
                                color: '#000'
                            }
                        }}>
                            <TableCell colSpan={3} align="left" sx={{ textAlign: 'left !important', pl: 2, fontWeight: 950 }}>GRAND TOTAL</TableCell>
                            <TableCell width="50" sx={{ fontWeight: 950 }}>{aggregatedItems.reduce((sum, i) => sum + i.quantity, 0)}</TableCell>
                            <TableCell width="70">-</TableCell>
                            <TableCell width="80" sx={{ fontWeight: 950 }}>{aggregatedItems.reduce((sum, i) => sum + i.grossLine, 0).toFixed(2)}</TableCell>
                            <TableCell width="70" sx={{ fontWeight: 950 }}>{aggregatedItems.reduce((sum, i) => sum + i.discountAmount, 0).toFixed(2)}</TableCell>
                            <TableCell width="50">-</TableCell>
                            <TableCell width="80" sx={{ fontWeight: 950 }}>{aggregatedItems.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Calculations & Summary */}
            <Box sx={{ mt: 1, border: '1px solid #000' }}>
                <Grid container>
                    {/* Left box: Total Qty, Word Amount, Tax Summary */}
                    <Grid item xs={7.5} sx={{ p: 1, borderRight: '1px solid #000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography sx={{ fontSize: '10px', fontWeight: 900 }}>TOTAL QTY: {normalizedItems.reduce((acc, i) => acc + i.quantity, 0)} Nos.</Typography>
                            <Box sx={{ mt: 1 }}>
                                <Typography sx={{ fontSize: '9px', fontWeight: 800 }}>Amount Chargeable (in words):</Typography>
                                <Typography sx={{ fontSize: '10px', fontWeight: 950, textTransform: 'uppercase' }}>
                                    INR {numberToWords(finalNetPayable)} ONLY
                                </Typography>
                            </Box>
                        </Box>

                        {/* TAX SUMMARY */}
                        <Box sx={{ mt: 2 }}>
                            <Typography sx={{ fontSize: '9.5px', fontWeight: 950, mb: 0.5 }}>TAX SUMMARY:</Typography>
                            <Table size="small" sx={{ border: '1px solid #000', borderCollapse: 'collapse' }}>
                                <TableHead sx={{ bgcolor: '#00FFFF' }}>
                                    <TableRow sx={{ '& .MuiTableCell-root': { fontSize: '8px', fontWeight: 900, border: '1px solid #000', py: 0.2, textAlign: 'center', color: '#000' } }}>
                                        <TableCell>Tax Rate</TableCell>
                                        <TableCell>Taxable Val</TableCell>
                                        {isInterState ? <TableCell>IGST</TableCell> : <><TableCell>CGST</TableCell><TableCell>SGST</TableCell></>}
                                        <TableCell>Total Tax</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody sx={{ '& .MuiTableCell-root': { fontSize: '8px', border: '1px solid #000', py: 0.2, textAlign: 'center', color: '#000', fontWeight: 700 } }}>
                                    {Object.values(hsnSummaryMap).map((h, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{h.gst}%</TableCell>
                                            <TableCell>{h.taxable.toFixed(2)}</TableCell>
                                            {isInterState ? <TableCell>{h.tax.toFixed(2)}</TableCell> : 
                                            <><TableCell>{(h.tax/2).toFixed(2)}</TableCell><TableCell>{(h.tax/2).toFixed(2)}</TableCell></>}
                                            <TableCell>{h.tax.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>

                        {sale.payment && (
                            <Box sx={{ mt: 1, p: 0.8, border: '1px dashed #cbd5e1', borderRadius: 1, bgcolor: '#f8fafc' }}>
                                <Typography sx={{ fontSize: '10px', fontWeight: 900 }}>PAYMENT METHOD: <Box component="span" sx={{ color: '#1e3a8a', textTransform: 'uppercase' }}>{sale.payment.mode || 'N/A'}</Box></Typography>
                                {sale.payment.mode === 'Split' && sale.payment.splitValues && (
                                    <Typography sx={{ fontSize: '9px', fontWeight: 700, mt: 0.2 }}>
                                        Cash: ₹{Number(sale.payment.splitValues.cash || 0).toFixed(2)} | 
                                        Card: ₹{Number(sale.payment.splitValues.card || 0).toFixed(2)} | 
                                        UPI: ₹{Number(sale.payment.splitValues.upi || 0).toFixed(2)}
                                    </Typography>
                                )}
                                {sale.payment.referenceNo && (
                                    <Typography sx={{ fontSize: '9px', fontWeight: 700 }}>Ref No: {sale.payment.referenceNo}</Typography>
                                )}
                            </Box>
                        )}
                    </Grid>
                    
                    {/* Right box: Calculations */}
                    <Grid item xs={4.5} sx={{ p: 1 }}>
                        <Stack spacing={0.5}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: '10px', fontWeight: 700 }}>Gross Total:</Typography><Typography sx={{ fontSize: '10px', fontWeight: 900 }}>₹{normalizedItems.reduce((acc, i) => acc + i.grossLine, 0).toFixed(2)}</Typography></Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: '10px', fontWeight: 700 }}>Total Discount:</Typography><Typography sx={{ fontSize: '10px', fontWeight: 900 }}>-₹{totalDiscount.toFixed(2)}</Typography></Box>
                            
                            {sale.adjustments?.map((adj, index) => (
                                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography sx={{ fontSize: '10px', fontWeight: 700 }}>{adj.label}:</Typography>
                                    <Typography sx={{ fontSize: '10px', fontWeight: 900 }}>₹{Number(adj.amount).toFixed(2)}</Typography>
                                </Box>
                            ))}
                            
                            {!isInclusiveSource && (
                                <>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: '10px', fontWeight: 700 }}>Taxable Value:</Typography><Typography sx={{ fontSize: '10px', fontWeight: 900 }}>₹{subTotal.toFixed(2)}</Typography></Box>
                                    {isInterState ? 
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: '10px', fontWeight: 700 }}>IGST:</Typography><Typography sx={{ fontSize: '10px', fontWeight: 900 }}>₹{totalTax.toFixed(2)}</Typography></Box> :
                                        <><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: '10px', fontWeight: 700 }}>CGST:</Typography><Typography sx={{ fontSize: '10px', fontWeight: 900 }}>₹{(totalTax/2).toFixed(2)}</Typography></Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: '10px', fontWeight: 700 }}>SGST:</Typography><Typography sx={{ fontSize: '10px', fontWeight: 900 }}>₹{(totalTax/2).toFixed(2)}</Typography></Box></>
                                    }
                                </>
                            )}
                            
                            {isInclusiveSource && totalTax > 0 && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: '10px', fontWeight: 700 }}>Tax Included:</Typography><Typography sx={{ fontSize: '10px', fontWeight: 900 }}>₹{totalTax.toFixed(2)}</Typography></Box>
                            )}

                            {Math.abs(roundOff) > 0.01 && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography sx={{ fontSize: '10px', fontWeight: 700 }}>Round Off:</Typography>
                                    <Typography sx={{ fontSize: '10px', fontWeight: 900 }}>{roundOff > 0 ? '+' : ''}₹{roundOff.toFixed(2)}</Typography>
                                </Box>
                            )}
 
                            <Divider sx={{ my: 0.5, borderBottomWidth: 1, borderColor: '#000' }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#00FFFF', p: 0.5 }}><Typography sx={{ fontSize: '11px', fontWeight: 950, color: '#000' }}>NET PAYABLE:</Typography><Typography sx={{ fontSize: '12px', fontWeight: 950, color: '#000' }}>₹{finalNetPayable.toFixed(2)}</Typography></Box>
                        </Stack>
                    </Grid>
                </Grid>
            </Box>

            {/* Declarations & Signature Block */}
            <Grid container sx={{ mt: 1, border: '1px solid #000' }}>
                <Grid item xs={7.5} sx={{ p: 1, borderRight: '1px solid #000' }}>
                    <Typography sx={{ fontSize: '9px', fontWeight: 900, textDecoration: 'underline', mb: 0.5 }}>Declaration:</Typography>
                    <Typography sx={{ fontSize: '8.5px', fontWeight: 700, lineHeight: 1.3, color: '#000' }}>
                        We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. All disputes are subject to <strong>SONIPAT (HARYANA)</strong> jurisdiction.
                    </Typography>
                    {!isStockTransfer && (
                        <Box sx={{ mt: 1 }}>
                            <Typography sx={{ fontSize: '8.5px', fontWeight: 800, textDecoration: 'underline' }}>Terms & Conditions:</Typography>
                            <Typography sx={{ fontSize: '7.5px', fontWeight: 600, lineHeight: 1.2 }}>
                                1. Goods once sold can be exchanged within 7 days only in original condition and with tag/invoice.<br/>
                                2. No cash refund will be provided; store credit note will be issued for future purchases.<br/>
                                3. All disputes are subject to SONIPAT (HARYANA) jurisdiction.
                            </Typography>
                        </Box>
                    )}
                </Grid>
                <Grid item xs={4.5} sx={{ p: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '90px', textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '9px', fontWeight: 900 }}>For <strong>{company.legalName || 'REBEL MASS EXPORT PVT LTD'}</strong></Typography>
                    <Box sx={{ mt: 'auto' }}>
                        <Typography sx={{ fontSize: '9px', fontWeight: 950, borderTop: '1px solid #000', pt: 0.5 }}>Authorised Signatory</Typography>
                    </Box>
                </Grid>
            </Grid>

            {/* Full-width HSN WISE SUMMARY */}
            <Box sx={{ mt: 2 }}>
                <Typography sx={{ fontSize: '10px', fontWeight: 950, mb: 0.5 }}>HSN WISE SUMMARY</Typography>
                <TableContainer component={Box} sx={{ border: '1px solid #000', borderRadius: 0 }}>
                    <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                        <TableHead sx={{ bgcolor: '#00FFFF', '& .MuiTableCell-root': { fontSize: '8px', fontWeight: 900, border: '1px solid #000', py: 0.2, textAlign: 'center', color: '#000' } }}>
                            <TableRow>
                                <TableCell rowSpan={2}>HSN/SAC</TableCell>
                                <TableCell rowSpan={2}>Taxable Value (₹)</TableCell>
                                <TableCell colSpan={2}>Central Tax</TableCell>
                                <TableCell colSpan={2}>State Tax</TableCell>
                                <TableCell colSpan={2}>Integrated Tax</TableCell>
                                <TableCell rowSpan={2}>Total Tax Amount (₹)</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Rate (%)</TableCell>
                                <TableCell>Amount (₹)</TableCell>
                                <TableCell>Rate (%)</TableCell>
                                <TableCell>Amount (₹)</TableCell>
                                <TableCell>Rate (%)</TableCell>
                                <TableCell>Amount (₹)</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody sx={{ '& .MuiTableCell-root': { fontSize: '8.5px', border: '1px solid #000', py: 0.3, textAlign: 'center', color: '#000', fontWeight: 700 } }}>
                            {Object.values(hsnSummaryMap).map((h, i) => {
                                const taxableVal = Number(h.taxable || 0);
                                const totalTaxVal = Number(h.tax || 0);
                                const gstRate = Number(h.gst || 0);
                                const halfRate = gstRate / 2;
                                const halfTax = totalTaxVal / 2;
                                
                                return (
                                    <TableRow key={i}>
                                        <TableCell>{h.hsn}</TableCell>
                                        <TableCell>{taxableVal.toFixed(2)}</TableCell>
                                        <TableCell>{isInterState ? '0.00' : halfRate.toFixed(2)}</TableCell>
                                        <TableCell>{isInterState ? '0.00' : halfTax.toFixed(2)}</TableCell>
                                        <TableCell>{isInterState ? '0.00' : halfRate.toFixed(2)}</TableCell>
                                        <TableCell>{isInterState ? '0.00' : halfTax.toFixed(2)}</TableCell>
                                        <TableCell>{isInterState ? gstRate.toFixed(2) : '0.00'}</TableCell>
                                        <TableCell>{isInterState ? totalTaxVal.toFixed(2) : '0.00'}</TableCell>
                                        <TableCell>{totalTaxVal.toFixed(2)}</TableCell>
                                    </TableRow>
                                );
                            })}
                            {/* Totals Row */}
                            <TableRow sx={{ bgcolor: '#f3f4f6', '& .MuiTableCell-root': { fontWeight: 900 } }}>
                                <TableCell>Total</TableCell>
                                <TableCell>
                                    {Object.values(hsnSummaryMap).reduce((sum, h) => sum + Number(h.taxable || 0), 0).toFixed(2)}
                                </TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>
                                    {isInterState ? '0.00' : (Object.values(hsnSummaryMap).reduce((sum, h) => sum + Number(h.tax || 0), 0) / 2).toFixed(2)}
                                </TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>
                                    {isInterState ? '0.00' : (Object.values(hsnSummaryMap).reduce((sum, h) => sum + Number(h.tax || 0), 0) / 2).toFixed(2)}
                                </TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>
                                    {isInterState ? Object.values(hsnSummaryMap).reduce((sum, h) => sum + Number(h.tax || 0), 0).toFixed(2) : '0.00'}
                                </TableCell>
                                <TableCell>
                                    {Object.values(hsnSummaryMap).reduce((sum, h) => sum + Number(h.tax || 0), 0).toFixed(2)}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Typography align="center" sx={{ fontSize: '8px', mt: 1, fontWeight: 700, opacity: 0.7 }}>
                This is a computer generated document and does not require a physical signature.
            </Typography>
        </Paper>
    );
};

function numberToWords(n) {
    if (n === 0) return 'ZERO';
    const a = ['', 'ONE ', 'TWO ', 'THREE ', 'FOUR ', 'FIVE ', 'SIX ', 'SEVEN ', 'EIGHT ', 'NINE ', 'TEN ', 'ELEVEN ', 'TWELVE ', 'THIRTEEN ', 'FOURTEEN ', 'FIFTEEN ', 'SIXTEEN ', 'SEVENTEEN ', 'EIGHTEEN ', 'NINETEEN '];
    const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    function makeGroup(n) {
        let str = '';
        if (n > 99) { str += a[Math.floor(n / 100)] + 'HUNDRED '; n %= 100; }
        if (n > 19) { str += b[Math.floor(n / 10)] + ' ' + a[n % 10]; } else { str += a[n]; }
        return str;
    }
    let num = Math.floor(n);
    let str = '';
    if (num >= 10000000) { str += makeGroup(Math.floor(num / 10000000)) + 'CRORE '; num %= 10000000; }
    if (num >= 100000) { str += makeGroup(Math.floor(num / 100000)) + 'LAKH '; num %= 100000; }
    if (num >= 1000) { str += makeGroup(Math.floor(num / 1000)) + 'THOUSAND '; num %= 1000; }
    if (num > 0) { str += makeGroup(num); }
    return str.trim();
}

export default StandardInvoicePrint;
