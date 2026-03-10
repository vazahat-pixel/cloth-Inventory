import { Box, Divider, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

const ExchangeInvoicePrint = ({ sale }) => {
    if (!sale) return null;

    const returns = (sale.products || []).filter(p => p.quantity < 0);
    const additions = (sale.products || []).filter(p => p.quantity > 0);

    const calculateSection = (items) => {
        return items.reduce((acc, it) => {
            const q = Math.abs(it.quantity);
            const r = Number(it.price || it.rate || 0);
            acc.qty += q;
            acc.total += q * r;
            return acc;
        }, { qty: 0, total: 0 });
    };

    const returnTotals = calculateSection(returns);
    const additionTotals = calculateSection(additions);

    return (
        <Paper elevation={0} sx={{ p: 4, bgcolor: '#fff', color: '#000', maxWidth: 800, mx: 'auto', border: '1px solid #eee' }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: 1 }}>CLOTH ERP</Typography>
                <Typography variant="subtitle1" sx={{ mt: 1 }}>Exchange Invoice</Typography>
            </Box>

            <Grid container spacing={4} sx={{ mb: 4 }}>
                <Grid item xs={6}>
                    <Typography variant="overline" color="textSecondary">Bill To</Typography>
                    <Typography variant="h6">{sale.customerName || 'Walk-in Customer'}</Typography>
                    {sale.customerMobile && <Typography variant="body2">{sale.customerMobile}</Typography>}
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                    <Typography variant="overline" color="textSecondary">Invoice Details</Typography>
                    <Typography variant="body1"><strong>Invoice #:</strong> {sale.invoiceNumber}</Typography>
                    <Typography variant="body2"><strong>Date:</strong> {new Date(sale.createdAt).toLocaleDateString()}</Typography>
                </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mb: 1, color: '#dc2626' }}>Returned Items (-)</Typography>
            <TableContainer sx={{ mb: 3 }}>
                <Table size="small">
                    <TableHead sx={{ bgcolor: '#fef2f2' }}>
                        <TableRow>
                            <TableCell>Item Description</TableCell>
                            <TableCell align="right">Qty</TableCell>
                            <TableCell align="right">Rate</TableCell>
                            <TableCell align="right">Total</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {returns.map((it, idx) => (
                            <TableRow key={idx}>
                                <TableCell>
                                    {it.itemName || it.productId?.name}
                                    <Typography variant="caption" display="block">{it.sku || it.productId?.sku}</Typography>
                                </TableCell>
                                <TableCell align="right">{Math.abs(it.quantity)}</TableCell>
                                <TableCell align="right">₹{Number(it.price || 0).toFixed(2)}</TableCell>
                                <TableCell align="right">₹{(Math.abs(it.quantity) * Number(it.price || 0)).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell colSpan={3} align="right"><strong>Total Return Value:</strong></TableCell>
                            <TableCell align="right"><strong>₹{returnTotals.total.toFixed(2)}</strong></TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            <Typography variant="h6" sx={{ mb: 1, color: '#16a34a' }}>New Additions (+)</Typography>
            <TableContainer sx={{ mb: 3 }}>
                <Table size="small">
                    <TableHead sx={{ bgcolor: '#f0fdf4' }}>
                        <TableRow>
                            <TableCell>Item Description</TableCell>
                            <TableCell align="right">Qty</TableCell>
                            <TableCell align="right">Rate</TableCell>
                            <TableCell align="right">Total</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {additions.map((it, idx) => (
                            <TableRow key={idx}>
                                <TableCell>
                                    {it.itemName || it.productId?.name}
                                    <Typography variant="caption" display="block">{it.sku || it.productId?.sku}</Typography>
                                </TableCell>
                                <TableCell align="right">{it.quantity}</TableCell>
                                <TableCell align="right">₹{Number(it.price || 0).toFixed(2)}</TableCell>
                                <TableCell align="right">₹{(it.quantity * Number(it.price || 0)).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell colSpan={3} align="right"><strong>Total New Value:</strong></TableCell>
                            <TableCell align="right"><strong>₹{additionTotals.total.toFixed(2)}</strong></TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ ml: 'auto', width: 250 }}>
                <Grid container spacing={1}>
                    <Grid item xs={7}><Typography variant="body2">Returned Total:</Typography></Grid>
                    <Grid item xs={5} sx={{ textAlign: 'right' }}><Typography variant="body2">₹{returnTotals.total.toFixed(2)}</Typography></Grid>

                    <Grid item xs={7}><Typography variant="body2">Purchased Total:</Typography></Grid>
                    <Grid item xs={5} sx={{ textAlign: 'right' }}><Typography variant="body2">₹{additionTotals.total.toFixed(2)}</Typography></Grid>

                    <Grid item xs={12}><Box sx={{ borderTop: '1px solid #eee', my: 1 }} /></Grid>

                    <Grid item xs={7}><Typography variant="h6">Net Payable:</Typography></Grid>
                    <Grid item xs={5} sx={{ textAlign: 'right' }}><Typography variant="h6">₹{sale.grandTotal.toFixed(2)}</Typography></Grid>
                </Grid>
            </Box>

            <Box sx={{ mt: 10, textAlign: 'center', color: '#666' }}>
                <Typography variant="caption">Thank you for visiting Cloth Store! Items exchanged cannot be returned again.</Typography>
            </Box>
        </Paper>
    );
};

export default ExchangeInvoicePrint;
