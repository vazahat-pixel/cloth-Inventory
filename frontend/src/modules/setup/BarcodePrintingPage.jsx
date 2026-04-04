import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { 
  Box, 
  Stack, 
  Typography, 
  Button, 
  TextField, 
  Autocomplete, 
  Tabs, 
  Tab, 
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
} from '@mui/material';
import {
  PrintOutlined as PrintIcon,
  FileUploadOutlined as UploadIcon,
  DescriptionOutlined as ExcelIcon,
} from '@mui/icons-material';
import { fetchGrns } from '../grn/grnSlice';
import api from '../../services/api';
import JsBarcode from 'jsbarcode';

function generateBarcodeDataUrl(text) {
  if (!text) return '';
  const canvas = document.createElement('canvas');
  try {
    JsBarcode(canvas, text, {
      format: 'CODE128',
      width: 1.8,
      height: 40,
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

const VerticalTag = ({ label, mfgLine1, mfgLine2, type, month, design }) => {
  const barcodeImg = useMemo(() => generateBarcodeDataUrl(label.barcode), [label.barcode]);

  return (
    <Box sx={{ 
      width: '50mm', 
      height: '100mm', 
      bgcolor: 'white', 
      color: 'black', 
      display: 'flex', 
      flexDirection: 'column', 
      border: '1px solid #e2e8f0', 
      p: '4mm',
      pt: '2mm',
      boxSizing: 'border-box',
      fontFamily: "'Inter', sans-serif",
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Barcode Section */}
      <Box sx={{ textAlign: 'center', mb: 1 }}>
        <img src={barcodeImg} style={{ width: '100%', height: '14mm', objectFit: 'contain' }} alt="barcode" />
        <Typography sx={{ fontSize: '9pt', fontWeight: 600, mt: 0.2 }}>{label.barcode}</Typography>
      </Box>

      {/* Product Details Section */}
      <Stack spacing={0.3} sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', fontSize: '10pt' }}>
          <Typography sx={{ width: '16mm', fontWeight: 700, fontSize: 'inherit' }}>Article :</Typography>
          <Typography sx={{ flex: 1, fontWeight: 700, fontSize: 'inherit' }}>{label.article}</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', fontSize: '10pt' }}>
          <Typography sx={{ width: '16mm', fontWeight: 700, fontSize: 'inherit' }}>Group</Typography>
          <Typography sx={{ flex: 1, fontWeight: 700, fontSize: 'inherit' }}>{label.category || 'SHIRT'}</Typography>
        </Box>

        <Box sx={{ display: 'flex', fontSize: '9.5pt' }}>
          <Typography sx={{ width: '16mm', fontWeight: 600, fontSize: 'inherit' }}>Type:</Typography>
          <Typography sx={{ flex: 1, fontWeight: 600, fontSize: 'inherit' }}>{type}</Typography>
        </Box>

        <Box sx={{ display: 'flex', fontSize: '10pt' }}>
          <Typography sx={{ width: '16mm', fontWeight: 700, fontSize: 'inherit' }}>DESIGN :</Typography>
          <Typography sx={{ flex: 1, fontWeight: 700, fontSize: 'inherit' }}>{design || 'COLLAR'}</Typography>
        </Box>

        <Box sx={{ display: 'flex', fontSize: '10pt', mt: 0.5 }}>
          <Typography sx={{ width: '16mm', fontWeight: 600, fontSize: 'inherit' }}>Size :</Typography>
          <Typography sx={{ flex: 1, fontWeight: 700, fontSize: '11pt' }}>{label.size}</Typography>
        </Box>

        <Box sx={{ display: 'flex', fontSize: '9.5pt' }}>
          <Typography sx={{ width: '16mm', fontWeight: 600, fontSize: 'inherit' }}>Qty: 1N</Typography>
          <Typography sx={{ flex: 1, fontWeight: 600, fontSize: 'inherit' }}>F/S</Typography>
        </Box>

        <Box sx={{ display: 'flex', fontSize: '9.5pt' }}>
          <Typography sx={{ width: '16mm', fontWeight: 600, fontSize: 'inherit' }}>Colour :</Typography>
          <Typography sx={{ flex: 1, fontWeight: 600, fontSize: 'inherit' }}>{label.color}</Typography>
        </Box>

        <Box sx={{ display: 'flex', fontSize: '11pt', mt: 1, alignItems: 'center' }}>
          <Typography sx={{ width: '16mm', fontWeight: 700, fontSize: 'inherit' }}>MRP :</Typography>
          <Typography sx={{ flex: 1, fontWeight: 700, fontSize: '12pt' }}>{Number(label.mrp || 0).toFixed(0)}</Typography>
        </Box>
        <Typography sx={{ fontSize: '8pt', fontWeight: 600, textAlign: 'left', ml: '16mm' }}>(Incl of all taxes)</Typography>
      </Stack>

      {/* Manufacturing Section */}
      <Box sx={{ mt: 'auto', borderTop: '0.5mm solid #eee', pt: 1 }}>
        <Typography sx={{ fontSize: '7.5pt', fontWeight: 800 }}>MFG:</Typography>
        <Typography sx={{ fontSize: '7.5pt', fontWeight: 700 }}>Mfg. & Marketed By</Typography>
        <Typography sx={{ fontSize: '7.5pt', fontWeight: 600 }}>Rebel Mass Export Pvt. Ltd</Typography>
        <Typography sx={{ fontSize: '7pt', fontWeight: 500 }}>{mfgLine1}</Typography>
        <Typography sx={{ fontSize: '7pt', fontWeight: 500 }}>{mfgLine2}</Typography>
        
        <Box sx={{ mt: 0.5 }}>
          <Typography sx={{ fontSize: '7.5pt', fontWeight: 700 }}>Customer Care:</Typography>
          <Typography sx={{ fontSize: '7.5pt', fontWeight: 500 }}>Email: info.dapolo@gmail.com</Typography>
        </Box>
      </Box>
    </Box>
  );
};

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
  const [importResults, setImportResults] = useState([]);
  const [batchLines, setBatchLines] = useState([]);
  const allItems = useSelector((state) => state.items.records) || [];

  const [type, setType] = useState('REGULAR');
  const [design, setDesign] = useState('');
  const [mfgLine1, setMfgLine1] = useState('Plot No 418, Sector-53, Phase 3');
  const [mfgLine2, setMfgLine2] = useState('Kundli, Sonipat (Haryana)');
  
  const currentMonth = useMemo(() => new Date().toLocaleString('en-GB', { month: 'short', year: 'numeric' }).toUpperCase(), []);

  useEffect(() => {
    dispatch(fetchGrns());
    import('../items/itemsSlice').then(m => dispatch(m.fetchItems()));
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
                salePrice: v.mrp || v.salePrice || p.salePrice || 0,
                size: v.size || 'N/A',
                color: p.shade || p.color || 'N/A',
                category: categoryObj?.name || categoryObj?.groupName || 'GARMENT',
                article: p.itemCode || p.sku
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
        body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background: #fff; color: #000; }
        .label { 
          width: 50mm; height: 100mm; box-sizing: border-box;
          padding: 4mm; overflow: hidden; page-break-after: always;
          display: flex; flex-direction: column; justify-content: flex-start;
          border-bottom: 1px dashed #ccc;
        }
        .header { text-align: center; border-bottom: 1.5px solid #000; padding-bottom: 1.5mm; margin-bottom: 3mm; }
        .brand { font-size: 18pt; font-weight: 900; letter-spacing: 4mm; text-transform: uppercase; margin: 0; line-height: 1; }
        .sub-brand { font-size: 7pt; letter-spacing: 1mm; font-weight: 700; margin-top: 1mm; }

        .barcode-container { width: 100%; text-align: center; margin-bottom: 3mm; }
        .barcode-img { width: 100%; height: 14mm; display: block; margin: 0 auto; object-fit: contain; }
        .barcode-text { font-size: 9pt; font-weight: 700; letter-spacing: 3mm; margin-top: 1.5mm; text-align: center; }
        
        .spec-container { display: flex; flex-direction: column; gap: 1mm; margin-bottom: 1mm; }
        .info-row { display: flex; font-size: 8.5pt; line-height: 1.2; align-items: baseline; }
        .info-col-key { width: 18mm; font-weight: 700; color: #444; }
        .info-col-val { flex: 1; text-transform: uppercase; font-weight: 800; color: #000; }
        .size-val { font-size: 10pt; font-weight: 900; }
        
        .price-section { 
          border: 1.5px solid #000; padding: 1.5mm 0; margin: 2mm 0;
          text-align: center; border-radius: 1mm;
        }
        .mrp-label { font-size: 10pt; font-weight: 900; margin-bottom: 0.5mm; }
        .mrp-value { font-size: 15pt; font-weight: 1000; }
        .tax-text { font-size: 7pt; font-weight: 600; font-style: italic; }

        .footer { font-size: 6.5pt; font-weight: 600; line-height: 1.2; }
        .origin-section { border-top: 0.5mm solid #ccc; padding-top: 1mm; margin-top: 2mm; text-align: center; width: 100%; }
        .origin { font-size: 8pt; font-weight: 900; letter-spacing: 1mm; text-transform: uppercase; }
        .care-icons { font-size: 12pt; margin-top: 1mm; letter-spacing: 8mm; }
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
            <span class="info-col-key">STYLE :</span> <span class="info-col-val">${label.article || label.articleCode || ''}</span>
          </div>
          <div class="info-row">
            <span class="info-col-key">CATGY :</span> <span class="info-col-val">${label.category || 'SHIRT'}</span>
          </div>
          <div class="info-row">
            <span class="info-col-key">GENRE :</span> <span class="info-col-val">${type}</span>
          </div>
          <div class="info-row">
            <span class="info-col-key">SIZE :</span> <span class="info-col-val size-val">${label.size}</span>
          </div>
          <div class="info-row">
            <span class="info-col-key">COLOR :</span> <span class="info-col-val">${label.color || 'N/A'}</span>
          </div>
          <div class="info-row">
             <span class="info-col-key">MONTH :</span> <span class="info-col-val">${currentMonth}</span>
          </div>
        </div>
        
        <div class="price-section">
          <div class="mrp-label">M.R.P.</div>
          <div class="mrp-value">₹ ${Number(label.mrp || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div class="tax-text">(Incl. of all taxes)</div>
        </div>

        <div class="footer">
          <div><b>MFG BY:</b> REBEL MASS EXPORT PVT LTD</div>
          <div>${mfgLine1}</div>
          <div>${mfgLine2}</div>
          <div>CC: info.dapolo@gmail.com</div>
        </div>

        <div class="origin-section">
          <div class="origin">MADE IN INDIA</div>
          <div class="care-icons">🧺🚫🧴🧼👔</div>
        </div>
      </div>
    `).join('');

    printWindow.document.write(`<html><head><title>Print Barcodes</title>${styles}</head><body onload="window.print(); setTimeout(() => window.close(), 500);">${labelsHtml}</body></html>`);
    printWindow.document.close();
  };

  const currentLabelData = useMemo(() => {
    if (!selectedProduct) return null;
    return {
      barcode: selectedProduct.barcode || selectedProduct.sku,
      article: selectedProduct.article,
      size: selectedProduct.size,
      mrp: selectedProduct.salePrice,
      color: selectedProduct.color,
      category: selectedProduct.category
    };
  }, [selectedProduct]);

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Barcode Printing</Typography>
      <Typography variant="body1" sx={{ color: '#64748b', mb: 4 }}>Approved Labelling System</Typography>

      <Paper sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: '1px solid #e2e8f0', px: 2 }}>
          <Tab icon={<PrintIcon />} label="Single Print" sx={{ py: 2, fontWeight: 700 }} />
          <Tab icon={<ExcelIcon />} label="Bulk / GRN Labels" sx={{ py: 2, fontWeight: 700 }} />
        </Tabs>

        <Box sx={{ p: 4 }}>
          {activeTab === 0 && (
            <Grid container spacing={6}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={4}>
                  <Box sx={{ p: 3, border: '1px dashed #cbd5e1', borderRadius: 3, bgcolor: '#f1f5f9' }}>
                    <Typography variant="subtitle2" sx={{ mb: 2.5, color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Vertical Apparels Tag Config
                    </Typography>
                    <Stack spacing={2.5}>
                      <TextField fullWidth size="small" variant="outlined" label="Type (e.g., FORMAL SOLID)" value={type} onChange={(e) => setType(e.target.value)} bgcolor="white" />
                      <TextField fullWidth size="small" variant="outlined" label="Mfg Line 1" value={mfgLine1} onChange={(e) => setMfgLine1(e.target.value)} bgcolor="white" />
                      <TextField fullWidth size="small" variant="outlined" label="Mfg Line 2" value={mfgLine2} onChange={(e) => setMfgLine2(e.target.value)} bgcolor="white" />
                    </Stack>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Search Product</Typography>
                    <Autocomplete
                      options={products}
                      getOptionLabel={(o) => `${o.sku} - ${o.name} (${o.size})`}
                      onChange={(_, v) => setSelectedProduct(v)}
                      renderInput={(params) => <TextField {...params} placeholder="Type SKU or Name..." size="small" />}
                    />
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Print Quantity</Typography>
                    <TextField fullWidth type="number" size="small" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                  </Box>

                  <Button 
                    variant="contained" 
                    fullWidth 
                    size="large"
                    disabled={!selectedProduct} 
                    onClick={() => printBatch(Array.from({ length: quantity }).map(() => currentLabelData))} 
                    startIcon={<PrintIcon />}
                    sx={{ py: 1.5, fontWeight: 800, borderRadius: 2 }}
                  >
                    Print Label
                  </Button>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 800, textAlign: 'center', color: '#64748b' }}>LIVE TAG PREVIEW</Typography>
                  {currentLabelData ? (
                    <VerticalTag 
                      label={currentLabelData} 
                      mfgLine1={mfgLine1} 
                      mfgLine2={mfgLine2} 
                      type={type} 
                      month={currentMonth}
                      design={design} 
                    />
                  ) : (
                    <Box sx={{ width: '50mm', height: '100mm', border: '2px dashed #cbd5e1', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4, textAlign: 'center' }}>
                      <Typography color="text.secondary">Select a product to see the tag preview</Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Stack spacing={3}>
              <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>1. SELECT STYLE TO PRINT BARCODES PRE-RECEIPT</Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={allItems}
                      getOptionLabel={(o) => `${o.itemCode} - ${o.itemName}`}
                      onChange={(_, v) => {
                        setSelectedProduct(v);
                        if (v) {
                          const vars = (v.sizes || v.variants || []).map(s => ({
                            variantId: s._id || s.id,
                            size: s.size,
                            sku: s.sku || s.barcode || v.itemCode,
                            printQty: 0,
                            mrp: s.mrp || s.salePrice || v.salePrice || 0,
                            color: v.shade || v.color || 'N/A',
                            category: (v.groupIds || []).find(g => g.groupType === 'Category')?.name || 'GARMENT',
                            article: v.itemCode
                          }));
                          setBatchLines(vars);
                        } else {
                          setBatchLines([]);
                        }
                      }}
                      renderInput={(params) => <TextField {...params} label="Select Finished Good Style" size="small" />}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={1}>
                      <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
                        Upload Excel
                        <input type="file" hidden onChange={handleExcelUpload} />
                      </Button>
                      <Button variant="contained" color="success" disabled={!importResults.length} onClick={() => printBatch(importResults)}>
                        Print Import ({importResults.length})
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </Box>

              {batchLines.length > 0 && (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#eff6ff' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>SIZE</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>BARCODE / SKU</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>PRINT QUANTITY</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>MRP (TAG)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {batchLines.map((line, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontWeight: 700 }}>{line.size}</TableCell>
                          <TableCell>{line.sku}</TableCell>
                          <TableCell align="right">
                            <TextField 
                              type="number" 
                              size="small" 
                              value={line.printQty} 
                              onChange={(e) => {
                                const next = [...batchLines];
                                next[idx].printQty = Number(e.target.value);
                                setBatchLines(next);
                              }}
                              sx={{ width: 100 }}
                            />
                          </TableCell>
                          <TableCell align="right">₹ {line.mrp}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {batchLines.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                   <Button variant="outlined" onClick={() => setBatchLines(batchLines.map(l => ({ ...l, printQty: 0 })))}>Clear Qty</Button>
                   <Button 
                    variant="contained" 
                    color="primary" 
                    size="large"
                    onClick={() => {
                      const labelsToPrint = [];
                      batchLines.forEach(l => {
                        for (let i = 0; i < l.printQty; i++) {
                          labelsToPrint.push({
                            barcode: l.sku,
                            article: l.article,
                            size: l.size,
                            mrp: l.mrp,
                            color: l.color,
                            category: l.category
                          });
                        }
                      });
                      if (!labelsToPrint.length) alert('Please enter print quantities first.');
                      else printBatch(labelsToPrint);
                    }}
                   >
                     GENERATE & PRINT BATCH ({batchLines.reduce((acc, l) => acc + (l.printQty || 0), 0)})
                   </Button>
                </Box>
              )}
            </Stack>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default BarcodePrintingPage;
