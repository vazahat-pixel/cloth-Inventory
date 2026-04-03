import { Box, Divider, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Stack } from '@mui/material';

const StandardInvoicePrint = ({ sale }) => {
    if (!sale) return null;

    const store = sale.storeId || {};
    const location = store.location || {};
    const items = sale.items || sale.products || [];
    
    const subTotal = sale.totals?.subTotal ?? sale.subTotal ?? 0;
    const tax = sale.totals?.tax ?? sale.tax ?? sale.totalTax ?? 0;
    const discount = sale.totals?.discount ?? sale.discount ?? 0;
    const grandTotal = sale.totals?.grandTotal ?? sale.grandTotal ?? 0;
    const loyaltyRedeemed = sale.totals?.loyaltyRedeemed ?? sale.loyaltyRedeemed ?? 0;
    const creditNoteApplied = sale.totals?.creditNoteAmount ?? sale.creditNoteApplied ?? 0;

    return (
        <Paper 
            elevation={0} 
            sx={{ 
                p: { xs: 2, sm: 4 }, 
                bgcolor: '#fff', 
                color: '#000', 
                maxWidth: 900, 
                mx: 'auto', 
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                '@media print': {
                    border: 'none',
                    p: 0,
                    width: '100% !important',
                    maxWidth: 'none !important'
                }
            }}
        >
            {/* Header: Global Company Branding */}
            <Box sx={{ mb: 4, pb: 4, borderBottom: '1px solid #f1f5f9' }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#111827', letterSpacing: -1 }}>REBEL MASS EXPORT PVT. LTD</Typography>
                <Typography variant="body2" sx={{ color: '#4b5563', mt: 0.5, fontWeight: 500 }}>
                    Plot No 418, Sector-53, Phase 3, Kundli, Sonipat (Haryana)
                </Typography>
                <Typography variant="body2" sx={{ color: '#4b5563' }}>
                    Customer Care: info.dapolo@gmail.com
                </Typography>
            </Box>

            {/* Sub-Header: Store / Branch Info */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={7}>
                    <Typography variant="subtitle1" sx={{ color: '#0f172a', fontWeight: 800, textTransform: 'uppercase' }}>{store.name || 'Branch Store'}</Typography>
                    <Typography variant="body2" sx={{ color: '#475569', mt: 0.5 }}>
                        {location.address}, {location.city}<br />
                        {location.state} - {location.pincode}
                    </Typography>
                    {store.gstNumber && (
                        <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 700, mt: 1 }}>
                            GSTIN: {store.gstNumber}
                        </Typography>
                    )}
                </Grid>
                <Grid item xs={5} sx={{ textAlign: 'right' }}>
                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #f1f5f9' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>TAX INVOICE</Typography>
                        <Stack spacing={0.5} sx={{ mt: 1 }}>
                            <DetailRow label="Invoice #" value={sale.invoiceNumber || sale.saleNumber} />
                            <DetailRow label="Date" value={new Date(sale.saleDate || sale.date || Date.now()).toLocaleDateString('en-IN')} />
                            <DetailRow label="Payment" value={sale.paymentMode || 'CASH'} />
                        </Stack>
                    </Box>
                </Grid>
            </Grid>

            {/* Customer Details */}
            <Box sx={{ mb: 4, p: 2, border: '1px solid #f1f5f9', borderRadius: 1.5 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Bill To:</Typography>
                <Typography variant="h6" sx={{ color: '#0f172a', fontWeight: 700 }}>{sale.customerName || 'Cash Customer'}</Typography>
                {sale.customerMobile && (
                    <Typography variant="body2" sx={{ color: '#475569' }}>
                        Mobile: {sale.customerMobile}
                    </Typography>
                )}
            </Box>

            {/* Items Table */}
            <TableContainer sx={{ mb: 4, border: '1px solid #e2e8f0', borderRadius: 1 }}>
                <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800 }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Item Description</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>Qty</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>Rate</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>Tax %</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>Net Total</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell sx={{ color: '#64748b' }}>{index + 1}</TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                        {item.itemName || 'Product'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                                        SKU: {item.sku || 'N/A'} | Size: {item.size || '-'} | Color: {item.color || '-'}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>{item.quantity}</TableCell>
                                <TableCell align="right">₹{Number(item.rate || item.price || 0).toFixed(2)}</TableCell>
                                <TableCell align="right">{Number(item.taxPercentage || 0).toFixed(1)}%</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>
                                    ₹{Number(item.amount || item.total || 0).toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Billing Summary */}
            <Grid container spacing={4}>
                <Grid item xs={6}>
                    <Box sx={{ p: 2, bgcolor: '#fdf2f2', borderRadius: 1.5, border: '1px solid #fecaca' }}>
                        <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 800, textTransform: 'uppercase' }}>Terms & Conditions:</Typography>
                        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#991b1b', lineHeight: 1.4 }}>
                            1. Goods once sold will not be taken back.<br />
                            2. Subject to {location.city || 'local'} jurisdiction.<br />
                            3. Exchange possible within 7 days with original tag.<br />
                            4. We are not responsible for any damage after wash.
                        </Typography>
                    </Box>
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>Amount in words:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', textTransform: 'capitalize' }}>
                            Rupees {numberToWords(grandTotal)} Only
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={6}>
                    <Stack spacing={1}>
                        <SummaryLine label="Sub Total" value={subTotal} />
                        {discount > 0 && <SummaryLine label="Discount (-)" value={discount} color="#dc2626" />}
                        {tax > 0 && <SummaryLine label="Add GST (+)" value={tax} />}
                        {loyaltyRedeemed > 0 && <SummaryLine label="Points Used (-)" value={loyaltyRedeemed} color="#16a34a" />}
                        {creditNoteApplied > 0 && <SummaryLine label="Credit Applied (-)" value={creditNoteApplied} color="#16a34a" />}
                        {sale.exchangeAdjustment > 0 && <SummaryLine label="Exchange Credit (-)" value={sale.exchangeAdjustment} color="#16a34a" />}
                        
                        
                        <Box sx={{ 
                            mt: 1, 
                            p: 2, 
                            bgcolor: '#1e293b', 
                            borderRadius: 1, 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            color: '#fff'
                        }}>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>GRAND TOTAL</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900 }}>
                                ₹{Number(grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                        </Box>
                    </Stack>
                </Grid>
            </Grid>

            {/* Authorized Signatory */}
            <Box sx={{ mt: 8, display: 'flex', justifyContent: 'flex-end' }}>
                <Box sx={{ textAlign: 'center', width: 250 }}>
                    <Divider sx={{ mb: 1, borderColor: '#cbd5e1' }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Authorized Signatory
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8' }}>
                        For {store.name}
                    </Typography>
                </Box>
            </Box>

            {/* Branding Footer */}
            <Box sx={{ mt: 6, pt: 3, borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 700 }}>Visit again! Your satisfaction is our priority.</Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5 }}>
                    Software powered by CLOTH ERP • www.clotherp.com
                </Typography>
            </Box>
        </Paper>
    );
};

const DetailRow = ({ label, value }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>{label}:</Typography>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e293b' }}>{value}</Typography>
    </Box>
);

const SummaryLine = ({ label, value, color }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1 }}>
        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>{label}</Typography>
        <Typography variant="body2" sx={{ color: color || '#1e293b', fontWeight: 700 }}>
            ₹{Number(value).toFixed(2)}
        </Typography>
    </Box>
);

// Helper to convert number to words for a premium feel
function numberToWords(num) {
  const a = ['','one ','two ','three ','four ', 'five ','six ','seven ','eight ','nine ','ten ','eleven ','twelve ','thirteen ','fourteen ','fifteen ','sixteen ','seventeen ','eighteen ','nineteen '];
  const b = ['', '', 'twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety'];

  if ((num = num.toString()).length > 9) return 'overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return ''; 
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim();
}

export default StandardInvoicePrint;
