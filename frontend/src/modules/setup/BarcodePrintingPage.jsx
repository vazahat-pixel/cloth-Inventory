import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  PrintOutlined as PrintIcon,
  QrCodeScannerOutlined as ScannerIcon,
} from '@mui/icons-material';
import JsBarcode from 'jsbarcode';
import api from '../../services/api';
import itemsData from '../items/data';

const fallbackProducts = itemsData.flatMap((item) =>
  (item.variants || []).map((variant) => ({
    id: variant.id,
    name: item.name,
    sku: variant.sku,
    barcode: variant.sku,
    salePrice: variant.sellingPrice || variant.mrp || 0,
    size: variant.size,
    color: variant.color,
    category: item.category || 'CLOTHING',
  })),
);

function generateBarcodeDataUrl(text) {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, text, {
    format: 'CODE128',
    width: 2,
    height: 50,
    displayValue: false,
    margin: 0,
  });
  return canvas.toDataURL('image/png');
}

function BarcodePrintingPage() {
  const [products, setProducts] = useState(fallbackProducts);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [type, setType] = useState('REGULAR PLAIN');
  const [design, setDesign] = useState('BAN COLLAR');
  const [qtyInfo, setQtyInfo] = useState('1N CASUAL');
  const [mfgLine1, setMfgLine1] = useState('Rebel Mass Export Pvt. Ltd');
  const [mfgLine2, setMfgLine2] = useState('Plot No 418, Sector-53, Phase 3');
  const [mfgLine3, setMfgLine3] = useState('Kundli, Sonipat (Haryana)');
  const [email, setEmail] = useState('info.dapolo@gmail.com');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await api.get('/products');
        const data = res.data;
        const apiProducts = data.products || data.data?.products || [];

        if (apiProducts.length) {
          setProducts(
            apiProducts.map((product) => ({
              id: product._id || product.id || product.sku,
              name: product.name || product.item_name || 'Unnamed Product',
              sku: product.sku || product.item_code || '',
              barcode: product.barcode || product.sku || product.item_code || '',
              salePrice: product.salePrice || product.sellingPrice || product.mrp || 0,
              size: product.size || '',
              color: product.color || '',
              category: product.category?.name || product.category || 'CLOTHING',
            })),
          );
        }
      } catch (error) {
        console.error('Failed to load products for barcode printing', error);
        setLoadError('Using fallback item data for barcode preview.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const barcodeValue = selectedProduct?.barcode || selectedProduct?.sku || '';
  const barcodeImgData = useMemo(
    () => (barcodeValue ? generateBarcodeDataUrl(barcodeValue) : ''),
    [barcodeValue],
  );

  const handlePrint = () => {
    if (!selectedProduct || !barcodeValue) {
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      return;
    }

    const labelHtml = `
      <div class="label-container" style="
        width: 280px;
        padding: 15px;
        border: 1px solid #000;
        font-family: Arial, sans-serif;
        text-transform: uppercase;
        margin-bottom: 20px;
        page-break-inside: avoid;
        background: #fff;
      ">
        <div style="text-align: center; margin-bottom: 5px;">
          <img src="${barcodeImgData}" style="width: 100%; max-height: 45px;" />
          <div style="font-weight: bold; font-size: 14px; letter-spacing: 2px;">${barcodeValue}</div>
        </div>

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
            <span style="font-weight: bold; font-size: 13px;">${selectedProduct.size || '--'}</span>
          </div>
          <div style="display: flex; margin-bottom: 3px;">
            <span style="width: 80px; font-weight: bold;">QTY: 1N</span>
            <span>${qtyInfo}</span>
          </div>
          <div style="display: flex; margin-bottom: 10px;">
            <span style="width: 80px; font-weight: bold;">COLOUR :</span>
            <span>${selectedProduct.color || 'NAVY'}</span>
          </div>

          <div style="border-top: 1px dashed #000; padding-top: 5px; margin-bottom: 5px;">
            <div style="display: flex; align-items: baseline;">
              <span style="width: 80px; font-weight: bold; font-size: 14px;">MRP :</span>
              <span style="font-weight: bold; font-size: 18px;">${selectedProduct.salePrice}</span>
            </div>
            <div style="font-size: 10px; text-align: center; margin-top: 2px;">(INCL. OF ALL TAXES)</div>
          </div>

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

        <div style="height: 5px; border-top: 2px solid #555; border-bottom: 2px solid #333; margin-top: 10px;"></div>
      </div>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Barcode Labels</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
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
          ${Array.from({ length: Number(quantity || 1) }).map(() => labelHtml).join('')}
          <script>
            window.onload = () => window.print();
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
        Barcode Label Printing
      </Typography>

      {loadError ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          {loadError}
        </Alert>
      ) : null}

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3}>
                <Typography variant="h6" color="primary">
                  Label Configuration
                </Typography>

                <Autocomplete
                  options={products}
                  loading={loading}
                  getOptionLabel={(option) => `${option.name} (${option.sku})`}
                  value={selectedProduct}
                  onChange={(_, value) => setSelectedProduct(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search Product"
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loading ? <CircularProgress color="inherit" size={18} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />

                <TextField
                  fullWidth
                  label="Type"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  size="small"
                />

                <TextField
                  fullWidth
                  label="Design"
                  value={design}
                  onChange={(event) => setDesign(event.target.value)}
                  size="small"
                />

                <TextField
                  fullWidth
                  label="Quantity Note"
                  value={qtyInfo}
                  onChange={(event) => setQtyInfo(event.target.value)}
                  size="small"
                  placeholder="e.g. 1N CASUAL"
                />

                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '12px' }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Manufacturer Details:
                  </Typography>
                  <TextField fullWidth value={mfgLine1} onChange={(event) => setMfgLine1(event.target.value)} size="small" sx={{ mb: 1, mt: 1 }} />
                  <TextField fullWidth value={mfgLine2} onChange={(event) => setMfgLine2(event.target.value)} size="small" sx={{ mb: 1 }} />
                  <TextField fullWidth value={mfgLine3} onChange={(event) => setMfgLine3(event.target.value)} size="small" sx={{ mb: 1 }} />
                  <TextField fullWidth value={email} onChange={(event) => setEmail(event.target.value)} size="small" label="Email" />
                </Box>

                <TextField
                  fullWidth
                  type="number"
                  label="Number of Labels"
                  value={quantity}
                  onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
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
          <Box
            sx={{
              p: 4,
              bgcolor: '#f1f5f9',
              borderRadius: '24px',
              textAlign: 'center',
              minHeight: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6" sx={{ color: '#334155', mb: 3 }}>
              Live Preview
            </Typography>

            {selectedProduct ? (
              <Paper
                elevation={4}
                sx={{
                  width: '280px',
                  p: 2,
                  textAlign: 'left',
                  border: '1px solid #ddd',
                  textTransform: 'uppercase',
                  fontFamily: 'monospace',
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 1 }}>
                  <Box component="img" src={barcodeImgData} alt="Barcode Preview" sx={{ width: '100%', maxHeight: 45, objectFit: 'contain', mb: 0.5 }} />
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {barcodeValue}
                  </Typography>
                </Box>
                <Typography variant="body2"><strong>ARTICLE :</strong> {selectedProduct.sku}</Typography>
                <Typography variant="body2"><strong>GROUP :</strong> {selectedProduct.category || 'CLOTHING'}</Typography>
                <Typography variant="body2"><strong>TYPE :</strong> {type}</Typography>
                <Typography variant="body2"><strong>DESIGN :</strong> {design}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}><strong>SIZE :</strong> {selectedProduct.size || '--'}</Typography>
                <Typography variant="body2"><strong>QTY: 1N</strong> {qtyInfo}</Typography>
                <Typography variant="body2"><strong>COLOUR :</strong> {selectedProduct.color || '--'}</Typography>
                <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                  <Typography variant="h6"><strong>MRP :</strong></Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', ml: 1 }}>
                    {selectedProduct.salePrice}
                  </Typography>
                </Box>
                <Typography variant="caption" display="block" align="center">
                  (Incl. of all taxes)
                </Typography>
              </Paper>
            ) : (
              <Stack alignItems="center" spacing={2}>
                <ScannerIcon sx={{ fontSize: 60, color: '#cbd5e1' }} />
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Select a product to see the preview
                </Typography>
              </Stack>
            )}

            <Typography variant="caption" sx={{ mt: 4, color: '#94a3b8' }}>
              The printed label will use the older label style with actual barcode bars.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default BarcodePrintingPage;
