import { Box, Divider, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Stack } from '@mui/material';

const StandardInvoicePrint = ({ sale }) => {
    if (!sale) return null;

    // Use normalized items if available, else fallback to products
    const items = sale.items || sale.products || [];
    
    // Use totals object if available, else fallback to top-level fields
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
                p: 5, 
                bgcolor: '#fff', 
                color: '#000', 
                maxWidth: 800, 
                mx: 'auto', 
                border: '1px solid #e2e8f0',
                borderRadius: 0,
                '@media print': {
                    border: 'none',
                    p: 0,
                    width: '100% !important',
                    maxWidth: 'none !important'
                }
            }}
        >
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: -1 }}>CLOTH ERP</Typography>
                <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 500 }}>Tax Invoice</Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>123, Fashion Street, Sector 12, Gujarat</Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>GSTIN: 24AAABC1234A1Z5</Typography>
            </Box>

            <Divider sx={{ my: 3, borderColor: '#f1f5f9' }} />

            {/* Bill Details */}
            <Grid container spacing={4} sx={{ mb: 4 }}>
                <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Billing To</Typography>
                    <Typography variant="h6" sx={{ color: '#0f172a', mt: 0.5 }}>{sale.customerName || 'Walk-in Customer'}</Typography>
                    {sale.customerMobile && (
                        <Typography variant="body2" sx={{ color: '#475569' }}>
                            M: {sale.customerMobile}
                        </Typography>
                    )}
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Invoice Info</Typography>
                    <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" sx={{ color: '#0f172a' }}><strong>Invoice #:</strong> {sale.invoiceNumber || sale.saleNumber}</Typography>
                        <Typography variant="body2" sx={{ color: '#0f172a' }}><strong>Date:</strong> {new Date(sale.saleDate || sale.date || Date.now()).toLocaleDateString()}</Typography>
                        <Typography variant="body2" sx={{ color: '#0f172a' }}><strong>Payment:</strong> {sale.paymentMode || 'CASH'}</Typography>
                    </Box>
                </Grid>
            </Grid>

            {/* Items Table */}
            <TableContainer sx={{ mb: 4, borderRadius: 1.5, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Description</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: '#475569' }}>Qty</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: '#475569' }}>Rate</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: '#475569' }}>Discount</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: '#475569' }}>Total</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item, index) => (
                            <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                        {item.itemName || 'Product'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                                        SKU: {item.sku || 'N/A'} {item.size ? `| Size: ${item.size}` : ''} {item.color ? `| Color: ${item.color}` : ''}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ color: '#0f172a' }}>{item.quantity}</TableCell>
                                <TableCell align="right" sx={{ color: '#0f172a' }}>₹{Number(item.rate || item.price || 0).toFixed(2)}</TableCell>
                                <TableCell align="right" sx={{ color: '#0f172a' }}>{Number(item.discount || 0).toFixed(2)}%</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                    ₹{Number(item.amount || item.total || 0).toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Summary */}
            <Box sx={{ ml: 'auto', width: '100%', maxWidth: 320 }}>
                <Stack spacing={1.5}>
                    <SummaryLine label="Subtotal" value={subTotal} />
                    {discount > 0 && <SummaryLine label="Discount" value={-discount} color="#dc2626" />}
                    {tax > 0 && <SummaryLine label="GST" value={tax} />}
                    {loyaltyRedeemed > 0 && <SummaryLine label="Loyalty Redeemed" value={-loyaltyRedeemed} color="#16a34a" />}
                    {creditNoteApplied > 0 && <SummaryLine label="Credit Applied" value={-creditNoteApplied} color="#16a34a" />}
                    
                    <Divider sx={{ my: 1, borderColor: '#f1f5f9' }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a' }}>Grand Total</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a' }}>
                            ₹{Number(grandTotal).toFixed(2)}
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            {/* Footer */}
            <Box sx={{ mt: 8, pt: 4, borderTop: '2px dashed #f1f5f9', textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>Thank you for shopping with us!</Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 1 }}>
                    Please keep this invoice for your records. Terms & Conditions apply.
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 3, opacity: 0.5 }}>
                    <Typography variant="caption">www.clotherp.com</Typography>
                    <Typography variant="caption">support@clotherp.com</Typography>
                    <Typography variant="caption">+91 98765 43210</Typography>
                </Box>
            </Box>
        </Paper>
    );
};

const SummaryLine = ({ label, value, color }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>{label}</Typography>
        <Typography variant="body2" sx={{ color: color || '#0f172a', fontWeight: 700 }}>
            {value < 0 ? `- ₹${Math.abs(value).toFixed(2)}` : `₹${Number(value).toFixed(2)}`}
        </Typography>
    </Box>
);

export default StandardInvoicePrint;
