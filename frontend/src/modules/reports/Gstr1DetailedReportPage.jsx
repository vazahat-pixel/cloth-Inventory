import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  Button,
  Pagination,
} from '@mui/material';
import ReportFilterPanel from './ReportFilterPanel';
import api from '../../services/api';
import * as XLSX from 'xlsx';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import TableViewOutlinedIcon from '@mui/icons-material/TableViewOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import SearchIcon from '@mui/icons-material/Search';

const ITEM_PAGE_SIZE = 100;

const defaultDateRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
};

function buildCSV(headers, rows, keys) {
  const escape = (v) => {
    const s = String(v ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const headerLine = headers.map(escape).join(',');
  const dataLines = rows.map((row) =>
    keys.map((k) => escape(row[k])).join(','),
  );
  return [headerLine, ...dataLines].join('\r\n');
}

function SummaryStat({ label, value, color }) {
  return (
    <Card elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 3, flex: 1, minWidth: '150px' }}>
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Typography>
      <Typography variant="h6" sx={{ fontWeight: 900, color: color || '#0f172a', mt: 0.5 }}>₹{Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
    </Card>
  );
}

function Gstr1DetailedReportPage() {
  const initialDates = useMemo(() => defaultDateRange(), []);
  const [data, setData] = useState(null);
  const [itemWiseRows, setItemWiseRows] = useState([]);
  const [itemWiseMeta, setItemWiseMeta] = useState(null);
  const [itemPage, setItemPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [itemLoading, setItemLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [draftFilters, setDraftFilters] = useState({
    startDate: initialDates.startDate,
    endDate: initialDates.endDate,
    warehouseId: 'all',
    brandId: 'all',
    categoryId: 'all',
    customerId: 'all',
    salesmanId: 'all',
  });
  const [appliedFilters, setAppliedFilters] = useState(draftFilters);

  const buildParams = useCallback((extra = {}) => ({
    startDate: appliedFilters.startDate,
    endDate: appliedFilters.endDate,
    warehouseId: appliedFilters.warehouseId,
    brandId: appliedFilters.brandId,
    categoryId: appliedFilters.categoryId,
    customerId: appliedFilters.customerId,
    salesmanId: appliedFilters.salesmanId,
    ...extra,
  }), [appliedFilters]);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/reports/detailed-gst', {
        params: buildParams({ includeItemWise: false }),
      });
      const report = response.data.report || response.data.data?.report;
      setData(report);
      setItemWiseRows([]);
      setItemWiseMeta(null);
      setItemPage(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch GST data.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const fetchItemWise = useCallback(async (page = 1) => {
    setItemLoading(true);
    try {
      const response = await api.get('/reports/detailed-gst', {
        params: buildParams({
          includeItemWise: true,
          itemPage: page,
          itemLimit: ITEM_PAGE_SIZE,
        }),
      });
      const report = response.data.report || response.data.data?.report;
      setItemWiseRows(report?.itemWise || []);
      setItemWiseMeta(report?.itemWiseMeta || null);
      setItemPage(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch item-wise GST data.');
    } finally {
      setItemLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (tab === 2 && appliedFilters) {
      fetchItemWise(1);
    }
  }, [tab, appliedFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyFilters = () => {
    setAppliedFilters({ ...draftFilters });
  };

  const handleTabChange = (_e, value) => {
    setTab(value);
  };

  const fetchAllItemWiseForExport = async () => {
    const response = await api.get('/reports/detailed-gst', {
      params: buildParams({
        includeItemWise: true,
        itemPage: 1,
        itemLimit: 500,
      }),
    });
    const report = response.data.report || response.data.data?.report;
    const meta = report?.itemWiseMeta;
    if (!meta?.total || meta.total <= 500) {
      return report?.itemWise || [];
    }
    const pages = meta.pages || Math.ceil(meta.total / 500);
    const all = [...(report.itemWise || [])];
    for (let p = 2; p <= pages; p += 1) {
      const res = await api.get('/reports/detailed-gst', {
        params: buildParams({ includeItemWise: true, itemPage: p, itemLimit: 500 }),
      });
      const r = res.data.report || res.data.data?.report;
      all.push(...(r?.itemWise || []));
    }
    return all;
  };

  const handleExportAllToExcel = async () => {
    if (!data) return;
    const exportItems = await fetchAllItemWiseForExport();
    const sortedItemsForExport = [...exportItems].sort((a, b) => (a.storeName || '').localeCompare(b.storeName || ''));
    const detailedData = [];

    if (sortedItemsForExport.length > 0) {
      let currentStore = sortedItemsForExport[0].storeName;
      let storeTotals = { qty: 0, taxable: 0, cgst: 0, sgst: 0, net: 0 };

      const pushSubtotalToExport = (store) => {
        detailedData.push({
          'Bill No': 'Subtotal',
          'Bill Date': '',
          'Customer Name': '',
          'Branch / Store': store || 'N/A',
          'Category / Group': '',
          'HSN Code': '',
          'MRP': '',
          'Discount %': '',
          'Total Quantity': storeTotals.qty,
          'Taxable Amount': Number(storeTotals.taxable.toFixed(2)),
          'CGST %': '',
          'CGST Amount': Number(storeTotals.cgst.toFixed(2)),
          'SGST / IGST %': '',
          'SGST / IGST Amount': Number(storeTotals.sgst.toFixed(2)),
          'Net Amount': Number(storeTotals.net.toFixed(2)),
        });
      };

      sortedItemsForExport.forEach((item) => {
        if (item.storeName !== currentStore) {
          pushSubtotalToExport(currentStore);
          currentStore = item.storeName;
          storeTotals = { qty: 0, taxable: 0, cgst: 0, sgst: 0, net: 0 };
        }
        storeTotals.qty += item.quantity || 0;
        storeTotals.taxable += item.taxable || 0;
        storeTotals.cgst += item.cgstAmount || 0;
        storeTotals.sgst += item.sgstIgstAmount || 0;
        storeTotals.net += item.netAmount || 0;
        detailedData.push({
          'Bill No': item.invoice,
          'Bill Date': new Date(item.date).toLocaleDateString(),
          'Customer Name': item.customer,
          'Branch / Store': item.storeName || 'N/A',
          'Category / Group': item.category,
          'HSN Code': item.hsn,
          'MRP': item.mrp || 0,
          'Discount %': `${item.discount || 0}%`,
          'Total Quantity': item.quantity,
          'Taxable Amount': item.taxable,
          'CGST %': `${item.cgstRate}%`,
          'CGST Amount': item.cgstAmount,
          'SGST / IGST %': `${item.sgstIgstRate}%`,
          'SGST / IGST Amount': item.sgstIgstAmount,
          'Net Amount': item.netAmount,
        });
      });
      pushSubtotalToExport(currentStore);
    }

    detailedData.push({
      'Bill No': 'Grand Total',
      'Total Quantity': exportItems.reduce((sum, item) => sum + item.quantity, 0),
      'Taxable Amount': data.summary.totalTaxableValue,
      'CGST Amount': data.summary.totalCGST,
      'SGST / IGST Amount': data.summary.totalSGST + data.summary.totalIGST,
      'Net Amount': data.summary.grandTotal,
    });

    const monthStoreData = (data.monthStoreSummary || []).map((m) => ({
      'Branch / Store': m.branchName,
      'Quantity': m.qty,
      'Taxable Value': m.taxable,
      'CGST': m.cgst,
      'SGST': m.sgst,
      'IGST': m.igst,
      'Total Tax': m.totalTax,
      'Invoice Value': m.invoiceValue,
    }));

    const slabData = data.slabSummary.map((s) => ({
      'Slab': s.slab,
      'Taxable Value': s.taxable,
      'CGST': s.cgst,
      'SGST': s.sgst,
      'IGST': s.igst,
      'Total Tax': s.totalTax,
      'Invoice Value': s.invoiceValue,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailedData), 'Detailed Item-wise');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(monthStoreData), 'Location Summary');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(slabData), 'Slab Summary');
    XLSX.writeFile(wb, `GST_Statutory_Report_${appliedFilters.startDate}_to_${appliedFilters.endDate}.xlsx`);
  };

  const handleExportCSV = async () => {
    if (!data) return;
    let headers;
    let rows;
    let filename;

    if (tab === 0) {
      headers = ['Branch Name', 'Quantity', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total Tax', 'Invoice Value'];
      rows = (data.monthStoreSummary || []).map((m) => ({
        'Branch Name': m.branchName,
        'Quantity': m.qty,
        'Taxable Value': m.taxable,
        'CGST': m.cgst,
        'SGST': m.sgst,
        'IGST': m.igst,
        'Total Tax': m.totalTax,
        'Invoice Value': m.invoiceValue,
      }));
      filename = `GST_Location_Summary_${appliedFilters.startDate}_to_${appliedFilters.endDate}.csv`;
    } else if (tab === 1) {
      headers = ['Slab', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total Tax', 'Invoice Value'];
      rows = data.slabSummary.map((s) => ({
        'Slab': s.slab,
        'Taxable Value': s.taxable,
        'CGST': s.cgst,
        'SGST': s.sgst,
        'IGST': s.igst,
        'Total Tax': s.totalTax,
        'Invoice Value': s.invoiceValue,
      }));
      filename = `GST_Slab_Summary_${appliedFilters.startDate}_to_${appliedFilters.endDate}.csv`;
    } else {
      const items = tab === 2 ? await fetchAllItemWiseForExport() : [];
      headers = ['Bill No', 'Bill Date', 'Customer Name', 'Branch / Store', 'Category / Group', 'HSN Code', 'MRP', 'Discount %', 'Total Quantity', 'Taxable Amount', 'CGST %', 'CGST Amount', 'SGST / IGST %', 'SGST / IGST Amount', 'Net Amount'];
      rows = items.map((item) => ({
        'Bill No': item.invoice,
        'Bill Date': new Date(item.date).toLocaleDateString(),
        'Customer Name': item.customer,
        'Branch / Store': item.storeName || 'N/A',
        'Category / Group': item.category,
        'HSN Code': item.hsn,
        'MRP': item.mrp || 0,
        'Discount %': `${item.discount || 0}%`,
        'Total Quantity': item.quantity,
        'Taxable Amount': item.taxable,
        'CGST %': `${item.cgstRate}%`,
        'CGST Amount': item.cgstAmount,
        'SGST / IGST %': `${item.sgstIgstRate}%`,
        'SGST / IGST Amount': item.sgstIgstAmount,
        'Net Amount': item.netAmount,
      }));
      filename = `GST_Detailed_Report_${appliedFilters.startDate}_to_${appliedFilters.endDate}.csv`;
    }

    const csvContent = buildCSV(headers, rows, headers);
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const itemWiseDisplayRows = useMemo(() => itemWiseRows, [itemWiseRows]);

  return (
    <Box>
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #gst-report-content, #gst-report-content * { visibility: visible; }
            #gst-report-content { position: absolute; left: 0; top: 0; width: 100%; background: #fff !important; color: #000 !important; padding: 0 !important; margin: 0 !important; }
            .no-print { display: none !important; }
            table { width: 100% !important; border-collapse: collapse !important; }
            th, td { border: 1px solid #cbd5e1 !important; padding: 6px 8px !important; font-size: 11px !important; }
            th { background-color: #f1f5f9 !important; color: #000 !important; }
          }
        `}
      </style>

      <Stack spacing={3} id="gst-report-content">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }} className="no-print">
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>Statutory GST Report</Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Statutory GST summary, HSN registers, and slab details for accounting and CA filing.</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" startIcon={<PrintOutlinedIcon />} onClick={() => window.print()} sx={{ fontWeight: 700, borderRadius: 2 }}>Print / Save PDF</Button>
            <Button size="small" variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={handleExportCSV} sx={{ fontWeight: 700, borderRadius: 2 }}>Export CSV</Button>
            <Button size="small" variant="contained" color="primary" startIcon={<TableViewOutlinedIcon />} onClick={handleExportAllToExcel} sx={{ fontWeight: 700, borderRadius: 2 }}>Download Excel (All Sheets)</Button>
          </Stack>
        </Box>

        <Paper elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 3 }} className="no-print">
          <ReportFilterPanel
            filters={{
              ...draftFilters,
              dateFrom: draftFilters.startDate,
              dateTo: draftFilters.endDate,
            }}
            onFiltersChange={(newFilters) => {
              setDraftFilters({
                ...newFilters,
                startDate: newFilters.dateFrom,
                endDate: newFilters.dateTo,
              });
            }}
            showWarehouse
            showBrand
            showCategory
            showCustomer
            showSalesman
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
              onClick={handleApplyFilters}
              disabled={loading}
              sx={{ fontWeight: 700, borderRadius: 2, minWidth: 140 }}
            >
              Apply Filters
            </Button>
          </Box>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : !data ? (
          <Alert severity="info">No data found for the selected period.</Alert>
        ) : (
          <>
            <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
              <SummaryStat label="Total Taxable Value" value={data.summary.totalTaxableValue} />
              <SummaryStat label="Total CGST" value={data.summary.totalCGST} color="#10b981" />
              <SummaryStat label="Total SGST" value={data.summary.totalSGST} color="#f59e0b" />
              <SummaryStat label="Total IGST" value={data.summary.totalIGST} color="#ec4899" />
              <SummaryStat label="Total GST" value={data.summary.totalGST} color="#3b82f6" />
              <SummaryStat label="Grand Total" value={data.summary.grandTotal} color="#0f172a" />
            </Stack>

            <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
              <Tabs value={tab} onChange={handleTabChange} sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }} className="no-print">
                <Tab label="Store / Location Summary" sx={{ fontWeight: 700, px: 3 }} />
                <Tab label="GST Slab Summary" sx={{ fontWeight: 700, px: 3 }} />
                <Tab label="Item-Wise Detailed" sx={{ fontWeight: 700, px: 3 }} />
                <Tab label="B2B Invoice List" sx={{ fontWeight: 700, px: 3 }} />
              </Tabs>

              <Box sx={{ p: 0 }}>
                {tab === 0 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 850 }}>Branch/Store Name</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 850 }}>Quantity</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 850 }}>Taxable Value</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 850 }}>CGST</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 850 }}>SGST</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 850 }}>IGST</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 850 }}>Total Tax</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 850 }}>Invoice Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(data.monthStoreSummary || []).map((h, i) => (
                          <TableRow key={i} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{h.branchName}</TableCell>
                            <TableCell align="center">{h.qty}</TableCell>
                            <TableCell align="right">₹{h.taxable.toFixed(2)}</TableCell>
                            <TableCell align="right">₹{h.cgst.toFixed(2)}</TableCell>
                            <TableCell align="right">₹{h.sgst.toFixed(2)}</TableCell>
                            <TableCell align="right">₹{h.igst.toFixed(2)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#3b82f6' }}>₹{h.totalTax.toFixed(2)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>₹{h.invoiceValue.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow sx={{ bgcolor: '#f8fafc', '& td': { fontWeight: 900 } }}>
                          <TableCell>Total</TableCell>
                          <TableCell align="center">{(data.monthStoreSummary || []).reduce((sum, h) => sum + h.qty, 0)}</TableCell>
                          <TableCell align="right">₹{data.summary.totalTaxableValue.toFixed(2)}</TableCell>
                          <TableCell align="right">₹{data.summary.totalCGST.toFixed(2)}</TableCell>
                          <TableCell align="right">₹{data.summary.totalSGST.toFixed(2)}</TableCell>
                          <TableCell align="right">₹{data.summary.totalIGST.toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ color: '#3b82f6' }}>₹{data.summary.totalGST.toFixed(2)}</TableCell>
                          <TableCell align="right">₹{data.summary.grandTotal.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {tab === 1 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 850 }}>GST Slab</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 850 }}>Taxable Value</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 850 }}>CGST</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 850 }}>SGST</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 850 }}>IGST</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 850 }}>Total Tax</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 850 }}>Invoice Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.slabSummary.map((s, i) => (
                          <TableRow key={i} hover>
                            <TableCell sx={{ fontWeight: 750 }}>{s.slab}</TableCell>
                            <TableCell align="right">₹{s.taxable.toFixed(2)}</TableCell>
                            <TableCell align="right">₹{s.cgst.toFixed(2)}</TableCell>
                            <TableCell align="right">₹{s.sgst.toFixed(2)}</TableCell>
                            <TableCell align="right">₹{s.igst.toFixed(2)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#3b82f6' }}>₹{s.totalTax.toFixed(2)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>₹{s.invoiceValue.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {tab === 2 && (
                  <>
                    {itemLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={32} /></Box>
                    ) : (
                      <TableContainer sx={{ maxHeight: 600 }}>
                        <Table size="small" stickyHeader>
                          <TableHead sx={{ '& .MuiTableCell-root': { bgcolor: '#f1f5f9', fontWeight: 850 } }}>
                            <TableRow>
                              <TableCell>Bill No</TableCell>
                              <TableCell>Bill Date</TableCell>
                              <TableCell>Customer</TableCell>
                              <TableCell>Branch / Store</TableCell>
                              <TableCell>Category</TableCell>
                              <TableCell>HSN</TableCell>
                              <TableCell align="right">Qty</TableCell>
                              <TableCell align="right">Taxable</TableCell>
                              <TableCell align="right">Net</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {itemWiseDisplayRows.map((item, i) => (
                              <TableRow key={`${item.invoice}-${item.hsn}-${i}`} hover>
                                <TableCell sx={{ fontWeight: 700 }}>{item.invoice}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(item.date).toLocaleDateString()}</TableCell>
                                <TableCell>{item.customer}</TableCell>
                                <TableCell>{item.storeName || 'N/A'}</TableCell>
                                <TableCell>{item.category}</TableCell>
                                <TableCell>{item.hsn}</TableCell>
                                <TableCell align="right">{item.quantity}</TableCell>
                                <TableCell align="right">₹{item.taxable.toFixed(2)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>₹{item.netAmount.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                    {itemWiseMeta?.total > ITEM_PAGE_SIZE && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, py: 2 }} className="no-print">
                        <Typography variant="body2" color="text.secondary">
                          Showing page {itemPage} of {itemWiseMeta.pages} ({itemWiseMeta.total} lines)
                        </Typography>
                        <Pagination
                          count={itemWiseMeta.pages}
                          page={itemPage}
                          onChange={(_e, p) => fetchItemWise(p)}
                          color="primary"
                          size="small"
                        />
                      </Box>
                    )}
                  </>
                )}

                {tab === 3 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 850 }}>Invoice</TableCell>
                          <TableCell sx={{ fontWeight: 850 }}>Customer</TableCell>
                          <TableCell sx={{ fontWeight: 850 }}>GSTIN</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 850 }}>Taxable</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 850 }}>IGST</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 850 }}>CGST</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 850 }}>SGST</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 850 }}>Grand Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.b2b.map((inv, i) => (
                          <TableRow key={i} hover>
                            <TableCell sx={{ fontWeight: 700 }}>{inv.invoice}</TableCell>
                            <TableCell>{inv.customer}</TableCell>
                            <TableCell sx={{ color: '#10b981', fontWeight: 700 }}>{inv.gstin}</TableCell>
                            <TableCell align="right">₹{inv.taxable.toFixed(2)}</TableCell>
                            <TableCell align="right">₹{inv.igst.toFixed(2)}</TableCell>
                            <TableCell align="right">₹{inv.cgst.toFixed(2)}</TableCell>
                            <TableCell align="right">₹{inv.sgst.toFixed(2)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>₹{inv.grandTotal.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </Paper>
          </>
        )}
      </Stack>
    </Box>
  );
}

export default Gstr1DetailedReportPage;
