import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    Paper,
    Stack,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    Autocomplete
} from '@mui/material';
import {
    PrintOutlined as PrintIcon,
    QrCodeScannerOutlined as ScannerIcon,
} from '@mui/icons-material';
import api from '../../services/api';

const BarcodePrintingPage = () => {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get('/products');
                // Backend returns { success, message, products, meta }
                const data = res.data;
                setProducts(data.products || data.data?.products || []);
            } catch (err) {
                console.error('Failed to load products for barcode printing', err);
            }
        };
        fetchProducts();
    }, []);

    const handlePrint = () => {
        if (!selectedProduct) return;

        // In a real app, this would use a label printer library or a specific print window
        const printWindow = window.open('', '_blank');
        const content = `
            <html>
                <body style="text-align: center; font-family: sans-serif; padding: 20px;">
                    ${Array.from({ length: quantity }).map(() => `
                        <div style="border: 1px solid #ccc; padding: 10px; margin: 10px; display: inline-block; width: 200px;">
                            <h3 style="margin: 0;">${selectedProduct.name}</h3>
                            <p style="margin: 5px 0;">SKU: ${selectedProduct.sku}</p>
                            <div style="font-size: 30px; font-weight: bold; margin: 10px 0;">${selectedProduct.barcode}</div>
                            <p style="margin: 0; font-size: 18px;">Price: ₹${selectedProduct.salePrice}</p>
                        </div>
                    `).join('')}
                    <script>window.print(); window.close();</script>
                </body>
            </html>
        `;
        printWindow.document.write(content);
        printWindow.document.close();
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>Barcode Label Printing</Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Stack spacing={4}>
                                <Autocomplete
                                    options={products}
                                    getOptionLabel={(option) => `${option.name} (${option.sku})`}
                                    value={selectedProduct}
                                    onChange={(e, val) => setSelectedProduct(val)}
                                    renderInput={(params) => <TextField {...params} label="Search Product" fullWidth />}
                                />

                                {selectedProduct && (
                                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '12px' }}>
                                        <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>Selected Product Info:</Typography>
                                        <Typography variant="h6">{selectedProduct.name}</Typography>
                                        <Typography variant="body2">SKU: {selectedProduct.sku}</Typography>
                                        <Typography variant="body2">Barcode: {selectedProduct.barcode}</Typography>
                                        <Typography variant="h5" sx={{ mt: 1, color: 'primary.main', fontWeight: 700 }}>₹{selectedProduct.salePrice}</Typography>
                                    </Box>
                                )}

                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Number of Labels"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    inputProps={{ min: 1, max: 100 }}
                                />

                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    startIcon={<PrintIcon />}
                                    disabled={!selectedProduct}
                                    onClick={handlePrint}
                                    sx={{ py: 1.5, borderRadius: '12px', fontWeight: 700 }}
                                >
                                    Generate & Print Labels
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', bgcolor: '#f1f5f9', borderRadius: '24px', p: 4, textAlign: 'center' }}>
                        <ScannerIcon sx={{ fontSize: 80, color: '#cbd5e1', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: '#334155' }}>Preview Window</Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 300 }}>
                            The generated labels will appear here or in a separate print dialog for thermal printers.
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default BarcodePrintingPage;
