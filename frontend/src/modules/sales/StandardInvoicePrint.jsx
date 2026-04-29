import { useState, useEffect } from 'react';
import { Box, Divider, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Stack, CircularProgress } from '@mui/material';
import api from '../../services/api';

const StandardInvoicePrint = ({ sale, store: providedStore, title: providedTitle, isTransfer = false }) => {
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
            <CircularProgress size={30} />
            <Typography sx={{ mt: 1, fontSize: '12px' }}>Preparing Document...</Typography>
        </Box>
    );

    const store = providedStore || (typeof sale.storeId === 'object' ? sale.storeId : null) || (typeof sale.warehouseId === 'object' ? sale.warehouseId : null) || {};
    const sourceWarehouse = sale.sourceWarehouseId || store || {};
    const destinationStore = sale.destinationStoreId || {};
    const company = config?.company || {};
    const invoicing = config?.invoicing || {};
    
    const saleItems = sale.items || sale.products || [];
    const normalizedItems = saleItems.map((item) => {
        const qty = Number(item.quantity ?? item.qty ?? 0);
        const rate = Number(item.rate ?? item.price ?? 0);
        const mrp = Number(item.mrp ?? rate);
        // Manual discount + Promo/Scheme discount
        const manualDiscountAmt = (rate * qty * Number(item.discountPercent ?? item.discount ?? 0)) / 100;
        const promoDiscountAmt = Number(item.promoDiscount ?? item.schemeDiscount ?? 0);
        const totalDiscountAmt = item.discountAmount !== undefined ? Number(item.discountAmount) : (manualDiscountAmt + promoDiscountAmt);
        
        const taxPercentage = Number(item.taxPercentage ?? item.gstPercent ?? 5);
        const lineTotal = Number(item.total ?? (rate * qty - totalDiscountAmt));
        
        // Determine if the original source was inclusive or exclusive
        const isInclusiveSource = sale.type === 'RETAIL' && !sale.dispatchNumber;
        
        // Back-calculate taxable from lineTotal
        const taxable = lineTotal / (1 + (taxPercentage / 100));
        const taxAmount = lineTotal - taxable;
        
        // Mathematically consistent display values (Exclusive of Tax)
        let displayGross, displayDiscount, displayRate;
        
        if (isInclusiveSource) {
            // MRP/Rate was inclusive of tax
            const baseInclusive = Math.max(mrp, rate);
            const grossInclusive = baseInclusive * qty;
            const discountInclusive = Math.max(0, grossInclusive - lineTotal);
            
            // For Retail/B2C, show inclusive values to match the POS screen exactly
            displayGross = grossInclusive;
            displayDiscount = discountInclusive;
            displayRate = baseInclusive;
        } else {
            // MRP/Rate was exclusive of tax (Dispatch/B2B)
            // In dispatch, 'mrp' is saved as the base rate, 'rate' is the discounted rate
            const baseExclusive = Math.max(mrp, rate); 
            displayGross = baseExclusive * qty;
            displayDiscount = Math.max(0, displayGross - taxable);
            displayRate = baseExclusive;
        }

        return {
            ...item,
            quantity: qty,
            rate: displayRate,
            mrp,
            discountAmount: displayDiscount,
            grossLine: displayGross,
            taxable,
            taxPercentage,
            taxAmount,
            lineTotal,
            itemName: item.itemName || item.variantId?.itemName || item.itemId?.itemName || item.name || 'Item',
            sku: item.sku || item.variantId?.sku || item.barcode || '-',
            size: item.size || item.variantId?.size || '-',
            color: item.color || item.variantId?.color || '-',
            hsnCode: item.hsnCode || item.itemId?.hsnCode || 'N/A'
        };
    });

    // Group items by category for the new format
    const groupedItems = normalizedItems.reduce((acc, item) => {
        const cat = (item.category || item.itemId?.categoryId?.name || item.categoryId?.name || 'OTHERS').toUpperCase();
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

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
    const displayTitle = providedTitle || (isTransfer ? 'STOCK TRANSFER NOTE' : (isB2B ? (isInterState ? 'TAX INVOICE (INTER-STATE)' : 'TAX INVOICE') : 'SALE INVOICE'));

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
            elevation={0} 
            sx={{ 
                p: 2, 
                bgcolor: '#fff', 
                color: '#000', 
                width: '148mm', 
                minHeight: '210mm',
                mx: 'auto', 
                borderRadius: 0,
                border: '1px solid #000',
                boxSizing: 'border-box',
                fontFamily: '"Arial", sans-serif',
                position: 'relative',
                '@media print': {
                    p: '5mm',
                    width: '148mm !important',
                    height: '210mm !important',
                    maxWidth: 'none !important',
                    border: 'none',
                    '@page': {
                        size: 'A5 portrait',
                        margin: '0mm'
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
                <Typography variant="subtitle2" sx={{ fontWeight: 900, textDecoration: 'underline', fontSize: '10px', mb: 0.5, color: '#475569' }}>
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
                        PH: {store.phone || store.managerPhone || company.phone || '9999999999'} | Email: {store.email || company.email || '-'}
                    </Box>
                </Typography>
            </Box>

            {/* Invoice Meta info Bar */}
            <Grid container sx={{ mb: 1, border: '1px solid #000', bgcolor: '#00CED1' }}>
                <Grid item xs={3} sx={{ p: 0.5, borderRight: '1px solid #000' }}>
                    <Typography sx={{ fontSize: '11px', fontWeight: 900, color: '#fff' }}>INVOICE NO.</Typography>
                </Grid>
                <Grid item xs={3} sx={{ p: 0.5, borderRight: '1px solid #000', bgcolor: '#fff' }}>
                    <Typography sx={{ fontSize: '11px', fontWeight: 900 }}>{invoicing.invoicePrefix}{sale.invoiceNumber || sale.saleNumber || sale.dispatchNumber || '25-26/DAP-1'}</Typography>
                </Grid>
                <Grid item xs={3} sx={{ p: 0.5, borderRight: '1px solid #000' }}>
                    <Typography sx={{ fontSize: '11px', fontWeight: 900, color: '#fff' }}>INVOICE DATE</Typography>
                </Grid>
                <Grid item xs={3} sx={{ p: 0.5, bgcolor: '#fff' }}>
                    <Typography sx={{ fontSize: '11px', fontWeight: 900 }}>{new Date(sale.saleDate || sale.createdAt).toLocaleDateString('en-GB')}</Typography>
                </Grid>
            </Grid>

            <Grid container sx={{ mb: 1, border: '1px solid #000' }}>
                <Grid item xs={6} sx={{ p: 0.5, borderRight: '1px solid #000' }}>
                    <Typography sx={{ fontSize: '11px' }}><strong>ORDER NO.</strong> {sale.orderNo || '-'}</Typography>
                </Grid>
                <Grid item xs={6} sx={{ p: 0.5 }}>
                    <Typography sx={{ fontSize: '11px' }}><strong>Transport-</strong> {sale.transportName || 'BY ROAD'}</Typography>
                </Grid>
            </Grid>

            {/* Customer & Store Details side-by-side */}
            <Grid container sx={{ border: '1px solid #000', mb: 1 }}>
                <Grid item xs={6} sx={{ p: 0.5, borderRight: '1px solid #000' }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, display: 'block', borderBottom: '1px solid #000', mb: 0.5, fontSize: '10px', bgcolor: '#f3f4f6' }}>
                        Customer Details (Billed to)
                    </Typography>
                    <Box sx={{ minHeight: 70 }}>
                        <Typography sx={{ fontSize: '12px', fontWeight: 900 }}>{destinationStore.name || destinationStore.storeName || sale.customerName || 'Walk-in Customer'}</Typography>
                        <Typography sx={{ fontSize: '10px' }}>{destinationAddress || sale.consigneeAddress || sale.customerAddress || 'N/A'}</Typography>
                        <Box sx={{ mt: 0.5, p: 0.5, bgcolor: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: 1 }}>
                            <Typography sx={{ fontSize: '11px', fontWeight: 900 }}>
                                Mobile: {sale.customerMobile || '-'}
                            </Typography>
                        </Box>
                        <Typography sx={{ fontSize: '10px', mt: 0.5 }}><strong>GSTIN:</strong> {sale.customerGst || 'N/A'}</Typography>
                    </Box>
                </Grid>
                <Grid item xs={6} sx={{ p: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, display: 'block', borderBottom: '1px solid #000', mb: 0.5, fontSize: '10px', bgcolor: '#f3f4f6' }}>
                        Billing Branch / Store Location
                    </Typography>
                    <Box sx={{ minHeight: 70 }}>
                        <Typography sx={{ fontSize: '11px', fontWeight: 900 }}>{store.name || 'Store Location'}</Typography>
                        <Typography sx={{ fontSize: '10px', lineHeight: 1.2 }}>
                            {store.location?.address || store.address || 'N/A'}<br />
                            {store.location?.city || store.city || ''}, {store.location?.state || store.state || ''} - {store.location?.pincode || store.pincode || ''}
                        </Typography>
                        <Typography sx={{ fontSize: '10px', mt: 1 }}>
                            <strong>GSTIN:</strong> {store.gstNumber || store.gstin || '-'}<br />
                            <strong>Contact:</strong> {store.phone || store.managerPhone || '-'}
                        </Typography>
                    </Box>
                </Grid>
            </Grid>

            {/* professional Category-wise Table */}
            {Object.keys(groupedItems).map((category, catIndex) => {
                const catItems = groupedItems[category];
                const catQty = catItems.reduce((sum, i) => sum + i.quantity, 0);
                const catGross = catItems.reduce((sum, i) => sum + i.grossLine, 0);
                const catDisc = catItems.reduce((sum, i) => sum + i.discountAmount, 0);
                const catNet = catItems.reduce((sum, i) => sum + i.lineTotal, 0);

                return (
                    <TableContainer key={category} component={Box} sx={{ border: '1px solid #000', mb: 1, borderRadius: 0 }}>
                        <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                            <TableHead sx={tableHeaderStyle}>
                                <TableRow>
                                    <TableCell width="30">S.N</TableCell>
                                    <TableCell width="100">CATEGORY</TableCell>
                                    <TableCell width="70">HSN</TableCell>
                                    <TableCell width="50">QTY</TableCell>
                                    <TableCell width="60">RATE</TableCell>
                                    <TableCell width="70">GROSS</TableCell>
                                    <TableCell width="50">DISC</TableCell>
                                    <TableCell width="40">GST%</TableCell>
                                    <TableCell width="80">NET AMT</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {catItems.map((item, index) => {
                                    return (
                                        <TableRow key={index} sx={{ '& .MuiTableCell-root': tableCellStyle }}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{category}</TableCell>
                                            <TableCell>{item.hsnCode}</TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell>{item.rate.toFixed(2)}</TableCell>
                                            <TableCell>{item.grossLine.toFixed(2)}</TableCell>
                                            <TableCell>{item.discountAmount.toFixed(2)}</TableCell>
                                            <TableCell>{item.taxPercentage}%</TableCell>
                                            <TableCell sx={{ fontWeight: 900 }}>{item.lineTotal.toFixed(2)}</TableCell>
                                        </TableRow>
                                    );
                                })}
                                {/* Category Totals Row */}
                                <TableRow sx={categoryRowStyle}>
                                    <TableCell colSpan={3} align="left" sx={{ textAlign: 'left !important', pl: 2 }}>TOTALS</TableCell>
                                    <TableCell>{catQty}</TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell>{catGross.toFixed(2)}</TableCell>
                                    <TableCell>{catDisc.toFixed(2)}</TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>{catNet.toFixed(2)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                );
            })}

            {/* Calculations & Summary */}
            <Box sx={{ mt: 1, border: '1px solid #000' }}>
                <Grid container>
                    <Grid item xs={7.5} sx={{ p: 1, borderRight: '1px solid #000' }}>
                        <Typography sx={{ fontSize: '10px', fontWeight: 900 }}>TOTAL QTY: {normalizedItems.reduce((acc, i) => acc + i.quantity, 0)} Nos.</Typography>
                        <Box sx={{ mt: 1 }}>
                            <Typography sx={{ fontSize: '9px', fontWeight: 800 }}>Amount Chargeable (in words):</Typography>
                            <Typography sx={{ fontSize: '10px', fontWeight: 950, textTransform: 'uppercase' }}>
                                INR {numberToWords(grandTotal)} ONLY
                            </Typography>
                        </Box>

                        <Box sx={{ mt: 1.5 }}>
                            <Table size="small" sx={{ border: '1px solid #000', borderCollapse: 'collapse' }}>
                                <TableHead sx={{ bgcolor: '#f3f4f6' }}>
                                    <TableRow sx={{ '& .MuiTableCell-root': { fontSize: '8px', fontWeight: 900, border: '1px solid #000', py: 0.2, textAlign: 'center' } }}>
                                        <TableCell>HSN/SAC</TableCell>
                                        <TableCell>Taxable Val</TableCell>
                                        {isInterState ? <TableCell>IGST</TableCell> : <><TableCell>CGST</TableCell><TableCell>SGST</TableCell></>}
                                        <TableCell>Total Tax</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {Object.values(hsnSummaryMap).map((h, i) => (
                                        <TableRow key={i} sx={{ '& .MuiTableCell-root': { fontSize: '8px', border: '1px solid #000', py: 0.2, textAlign: 'center' } }}>
                                            <TableCell>{h.hsn} ({h.gst}%)</TableCell>
                                            <TableCell>{h.taxable.toFixed(2)}</TableCell>
                                            {isInterState ? <TableCell>{h.tax.toFixed(2)}</TableCell> : 
                                            <><TableCell>{(h.tax/2).toFixed(2)}</TableCell><TableCell>{(h.tax/2).toFixed(2)}</TableCell></>}
                                            <TableCell>{h.tax.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Grid>
                    
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

                            <Divider sx={{ my: 0.5, borderBottomWidth: 1, borderColor: '#000' }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#f8fafc', p: 0.5 }}><Typography sx={{ fontSize: '12px', fontWeight: 950 }}>NET PAYABLE:</Typography><Typography sx={{ fontSize: '13px', fontWeight: 950 }}>₹{grandTotal.toFixed(2)}</Typography></Box>
                        </Stack>
                    </Grid>
                </Grid>
            </Box>

            {/* Footer / Declarations */}
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <Box sx={{ flex: 1, border: '1px solid #000', p: 1 }}>
                    <Typography sx={{ fontSize: '9px', fontWeight: 900, mb: 0.5, textDecoration: 'underline' }}>Terms & Conditions / Exchange Policy:</Typography>
                    <Typography sx={{ fontSize: '8px', fontWeight: 700, whiteSpace: 'pre-line', lineHeight: 1.2 }}>
                        {`1. Goods once sold can be EXCHANGED within 7 DAYS only if in original condition and with this invoice.
2. No refund will be provided; credit note will be issued for future purchases.
3. Items without tags or having signs of wear will not be accepted for exchange.
4. All disputes are subject to local jurisdiction.`}
                    </Typography>
                </Box>
                <Box sx={{ width: '35%', textAlign: 'center', p: 1, border: '1px solid #000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '9px', fontWeight: 900 }}>For {company.legalName || 'REBEL MASS EXPORT PVT LTD'}</Typography>
                    <Box sx={{ mt: 3 }}>
                        <Typography sx={{ fontSize: '9px', fontWeight: 950, borderTop: '1px solid #000', pt: 0.5 }}>Authorised Signatory</Typography>
                    </Box>
                </Box>
            </Box>

            <Typography align="center" sx={{ fontSize: '8px', mt: 0.5, fontWeight: 700, opacity: 0.7 }}>
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
