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
import { useSearchParams } from 'react-router-dom';
import JsBarcode from 'jsbarcode';
import api from '../../services/api';

const fallbackProducts = [];

function generateBarcodeDataUrl(text) {
  if (!text) return '';
  const canvas = document.createElement('canvas');
  try {
    JsBarcode(canvas, text, {
        format: 'CODE128',
        width: 1.5,
        height: 40,
        displayValue: false,
        margin: 0,
    });
    return canvas.toDataURL('image/png');
  } catch (e) {
    return '';
  }
}

function BarcodePrintingPage() {
  const [searchParams] = useSearchParams();
  const grnId = searchParams.get('grnId');

  const [activeTab, setActiveTab] = useState(0);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [importResults, setImportResults] = useState([]);

  const [type, setType] = useState('REGULAR');
  const [design, setDesign] = useState('');
  const [qtyInfo, setQtyInfo] = useState('1N');
  const [mfgLine1, setMfgLine1] = useState('Plot No 418, Sector-53, Phase 3');
  const [mfgLine2, setMfgLine2] = useState('Kundli, Sonipat (Haryana)');
  const [mfgLine3, setMfgLine3] = useState('');
  
  useEffect(() => {
    if (grnId) {
      setActiveTab(1); // Bulk Tab
      const fetchGrnLabels = async () => {
        setImporting(true);
        try {
          const res = await api.get(`/barcodes/grn/${grnId}`);
          setImportResults(res.data?.data?.labels || res.data?.labels || []);
        } catch (err) {
          alert('Failed to load stickers from GRN: ' + err.message);
        } finally {
          setImporting(false);
        }
      };
      fetchGrnLabels();
    }
  }, [grnId]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await api.get('/items'); // Correct product route
        const apiProducts = res.data?.items || res.data?.products || [];
        
        if (apiProducts.length) {
            const flattened = [];
            apiProducts.forEach(p => {
                const variants = p.sizes || p.variants || [{}];
                variants.forEach(v => {
                    flattened.push({
                        id: v._id || p._id,
                        name: p.itemName || p.name,
                        sku: v.barcode || p.itemCode || p.sku,
                        barcode: v.barcode || p.barcode || p.itemCode,
                        salePrice: v.salePrice || p.salePrice || 0,
                        size: v.size || 'N/A',
                        color: p.shade || p.color || 'N/A',
                        category: p.categoryId?.name || 'GARMENT'
                    });
                });
            });
            setProducts(flattened);
        }
      } catch (error) {
        console.error('Fetch failed', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const barcodeValue = selectedProduct?.barcode || selectedProduct?.sku || '';
  const barcodeImgData = useMemo(() => generateBarcodeDataUrl(barcodeValue), [barcodeValue]);

  const handleExcelUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/barcodes/import-excel', formData);
      setImportResults(res.data?.data?.labels || []);
    } catch (error) {
      alert('Import failed');
    } finally {
      setImporting(false);
    }
  };

  const printBatch = (labels) => {
    if (!labels.length) return;
    const printWindow = window.open('', '_blank');
    const labelsHtml = labels.map(label => `
      <div style="width: 2.25in; border: 1px solid #000; padding: 5px; margin-bottom: 2mm; font-family: sans-serif; text-transform: uppercase;">
        <div style="text-align: center;">
          <img src="${generateBarcodeDataUrl(label.barcode)}" style="width: 100%; height: 40px;" />
          <div style="font-weight: bold; font-size: 8pt;">${label.barcode}</div>
        </div>
        <div style="font-size: 7pt; margin-top: 5px;">
           <div><b>ARTICLE :</b> ${label.article}</div>
           <div><b>SIZE :</b> ${label.size}</div>
           <div><b>MRP :</b> ${label.mrp}</div>
        </div>
      </div>
    `).join('');

    printWindow.document.write(`<html><body onload="window.print(); window.close()">${labelsHtml}</body></html>`);
    printWindow.document.close();
  };

  const handlePrint = () => {
    if (!selectedProduct) return;
    const labels = Array.from({ length: quantity }).map(() => ({
      barcode: barcodeValue,
      article: selectedProduct.sku,
      size: selectedProduct.size,
      mrp: selectedProduct.salePrice,
      color: selectedProduct.color
    }));
    printBatch(labels);
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Barcode Printing</Typography>
      <Typography variant="body1" sx={{ color: '#64748b', mb: 4 }}>Approved Labelling System</Typography>

      <Paper sx={{ borderRadius: '16px', overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab icon={<PrintIcon />} label="Single Print" />
          <Tab icon={<ExcelIcon />} label="Bulk / GRN Labels" />
        </Tabs>

        <Box sx={{ p: 4 }}>
          {activeTab === 0 ? (
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 5 }}>
                <Stack spacing={3}>
                  <Autocomplete
                    options={products}
                    getOptionLabel={(o) => `${o.sku} - ${o.name} (${o.size})`}
                    onChange={(_, v) => setSelectedProduct(v)}
                    renderInput={(params) => <TextField {...params} label="Search Product" />}
                  />
                  <TextField type="number" label="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                  <Button variant="contained" disabled={!selectedProduct} onClick={handlePrint} startIcon={<PrintIcon />}>Print Label</Button>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                 {selectedProduct && (
                   <Card variant="outlined">
                     <CardContent sx={{ textAlign: 'center' }}>
                       <img src={barcodeImgData} style={{ width: '200px' }} />
                       <Typography variant="h6">{selectedProduct.name}</Typography>
                       <Typography>MRP: {selectedProduct.salePrice}</Typography>
                     </CardContent>
                   </Card>
                 )}
              </Grid>
            </Grid>
          ) : (
            <Stack spacing={3}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
                  Upload Excel Manual
                  <input type="file" hidden onChange={handleExcelUpload} />
                </Button>
                {grnId && <Alert severity="info">Auto-loaded labels from GRN: {grnId}</Alert>}
                <Button variant="contained" color="success" disabled={!importResults.length} onClick={() => printBatch(importResults)}>
                  Print All Queued Labels ({importResults.length})
                </Button>
              </Stack>
              
              <TableContainer component={Paper} variant="outlined">
                 <Table size="small">
                   <TableHead>
                     <TableRow>
                       <TableCell>Barcode</TableCell>
                       <TableCell>Article</TableCell>
                       <TableCell>Size</TableCell>
                       <TableCell>Price</TableCell>
                     </TableRow>
                   </TableHead>
                   <TableBody>
                     {importResults.map((r, i) => (
                       <TableRow key={i}>
                         <TableCell>{r.barcode}</TableCell>
                         <TableCell>{r.article}</TableCell>
                         <TableCell>{r.size}</TableCell>
                         <TableCell>{r.mrp}</TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
              </TableContainer>
            </Stack>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default BarcodePrintingPage;
