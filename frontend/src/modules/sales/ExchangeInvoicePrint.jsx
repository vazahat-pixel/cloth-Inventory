import { Box, Divider, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Stack } from '@mui/material';

const ExchangeInvoicePrint = ({ sale }) => {
    if (!sale) return null;

    const store = sale.storeId || {};
    const location = store.location || {};
    const newItems = sale.items || [];
    const returnedItems = sale.returnedItems || [];
    
    const subTotal = sale.subTotal ?? 0;
    const tax = sale.totalTax ?? 0;
    // Combine all discounts for display
    const discount = Number(sale.discount || 0) + Number(sale.schemeDiscount || 0) + Number(sale.couponDiscount || 0);
    const grandTotal = sale.grandTotal ?? 0;
    const exchangeAdjustment = sale.exchangeAdjustment ?? 0;

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
            <Box sx={{ mb: 4, pb: 4, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#111827' }}>EXCHANGE VOUCHER</Typography>
                <Typography variant="body2" sx={{ color: '#4b5563', mt: 0.5 }}>
                    REBEL MASS EXPORT PVT. LTD - {store.name}
                </Typography>
            </Box>

            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>Invoice Details:</Typography>
                    <Typography variant="body2"><strong>Invoice #:</strong> {sale.saleNumber}</Typography>
                    <Typography variant="body2"><strong>Date:</strong> {new Date(sale.saleDate).toLocaleDateString('en-IN')}</Typography>
                    <Typography variant="body2"><strong>Mode:</strong> {sale.paymentMode}</Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>Customer Detail:</Typography>
                    <Typography variant="body2"><strong>{sale.customerName || 'Cash Customer'}</strong></Typography>
                    {sale.customerMobile && <Typography variant="body2">{sale.customerMobile}</Typography>}
                </Grid>
            </Grid>

            {/* Returned Section (RED) */}
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#dc2626', mb: 1, textTransform: 'uppercase' }}>Items Returned (-)</Typography>
            <TableContainer sx={{ mb: 3, border: '1px solid #fecaca', borderRadius: 1 }}>
                <Table size="small">
                    <TableHead sx={{ bgcolor: '#fef2f2' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800 }}>BC / Item</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>Qty</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>Rate</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>Value</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {returnedItems.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.itemId?.itemName || 'Product'}</Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b' }}>{item.barcode}</Typography>
                                </TableCell>
                                <TableCell align="right">{item.quantity}</TableCell>
                                <TableCell align="right">₹{Number(item.rate).toFixed(2)}</TableCell>
                                <TableCell align="right">₹{Number(item.total).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* New Additions Section (GREEN) */}
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#16a34a', mb: 1, textTransform: 'uppercase' }}>New Purchases (+)</Typography>
            <TableContainer sx={{ mb: 4, border: '1px solid #dcfce7', borderRadius: 1 }}>
                <Table size="small">
                    <TableHead sx={{ bgcolor: '#f0fdf4' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800 }}>BC / Item</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>Qty</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>Rate</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>Value</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {newItems.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.itemId?.itemName || 'Product'}</Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b' }}>{item.barcode}</Typography>
                                </TableCell>
                                <TableCell align="right">{item.quantity}</TableCell>
                                <TableCell align="right">₹{Number(item.rate).toFixed(2)}</TableCell>
                                <TableCell align="right">₹{Number(item.total).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Grid container spacing={4}>
                <Grid item xs={6}>
                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>Exchange Policy:</Typography>
                        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#475569' }}>
                            1. Items once exchanged cannot be returned or re-exchanged.<br />
                            2. Quality check performed on returned products.<br />
                            3. Net payable is inclusive of GST.
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={6}>
                    <Stack spacing={1}>
                        <DetailTotal label="New Product Total" value={subTotal + tax - discount} />
                        <DetailTotal label="Return Adjusted Credit" value={`-${exchangeAdjustment.toFixed(2)}`} color="#dc2626" />
                        <Divider />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1, bgcolor: '#1e293b', borderRadius: 1, color: '#fff' }}>
                            <Typography sx={{ fontWeight: 800 }}>NET PAYABLE</Typography>
                            <Typography sx={{ fontWeight: 900 }}>₹{grandTotal.toFixed(2)}</Typography>
                        </Box>
                    </Stack>
                </Grid>
            </Grid>

            {/* Signature Area */}
            <Box sx={{ mt: 10, pt: 4, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ borderBottom: '1px solid #000', px: 3, pb: 0.5, display: 'inline-block' }}>{sale.customerName || 'Customer'}</Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>Customer Signature</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ borderBottom: '1px solid #000', px: 3, pb: 0.5, display: 'inline-block' }}>Authorized Store Rep</Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>Cashier/Manager</Typography>
                </Box>
            </Box>
        </Paper>
    );
};

const DetailTotal = ({ label, value, color }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" sx={{ color: '#64748b' }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, color: color || '#0f172a' }}>
            {typeof value === 'string' ? value : `₹${Number(value).toFixed(2)}`}
        </Typography>
    </Box>
);

export default ExchangeInvoicePrint;
