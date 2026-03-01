import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
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
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ReportFilterPanel from './ReportFilterPanel';
import ReportExportButton from './ReportExportButton';
import { SummaryChip } from './SalesReportPage';

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const FAST_MOVING_DAYS = 30;
const SLOW_MOVING_DAYS = 90;

function MovementReportPage() {
  const sales = useSelector((state) => state.sales?.records || []);
  const items = useSelector((state) => state.items?.records || []);
  const stock = useSelector((state) => state.inventory?.stock || []);

  const [filters, setFilters] = useState({});
  const [searchText, setSearchText] = useState('');
  const [viewFilter, setViewFilter] = useState('all'); // 'all' | 'fast' | 'slow'
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const today = new Date().toISOString().slice(0, 10);

  const variantSalesMap = useMemo(() => {
    const map = {};
    sales.forEach((sale) => {
      const saleDate = sale.date || today;
      (sale.items || []).forEach((line) => {
        const vid = line.variantId;
        if (!map[vid]) {
          map[vid] = { itemName: line.itemName, size: line.size, color: line.color, sku: line.sku, totalQty: 0, lastSoldDate: saleDate };
        }
        map[vid].totalQty += toNum(line.quantity);
        if (saleDate > (map[vid].lastSoldDate || '')) {
          map[vid].lastSoldDate = saleDate;
        }
      });
    });
    return map;
  }, [sales, today]);

  const variantStockMap = useMemo(() => {
    const map = {};
    stock.forEach((s) => {
      map[s.variantId] = (map[s.variantId] || 0) + toNum(s.quantity);
    });
    return map;
  }, [stock]);

  const movementRows = useMemo(() => {
    const rows = [];
    items.forEach((item) => {
      item.variants?.forEach((v) => {
        const salesData = variantSalesMap[v.id];
        const qtySold = salesData?.totalQty || 0;
        const lastSoldDate = salesData?.lastSoldDate || null;
        const currentStock = variantStockMap[v.id] || 0;

        let daysSinceSold = null;
        if (lastSoldDate) {
          daysSinceSold = Math.floor((new Date(today) - new Date(lastSoldDate)) / (24 * 60 * 60 * 1000));
        }

        const isFastMoving = qtySold > 0 && daysSinceSold !== null && daysSinceSold <= FAST_MOVING_DAYS;
        const isSlowMoving = (qtySold > 0 && daysSinceSold !== null && daysSinceSold > SLOW_MOVING_DAYS) || (currentStock > 0 && qtySold === 0);

        rows.push({
          id: v.id,
          itemName: item.name,
          variant: `${v.size || ''}/${v.color || ''}`.replace(/\/$/, ''),
          sku: v.sku,
          qtySold,
          currentStock,
          lastSoldDate,
          daysSinceSold,
          movement: isFastMoving ? 'Fast' : isSlowMoving ? 'Slow' : 'Normal',
        });
      });
    });
    return rows.sort((a, b) => b.qtySold - a.qtySold);
  }, [items, variantSalesMap, variantStockMap, today]);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return movementRows.filter((row) => {
      const matchesDateFrom =
        !filters.dateFrom || (row.lastSoldDate && row.lastSoldDate >= filters.dateFrom) || !row.lastSoldDate;
      const matchesDateTo =
        !filters.dateTo || (row.lastSoldDate && row.lastSoldDate <= filters.dateTo) || !row.lastSoldDate;
      const matchesView =
        viewFilter === 'all' ||
        (viewFilter === 'fast' && row.movement === 'Fast') ||
        (viewFilter === 'slow' && row.movement === 'Slow');
      const matchesSearch =
        !query ||
        (row.itemName || '').toLowerCase().includes(query) ||
        (row.sku || '').toLowerCase().includes(query);
      return matchesDateFrom && matchesDateTo && matchesView && matchesSearch;
    });
  }, [movementRows, filters, searchText, viewFilter]);

  const paginatedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage],
  );

  const summary = useMemo(() => {
    const fast = filteredRows.filter((r) => r.movement === 'Fast').length;
    const slow = filteredRows.filter((r) => r.movement === 'Slow').length;
    return {
      totalVariants: filteredRows.length,
      fastMoving: fast,
      slowMoving: slow,
    };
  }, [filteredRows]);

  const exportRows = useMemo(
    () =>
      filteredRows.map((r) => ({
        Item: r.itemName,
        Variant: r.variant,
        SKU: r.sku,
        'Qty Sold': r.qtySold,
        'Current Stock': r.currentStock,
        'Last Sold': r.lastSoldDate || '-',
        'Days Since Sold': r.daysSinceSold ?? '-',
        Movement: r.movement,
      })),
    [filteredRows],
  );

  return (
    <Box>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Movement & Alerts
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Fast-moving (sold in last {FAST_MOVING_DAYS} days) and slow-moving items.
          </Typography>
        </Box>

        <ReportFilterPanel filters={filters} onFiltersChange={setFilters} showDateRange />

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
          <Stack direction="row" spacing={1}>
            {['all', 'fast', 'slow'].map((v) => (
              <Typography
                key={v}
                component="span"
                sx={{
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1,
                  cursor: 'pointer',
                  fontWeight: viewFilter === v ? 700 : 600,
                  bgcolor: viewFilter === v ? '#3b82f6' : 'transparent',
                  color: viewFilter === v ? '#fff' : '#64748b',
                  '&:hover': { bgcolor: viewFilter === v ? '#2563eb' : '#f1f5f9' },
                }}
                onClick={() => {
                  setViewFilter(v);
                  setPage(0);
                }}
              >
                {v === 'all' ? 'All' : v === 'fast' ? 'Fast' : 'Slow'}
              </Typography>
            ))}
          </Stack>
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', mb: 1 }}>
          Summary
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          <SummaryChip label="Total Variants" value={summary.totalVariants} />
          <SummaryChip
            label="Fast Moving"
            value={summary.fastMoving}
          />
          <SummaryChip
            label="Slow Moving"
            value={summary.slowMoving}
          />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack direction="row" justifyContent="flex-end" sx={{ p: 1.5 }}>
          <ReportExportButton
            headers={['Item', 'Variant', 'SKU', 'Qty Sold', 'Current Stock', 'Last Sold', 'Days Since Sold', 'Movement']}
            headerKeys={['Item', 'Variant', 'SKU', 'Qty Sold', 'Current Stock', 'Last Sold', 'Days Since Sold', 'Movement']}
            rows={exportRows}
            filename="movement-report.csv"
          />
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Variant</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Qty Sold</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Current Stock</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Last Sold</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Days Since</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Movement</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{row.itemName}</TableCell>
                  <TableCell>{row.variant || '-'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{row.sku}</TableCell>
                  <TableCell align="right">{row.qtySold}</TableCell>
                  <TableCell align="right">{row.currentStock}</TableCell>
                  <TableCell>{row.lastSoldDate || '-'}</TableCell>
                  <TableCell align="right">{row.daysSinceSold ?? '-'}</TableCell>
                  <TableCell>
                    {row.movement === 'Fast' ? (
                      <Typography component="span" sx={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TrendingUpIcon fontSize="small" /> Fast
                      </Typography>
                    ) : row.movement === 'Slow' ? (
                      <Typography component="span" sx={{ color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TrendingDownIcon fontSize="small" /> Slow
                      </Typography>
                    ) : (
                      row.movement
                    )}
                  </TableCell>
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

export default MovementReportPage;
