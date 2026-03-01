import { useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import PreviewIcon from '@mui/icons-material/Preview';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { generateGSTR1JSON, generateGSTR3BJSON, parseGSTR2AJSON, reconcileGSTR2A } from './gstService';

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const getDefaultDateRange = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const first = `${y}-${m}-01`;
  const last = d.toISOString().slice(0, 10);
  return { from: first, to: last };
};

function GSTRSummaryPage() {
  const sales = useSelector((state) => state.sales?.records || []);
  const salesReturns = useSelector((state) => state.sales?.returns || []);
  const purchases = useSelector((state) => state.purchase?.records || []);
  const purchaseReturns = useSelector((state) => state.purchase?.returns || []);

  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [dateFrom, setDateFrom] = useState(defaultRange.from);
  const [dateTo, setDateTo] = useState(defaultRange.to);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [gstr2aData, setGstr2aData] = useState(null);
  const fileInputRef = useRef(null);

  const filteredSales = useMemo(
    () =>
      sales.filter((s) => {
        const d = s.date || '';
        return (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
      }),
    [sales, dateFrom, dateTo],
  );
  const filteredPurchases = useMemo(
    () =>
      purchases.filter((p) => {
        const d = p.billDate || p.date || '';
        return (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
      }),
    [purchases, dateFrom, dateTo],
  );

  const outwardSupplies = useMemo(
    () => ({
      taxableValue: filteredSales.reduce(
        (sum, s) =>
          sum + toNum(s.totals?.grossAmount) - toNum(s.totals?.lineDiscount) - toNum(s.totals?.billDiscount),
        0,
      ),
      cgst: filteredSales.reduce((sum, s) => sum + toNum(s.totals?.taxAmount) / 2, 0),
      sgst: filteredSales.reduce((sum, s) => sum + toNum(s.totals?.taxAmount) / 2, 0),
      igst: 0,
      totalTax: filteredSales.reduce((sum, s) => sum + toNum(s.totals?.taxAmount), 0),
    }),
    [filteredSales],
  );

  const inwardSupplies = useMemo(
    () => ({
      taxableValue: filteredPurchases.reduce(
        (sum, p) => sum + toNum(p.totals?.grossAmount) - toNum(p.totals?.totalDiscount),
        0,
      ),
      cgst: filteredPurchases.reduce((sum, p) => sum + toNum(p.totals?.totalTax) / 2, 0),
      sgst: filteredPurchases.reduce((sum, p) => sum + toNum(p.totals?.totalTax) / 2, 0),
      igst: 0,
      totalTax: filteredPurchases.reduce((sum, p) => sum + toNum(p.totals?.totalTax), 0),
    }),
    [filteredPurchases],
  );

  const taxLiability = outwardSupplies.totalTax;
  const inputTaxCredit = inwardSupplies.totalTax;
  const netPayable = taxLiability - inputTaxCredit;

  const gstr1JSON = useMemo(
    () => generateGSTR1JSON(sales, salesReturns, dateFrom, dateTo),
    [sales, salesReturns, dateFrom, dateTo],
  );
  const gstr3bJSON = useMemo(
    () =>
      generateGSTR3BJSON(sales, purchases, salesReturns, purchaseReturns, dateFrom, dateTo),
    [sales, purchases, salesReturns, purchaseReturns, dateFrom, dateTo],
  );

  const filingData = useMemo(
    () => ({
      gstr1: gstr1JSON,
      gstr3b: gstr3bJSON,
    }),
    [gstr1JSON, gstr3bJSON],
  );

  const handleDownloadGSTR1 = () => {
    const blob = new Blob([JSON.stringify(gstr1JSON, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR1_${dateFrom.replace(/-/g, '')}_${dateTo.replace(/-/g, '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadGSTR3B = () => {
    const blob = new Blob([JSON.stringify(gstr3bJSON, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR3B_${dateFrom.replace(/-/g, '')}_${dateTo.replace(/-/g, '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGSTR2AFile = (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result;
        const invoices = parseGSTR2AJSON(content);
        const result = reconcileGSTR2A(invoices, purchases, dateFrom, dateTo);
        setGstr2aData({ invoices, ...result });
      } catch (err) {
        setGstr2aData({ error: 'Invalid JSON or file format' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <Box>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            GSTR Summary
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            GSTR-1 / GSTR-3B summary and JSON export. Import GSTR-2A for reconciliation.
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', mb: 1 }}>
            Date Range
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="From"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="To"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Paper>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" startIcon={<PreviewIcon />} onClick={() => setExportDialogOpen(true)}>
            Preview Filing Data
          </Button>
          <Button variant="contained" startIcon={<FileDownloadIcon />} onClick={handleDownloadGSTR1}>
            Download GSTR-1 JSON
          </Button>
          <Button variant="contained" startIcon={<FileDownloadIcon />} onClick={handleDownloadGSTR3B}>
            Download GSTR-3B JSON
          </Button>
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
          Outward Supplies (Sales)
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          <SummaryCard label="Taxable Value" value={`₹${outwardSupplies.taxableValue.toFixed(2)}`} />
          <SummaryCard label="CGST" value={`₹${outwardSupplies.cgst.toFixed(2)}`} />
          <SummaryCard label="SGST" value={`₹${outwardSupplies.sgst.toFixed(2)}`} />
          <SummaryCard label="IGST" value={`₹${outwardSupplies.igst.toFixed(2)}`} />
          <SummaryCard label="Total Tax" value={`₹${outwardSupplies.totalTax.toFixed(2)}`} strong />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
          Inward Supplies (Purchases)
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          <SummaryCard label="Taxable Value" value={`₹${inwardSupplies.taxableValue.toFixed(2)}`} />
          <SummaryCard label="CGST (ITC)" value={`₹${inwardSupplies.cgst.toFixed(2)}`} />
          <SummaryCard label="SGST (ITC)" value={`₹${inwardSupplies.sgst.toFixed(2)}`} />
          <SummaryCard label="IGST (ITC)" value={`₹${inwardSupplies.igst.toFixed(2)}`} />
          <SummaryCard label="Input Tax Credit" value={`₹${inwardSupplies.totalTax.toFixed(2)}`} strong />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
          Tax Liability Summary
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          <SummaryCard label="Tax Liability (Outward)" value={`₹${taxLiability.toFixed(2)}`} />
          <SummaryCard label="Input Tax Credit" value={`₹${inputTaxCredit.toFixed(2)}`} />
          <SummaryCard
            label="Net Payable"
            value={`₹${netPayable.toFixed(2)}`}
            strong
            color={netPayable < 0 ? 'success.main' : netPayable > 0 ? 'error.main' : undefined}
          />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
          GSTR-2A Reconcile
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
          Import GSTR-2A JSON file from GST portal to match with your purchase records.
        </Typography>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleGSTR2AFile}
        />
        <Button
          variant="outlined"
          startIcon={<UploadFileIcon />}
          onClick={() => fileInputRef.current?.click()}
        >
          Import GSTR-2A JSON
        </Button>

        {gstr2aData && (
          <Box sx={{ mt: 3 }}>
            {gstr2aData.error && (
              <Typography color="error" sx={{ mb: 2 }}>
                {gstr2aData.error}
              </Typography>
            )}
            {!gstr2aData.error && (
              <>
                <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
                  <SummaryCard label="Matched" value={gstr2aData.matched?.length || 0} />
                  <SummaryCard label="Mismatched" value={gstr2aData.mismatched?.length || 0} />
                  <SummaryCard label="Not in Portal" value={gstr2aData.notInPortal?.length || 0} />
                  <SummaryCard label="Not in Books" value={gstr2aData.notInBooks?.length || 0} />
                </Stack>
                {(gstr2aData.mismatched?.length > 0 || gstr2aData.notInPortal?.length > 0) && (
                  <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Bill / Invoice</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Our Value</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Portal Value</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Our Tax</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Portal Tax</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(gstr2aData.mismatched || []).map((r, i) => (
                          <TableRow key={`mismatch-${i}`} sx={{ bgcolor: 'rgba(239, 68, 68, 0.06)' }}>
                            <TableCell>{r.billNumber}</TableCell>
                            <TableCell>{r.billDate}</TableCell>
                            <TableCell>₹{r.ourValue?.toFixed(2)}</TableCell>
                            <TableCell>₹{r.portalValue?.toFixed(2)}</TableCell>
                            <TableCell>₹{r.ourTax?.toFixed(2)}</TableCell>
                            <TableCell>₹{r.portalTax?.toFixed(2)}</TableCell>
                            <TableCell sx={{ color: 'error.main', fontWeight: 600 }}>Mismatch</TableCell>
                          </TableRow>
                        ))}
                        {(gstr2aData.notInPortal || []).map((r, i) => (
                          <TableRow key={`notportal-${i}`} sx={{ bgcolor: 'rgba(234, 179, 8, 0.08)' }}>
                            <TableCell>{r.billNumber}</TableCell>
                            <TableCell>{r.billDate}</TableCell>
                            <TableCell>₹{r.ourValue?.toFixed(2)}</TableCell>
                            <TableCell>-</TableCell>
                            <TableCell>₹{r.ourTax?.toFixed(2)}</TableCell>
                            <TableCell>-</TableCell>
                            <TableCell sx={{ color: 'warning.main', fontWeight: 600 }}>Not in GSTR-2A</TableCell>
                          </TableRow>
                        ))}
                        {(gstr2aData.notInBooks || []).map((r, i) => (
                          <TableRow key={`notbooks-${i}`} sx={{ bgcolor: 'rgba(59, 130, 246, 0.06)' }}>
                            <TableCell>{r.invNum}</TableCell>
                            <TableCell>{r.invDate}</TableCell>
                            <TableCell>-</TableCell>
                            <TableCell>₹{r.value?.toFixed(2)}</TableCell>
                            <TableCell>-</TableCell>
                            <TableCell>₹{r.tax?.toFixed(2)}</TableCell>
                            <TableCell sx={{ color: 'info.main', fontWeight: 600 }}>Not in books</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}
          </Box>
        )}
      </Paper>

      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Filing Data Preview</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            JSON structure for GST filing. Upload to GSTN Returns Offline Tool.
          </Typography>
          <Box
            component="pre"
            sx={{
              p: 2,
              bgcolor: '#f8fafc',
              borderRadius: 2,
              overflow: 'auto',
              fontSize: 12,
              fontFamily: 'monospace',
              border: '1px solid #e2e8f0',
            }}
          >
            {JSON.stringify(filingData, null, 2)}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

function SummaryCard({ label, value, strong, color }) {
  return (
    <Box
      sx={{
        border: '1px solid #e2e8f0',
        borderRadius: 1.5,
        px: 2,
        py: 1.5,
        minWidth: 120,
      }}
    >
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: color || '#0f172a',
          fontWeight: strong ? 800 : 700,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default GSTRSummaryPage;
