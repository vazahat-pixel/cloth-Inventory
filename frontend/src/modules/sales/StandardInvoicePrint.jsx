import { useState, useEffect } from 'react';
import { Box, Divider, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Stack, CircularProgress } from '@mui/material';
import api from '../../services/api';

const StandardInvoicePrint = ({ sale, title: providedTitle, isTransfer = false }) => {
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

    const store = sale.storeId || sale.warehouseId || {};
    const company = config?.company || {};
    const invoicing = config?.invoicing || {};
    
    const rawItems = sale.items || sale.products || [];
    
    // Grouping Logic by Category
    const groupedItems = rawItems.reduce((acc, item) => {
        const categoryName = item.itemId?.categoryId?.name || 'OTHERS';
        if (!acc[categoryName]) acc[categoryName] = [];
        acc[categoryName].push(item);
        return acc;
    }, {});

    const hsnSummaryMap = rawItems.reduce((acc, item) => {
        const hsn = item.itemId?.hsCodeId?.code || 'N/A';
        const gst = item.taxPercentage || 0;
        const key = `${hsn}-${gst}`;
        
        if (!acc[key]) {
            acc[key] = { hsn, gst, qty: 0, taxable: 0, tax: 0 };
        }
        acc[key].qty += item.quantity;
        acc[key].taxable += (item.rate * item.quantity);
        acc[key].tax += (item.taxAmount || 0);
        return acc;
    }, {});

    // State determination
    const storeState = (company.address?.state || store.location?.state || 'HARYANA').trim().toUpperCase();
    const customerState = (sale.customerState || 'DELHI').trim().toUpperCase();
    const isInterState = customerState !== storeState;

    const subTotal = Number(sale.subTotal || rawItems.reduce((acc, i) => acc + (i.rate * i.quantity), 0));
    const tax = Number(sale.totalTax ?? sale.tax ?? rawItems.reduce((acc, i) => acc + (i.taxAmount || 0), 0));
    const discount = Number(sale.discount || 0);
    const grandTotal = Number(sale.grandTotal || (subTotal + tax - discount));
    
    const displayTitle = providedTitle || (isTransfer ? 'STOCK TRANSFER NOTE' : (isInterState ? 'TAX INVOICE (INTER-STATE)' : 'TAX INVOICE'));

    const tableHeaderStyle = { 
        bgcolor: '#f8fafc', 
        border: '1px solid #000',
        '& .MuiTableCell-root': {
            color: '#000',
            fontWeight: 900,
            fontSize: '10px',
            py: 0.75,
            border: '1px solid #000',
            textTransform: 'uppercase'
        }
    };

    const tableCellStyle = {
        fontSize: '10px',
        py: 0.5,
        border: '1px solid #000',
        fontWeight: 600,
        color: '#000'
    };

    return (
        <Paper 
            elevation={0} 
            sx={{ 
                p: 3, 
                bgcolor: '#fff', 
                color: '#000', 
                maxWidth: 1000, 
                mx: 'auto', 
                borderRadius: 0,
                border: '2px solid #000',
                fontFamily: '"Arial", sans-serif',
                '@media print': {
                    p: 1.5,
                    width: '100% !important',
                    maxWidth: 'none !important',
                    border: '1px solid #000'
                }
            }}
        >
            {/* Main Header */}
            <Box sx={{ textAlign: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, textDecoration: 'underline', fontSize: '13px' }}>
                    {displayTitle}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 950, mt: 1, letterSpacing: 1, textTransform: 'uppercase' }}>
                    {company.legalName || 'REBEL MASS EXPORT PVT LTD'}
                </Typography>
                <Typography sx={{ fontSize: '11px', fontWeight: 700, lineHeight: 1.4 }}>
                    {company.address?.address || 'PLOT NO 418 PHASE 3 SECTOR - 53 HSIIDC KUNDLI SONIPAT'}<br />
                    {company.address?.city || 'SONIPAT'}, {company.address?.state || 'HARYANA'} - {company.address?.pincode || '131028'}
                    &nbsp;GSTIN: {company.gstin || '06AAJCR6675A1ZB'} PH: {company.phone || '9999999999'}
                </Typography>
            </Box>

            <Divider sx={{ mb: 1, borderBottomWidth: 2, borderColor: '#000' }} />

            {/* Invoice Meta info */}
            <Grid container sx={{ mb: 1, border: '1.5px solid #000' }}>
                <Grid item xs={6} sx={{ p: 1, borderRight: '1.5px solid #000' }}>
                    <Typography sx={{ fontSize: '11px' }}><strong>INVOICE NO.:</strong> {invoicing.invoicePrefix}{sale.invoiceNumber || sale.saleNumber || '26-27/DAP-1'}</Typography>
                </Grid>
                <Grid item xs={6} sx={{ p: 1 }}>
                    <Typography sx={{ fontSize: '11px' }}><strong>INVOICE DATE:</strong> {new Date(sale.saleDate || sale.createdAt).toLocaleDateString('en-IN')}</Typography>
                </Grid>
                <Grid item xs={6} sx={{ p: 1, borderRight: '1.5px solid #000', borderTop: '1.5px solid #000' }}>
                    <Typography sx={{ fontSize: '11px' }}><strong>ORDER / PO NO.:</strong> {sale.orderNo || '-'}</Typography>
                </Grid>
                <Grid item xs={6} sx={{ p: 1, borderTop: '1.5px solid #000' }}>
                    <Typography sx={{ fontSize: '11px' }}><strong>TRANSPORT:</strong> {sale.transportName || 'BY ROAD'}</Typography>
                </Grid>
            </Grid>

            {/* Side-by-Side Billing & Shipped To */}
            <Grid container sx={{ border: '1.5px solid #000', mb: 1 }}>
                <Grid item xs={6} sx={{ p: 1, borderRight: '1.5px solid #000' }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, display: 'block', borderBottom: '1px solid #000', mb: 0.5, fontSize: '10px' }}>
                        Details Of Receiver (Billed to)
                    </Typography>
                    <Box sx={{ minHeight: 90 }}>
                        <Typography sx={{ fontSize: '11px', fontWeight: 900 }}>{sale.customerName || 'N/A'}</Typography>
                        <Typography sx={{ fontSize: '10px' }}>{sale.customerAddress || 'N/A'}</Typography>
                        <Stack sx={{ mt: 1 }}>
                            <Typography sx={{ fontSize: '10px' }}><strong>Phone No.:</strong> {sale.customerMobile || '-'}</Typography>
                            <Typography sx={{ fontSize: '10px' }}><strong>GSTIN No.:</strong> {sale.customerGst || 'N/A'}</Typography>
                            <Typography sx={{ fontSize: '10px' }}><strong>State:</strong> {customerState} <strong>Code:</strong> 07</Typography>
                        </Stack>
                    </Box>
                </Grid>
                <Grid item xs={6} sx={{ p: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, display: 'block', borderBottom: '1px solid #000', mb: 0.5, fontSize: '10px' }}>
                        Details of Consignee (Shipped to)
                    </Typography>
                    <Box sx={{ minHeight: 90 }}>
                        <Typography sx={{ fontSize: '11px', fontWeight: 900 }}>{sale.consigneeName || sale.customerName || 'N/A'}</Typography>
                        <Typography sx={{ fontSize: '10px' }}>{sale.consigneeAddress || sale.customerAddress || 'N/A'}</Typography>
                        <Stack sx={{ mt: 1 }}>
                            <Typography sx={{ fontSize: '10px' }}><strong>E-mail:</strong> {sale.consigneeEmail || '-'}</Typography>
                            <Typography sx={{ fontSize: '10px' }}><strong>GSTIN No.:</strong> {sale.consigneeGst || sale.customerGst || 'N/A'}</Typography>
                            <Typography sx={{ fontSize: '10px' }}><strong>State:</strong> {sale.consigneeState || customerState}</Typography>
                        </Stack>
                    </Box>
                </Grid>
            </Grid>

            {/* Dynamic Items Table */}
            {Object.entries(groupedItems).map(([category, items], catIndex) => {
                const catTotals = items.reduce((acc, i) => {
                    acc.qty += i.quantity;
                    acc.gross += (i.rate * i.quantity);
                    acc.net += (i.total || i.amount);
                    acc.disc += (i.discountAmount || 0);
                    return acc;
                }, { qty: 0, gross: 0, net: 0, disc: 0 });

                return (
                    <Box key={category} sx={{ mb: 1 }}>
                        <TableContainer component={Box} sx={{ border: '1px solid #000' }}>
                            <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                                <TableHead sx={tableHeaderStyle}>
                                    <TableRow>
                                        <TableCell width="30">S.N</TableCell>
                                        <TableCell>CATEGORY</TableCell>
                                        <TableCell>HSN</TableCell>
                                        <TableCell align="center">QTY</TableCell>
                                        <TableCell align="right">RATE</TableCell>
                                        <TableCell align="right">GROSS AM</TableCell>
                                        <TableCell align="center">DISC</TableCell>
                                        <TableCell align="center">GST%</TableCell>
                                        <TableCell align="right">NET AM</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {items.map((item, index) => (
                                        <TableRow key={index} sx={{ '& .MuiTableCell-root': tableCellStyle }}>
                                            <TableCell align="center">{index + 1}</TableCell>
                                            <TableCell sx={{ fontSize: '9px' }}>{category}</TableCell>
                                            <TableCell>{item.itemId?.hsCodeId?.code || 'N/A'}</TableCell>
                                            <TableCell align="center">{item.quantity}</TableCell>
                                            <TableCell align="right">{Number(item.rate).toFixed(2)}</TableCell>
                                            <TableCell align="right">{Number(item.rate * item.quantity).toFixed(2)}</TableCell>
                                            <TableCell align="center">{Number(item.discountAmount || 0).toFixed(2)}</TableCell>
                                            <TableCell align="center">{item.taxPercentage}%</TableCell>
                                            <TableCell align="right">{Number(item.total || item.amount).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow sx={{ '& .MuiTableCell-root': { ...tableCellStyle, bgcolor: '#f1f5f9', fontWeight: 900, py: 0.25 } }}>
                                        <TableCell colSpan={3} align="right">SUBTOTAL ({category}):</TableCell>
                                        <TableCell align="center">{catTotals.qty}</TableCell>
                                        <TableCell align="right" />
                                        <TableCell align="right">{catTotals.gross.toFixed(2)}</TableCell>
                                        <TableCell align="center">{catTotals.disc.toFixed(2)}</TableCell>
                                        <TableCell align="center" />
                                        <TableCell align="right">{catTotals.net.toFixed(2)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                );
            })}

            {/* Calculations & Summary */}
            <Box sx={{ mt: 1, border: '1.5px solid #000' }}>
                <Grid container>
                    <Grid item xs={7.5} sx={{ p: 1, borderRight: '1.5px solid #000' }}>
                        <Typography sx={{ fontSize: '10px', fontWeight: 900 }}>TOTAL QTY: {rawItems.reduce((acc, i) => acc + i.quantity, 0)} Nos.</Typography>
                        <Box sx={{ mt: 1.5 }}>
                            <Typography sx={{ fontSize: '9px', fontWeight: 800 }}>Amount Chargeable (in words):</Typography>
                            <Typography sx={{ fontSize: '11px', fontWeight: 950, textTransform: 'uppercase' }}>
                                INR {numberToWords(grandTotal)} ONLY
                            </Typography>
                        </Box>

                        <Box sx={{ mt: 2 }}>
                            <Table size="small" sx={{ border: '1px solid #000', borderCollapse: 'collapse' }}>
                                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                    <TableRow sx={{ '& .MuiTableCell-root': { fontSize: '8px', fontWeight: 900, border: '1px solid #000', py: 0.2 } }}>
                                        <TableCell>HSN/SAC</TableCell>
                                        <TableCell align="right">Taxable Val</TableCell>
                                        {isInterState ? <TableCell align="right">IGST</TableCell> : <><TableCell align="right">CGST</TableCell><TableCell align="right">SGST</TableCell></>}
                                        <TableCell align="right">Total Tax</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {Object.values(hsnSummaryMap).map((h, i) => (
                                        <TableRow key={i} sx={{ '& .MuiTableCell-root': { fontSize: '8px', border: '1px solid #000', py: 0.2 } }}>
                                            <TableCell>{h.hsn} ({h.gst}%)</TableCell>
                                            <TableCell align="right">{h.taxable.toFixed(2)}</TableCell>
                                            {isInterState ? <TableCell align="right">{h.tax.toFixed(2)}</TableCell> : 
                                            <><TableCell align="right">{(h.tax/2).toFixed(2)}</TableCell><TableCell align="right">{(h.tax/2).toFixed(2)}</TableCell></>}
                                            <TableCell align="right">{h.tax.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Grid>
                    
                    <Grid item xs={4.5} sx={{ p: 1 }}>
                        <Stack spacing={0.75}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: '11px', fontWeight: 700 }}>Sub Total:</Typography><Typography sx={{ fontSize: '11px', fontWeight: 900 }}>₹{subTotal.toFixed(2)}</Typography></Box>
                            {isInterState ? 
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: '10px', fontWeight: 700 }}>IGST:</Typography><Typography sx={{ fontSize: '10px', fontWeight: 900 }}>₹{tax.toFixed(2)}</Typography></Box> :
                                <><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: '10px', fontWeight: 700 }}>CGST:</Typography><Typography sx={{ fontSize: '10px', fontWeight: 900 }}>₹{(tax/2).toFixed(2)}</Typography></Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: '10px', fontWeight: 700 }}>SGST:</Typography><Typography sx={{ fontSize: '10px', fontWeight: 900 }}>₹{(tax/2).toFixed(2)}</Typography></Box></>
                            }
                            {discount > 0 && <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'error.main' }}><Typography sx={{ fontSize: '10px', fontWeight: 700 }}>Disc:</Typography><Typography sx={{ fontSize: '10px', fontWeight: 900 }}>-₹{discount.toFixed(2)}</Typography></Box>}
                            <Divider sx={{ my: 0.5, borderBottomWidth: 1.5, borderColor: '#000' }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: '13px', fontWeight: 950 }}>GRAND TOTAL:</Typography><Typography sx={{ fontSize: '15px', fontWeight: 950 }}>₹{grandTotal.toFixed(2)}</Typography></Box>
                            <Box sx={{ mt: 1, p: 0.75, bgcolor: '#f8fafc', border: '1px dashed #000' }}>
                                <Typography sx={{ fontSize: '9px', fontWeight: 800 }}>Bank Details:</Typography>
                                <Typography sx={{ fontSize: '9px' }}>{invoicing.bankDetails?.bankName} | A/c: {invoicing.bankDetails?.accountNo}</Typography>
                                <Typography sx={{ fontSize: '9px' }}>IFSC: {invoicing.bankDetails?.ifsc} | Br: {invoicing.bankDetails?.branch}</Typography>
                            </Box>
                        </Stack>
                    </Grid>
                </Grid>
            </Box>

            {/* Footer / Declarations */}
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <Box sx={{ flex: 1, border: '1px solid #000', p: 1 }}>
                    <Typography sx={{ fontSize: '9px', fontWeight: 900, mb: 0.5 }}>Terms & Conditions:</Typography>
                    <Typography sx={{ fontSize: '8px', fontWeight: 600, whiteSpace: 'pre-line', lineHeight: 1.3 }}>
                        {invoicing.termsAndConditions || 'Standard terms apply.'}
                    </Typography>
                </Box>
                <Box sx={{ width: '35%', textAlign: 'center', p: 1, border: '1px solid #000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '9px', fontWeight: 900 }}>For {company.legalName || 'REBEL MASS EXPORT PVT LTD'}</Typography>
                    <Box sx={{ mt: 5 }}>
                        <Typography sx={{ fontSize: '9px', fontWeight: 950, borderTop: '1px solid #000', pt: 0.5 }}>Authorised Signatory</Typography>
                    </Box>
                </Box>
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
