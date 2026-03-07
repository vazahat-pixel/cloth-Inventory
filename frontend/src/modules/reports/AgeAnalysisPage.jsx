import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ReportFilterPanel from './ReportFilterPanel';
import ReportExportButton from './ReportExportButton';
import { SummaryChip } from './SalesReportPage';
import { fetchPurchases } from '../purchase/purchaseSlice';
import { fetchStockOverview } from '../inventory/inventorySlice';

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const AGE_BUCKETS = [
  { key: '0-10', label: '0-10 days', min: 0, max: 10 },
  { key: '10-30', label: '10-30 days', min: 10, max: 30 },
  { key: '30-60', label: '30-60 days', min: 30, max: 60 },
  { key: '60-90', label: '60-90 days', min: 60, max: 90 },
  { key: '90+', label: '90+ days', min: 90, max: Infinity },
];

function AgeAnalysisPage() {
  const dispatch = useDispatch();
  const purchases = useSelector((state) => state.purchase?.records || []);
  const stock = useSelector((state) => state.inventory?.stock || []);
  const items = useSelector((state) => state.items?.records || []);

  useEffect(() => {
    dispatch(fetchPurchases());
    dispatch(fetchStockOverview());
  }, [dispatch]);

  const [filters, setFilters] = useState({});
  const [searchText, setSearchText] = useState('');
  const [bucketFilter, setBucketFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const today = new Date();

  const variantCostMap = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      item.variants?.forEach((v) => {
        map[v.id] = toNum(v.costPrice) || toNum(v.sellingPrice) * 0.6;
      });
    });
    return map;
  }, [items]);

  const firstPurchaseByVariantWarehouse = useMemo(() => {
    const map = {};
    purchases.forEach((p) => {
      const billDate = p.billDate || p.date;
      if (!billDate) return;
      (p.items || []).forEach((line) => {
        const key = `${line.variantId}-${p.warehouseId || ''}`;
        if (!map[key] || billDate < map[key]) {
          map[key] = billDate;
        }
      });
    });
    return map;
  }, [purchases]);

  const lotAgeData = useMemo(() => {
    const rows = [];
    stock.forEach((s) => {
      const qtyOnHand = toNum(s.quantity);
      if (qtyOnHand <= 0) return;
      const key = `${s.variantId}-${s.warehouseId || ''}`;
      const firstReceived = firstPurchaseByVariantWarehouse[key] || new Date().toISOString().slice(0, 10);
      const daysInStock = Math.floor((today - new Date(firstReceived)) / (24 * 60 * 60 * 1000));
      const bucket = AGE_BUCKETS.find((b) => daysInStock >= b.min && daysInStock < b.max) || AGE_BUCKETS[AGE_BUCKETS.length - 1];
      const cost = variantCostMap[s.variantId] || 0;
      const value = qtyOnHand * cost;

      rows.push({
        id: s.id,
        itemName: s.itemName,
        variant: `${s.size || ''}/${s.color || ''}`.replace(/\/$/, ''),
        sku: s.sku,
        lotNumber: s.lotNumber || '-',
        firstReceived,
        warehouseId: s.warehouseId,
        qtyOnHand,
        daysInStock,
        ageBucket: bucket.key,
        ageLabel: bucket.label,
        cost,
        value,
      });
    });
    return rows.sort((a, b) => b.daysInStock - a.daysInStock);
  }, [stock, firstPurchaseByVariantWarehouse, variantCostMap]);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return lotAgeData.filter((row) => {
      const matchesDateFrom =
        !filters.dateFrom || (row.firstReceived && row.firstReceived >= filters.dateFrom);
      const matchesDateTo = !filters.dateTo || (row.firstReceived && row.firstReceived <= filters.dateTo);
      const matchesWarehouse =
        !filters.warehouseId || filters.warehouseId === 'all' || row.warehouseId === filters.warehouseId;
      const matchesBucket = bucketFilter === 'all' || row.ageBucket === bucketFilter;
      const matchesSearch =
        !query ||
        (row.itemName || '').toLowerCase().includes(query) ||
        (row.sku || '').toLowerCase().includes(query);
      return matchesDateFrom && matchesDateTo && matchesBucket && matchesWarehouse && matchesSearch;
    });
  }, [lotAgeData, filters, searchText, bucketFilter]);

  const paginatedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage],
  );

  const summary = useMemo(() => {
    const byBucket = {};
    AGE_BUCKETS.forEach((b) => {
      byBucket[b.key] = { count: 0, qty: 0, value: 0 };
    });
    filteredRows.forEach((r) => {
      if (byBucket[r.ageBucket]) {
        byBucket[r.ageBucket].count += 1;
        byBucket[r.ageBucket].qty += r.qtyOnHand;
        byBucket[r.ageBucket].value += r.value;
      }
    });
    let totalValue = 0;
    filteredRows.forEach((r) => {
      totalValue += r.value;
    });
    return { byBucket, totalValue, totalVariants: filteredRows.length };
  }, [filteredRows]);

  const exportRows = useMemo(
    () =>
      filteredRows.map((r) => ({
        Item: r.itemName,
        Variant: r.variant,
        SKU: r.sku,
        Lot: r.lotNumber,
        'Qty On Hand': r.qtyOnHand,
        'Days In Stock': r.daysInStock,
        'Age Bucket': r.ageLabel,
        Cost: r.cost.toFixed(2),
        Value: r.value.toFixed(2),
      })),
    [filteredRows],
  );

  return (
    <Box>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Age Analysis
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Stock age distribution: 0-10 days, 10-30 days, 30-60 days, 60-90 days, 90+ days.
          </Typography>
        </Box>

        <ReportFilterPanel filters={filters} onFiltersChange={setFilters} showDateRange showWarehouse />

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            value={searchText}
            onChange={(e) => {
              setPage(0);
              setSearchText(e.target.value);
            }}
            placeholder="Search by item or SKU"
            sx={{ maxWidth: 320 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            <Typography
              component="span"
              sx={{
                px: 1,
                py: 0.5,
                borderRadius: 1,
                cursor: 'pointer',
                fontWeight: bucketFilter === 'all' ? 700 : 600,
                bgcolor: bucketFilter === 'all' ? '#3b82f6' : 'transparent',
                color: bucketFilter === 'all' ? '#fff' : '#64748b',
                fontSize: '0.8rem',
              }}
              onClick={() => { setBucketFilter('all'); setPage(0); }}
            >
              All
            </Typography>
            {AGE_BUCKETS.map((b) => (
              <Typography
                key={b.key}
                component="span"
                sx={{
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  cursor: 'pointer',
                  fontWeight: bucketFilter === b.key ? 700 : 600,
                  bgcolor: bucketFilter === b.key ? '#3b82f6' : 'transparent',
                  color: bucketFilter === b.key ? '#fff' : '#64748b',
                  fontSize: '0.8rem',
                }}
                onClick={() => { setBucketFilter(b.key); setPage(0); }}
              >
                {b.label}
              </Typography>
            ))}
          </Stack>
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', mb: 1 }}>
          Summary by Age Bucket
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          {AGE_BUCKETS.map((b) => (
            <SummaryChip
              key={b.key}
              label={b.label}
              value={`${summary.byBucket[b.key]?.count || 0} (₹${(summary.byBucket[b.key]?.value || 0).toFixed(0)})`}
            />
          ))}
          <SummaryChip label="Total Value" value={`₹${summary.totalValue.toFixed(2)}`} strong />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack direction="row" justifyContent="flex-end" sx={{ p: 1.5 }}>
          <ReportExportButton
            headers={['Item', 'Variant', 'SKU', 'Lot', 'Qty On Hand', 'Days In Stock', 'Age Bucket', 'Cost', 'Value']}
            headerKeys={['Item', 'Variant', 'SKU', 'Lot', 'Qty On Hand', 'Days In Stock', 'Age Bucket', 'Cost', 'Value']}
            rows={exportRows}
            filename="age-analysis.csv"
          />
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Variant</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Lot</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Qty On Hand</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Days In Stock</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Age Bucket</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{row.itemName}</TableCell>
                  <TableCell>{row.variant || '-'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{row.sku}</TableCell>
                  <TableCell>{row.lotNumber}</TableCell>
                  <TableCell align="right">{row.qtyOnHand}</TableCell>
                  <TableCell align="right">{row.daysInStock}</TableCell>
                  <TableCell>{row.ageLabel}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>₹{row.value.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredRows.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Paper>
    </Box>
  );
}

export default AgeAnalysisPage;
