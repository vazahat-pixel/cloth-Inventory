import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGrns } from '../grn/grnSlice';
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
      height: 35,
      displayValue: false,
      margin: 0,
      background: '#ffffff',
      lineColor: '#000000',
    });
    return canvas.toDataURL('image/png', 1.0);
  } catch (e) {
    return '';
  }
}

function BarcodePrintingPage() {
  const [searchParams] = useSearchParams();
  const rawGrnId = searchParams.get('grnId');
  
  const dispatch = useDispatch();
  const grns = useSelector((state) => state.grn?.records) || [];

  const [activeTab, setActiveTab] = useState(0);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedGrn, setSelectedGrn] = useState(null);
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
    dispatch(fetchGrns());
  }, [dispatch]);

  const fetchGrnLabels = async (idOfGrn) => {
    setImporting(true);
    try {
      const res = await api.get(`/barcodes/grn/${idOfGrn}`);
      const extractedLabels = res.data?.data?.labels || res.data?.labels || [];
      setImportResults(extractedLabels);
      if (extractedLabels.length === 0) alert('No valid received items found in this GRN to print.');
    } catch (err) {
      alert('Failed to load stickers from GRN: ' + (err.response?.data?.message || err.message));
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    if (rawGrnId) {
      setActiveTab(1); // Bulk Tab
      fetchGrnLabels(rawGrnId);
      const preloadedGrn = grns.find(g => (g._id || g.id) === rawGrnId);
      if (preloadedGrn) setSelectedGrn(preloadedGrn);
    }
  }, [rawGrnId, grns.length]);

  const handleGrnSelect = (_, grnObj) => {
    setSelectedGrn(grnObj);
    if (grnObj) fetchGrnLabels(grnObj._id || grnObj.id);
    else setImportResults([]);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await api.get('/items');
        const apiProducts = res.data?.items || res.data?.data || res.data || [];

        if (apiProducts.length) {
          const flattened = [];
          apiProducts.forEach(p => {
            const variants = p.sizes || p.variants || [{}];
            const categoryObj = (p.groupIds || []).find(g => g.groupType === 'Category');
            variants.forEach(v => {
              flattened.push({
                id: v._id || p._id,
                name: p.itemName || p.name,
                sku: v.sku || v.barcode || p.itemCode || p.sku,
                barcode: v.barcode || v.sku || p.barcode || p.itemCode,
                salePrice: v.salePrice || p.salePrice || 0,
                size: v.size || 'N/A',
                color: p.shade || p.color || 'N/A',
                category: categoryObj?.name || categoryObj?.groupName || 'GARMENT'
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
    const styles = `
      <style>
        @page { size: 50mm 100mm; margin: 0; }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background: #fff; color: #000; letter-spacing: 0.1mm; }
        .label { 
          width: 50mm; height: 100mm; box-sizing: border-box;
          padding: 4mm 5mm; overflow: hidden; page-break-after: always;
          display: flex; flex-direction: column; justify-content: flex-start;
          border: 1px solid #eee; /* Light boundary for preview visibility */
        }
        .header { text-align: center; border-bottom: 0.5mm solid #000; padding-bottom: 2mm; margin-bottom: 3mm; }
        .brand { font-size: 16pt; font-weight: 800; letter-spacing: 1.5mm; text-transform: uppercase; margin: 0; }
        .sub-brand { font-size: 6.5pt; letter-spacing: 0.5mm; font-weight: 600; opacity: 0.8; }

        .barcode-container { width: 100%; text-align: center; margin-bottom: 4mm; padding: 1mm 0; }
        .barcode-img { width: 100%; height: 14mm; display: block; margin: 0 auto; object-fit: contain; }
        .barcode-text { font-size: 9pt; font-weight: 700; letter-spacing: 1.5mm; margin-top: 1mm; text-align: center; }
        
        .spec-container { display: flex; flex-direction: column; gap: 0.8mm; margin-bottom: 4mm; }
        .info-row { display: flex; font-size: 8.5pt; line-height: 1.2; align-items: baseline; }
        .info-col-key { width: 18mm; font-weight: 700; color: #444; }
        .info-col-val { flex: 1; text-transform: uppercase; font-weight: 800; color: #000; }
        
        .price-section { 
          border: 1px solid #000; padding: 2mm; margin-top: auto; margin-bottom: 4mm;
          text-align: center; border-radius: 1mm;
        }
        .mrp-label { font-size: 10pt; font-weight: 800; margin-bottom: 1mm; }
        .mrp-value { font-size: 14pt; font-weight: 900; }
        .tax-text { font-size: 7.5pt; font-weight: 500; font-style: italic; }

        .footer { font-size: 7pt; line-height: 1.3; font-weight: 500; }
        .origin { font-size: 8pt; font-weight: 800; text-align: center; border-top: 0.3mm solid #aaa; padding-top: 1.5mm; margin-top: 2mm; text-transform: uppercase; }
        .care-icons { text-align: center; font-size: 10pt; margin-top: 1mm; letter-spacing: 2mm; opacity: 0.8; }
      </style>
    `;

    const labelsHtml = labels.map(label => `
      <div class="label">
        <div class="header">
          <div class="brand">DAPOLO</div>
          <div class="sub-brand">PREMIUM APPARELS</div>
        </div>

        <div class="barcode-container">
          <img src="${generateBarcodeDataUrl(label.barcode)}" class="barcode-img" />
          <div class="barcode-text">${label.barcode}</div>
        </div>
        
        <div class="spec-container">
          <div class="info-row">
            <span class="info-col-key">STYLE :</span> <span class="info-col-val">${label.article}</span>
          </div>
          <div class="info-row">
            <span class="info-col-key">CATGY :</span> <span class="info-col-val">${label.category || 'SHIRT'}</span>
          </div>
          <div class="info-row">
            <span class="info-col-key">GENRE :</span> <span class="info-col-val">${type}</span>
          </div>
          <div class="info-row">
            <span class="info-col-key">SIZE :</span> <span class="info-col-val" style="font-size: 11pt">${label.size}</span>
          </div>
          <div class="info-row">
            <span class="info-col-key">COLOR :</span> <span class="info-col-val">${label.color}</span>
          </div>
          <div class="info-row">
             <span class="info-col-key">MONTH :</span> <span class="info-col-val">${new Date().toLocaleString('en-GB', { month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
        
        <div class="price-section">
          <div class="mrp-label">M.R.P.</div>
          <div class="mrp-value">₹ ${Number(label.mrp).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div class="tax-text">(Incl. of all taxes)</div>
        </div>

        <div class="footer">
          <div><b>MFG BY:</b> REBEL MASS EXPORT PVT LTD</div>
          <div>${mfgLine1}, ${mfgLine2}</div>
          <div>CC: info.dapolo@gmail.com</div>
        </div>

        <div class="origin">MADE IN INDIA</div>
        <div class="care-icons">🧺 🚫🧴 🧼 👔</div>
      </div>
    `).join('');

    printWindow.document.write(`<html><head>${styles}</head><body onload="window.print(); setTimeout(() => window.close(), 500);">${labelsHtml}</body></html>`);
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
          {activeTab === 0 && (
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 5 }}>
                <Stack spacing={3}>
                  <Box sx={{ p: 2, border: '1px dashed #cbd5e1', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, color: '#475569' }}>Vertical Apparels Tag Config</Typography>
                    <Stack spacing={2}>
                      <TextField size="small" label="Type (e.g., FORMAL SOLID)" value={type} onChange={(e) => setType(e.target.value)} />
                      <TextField size="small" label="DESIGN (e.g., COLLAR)" value={design} onChange={(e) => setDesign(e.target.value)} />
                      <TextField size="small" label="Mfg Line 1" value={mfgLine1} onChange={(e) => setMfgLine1(e.target.value)} />
                      <TextField size="small" label="Mfg Line 2" value={mfgLine2} onChange={(e) => setMfgLine2(e.target.value)} />
                    </Stack>
                  </Box>
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
                      <img src={barcodeImgData} style={{ width: '200px' }} alt="barcode" />
                      <Typography variant="h6">{selectedProduct.name}</Typography>
                      <Typography>MRP: {selectedProduct.salePrice}</Typography>
                    </CardContent>
                  </Card>
                )}
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Autocomplete
                   options={grns}
                   getOptionLabel={(o) => `${o.grnNumber} - ${o.supplierId?.name || o.supplierId?.supplierName || 'Unknown Supplier'}`}
                   value={selectedGrn}
                   onChange={handleGrnSelect}
                   sx={{ width: 400 }}
                   renderInput={(params) => <TextField {...params} label="Select a Completed GRN / PV" size="small" />}
                />
                <Typography variant="body2" sx={{color: '#64748b'}}>OR</Typography>
                <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
                  Upload Excel Manual
                  <input type="file" hidden onChange={handleExcelUpload} />
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                <Button variant="contained" color="success" disabled={!importResults.length} onClick={() => printBatch(importResults)}>
                  Print Automation ({importResults.length})
                </Button>
              </Box>

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
