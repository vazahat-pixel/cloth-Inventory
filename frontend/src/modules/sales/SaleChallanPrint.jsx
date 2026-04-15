import { Box, Divider, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Stack } from '@mui/material';

const SaleChallanPrint = ({ challan }) => {
    if (!challan) return null;

    const store = challan.storeId || {};
    const location = store.location || {};
    const items = challan.items || [];
    
    const totalQuantity = items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);

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
            <Box sx={{ mb: 4, textAlign: 'center', borderBottom: '2px solid #000', pb: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#111827', mb: 1 }}>DELIVERY CHALLAN</Typography>
                <Typography variant="subtitle2" sx={{ color: '#dc2626', fontWeight: 800 }}>NOT A TAX INVOICE</Typography>
            </Box>

            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#111827' }}>REBEL MASS EXPORT PVT. LTD</Typography>
                    <Typography variant="body2" sx={{ color: '#4b5563', mt: 0.5 }}>
                        Plot No 418, Sector-53, Phase 3, Kundli, Sonipat (Haryana)
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4b5563' }}>
                        Customer Care: info.dapolo@gmail.com
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right', minWidth: 250, p: 2, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                    <Stack spacing={0.5}>
                        <DetailRow label="Challan #" value={challan.challanNumber || challan.number || 'N/A'} />
                        <DetailRow label="Date" value={new Date(challan.createdAt || challan.date || Date.now()).toLocaleDateString('en-IN')} />
                        <DetailRow label="Vehicle #" value={challan.vehicleNumber || '-'} />
                    </Stack>
                </Box>
            </Box>

            {/* Consignee / Store Branch Details */}
            <Grid container spacing={4} sx={{ mb: 4 }}>
                <Grid item xs={6}>
                    <Box sx={{ p: 2, border: '1px solid #f1f5f9', borderRadius: 1.5, height: '100%' }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>From:</Typography>
                        <Typography variant="subtitle1" sx={{ color: '#0f172a', fontWeight: 700, mt: 0.5 }}>{store.name || 'Warehouse'}</Typography>
                        <Typography variant="body2" sx={{ color: '#4b5563', mt: 0.5 }}>
                            {location.address}, {location.city}<br />
                            {location.state} - {location.pincode}
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={6}>
                    <Box sx={{ p: 2, border: '1px solid #f1f5f9', borderRadius: 1.5, height: '100%' }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>To (Consignee):</Typography>
                        <Typography variant="subtitle1" sx={{ color: '#0f172a', fontWeight: 700, mt: 0.5 }}>{challan.customerName || challan.destinationStoreId?.name || 'Walk-in Customer'}</Typography>
                        <Typography variant="body2" sx={{ color: '#4b5563', mt: 0.5 }}>
                            {challan.shippingAddress || challan.customerAddress || 'Self Pickup / Counter Dispatch'}
                        </Typography>
                        {challan.customerMobile && <Typography variant="body2" sx={{ color: '#4b5563' }}>Mob: {challan.customerMobile}</Typography>}
                    </Box>
                </Grid>
            </Grid>

            {/* Items Table */}
            <TableContainer sx={{ mb: 4, border: '1px solid #000' }}>
                <Table size="small">
                    <TableHead sx={{ bgcolor: '#eee' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800, color: '#000' }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#000' }}>Item Description / SKU</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: '#000' }}>Quantity</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 800, color: '#000' }}>UOM</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#000' }}>Remarks</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item, index) => (
                            <TableRow key={index} sx={{ borderBottom: '1px solid #eee' }}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.itemName || item.productId?.itemName || 'Product'}</Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b' }}>SKU: {item.sku || 'N/A'} | Size: {item.size || '-'}</Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 900 }}>{item.quantity}</TableCell>
                                <TableCell align="center">PCS</TableCell>
                                <TableCell sx={{ color: '#94a3b8' }}>-</TableCell>
                            </TableRow>
                        ))}
                        {/* Summary Row */}
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            <TableCell colSpan={2} align="right" sx={{ fontWeight: 800 }}>TOTAL QUANTITY</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, borderLeft: '1px solid #000' }}>{totalQuantity}</TableCell>
                            <TableCell colSpan={2} />
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Signatures and Conditions */}
            <Grid container spacing={4} sx={{ mt: 8 }}>
                <Grid item xs={6}>
                    <Box sx={{ p: 2, border: '1px dotted #ccc', borderRadius: 1.5 }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>Receiver's Signature:</Typography>
                        <Box sx={{ height: 60 }} />
                        <Divider />
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>Received goods in good condition.</Typography>
                    </Box>
                </Grid>
                <Grid item xs={6} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                     <Box sx={{ textAlign: 'center', width: 250 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>FOR REBEL MASS EXPORT PVT. LTD</Typography>
                        <Box sx={{ height: 60 }} />
                        <Divider sx={{ borderColor: '#000' }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, mt: 0.5, display: 'block' }}>AUTHORIZED SIGNATORY</Typography>
                    </Box>
                </Grid>
            </Grid>

            {/* Footer */}
            <Box sx={{ mt: 6, textAlign: 'center', borderTop: '1px solid #eee', pt: 2 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Generated via Cloth ERP • All rights reserved.
                </Typography>
            </Box>
        </Paper>
    );
};

const DetailRow = ({ label, value }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>{label}:</Typography>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a' }}>{value}</Typography>
    </Box>
);

export default SaleChallanPrint;
