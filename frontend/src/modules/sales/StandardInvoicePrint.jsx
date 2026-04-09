import { Box, Divider, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Stack } from '@mui/material';

const StandardInvoicePrint = ({ sale }) => {
    if (!sale) return null;

    const store = sale.storeId || {};
    const location = store.location || {};
    const items = sale.items || sale.products || [];
    
    const subTotal = sale.totals?.subTotal ?? sale.subTotal ?? 0;
    const tax = sale.totals?.taxAmount ?? sale.tax ?? sale.totalTax ?? 0;
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
                borderRadius: 0,
                border: '1px solid #1e3a8a',
                fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                '@media print': {
                    border: '1px solid #333',
                    p: 2,
                    width: '100% !important',
                    maxWidth: 'none !important'
                }
            }}
        >
            {/* Professional Header with Blue Theme */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                mb: 3,
                borderBottom: '4px solid #1e3a8a',
                pb: 2
            }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase' }}>
                        REBEL MASS EXPORT PVT. LTD
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {location.address}, {location.city}, {location.state} - {location.pincode}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                        Email: info.dapolo@gmail.com | GSTIN: {store.gstNumber || '29AAAAA0000A1Z5'}
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#e2e8f0', letterSpacing: 2, opacity: 0.5 }}>
                        INVOICE
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={4} sx={{ mb: 4 }}>
                <Grid item xs={6}>
                    <Box sx={{ p: 1.5, border: '1px solid #e2e8f0', height: '100%' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', display: 'block', mb: 1, borderBottom: '1px solid #e2e8f0' }}>
                            Billing Details
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{sale.customerName || 'Walk-in Customer'}</Typography>
                        <Typography variant="body2">Mobile: {sale.customerMobile || 'N/A'}</Typography>
                        {sale.customerAddress && <Typography variant="body2">{sale.customerAddress}</Typography>}
                    </Box>
                </Grid>
                <Grid item xs={6}>
                    <Box sx={{ p: 1.5, border: '1px solid #e2e8f0', height: '100%' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', display: 'block', mb: 1, borderBottom: '1px solid #e2e8f0' }}>
                            Invoice Information
                        </Typography>
                        <Stack spacing={0.5}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Invoice Number:</Typography>
                                <Typography variant="body2">{sale.invoiceNumber || sale.saleNumber}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Date:</Typography>
                                <Typography variant="body2">{new Date(sale.saleDate || sale.date || Date.now()).toLocaleDateString('en-IN')}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Payment Method:</Typography>
                                <Typography variant="body2" sx={{ textTransform: 'uppercase' }}>{sale.paymentMode || 'CASH'}</Typography>
                            </Box>
                            {sale.salesmanName && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Salesperson:</Typography>
                                    <Typography variant="body2">{sale.salesmanName}</Typography>
                                </Box>
                            )}
                        </Stack>
                    </Box>
                </Grid>
            </Grid>

            {/* Items Table with Industrial Look */}
            <TableContainer sx={{ mb: 4 }}>
                <Table size="small" sx={{ border: '1px solid #1e3a8a' }}>
                    <TableHead sx={{ bgcolor: '#1e3a8a' }}>
                        <TableRow>
                            <TableCell sx={{ color: '#fff', fontWeight: 800 }}>SR.</TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 800 }}>DESCRIPTION OF GOODS</TableCell>
                            <TableCell align="center" sx={{ color: '#fff', fontWeight: 800 }}>QTY</TableCell>
                            <TableCell align="right" sx={{ color: '#fff', fontWeight: 800 }}>RATE</TableCell>
                            <TableCell align="right" sx={{ color: '#fff', fontWeight: 800 }}>TAX %</TableCell>
                            <TableCell align="right" sx={{ color: '#fff', fontWeight: 800 }}>AMOUNT</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item, index) => (
                            <TableRow key={index} sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                                <TableCell sx={{ borderRight: '1px solid #e2e8f0' }}>{index + 1}</TableCell>
                                <TableCell sx={{ borderRight: '1px solid #e2e8f0' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.itemName || 'Product'}</Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                                        SKU: {item.sku || 'N/A'} | Size: {item.size || '-'} | Color: {item.color || '-'}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center" sx={{ borderRight: '1px solid #e2e8f0', fontWeight: 600 }}>{item.quantity}</TableCell>
                                <TableCell align="right" sx={{ borderRight: '1px solid #e2e8f0' }}>{Number(item.rate || item.price || 0).toFixed(2)}</TableCell>
                                <TableCell align="right" sx={{ borderRight: '1px solid #e2e8f0' }}>{Number(item.taxPercentage || 5).toFixed(1)}%</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>{Number(item.amount || item.total || 0).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Grid container spacing={2}>
                <Grid item xs={7}>
                    <Box sx={{ p: 2, border: '1px solid #e2e8f0', mb: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e3a8a', display: 'block', mb: 1 }}>DECLARATION:</Typography>
                        <Typography sx={{ fontSize: '10px', color: '#475569', lineHeight: 1.5 }}>
                            1. Certified that the particulars given above are true and correct.<br />
                            2. Goods once sold will not be taken back.<br />
                            3. Subject to jurisdiction of {location.city || 'local'} courts.<br />
                            4. This is a computer generated invoice.
                        </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>AMOUNT IN WORDS:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase' }}>
                        RUPEES {numberToWords(grandTotal)} ONLY
                    </Typography>
                </Grid>
                <Grid item xs={5}>
                    <Stack spacing={0.5} sx={{ border: '1px solid #1e3a8a', p: 1.5 }}>
                        <SummaryLine label="Sub Total" value={subTotal} />
                        <SummaryLine label="Tax Amount" value={tax} />
                        {discount > 0 && <SummaryLine label="Discount (-)" value={discount} color="#dc2626" />}
                        {loyaltyRedeemed > 0 && <SummaryLine label="Rewards Used" value={loyaltyRedeemed} color="#16a34a" />}
                        {creditNoteApplied > 0 && <SummaryLine label="Credit Note" value={creditNoteApplied} color="#16a34a" />}
                        <Divider sx={{ my: 1, bgcolor: '#1e3a8a' }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e3a8a' }}>TOTAL AMOUNT</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: '#1e3a8a' }}>₹{Number(grandTotal).toFixed(2)}</Typography>
                        </Box>
                    </Stack>
                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Box sx={{ height: 60 }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, borderTop: '1px solid #333', pt: 0.5, px: 4 }}>
                            AUTHORIZED SIGNATORY
                        </Typography>
                    </Box>
                </Grid>
            </Grid>

            {/* Footer */}
            <Box sx={{ mt: 6, textAlign: 'center', p: 2, bgcolor: '#f8fafc' }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e3a8a' }}>
                    THANK YOU FOR YOUR BUSINESS! VISIT AGAIN.
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#64748b' }}>
                    Plot No 418, Sector-53, Phase 3, Kundli, Sonipat, Haryana
                </Typography>
            </Box>
        </Paper>
    );
};

const SummaryLine = ({ label, value, color }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>{label}:</Typography>
        <Typography sx={{ fontSize: '12px', fontWeight: 700, color: color || '#1e293b' }}>₹{Number(value).toFixed(2)}</Typography>
    </Box>
);

function numberToWords(num) {
  const a = ['','ONE ','TWO ','THREE ','FOUR ', 'FIVE ','SIX ','SEVEN ','EIGHT ','NINE ','TEN ','ELEVEN ','TWELVE ','THIRTEEN ','FOURTEEN ','FIFTEEN ','SIXTEEN ','SEVENTEEN ','EIGHTEEN ','NINETEEN '];
  const b = ['', '', 'TWENTY','THIRTY','FORTY','FIFTY', 'SIXTY','SEVENTY','EIGHTY','NINETY'];
  
  if ((num = num.toString()).split('.')[0].length > 9) return 'OVERFLOW';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return ''; 
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'CRORE ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'LAKH ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'THOUSAND ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'HUNDRED ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'AND ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim();
}

export default StandardInvoicePrint;
