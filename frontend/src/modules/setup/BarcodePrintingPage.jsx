import React, { useState, useEffect, useRef } from 'react';
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
    Autocomplete,
    Divider
} from '@mui/material';
import {
    PrintOutlined as PrintIcon,
    QrCodeScannerOutlined as ScannerIcon,
} from '@mui/icons-material';
import JsBarcode from 'jsbarcode';
import api from '../../services/api';

const BarcodePrintingPage = () => {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // Additional fields to match the image format
    const [type, setType] = useState('REGULAR PLAIN');
    const [design, setDesign] = useState('BAN COLLAR');
    const [qtyInfo, setQtyInfo] = useState('1N CASUAL');
    const [mfgLine1, setMfgLine1] = useState('Rebel Mass Export Pvt. Ltd');
    const [mfgLine2, setMfgLine2] = useState('Plot No 418, Sector-53, Phase 3');
    const [mfgLine3, setMfgLine3] = useState('Kundli, Sonipat (Haryana)');
    const [email, setEmail] = useState('info.dapolo@gmail.com');

    const canvasRef = useRef(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get('/products');
                const data = res.data;
                setProducts(data.products || data.data?.products || []);
            } catch (err) {
                console.error('Failed to load products for barcode printing', err);
            }
        };
        fetchProducts();
    }, []);

    const generateBarcodeDataUrl = (text) => {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, text, {
            format: "CODE128",
            width: 2,
            height: 50,
            displayValue: false,
            margin: 0
        });
        return canvas.toDataURL("image/png");
    };

    const handlePrint = () => {
        if (!selectedProduct) return;

        const barcodeImgData = generateBarcodeDataUrl(selectedProduct.barcode);
        const printWindow = window.open('', '_blank');
        
        const labelHtml = `
            <div class="label-container" style="
                width: 280px; 
                padding: 15px; 
                border: 1px solid #000; 
                font-family: 'Arial', sans-serif; 
                text-transform: uppercase;
                margin-bottom: 20px;
                page-break-inside: avoid;
                background: #fff;
            ">
                <!-- Barcode Section -->
                <div style="text-align: center; margin-bottom: 5px;">
                    <img src="${barcodeImgData}" style="width: 100%; max-height: 45px;" />
                    <div style="font-weight: bold; font-size: 14px; letter-spacing: 2px;">${selectedProduct.barcode}</div>
                </div>

                <!-- Product Details -->
                <div style="font-size: 11px; line-height: 1.4;">
                    <div style="display: flex; margin-bottom: 3px;">
                        <span style="width: 80px; font-weight: bold;">ARTICLE :</span>
                        <span>${selectedProduct.sku}</span>
                    </div>
                    <div style="display: flex; margin-bottom: 3px;">
                        <span style="width: 80px; font-weight: bold;">GROUP :</span>
                        <span>${selectedProduct.category || 'CLOTHING'}</span>
                        <span style="margin-left: auto; font-size: 10px;">0015</span>
                    </div>
                    <div style="display: flex; margin-bottom: 3px;">
                        <span style="width: 80px; font-weight: bold;">TYPE :</span>
                        <span>${type}</span>
                    </div>
                    <div style="display: flex; margin-bottom: 15px;">
                        <span style="width: 80px; font-weight: bold;">DESIGN :</span>
                        <span>${design}</span>
                    </div>

                    <div style="display: flex; margin-bottom: 3px;">
                        <span style="width: 80px; font-weight: bold;">SIZE :</span>
                        <span style="font-weight: bold; font-size: 13px;">${selectedProduct.size}</span>
                    </div>
                    <div style="display: flex; margin-bottom: 3px;">
                        <span style="width: 80px; font-weight: bold;">QTY: 1N</span>
                        <span>${qtyInfo}</span>
                    </div>
                    <div style="display: flex; margin-bottom: 10px;">
                        <span style="width: 80px; font-weight: bold;">COLOUR :</span>
                        <span>${selectedProduct.color || 'NAVY'}</span>
                    </div>

                    <!-- Price Section -->
                    <div style="border-top: 1px dashed #000; padding-top: 5px; margin-bottom: 5px;">
                        <div style="display: flex; align-items: baseline;">
                            <span style="width: 80px; font-weight: bold; font-size: 14px;">MRP :</span>
                            <span style="font-weight: bold; font-size: 18px;">${selectedProduct.salePrice}</span>
                        </div>
                        <div style="font-size: 10px; text-align: center; margin-top: 2px;">(INCL. OF ALL TAXES)</div>
                    </div>

                    <!-- MFG Info -->
                    <div style="font-size: 9px; line-height: 1.2; margin-top: 10px;">
                        <div style="font-weight: bold;">MFG:</div>
                        <div style="font-weight: bold;">MFG. & MARKETED BY</div>
                        <div>${mfgLine1}</div>
                        <div>${mfgLine2}</div>
                        <div>${mfgLine3}</div>
                        <div style="margin-top: 3px;">CUSTOMER CARE: +91 XXXXXXXXXX</div>
                        <div>EMAIL: ${email}</div>
                    </div>
                </div>

                <!-- Bottom Stripe -->
                <div style="height: 5px; border-top: 2px solid #555; border-bottom: 2px solid #333; margin-top: 10px;"></div>
            </div>
        `;

        const content = `
            <html>
                <head>
                    <title>Barcode Labels</title>
                    <style>
                        @media print {
                            body { margin: 0; padding: 0; }
                            .no-print { display: none; }
                        }
                        body { 
                            display: flex; 
                            flex-wrap: wrap; 
                            justify-content: center; 
                            padding: 20px;
                            background: #f0f0f0;
                        }
                    </style>
                </head>
                <body>
                    ${Array.from({ length: quantity }).map(() => labelHtml).join('')}
                    <script>
                        window.onload = () => {
                            window.print();
                            // window.close(); 
                        };
                    </script>
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
                <Grid item xs={12} md={5}>
                    <Card sx={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Stack spacing={3}>
                                <Typography variant="h6" color="primary">Label Configuration</Typography>
                                
                                <Autocomplete
                                    options={products}
                                    getOptionLabel={(option) => `${option.name} (${option.sku})`}
                                    value={selectedProduct}
                                    onChange={(e, val) => setSelectedProduct(val)}
                                    renderInput={(params) => <TextField {...params} label="Search Product" fullWidth />}
                                />

                                <TextField
                                    fullWidth
                                    label="Type"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    size="small"
                                />

                                <TextField
                                    fullWidth
                                    label="Design"
                                    value={design}
                                    onChange={(e) => setDesign(e.target.value)}
                                    size="small"
                                />

                                <TextField
                                    fullWidth
                                    label="Quantity Note"
                                    value={qtyInfo}
                                    onChange={(e) => setQtyInfo(e.target.value)}
                                    size="small"
                                    placeholder="e.g. 1N CASUAL"
                                />

                                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '12px' }}>
                                    <Typography variant="caption" sx={{ color: '#64748b' }}>Manufacturer Details:</Typography>
                                    <TextField fullWidth value={mfgLine1} onChange={e => setMfgLine1(e.target.value)} size="small" sx={{ mb: 1, mt: 1 }} />
                                    <TextField fullWidth value={mfgLine2} onChange={e => setMfgLine2(e.target.value)} size="small" sx={{ mb: 1 }} />
                                    <TextField fullWidth value={mfgLine3} onChange={e => setMfgLine3(e.target.value)} size="small" sx={{ mb: 1 }} />
                                    <TextField fullWidth value={email} onChange={e => setEmail(e.target.value)} size="small" label="Email" />
                                </Box>

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
                                    Generate & Print
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={7}>
                    <Box sx={{ p: 4, bgcolor: '#f1f5f9', borderRadius: '24px', textAlign: 'center', minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ color: '#334155', mb: 3 }}>Live Preview</Typography>
                        
                        {selectedProduct ? (
                            <Paper elevation={4} sx={{ 
                                width: '280px', 
                                p: 2, 
                                textAlign: 'left', 
                                border: '1px solid #ddd',
                                textTransform: 'uppercase',
                                fontFamily: 'monospace'
                            }}>
                                <Box sx={{ textAlign: 'center', mb: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', letterSpacing: 2 }}>|||||||||||||||</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{selectedProduct.barcode}</Typography>
                                </Box>
                                <Typography variant="body2"><strong>ARTICLE :</strong> {selectedProduct.sku}</Typography>
                                <Typography variant="body2"><strong>GROUP :</strong> {selectedProduct.category || 'CLOTHING'}</Typography>
                                <Typography variant="body2"><strong>TYPE :</strong> {type}</Typography>
                                <Typography variant="body2"><strong>DESIGN :</strong> {design}</Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}><strong>SIZE :</strong> {selectedProduct.size}</Typography>
                                <Typography variant="body2"><strong>QTY: 1N</strong> {qtyInfo}</Typography>
                                <Typography variant="body2"><strong>COLOUR :</strong> {selectedProduct.color}</Typography>
                                <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                                <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                                    <Typography variant="h6"><strong>MRP :</strong></Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 'bold', ml: 1 }}>{selectedProduct.salePrice}</Typography>
                                </Box>
                                <Typography variant="caption" display="block" align="center">(Incl. of all taxes)</Typography>
                            </Paper>
                        ) : (
                            <Stack alignItems="center" spacing={2}>
                                <ScannerIcon sx={{ fontSize: 60, color: '#cbd5e1' }} />
                                <Typography variant="body2" sx={{ color: '#64748b' }}>Select a product to see the preview</Typography>
                            </Stack>
                        )}
                        
                        <Typography variant="caption" sx={{ mt: 4, color: '#94a3b8' }}>
                            The printed label will include actual barcode bars and manufacturer branding.
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default BarcodePrintingPage;
