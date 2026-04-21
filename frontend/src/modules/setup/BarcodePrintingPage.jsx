import { useState, useEffect, useMemo, useRef } from 'react';
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
  HistoryOutlined as HistoryIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';
import { fetchGrns } from '../grn/grnSlice';
import api from '../../services/api';
import JsBarcode from 'jsbarcode';
import { useNotification } from '../../context/NotificationProvider';
import { useLoading } from '../../context/LoadingProvider';
import { useConfirm } from '../../context/ConfirmProvider';
import * as XLSX from 'xlsx';


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
      minHeight: '135mm', 
      bgcolor: 'white', 
      color: 'black', 
      display: 'flex', 
      flexDirection: 'column', 
      border: '1.5px solid black', 
      p: '4mm',
      pt: '3mm',
      boxSizing: 'border-box',
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      position: 'relative'
    }}>
      {/* Barcode Section */}
      <Box sx={{ textAlign: 'center', mb: 1.5 }}>
        <img src={barcodeImg} style={{ width: '100%', height: '14mm', objectFit: 'contain' }} alt="barcode" />
        <Typography sx={{ fontSize: '9pt', fontWeight: 600, mt: 0.2, letterSpacing: '0.8mm' }}>{label.barcode}</Typography>
      </Box>

      {/* Product Details Section */}
      <Stack spacing={0.5} sx={{ px: 0.5, flex: 1 }}>
        {[
          { label: 'Article :', val: label.article },
          { label: 'Group', val: label.category || 'SHIRT' },
          { label: 'Type:', val: type },
          { label: 'DESIGN :', val: design || 'COLLAR' },
        ].map((item, i) => (
          <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '22mm 1fr', fontSize: '9.2pt', lineHeight: 1.1, alignItems: 'start' }}>
            <Typography sx={{ fontWeight: 800, fontSize: 'inherit' }}>{item.label}</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: 'inherit', textTransform: 'uppercase' }}>{item.val}</Typography>
          </Box>
        ))}

        <Box sx={{ display: 'grid', gridTemplateColumns: '22mm 1fr', fontSize: '9.5pt', mt: 0.2, alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 'inherit' }}>Size :</Typography>
          <Typography sx={{ fontWeight: 900, fontSize: '11pt', textTransform: 'uppercase' }}>{label.size}</Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '22mm 1fr', fontSize: '9pt', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 'inherit' }}>Qty: 1N</Typography>
          <Typography sx={{ fontWeight: 700, fontSize: 'inherit', textTransform: 'uppercase' }}>F/S</Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '22mm 1fr', fontSize: '9pt', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 'inherit' }}>Colour :</Typography>
          <Typography sx={{ fontWeight: 700, fontSize: 'inherit', textTransform: 'uppercase' }}>{label.color}</Typography>
        </Box>

        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '22mm 1fr', alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 800, fontSize: '10pt' }}>MRP :</Typography>
            <Typography sx={{ fontWeight: 900, fontSize: '14pt', textAlign: 'left' }}>
              {Number(label.mrp || 0).toFixed(0)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'left', pl: '22mm', mt: -0.5 }}>
            <Typography sx={{ fontSize: '7.5pt', fontWeight: 700 }}>(Incl of all taxes)</Typography>
          </Box>
        </Box>
      </Stack>

      {/* Manufacturing Section */}
      <Box sx={{ mt: 'auto', borderTop: '1px solid black', pt: 1.8, px: 0.5 }}>
        <Typography sx={{ fontSize: '7.5pt', fontWeight: 900, mb: 0.1 }}>MFG:</Typography>
        <Typography sx={{ fontSize: '7.5pt', fontWeight: 800 }}>Mfg. & Marketed By</Typography>
        <Typography sx={{ fontSize: '7.5pt', fontWeight: 700 }}>Rebel Mass Export Pvt. Ltd</Typography>
        <Typography sx={{ fontSize: '7pt', fontWeight: 600 }}>{mfgLine1}</Typography>
        <Typography sx={{ fontSize: '7pt', fontWeight: 600 }}>{mfgLine2}</Typography>
        
        <Box sx={{ mt: 0.8 }}>
          <Typography sx={{ fontSize: '7.5pt', fontWeight: 800 }}>Customer Care:</Typography>
          <Typography sx={{ fontSize: '7pt', fontWeight: 600 }}>Email: info.dapolo@gmail.com</Typography>
        </Box>
      </Box>
    </Box>
  );
};

function BarcodePrintingPage() {
  const [searchParams] = useSearchParams();
  const rawGrnId = searchParams.get('grnId');
  const shouldAutoPrint = searchParams.get('autoPrint') === '1';
  const preselectedItemId = searchParams.get('itemId');
  const preselectedItemIds = useMemo(
    () => (searchParams.get('itemIds') || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    [searchParams],
  );
  
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
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [globalBatchQty, setGlobalBatchQty] = useState(1);
  const allItems = useSelector((state) => state.items.records) || [];
  const autoPrintTriggeredRef = useRef(false);
  const { showNotification } = useNotification();
  const { showLoading, hideLoading } = useLoading();
  const { showConfirm } = useConfirm();

  const [type, setType] = useState('FORMAL SOLID');
  const [design, setDesign] = useState('COLLAR');
  const [mfgLine1, setMfgLine1] = useState('Plot No 418, Sector-53, Phase 3');
  const [mfgLine2, setMfgLine2] = useState('Kundli, Sonipat (Haryana)');
  
  // History State
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/barcodes');
      setHistory(res.data?.data?.barcodes || []);
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const deleteSingleRecord = async (id) => {
    const confirmed = await showConfirm({
      title: 'Delete History Record',
      message: 'Are you sure you want to delete this record?',
      confirmText: 'Delete',
      severity: 'error'
    });
    if (!confirmed) return;
    
    showLoading('Deleting record...');
    try {
      await api.delete(`/barcodes/${id}`);
      showNotification('Record deleted successfully', 'success');
      fetchHistory();
    } catch (err) {
      showNotification('Delete failed', 'error');
    } finally {
      hideLoading();
    }
  };

  const deleteAllRecords = async () => {
    const confirmed = await showConfirm({
      title: 'Clear All History',
      message: 'WARNING: THIS WILL DELETE ALL GENERATED BARCODE RECORDS. Are you sure you want to proceed?',
      confirmText: 'Clear All',
      severity: 'error'
    });
    if (!confirmed) return;

    showLoading('Clearing history...');
    try {
      await api.delete('/barcodes');
      showNotification('All records deleted successfully', 'success');
      fetchHistory();
    } catch (err) {
      showNotification('Delete all failed', 'error');
    } finally {
      hideLoading();
    }
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    showLoading('Processing excel file...');
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData && jsonData.length > 0) {
          const formatted = jsonData.map((row) => ({
            barcode: String(row.Barcode || row.barcode || row.SKU || row.sku || ''),
            article: String(row.Article || row.article || row.Item || row.item || row.ItemCode || row.itemCode || ''),
            size: String(row.Size || row.size || 'N/A'),
            mrp: Number(row.MRP || row.mrp || row.Price || row.price || 0),
            color: String(row.Color || row.color || 'N/A'),
            category: String(row.Category || row.category || 'GARMENT'),
          })).filter(item => item.barcode);

          setImportResults(formatted);
          showNotification(`Successfully loaded ${formatted.length} items for printing.`, 'success');
        } else {
          showNotification('No data found in Excel sheet.', 'warning');
        }
      } catch (err) {
        console.error('Excel parse error:', err);
        showNotification('Failed to parse Excel file. Ensure it is a valid .xlsx or .xls file.', 'error');
      } finally {
        hideLoading();
      }
    };
    reader.onerror = () => {
      showNotification('Error reading file.', 'error');
      hideLoading();
    };
    reader.readAsArrayBuffer(file);
  };

  useEffect(() => {

    if (activeTab === 2) {
      fetchHistory();
    }
  }, [activeTab]);
  
  useEffect(() => {
    dispatch(fetchGrns());
    import('../items/itemsSlice').then(m => dispatch(m.fetchItems()));
  }, [dispatch]);

  const buildBatchLinesFromItems = (items) => {
    const lines = [];
    items.forEach((item) => {
      const variants = item.sizes || item.variants || [];
      if (!variants.length) {
        return;
      }

      variants.forEach((variant) => {
        lines.push({
          itemId: item._id || item.id,
          variantId: variant._id || variant.id,
          itemCode: item.itemCode,
          itemName: item.itemName,
          size: variant.size || 'N/A',
          sku: variant.sku || variant.barcode || item.itemCode,
          printQty: 1,
          mrp: variant.mrp || variant.salePrice || item.salePrice || item.mrp || 0,
          color: variant.color || item.shadeNo || item.color || item.shade || 'N/A',
          category: (item.groupIds || []).find(g => g.groupType === 'Category')?.name || (item.categoryId?.name || item.categoryId?.groupName) || 'GARMENT',
          article: item.itemCode
        });
      });
    });

    return lines;
  };

  const buildLabelsFromBatchLines = (lines) => {
    const labels = [];
    lines.forEach((line) => {
      const qty = Math.max(0, Number(line.printQty) || 0);
      for (let i = 0; i < qty; i++) {
        labels.push({
          barcode: line.sku,
          article: line.article,
          size: line.size,
          mrp: line.mrp,
          color: line.color,
          category: line.category
        });
      }
    });
    return labels;
  };

  const fetchGrnLabels = async (idOfGrn) => {
    setImporting(true);
    showLoading('Loading stickers from GRN...');
    try {
      const res = await api.get(`/barcodes/grn/${idOfGrn}`);
      const extractedLabels = res.data?.data?.labels || res.data?.labels || [];
      setImportResults(extractedLabels);
      if (extractedLabels.length === 0) {
        showNotification('No valid received items found in this GRN to print.', 'warning');
      }
      return extractedLabels;
    } catch (err) {
      showNotification('Failed to load stickers from GRN: ' + (err.response?.data?.message || err.message), 'error');
      return [];
    } finally {
      setImporting(false);
      hideLoading();
    }
  };

  useEffect(() => {
    if (!rawGrnId) return;

    const loadGrnLabels = async () => {
      setActiveTab(1);
      const labels = await fetchGrnLabels(rawGrnId);
      if (shouldAutoPrint && labels.length && !autoPrintTriggeredRef.current) {
        autoPrintTriggeredRef.current = true;
        setTimeout(() => printBatch(labels), 250);
      }
    };

    loadGrnLabels();
  }, [rawGrnId, shouldAutoPrint]);

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
                color: v.color || p.shadeNo || p.color || p.shade || 'N/A',
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

  useEffect(() => {
    const preselectedIds = [...new Set([preselectedItemId, ...preselectedItemIds].filter(Boolean))];
    if (!preselectedIds.length || !allItems.length) return;

    const matchedItems = allItems.filter((item) => preselectedIds.includes(String(item._id || item.id)));
    if (!matchedItems.length) return;

    setActiveTab(1);
    setSelectedStyles(matchedItems);
    setBatchLines(buildBatchLinesFromItems(matchedItems));

    if (shouldAutoPrint && !autoPrintTriggeredRef.current) {
      const labels = buildLabelsFromBatchLines(buildBatchLinesFromItems(matchedItems));
      if (labels.length) {
        autoPrintTriggeredRef.current = true;
        setTimeout(() => printBatch(labels), 250);
      }
    }
  }, [allItems, preselectedItemId, preselectedItemIds, shouldAutoPrint]);

  const printBatch = (labels) => {
    if (!labels.length) return;
    const printWindow = window.open('', '_blank');
    const styles = `
      <style>
        @page { size: 50mm 135mm; margin: 0; }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background: #fff; color: #000; }
        .label { 
          width: 50mm; height: 135mm; box-sizing: border-box;
          padding: 4.5mm; overflow: hidden; page-break-after: always;
          display: flex; flex-direction: column; justify-content: flex-start;
          border-bottom: 0.2mm solid #eee;
        }
        .barcode-container { width: 100%; text-align: center; margin-bottom: 4mm; }
        .barcode-img { width: 100%; height: 14mm; display: block; margin: 0 auto; object-fit: contain; }
        .barcode-text { font-size: 9pt; font-weight: 600; letter-spacing: 0.8mm; margin-top: 1mm; text-align: center; }
        
        .spec-container { display: flex; flex-direction: column; gap: 1.2mm; flex: 1; padding: 0 0.5mm; }
        .row { display: grid; grid-template-columns: 22mm 1fr; font-size: 9.2pt; line-height: 1.1; align-items: start; }
        .key { font-weight: 800; }
        .val { font-weight: 700; text-transform: uppercase; }

        .mrp-section { margin-top: 2mm; }
        .mrp-row { display: grid; grid-template-columns: 22mm 1fr; font-size: 10pt; align-items: center; font-weight: 800; }
        .mrp-val { font-size: 14pt; font-weight: 900; }
        .tax-text { font-size: 7.5pt; font-weight: 700; margin-left: 22mm; margin-top: -0.5mm; }

        .footer { font-size: 7.2pt; font-weight: 700; line-height: 1.3; border-top: 1px solid #000; padding-top: 2.5mm; margin-top: auto; padding-left: 0.5mm; }
        .mfg-title { font-size: 7.5pt; font-weight: 900; margin-bottom: 0.5mm; }
        .mf-line { font-size: 7pt; font-weight: 600; }
      </style>
    `;

    const labelsHtml = labels.map(label => `
      <div class="label">
        <div class="barcode-container">
          <img src="${generateBarcodeDataUrl(label.barcode)}" class="barcode-img" />
          <div class="barcode-text">${label.barcode}</div>
        </div>
        
        <div class="spec-container">
          <div class="row">
            <span class="key">Article :</span> <span class="val">${label.article || ''}</span>
          </div>
          <div class="row">
            <span class="key">Group</span> <span class="val">${label.category || 'SHIRT'}</span>
          </div>
          <div class="row">
            <span class="key">Type:</span> <span class="val">${type}</span>
          </div>
          <div class="row">
            <span class="key">DESIGN :</span> <span class="val">${design}</span>
          </div>
          <div class="row" style="align-items: center; margin-top: 0.5mm;">
            <span class="key">Size :</span> <span class="val" style="font-size: 11pt; font-weight: 900;">${label.size}</span>
          </div>
          <div class="row" style="align-items: center;">
            <span class="key">Qty: 1N</span> <span class="val">F/S</span>
          </div>
          <div class="row" style="align-items: center;">
            <span class="key">Colour :</span> <span class="val">${label.color || 'N/A'}</span>
          </div>
          
          <div class="mrp-section">
            <div class="mrp-row">
              <span class="key">MRP :</span> <span class="mrp-val">${Number(label.mrp || 0).toFixed(0)}</span>
            </div>
            <div class="tax-text">(Incl of all taxes)</div>
          </div>
        </div>

        <div class="footer">
          <div class="mfg-title">MFG:</div>
          <div>Mfg. & Marketed By</div>
          <div>Rebel Mass Export Pvt. Ltd</div>
          <div class="mf-line">${mfgLine1}</div>
          <div class="mf-line">${mfgLine2}</div>
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

  const totalBatchLabels = useMemo(
    () => batchLines.reduce((acc, line) => acc + (Number(line.printQty) || 0), 0),
    [batchLines],
  );

  const updateAllBatchQuantities = (qty) => {
    const normalizedQty = Math.max(0, Number(qty) || 0);
    setBatchLines((prev) => prev.map((line) => ({ ...line, printQty: normalizedQty })));
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Approved Labelling System</Typography>
      <Typography variant="body1" sx={{ color: '#64748b', mb: 4 }}>Barcode Tag Generation</Typography>

      <Paper sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: '1px solid #e2e8f0', px: 2 }}>
          <Tab icon={<PrintIcon />} label="Single Print" sx={{ py: 2, fontWeight: 700 }} />
          <Tab icon={<ExcelIcon />} label="Bulk / GRN Labels" sx={{ py: 2, fontWeight: 700 }} />
          <Tab icon={<HistoryIcon />} label="Generation History" sx={{ py: 2, fontWeight: 700 }} />
        </Tabs>

        <Box sx={{ p: 4 }}>
          {activeTab === 0 && (
            <Grid container spacing={6}>
              <Grid item xs={12} md={6}>
                <Stack spacing={4}>
                  <Box sx={{ p: 4, border: '1px solid #e2e8f0', borderRadius: 4, bgcolor: '#f8fafc' }}>
                    <Typography variant="subtitle2" sx={{ mb: 3, color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Vertical Tag Parameters
                    </Typography>
                    <Stack spacing={2.5}>
                      <TextField fullWidth size="medium" label="Type" value={type} onChange={(e) => setType(e.target.value)} />
                      <TextField fullWidth size="medium" label="Design" value={design} onChange={(e) => setDesign(e.target.value)} />
                      <TextField fullWidth size="medium" label="Mfg Line 1" value={mfgLine1} onChange={(e) => setMfgLine1(e.target.value)} />
                      <TextField fullWidth size="medium" label="Mfg Line 2" value={mfgLine2} onChange={(e) => setMfgLine2(e.target.value)} />
                    </Stack>
                  </Box>

                  <Autocomplete
                    options={products}
                    getOptionLabel={(o) => `${o.sku} - ${o.name} (${o.size})`}
                    onChange={(_, v) => setSelectedProduct(v)}
                    sx={{ width: '100%', minWidth: { md: 400 } }}
                    renderInput={(params) => <TextField {...params} label="Select Product Attachment" size="medium" placeholder="Search by SKU or Name..." />}
                  />

                  <TextField fullWidth type="number" size="medium" label="Print Quantity" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />

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
              <Box sx={{ p: 4, bgcolor: '#f1f5f9', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle2" sx={{ mb: 3, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 1 }}>SELECT STYLE FOR BATCH PRINTING</Typography>
                <Grid container spacing={4} alignItems="center">
                  <Grid item xs={12} md={9}>
                    <Autocomplete
                      multiple
                      options={allItems}
                      getOptionLabel={(o) => `${o.itemCode} - ${o.itemName}`}
                      value={selectedStyles}
                      onChange={(_, value) => {
                        setSelectedStyles(value);
                        if (value?.length) {
                          setBatchLines(buildBatchLinesFromItems(value));
                        } else {
                          setBatchLines([]);
                        }
                      }}
                      sx={{ width: '100%', minWidth: { md: 500 } }}
                      renderInput={(params) => <TextField {...params} label="Select Finished Good Styles" size="medium" placeholder="Search and select one or more styles..." />}
                      ListboxProps={{
                        sx: { maxHeight: 400, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', '& .MuiAutocomplete-option': { px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9' } }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                      <Button variant="outlined" component="label" startIcon={<UploadIcon />} sx={{ py: 1.2, px: 3, borderRadius: 2 }}>
                        Upload Excel
                        <input type="file" hidden onChange={handleExcelUpload} />
                      </Button>
                      <Button variant="contained" color="success" disabled={!importResults.length} onClick={() => printBatch(importResults)} sx={{ py: 1.2, px: 3, borderRadius: 2 }}>
                        Print ({importResults.length})
                      </Button>
                      {rawGrnId && importResults.length > 0 && (
                        <Button variant="outlined" color="primary" onClick={() => printBatch(importResults)} sx={{ py: 1.2, px: 3, borderRadius: 2 }}>
                          Direct GRN Print
                        </Button>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              </Box>

              {batchLines.length > 0 && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
                      Yahan se aap GRN ke bina bhi naye items ke barcodes ek sath print kar sakte hain. Ye sirf print flow hai, inventory me koi entry nahi jayegi.
                    </Typography>
                    <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
                      <TextField
                        type="number"
                        size="small"
                        label="Set Qty For All"
                        value={globalBatchQty}
                        onChange={(e) => setGlobalBatchQty(Number(e.target.value))}
                        sx={{ width: 140 }}
                      />
                      <Button variant="outlined" onClick={() => updateAllBatchQuantities(globalBatchQty)}>
                        Apply All
                      </Button>
                      <Button variant="outlined" color="inherit" onClick={() => updateAllBatchQuantities(0)}>
                        Clear All
                      </Button>
                    </Stack>
                  </Box>

                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#eff6ff' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>STYLE</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>SIZE</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>BARCODE / SKU</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>PRINT QUANTITY</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>MRP</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {batchLines.map((line, idx) => (
                          <TableRow key={`${line.itemId || 'item'}-${line.variantId || idx}`}>
                            <TableCell sx={{ fontWeight: 700 }}>{line.article}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{line.size}</TableCell>
                            <TableCell>{line.sku}</TableCell>
                            <TableCell align="right">
                              <TextField 
                                type="number" 
                                size="medium" 
                                value={line.printQty} 
                                onChange={(e) => {
                                  const next = [...batchLines];
                                  next[idx].printQty = Number(e.target.value);
                                  setBatchLines(next);
                                }}
                                sx={{ width: 140 }}
                              />
                            </TableCell>
                            <TableCell align="right">{line.mrp}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {batchLines.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                   <Button variant="contained" 
                    onClick={() => {
                      const labelsToPrint = buildLabelsFromBatchLines(batchLines);
                      if (!labelsToPrint.length) showNotification('Please enter print quantities first.', 'warning');
                      else printBatch(labelsToPrint);
                    }}
                   >
                     GENERATE BATCH TAGS ({totalBatchLabels})
                   </Button>
                </Box>
              )}
            </Stack>
          )}

          {activeTab === 2 && (
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Generation History</Typography>
                  <Typography variant="body2" color="textSecondary">Trace records of generated barcodes and their associated GRNs.</Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  color="error" 
                  startIcon={<DeleteIcon />} 
                  onClick={deleteAllRecords}
                  disabled={history.length === 0}
                >
                  Clear All History
                </Button>
              </Box>

              {historyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : history.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>GENERATED DATE</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>BARCODE</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>STYLE / ITEM</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>BATCH NO</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>ACTIONS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {history.map((row) => (
                        <TableRow key={row._id} hover>
                          <TableCell sx={{ fontSize: '0.85rem' }}>
                            {new Date(row.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, color: '#1e293b' }}>
                            {row.barcode}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.itemId?.itemCode}</Typography>
                            <Typography variant="caption" color="textSecondary">{row.itemId?.itemName}</Typography>
                          </TableCell>
                          <TableCell>{row.batchNo}</TableCell>
                          <TableCell align="right">
                            <Button 
                              size="small" 
                              color="error" 
                              onClick={() => deleteSingleRecord(row._id)}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ py: 10, textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: 4 }}>
                   <Typography variant="body1" color="textSecondary">No history found. Generate barcodes via GRN or Bulk print to see records here.</Typography>
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
