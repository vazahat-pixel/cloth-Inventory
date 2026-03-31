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
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  PrintOutlined as PrintIcon,
  QrCodeScannerOutlined as ScannerIcon,
  FileUploadOutlined as UploadIcon,
  DescriptionOutlined as ExcelIcon,
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
    width: 1.5,
    height: 40,
    displayValue: false,
    margin: 0,
  });
  return canvas.toDataURL('image/png');
}

function BarcodePrintingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [products, setProducts] = useState(fallbackProducts);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [importResults, setImportResults] = useState([]);

  const [type, setType] = useState('REGULAR');
  const [design, setDesign] = useState('');
  const [qtyInfo, setQtyInfo] = useState('1N');
  const [mfgLine1, setMfgLine1] = useState('');
  const [mfgLine2, setMfgLine2] = useState('');
  const [mfgLine3, setMfgLine3] = useState('');
  const [email, setEmail] = useState('');

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

  const handleExcelUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResults([]);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/barcodes/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResults(res.data?.data?.labels || []);
    } catch (error) {
      alert('Import failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setImporting(false);
    }
  };

  const printBatch = (labels) => {
    if (!labels || !labels.length) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const labelsHtml = labels.map(label => `
      <div class="tag" style="
        width: 2.25in;
        background: #fff;
        border: 1px solid #000;
        padding: 5px 8px;
        page-break-inside: avoid;
        font-family: 'Inter', Arial, sans-serif;
        margin-bottom: 2mm;
        text-transform: uppercase;
        box-sizing: border-box;
      ">
        <div style="text-align: center; margin-bottom: 5px;">
          <img src="${generateBarcodeDataUrl(label.barcode)}" style="width: 100%; max-height: 40px; display: block; margin: 0 auto;" />
          <div style="font-weight: 700; font-size: 8pt; letter-spacing: 1px;">${label.barcode}</div>
        </div>

        <div style="font-size: 8pt; line-height: 1.3;">
          <div><span style="font-weight: 700; display: inline-block; width: 60px;">ARTICLE :</span> ${label.article}</div>
          <div><span style="font-weight: 700; display: inline-block; width: 60px;">DESIGN :</span> ${label.design || ''}</div>
          <div><span style="font-weight: 700; display: inline-block; width: 60px;">SIZE :</span> <span style="font-weight: 800; font-size: 9pt;">${label.size}</span></div>
          <div><span style="font-weight: 700; display: inline-block; width: 60px;">COLOUR :</span> ${label.color}</div>
          
          <div style="text-align: center; margin: 5px 0;">
             <span style="font-weight: 700;">MRP : </span>
             <span style="font-weight: 800; font-size: 14pt;">${label.mrp}</span>
             <div style="font-size: 6pt;">(INCL. OF ALL TAXES)</div>
          </div>

          <div style="border-top: 1px solid #eee; font-size: 6.5pt; color: #444; padding-top: 3px;">
            <div style="font-weight: 800;">MFG. & MARKETED BY</div>
            <div style="font-weight: 800;">REBEL MASS EXPORT PVT. LTD</div>
            <div>${mfgLine1 || 'Plot No 418, Sector-53, Phase 3'}</div>
            <div>${mfgLine2 || 'Kundli, Sonipat (Haryana)'}</div>
          </div>
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Bulk Barcode Print</title>
          <style>
            @page { margin: 0; }
            body { 
              margin: 0; 
              display: flex; 
              flex-wrap: wrap; 
              justify-content: center;
              padding: 10px;
              background: #fdfdfd;
            }
          </style>
        </head>
        <body>
          ${labelsHtml}
          <script>
            window.onload = () => {
              setTimeout(() => { window.print(); window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrint = () => {
    if (!selectedProduct) return;
    const labels = Array.from({ length: quantity }).map(() => ({
      barcode: barcodeValue,
      article: selectedProduct.sku,
      size: selectedProduct.size,
      color: selectedProduct.color,
      mrp: selectedProduct.salePrice,
      design: design || selectedProduct.name
    }));
    printBatch(labels);
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>
        Barcode Printing System
      </Typography>
      <Typography variant="body1" sx={{ color: '#64748b', mb: 4 }}>
        HO Labelling Center: Individual generation or high-volume Excel automation.
      </Typography>

      <Paper sx={{ mb: 4, borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, v) => setActiveTab(v)}
          sx={{ borderBottom: '1px solid #e2e8f0', bgcolor: '#fff' }}
        >
          <Tab icon={<PrintIcon />} iconPosition="start" label="Single Product Print" sx={{ fontWeight: 700, px: 4 }} />
          <Tab icon={<ExcelIcon />} iconPosition="start" label="Bulk Print (Excel)" sx={{ fontWeight: 700, px: 4 }} />
        </Tabs>

        <Box sx={{ p: 4 }}>
          {activeTab === 0 ? (
            <Grid container spacing={4}>
              <Grid item xs={12} md={5}>
                <Stack spacing={3}>
                  <Autocomplete
                    options={products}
                    loading={loading}
                    getOptionLabel={(option) => `${option.name} (${option.sku})`}
                    value={selectedProduct}
                    onChange={(_, value) => setSelectedProduct(value)}
                    renderInput={(params) => (
                      <TextField {...params} label="Search Product" fullWidth variant="outlined" />
                    )}
                  />

                  <Grid container spacing={2}>
                    <Grid item xs={6}><TextField fullWidth label="Type" value={type} onChange={(e) => setType(e.target.value)} size="small" /></Grid>
                    <Grid item xs={6}><TextField fullWidth label="Design" value={design} onChange={(e) => setDesign(e.target.value)} size="small" /></Grid>
                    <Grid item xs={12}><TextField fullWidth label="Qty Note" value={qtyInfo} onChange={(e) => setQtyInfo(e.target.value)} size="small" /></Grid>
                  </Grid>

                  <TextField
                    fullWidth
                    type="number"
                    label="Quantity to Print"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  />

                  <Button
                    variant="contained"
                    size="large"
                    disabled={!selectedProduct}
                    onClick={handlePrint}
                    startIcon={<PrintIcon />}
                    sx={{ py: 2, borderRadius: '12px', fontWeight: 700 }}
                  >
                    Generate & Print
                  </Button>
                </Stack>
              </Grid>

              <Grid item xs={12} md={7}>
                <Box sx={{ p: 4, bgcolor: '#f1f5f9', borderRadius: '16px', border: '2px dashed #cbd5e1', textAlign: 'center' }}>
                    <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 3 }}>Live Sticker Preview</Typography>
                    {selectedProduct ? (
                      <Paper elevation={4} sx={{ width: '220px', mx: 'auto', p: 2, textAlign: 'left', bgcolor: '#fff', border: '1px solid #000' }}>
                        <Box sx={{ textAlign: 'center', mb: 1 }}>
                          <img src={barcodeImgData} style={{ width: '100%', maxHeight: '40px' }} />
                          <Typography variant="caption" sx={{ fontWeight: 800 }}>{barcodeValue}</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '7pt', fontWeight: 700 }}>ARTICLE: {selectedProduct.sku}</Typography>
                        <Typography sx={{ fontSize: '7pt', fontWeight: 700 }}>SIZE: {selectedProduct.size}</Typography>
                        <Typography sx={{ fontSize: '7pt', fontWeight: 700 }}>COLOUR: {selectedProduct.color}</Typography>
                        <Typography sx={{ fontSize: '12pt', fontWeight: 800, textAlign: 'center', mt: 1 }}>MRP: {selectedProduct.salePrice}</Typography>
                      </Paper>
                    ) : (
                      <Stack spacing={1} sx={{ opacity: 0.5 }}>
                        <ScannerIcon sx={{ fontSize: 60, mx: 'auto' }} />
                        <Typography variant="body2">Select product to preview</Typography>
                      </Stack>
                    )}
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Box>
              <Stack spacing={3} alignItems="center">
                <Box sx={{ p: 6, border: '2px dashed #3b82f6', borderRadius: '24px', bgcolor: '#eff6ff', textAlign: 'center', width: '100%', maxWidth: 600 }}>
                  <ExcelIcon sx={{ fontSize: 64, color: '#3b82f6', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Upload Print Schedule</Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                    Upload an Excel file with columns: <b>Item Code</b>, <b>Size</b>, <b>Color</b>, <b>Qty</b>.
                    The system will automatically continue the barcode numbering sequence.
                  </Typography>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={importing ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
                    disabled={importing}
                    sx={{ borderRadius: '12px', px: 4, py: 1.5 }}
                  >
                    {importing ? 'Processing Sequence...' : 'Select Excel File'}
                    <input type="file" hidden accept=".xlsx,.xls" onChange={handleExcelUpload} />
                  </Button>
                </Box>

                {importResults.length > 0 && (
                  <Card sx={{ width: '100%', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          Generated Labels ({importResults.length})
                        </Typography>
                        <Button 
                          variant="contained" 
                          color="success" 
                          startIcon={<PrintIcon />}
                          onClick={() => printBatch(importResults)}
                        >
                          Print All Labels
                        </Button>
                      </Stack>
                      <TableContainer sx={{ maxHeight: 400 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>Barcode</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Article</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Color</TableCell>
                              <TableCell sx={{ fontWeight: 700 }} align="right">MRP</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {importResults.map((row, i) => (
                              <TableRow key={i}>
                                <TableCell sx={{ fontFamily: 'monospace' }}>{row.barcode}</TableCell>
                                <TableCell>{row.article}</TableCell>
                                <TableCell>{row.size}</TableCell>
                                <TableCell>{row.color}</TableCell>
                                <TableCell align="right">{row.mrp}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                )}
              </Stack>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default BarcodePrintingPage;
