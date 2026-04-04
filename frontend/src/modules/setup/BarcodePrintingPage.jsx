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
      width: 2,
      height: 45,
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

const VerticalTag = ({ label, mfgLine1, mfgLine2, type, design }) => {
  const barcodeImg = useMemo(() => generateBarcodeDataUrl(label.barcode), [label.barcode]);

  return (
    <Box sx={{ 
      width: '50mm', 
      height: '110mm', 
      bgcolor: 'white', 
      color: 'black', 
      display: 'flex', 
      flexDirection: 'column', 
      border: '1px solid #e2e8f0', 
      p: '5mm',
      pt: '3mm',
      boxSizing: 'border-box',
      fontFamily: "'Inter', sans-serif",
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Barcode Section */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <img src={barcodeImg} style={{ width: '100%', height: '14mm', objectFit: 'contain' }} alt="barcode" />
        <Typography sx={{ fontSize: '10pt', fontWeight: 600, mt: 0.5, letterSpacing: '2px' }}>{label.barcode}</Typography>
      </Box>

      {/* Product Details Section */}
      <Stack spacing={0.4} sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', fontSize: '10.5pt' }}>
          <Typography sx={{ width: '18mm', fontWeight: 700, fontSize: 'inherit' }}>Article :</Typography>
          <Typography sx={{ flex: 1, fontWeight: 700, fontSize: 'inherit' }}>{label.article}</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', fontSize: '10.5pt' }}>
          <Typography sx={{ width: '18mm', fontWeight: 700, fontSize: 'inherit' }}>Group</Typography>
          <Typography sx={{ flex: 1, fontWeight: 700, fontSize: 'inherit' }}>{label.category || 'SHIRT'}</Typography>
        </Box>

        <Box sx={{ display: 'flex', fontSize: '10pt' }}>
          <Typography sx={{ width: '18mm', fontWeight: 600, fontSize: 'inherit' }}>Type:</Typography>
          <Typography sx={{ flex: 1, fontWeight: 600, fontSize: 'inherit' }}>{type}</Typography>
        </Box>

        <Box sx={{ display: 'flex', fontSize: '10.5pt' }}>
          <Typography sx={{ width: '18mm', fontWeight: 700, fontSize: 'inherit' }}>DESIGN :</Typography>
          <Typography sx={{ flex: 1, fontWeight: 700, fontSize: 'inherit' }}>{design || 'COLLAR'}</Typography>
        </Box>

        <Box sx={{ display: 'flex', fontSize: '10.5pt', mt: 0.5 }}>
          <Typography sx={{ width: '18mm', fontWeight: 600, fontSize: 'inherit' }}>Size :</Typography>
          <Typography sx={{ flex: 1, fontWeight: 700, fontSize: '11pt', ml: 4 }}>{label.size}</Typography>
        </Box>

        <Box sx={{ display: 'flex', fontSize: '10pt' }}>
          <Typography sx={{ width: '18mm', fontWeight: 600, fontSize: 'inherit' }}>Qty: 1N</Typography>
          <Typography sx={{ flex: 1, fontWeight: 600, fontSize: 'inherit', ml: 4 }}>F/S</Typography>
        </Box>

        <Box sx={{ display: 'flex', fontSize: '10pt' }}>
          <Typography sx={{ width: '18mm', fontWeight: 600, fontSize: 'inherit' }}>Colour :</Typography>
          <Typography sx={{ flex: 1, fontWeight: 600, fontSize: 'inherit' }}>{label.color}</Typography>
        </Box>

        <Box sx={{ display: 'flex', fontSize: '11pt', mt: 1, alignItems: 'center' }}>
          <Typography sx={{ width: '18mm', fontWeight: 700, fontSize: 'inherit' }}>MRP :</Typography>
          <Typography sx={{ flex: 1, fontWeight: 700, fontSize: '13pt', ml: 4 }}>{Number(label.mrp || 0).toFixed(0)}</Typography>
        </Box>
        <Typography sx={{ fontSize: '8.5pt', fontWeight: 600, textAlign: 'left', pl: '19mm' }}> (Incl of all taxes)</Typography>
      </Stack>

      {/* Manufacturing Section */}
      <Box sx={{ mt: 'auto', borderTop: '0.1mm solid #eee', pt: 1.5 }}>
        <Typography sx={{ fontSize: '8.5pt', fontWeight: 800, mb: 0.2 }}>MFG:</Typography>
        <Typography sx={{ fontSize: '8.5pt', fontWeight: 700 }}>Mfg. & Marketed By</Typography>
        <Typography sx={{ fontSize: '8.5pt', fontWeight: 600, color: '#333' }}>Rebel Mass Export Pvt. Ltd</Typography>
        <Typography sx={{ fontSize: '8pt', fontWeight: 500 }}>{mfgLine1}</Typography>
        <Typography sx={{ fontSize: '8pt', fontWeight: 500 }}>{mfgLine2}</Typography>
        
        <Box sx={{ mt: 0.8 }}>
          <Typography sx={{ fontSize: '8.5pt', fontWeight: 700 }}>Customer Care:</Typography>
          <Typography sx={{ fontSize: '8.5pt', fontWeight: 500 }}>Email: info.dapolo@gmail.com</Typography>
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
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState([]);
  const [batchLines, setBatchLines] = useState([]);
  const allItems = useSelector((state) => state.items.records) || [];

  const [type, setType] = useState('FORMAL SOLID');
  const [design, setDesign] = useState('COLLAR');
  const [mfgLine1, setMfgLine1] = useState('Plot No 418, Sector-53, Phase 3');
  const [mfgLine2, setMfgLine2] = useState('Kundli, Sonipat (Haryana)');
  
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
      setActiveTab(1); 
      fetchGrnLabels(rawGrnId);
    }
  }, [rawGrnId]);

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
                category: categoryObj?.name || categoryObj?.groupName || 'SHIRT',
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
        @page { size: 50mm 110mm; margin: 0; }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background: #fff; color: #000; }
        .label { 
          width: 50mm; height: 110mm; box-sizing: border-box;
          padding: 5mm; pt: 3mm; overflow: hidden; page-break-after: always;
          display: flex; flex-direction: column; justify-content: flex-start;
          border-bottom: 2px dashed #eee;
        }
        .barcode-container { width: 100%; text-align: center; margin-bottom: 5mm; }
        .barcode-img { width: 100%; height: 14mm; display: block; margin: 0 auto; object-fit: contain; }
        .barcode-text { font-size: 10pt; font-weight: 600; letter-spacing: 2mm; margin-top: 1mm; text-align: center; }
        
        .spec-container { display: flex; flex-direction: column; gap: 1.5mm; flex: 1; }
        .info-row { display: flex; font-size: 10pt; line-height: 1.2; align-items: baseline; }
        .info-col-key { width: 18mm; font-weight: 700; }
        .info-col-val { flex: 1; font-weight: 700; }
        .info-row-plain { display: flex; font-size: 10pt; line-height: 1.2; align-items: baseline; }
        .info-row-plain .info-col-key { font-weight: 600; }
        .info-row-plain .info-col-val { font-weight: 600; }

        .mrp-section { mt: 3mm; }
        .mrp-row { display: flex; font-size: 11pt; align-items: center; font-weight: 700; }
        .mrp-key { width: 18mm; }
        .mrp-val { font-size: 13pt; margin-left: 4mm; }
        .tax-text { font-size: 8.5pt; font-weight: 600; margin-left: 19mm; }

        .footer { font-size: 8pt; font-weight: 600; line-height: 1.3; border-top: 1px solid #eee; pt: 3mm; margin-top: auto; }
        .mfg-title { font-size: 8.5pt; font-weight: 800; margin-bottom: 1mm; }
        .mkt-by { font-size: 8.5pt; font-weight: 700; }
        .comp { font-size: 8.5pt; font-weight: 600; }
      </style>
    `;

    const labelsHtml = labels.map(label => `
      <div class="label">
        <div class="barcode-container">
          <img src="${generateBarcodeDataUrl(label.barcode)}" class="barcode-img" />
          <div class="barcode-text">${label.barcode}</div>
        </div>
        
        <div class="spec-container">
          <div class="info-row">
            <span class="info-col-key">Article :</span> <span class="info-col-val">${label.article || ''}</span>
          </div>
          <div class="info-row">
            <span class="info-col-key">Group</span> <span class="info-col-val">${label.category || 'SHIRT'}</span>
          </div>
          <div class="info-row-plain">
            <span class="info-col-key">Type:</span> <span class="info-col-val">${type}</span>
          </div>
          <div class="info-row">
            <span class="info-col-key">DESIGN :</span> <span class="info-col-val">${design}</span>
          </div>
          <div class="info-row">
            <span class="info-col-key">Size :</span> <span class="info-col-val" style="font-size: 11pt; margin-left: 4mm;">${label.size}</span>
          </div>
          <div class="info-row-plain">
            <span class="info-col-key">Qty: 1N</span> <span class="info-col-val" style="margin-left: 4mm;">F/S</span>
          </div>
          <div class="info-row-plain">
            <span class="info-col-key">Colour :</span> <span class="info-col-val">${label.color || 'N/A'}</span>
          </div>
          
          <div class="mrp-section">
            <div class="mrp-row">
              <span class="mrp-key">MRP :</span> <span class="mrp-val">${Number(label.mrp || 0).toFixed(0)}</span>
            </div>
            <div class="tax-text">(Incl of all taxes)</div>
          </div>
        </div>

        <div class="footer">
          <div class="mfg-title">MFG:</div>
          <div class="mkt-by">Mfg. & Marketed By</div>
          <div class="comp">Rebel Mass Export Pvt. Ltd</div>
          <div>${mfgLine1}</div>
          <div>${mfgLine2}</div>
          <div style="margin-top: 2mm;">
            <b>Customer Care:</b><br/>
            Email: info.dapolo@gmail.com
          </div>
        </div>
      </div>
    `).join('');

    printWindow.document.write(`<html><head><title>Print Tags</title>${styles}</head><body onload="window.print(); setTimeout(() => window.close(), 500);">${labelsHtml}</body></html>`);
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
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Approved Labelling System</Typography>
      <Typography variant="body1" sx={{ color: '#64748b', mb: 4 }}>Barcode Tag Generation</Typography>

      <Paper sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: '1px solid #e2e8f0', px: 2 }}>
          <Tab icon={<PrintIcon />} label="Single Print" sx={{ py: 2, fontWeight: 700 }} />
          <Tab icon={<ExcelIcon />} label="Bulk / GRN Labels" sx={{ py: 2, fontWeight: 700 }} />
        </Tabs>

        <Box sx={{ p: 4 }}>
          {activeTab === 0 && (
            <Grid container spacing={6}>
              <Grid item xs={12} md={6}>
                <Stack spacing={4}>
                  <Box sx={{ p: 3, border: '1px dashed #cbd5e1', borderRadius: 3, bgcolor: '#f1f5f9' }}>
                    <Typography variant="subtitle2" sx={{ mb: 2.5, color: '#475569', fontWeight: 800, textTransform: 'uppercase' }}>
                      Vertical Tag Parameters
                    </Typography>
                    <Stack spacing={2}>
                      <TextField fullWidth size="small" label="Type" value={type} onChange={(e) => setType(e.target.value)} />
                      <TextField fullWidth size="small" label="Design" value={design} onChange={(e) => setDesign(e.target.value)} />
                      <TextField fullWidth size="small" label="Mfg Line 1" value={mfgLine1} onChange={(e) => setMfgLine1(e.target.value)} />
                      <TextField fullWidth size="small" label="Mfg Line 2" value={mfgLine2} onChange={(e) => setMfgLine2(e.target.value)} />
                    </Stack>
                  </Box>

                  <Autocomplete
                    options={products}
                    getOptionLabel={(o) => `${o.sku} - ${o.name} (${o.size})`}
                    onChange={(_, v) => setSelectedProduct(v)}
                    renderInput={(params) => <TextField {...params} label="Select Product Attachment" size="small" />}
                  />

                  <TextField fullWidth type="number" size="small" label="Print Quantity" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />

                  <Button 
                    variant="contained" 
                    fullWidth 
                    disabled={!selectedProduct} 
                    onClick={() => printBatch(Array.from({ length: quantity }).map(() => currentLabelData))} 
                    startIcon={<PrintIcon />}
                    sx={{ py: 1.5, fontWeight: 800 }}
                  >
                    Generate & Print Tag
                  </Button>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 800, textAlign: 'center' }}>TAG PREVIEW (WYSIWYG)</Typography>
                  {currentLabelData ? (
                    <VerticalTag 
                      label={currentLabelData} 
                      mfgLine1={mfgLine1} 
                      mfgLine2={mfgLine2} 
                      type={type} 
                      design={design} 
                    />
                  ) : (
                    <Box sx={{ width: '50mm', height: '110mm', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4, textAlign: 'center' }}>
                      <Typography color="text.secondary">Select product to preview tag</Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Stack spacing={3}>
              <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>SELECT STYLE FOR BATCH PRINTING</Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={allItems}
                      getOptionLabel={(o) => `${o.itemCode} - ${o.itemName}`}
                      onChange={(_, v) => {
                        if (v) {
                          const vars = (v.sizes || v.variants || []).map(s => ({
                            variantId: s._id || s.id,
                            size: s.size,
                            sku: s.sku || s.barcode || v.itemCode,
                            printQty: 0,
                            mrp: s.mrp || s.salePrice || v.salePrice || 0,
                            color: v.shade || v.color || 'N/A',
                            category: (v.groupIds || []).find(g => g.groupType === 'Category')?.name || 'SHIRT',
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
                        <TableCell align="right" sx={{ fontWeight: 700 }}>MRP</TableCell>
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
                          <TableCell align="right">{line.mrp}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {batchLines.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                   <Button variant="contained" 
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
                     GENERATE BATCH TAGS ({batchLines.reduce((acc, l) => acc + (l.printQty || 0), 0)})
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
