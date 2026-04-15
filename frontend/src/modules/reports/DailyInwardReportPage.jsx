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
import { fetchMovements } from '../inventory/inventorySlice';

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function DailyInwardReportPage() {
  const dispatch = useDispatch();
  const movements = useSelector((state) => state.inventory?.movements || []);
  const items = useSelector((state) => state.items?.records || []);

  const today = new Date().toISOString().slice(0, 10);
  const [filters, setFilters] = useState({ dateFrom: today, dateTo: today });
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    // Only fetch if a date range is selected, or use today as default
    const params = {};
    if (filters.dateFrom) params.startDate = filters.dateFrom;
    if (filters.dateTo) params.endDate = filters.dateTo;
    
    // Add store filter if selected (Admin view)
    if (filters.warehouseId && filters.warehouseId !== 'all') {
      params.storeId = filters.warehouseId;
    }

    // Default to today if no dates provided to prevent massive load
    if (!filters.dateFrom && !filters.dateTo) {
      params.startDate = today;
      params.endDate = today;
    }

    dispatch(fetchMovements(params));
  }, [dispatch, filters.dateFrom, filters.dateTo, filters.warehouseId, today]);

  // Transform movements for table
  const inwardRows = useMemo(() => {
    // Filter only INWARD movements - Backend now returns type: 'IN'/'OUT' based on qty
    const inMovements = movements.filter((m) => m.type === 'IN');
    const query = searchText.trim().toLowerCase();

    return inMovements.map((m) => ({
      id: m._id || m.id,
      date: new Date(m.createdAt || m.date).toLocaleDateString(),
      itemName: m.itemName || 'Unknown Item',
      sku: m.sku || '-',
      sizeColor: `${m.size || '-'} / ${m.color || '-'}`,
      location: m.locationName || (m.toLocation?.name) || 'Main Inventory',
      quantity: toNum(m.quantity || m.qty),
      reference: m.reference || '-',
      reason: m.sourceType || m.reason || 'Inward',
    })).filter(row => {
       if (!query) return true;
       return row.itemName.toLowerCase().includes(query) || row.sku.toLowerCase().includes(query) || row.reference.toLowerCase().includes(query);
    });
  }, [movements, searchText]);

  const paginatedRows = useMemo(
    () => inwardRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [inwardRows, page, rowsPerPage],
  );

  const summary = useMemo(() => {
    const totalQty = inwardRows.reduce((sum, r) => sum + r.quantity, 0);
    return {
      totalEntries: inwardRows.length,
      totalQuantity: totalQty
    };
  }, [inwardRows]);

  const exportRows = useMemo(
    () =>
      inwardRows.map((r) => ({
        Date: r.date,
        Item: r.itemName,
        SKU: r.sku,
        'Size/Color': r.sizeColor,
        Quantity: r.quantity,
        Location: r.location,
        Reference: r.reference,
        Reason: r.reason
      })),
    [inwardRows],
  );

  return (
    <Box>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Daily Inward Report (GRN/Receipts)
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Track new stock received into inventory location on a specific day.
          </Typography>
        </Box>

        <ReportFilterPanel 
            filters={filters} 
            onFiltersChange={setFilters} 
            showDateRange 
            showWarehouse
        />

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            value={searchText}
            onChange={(e) => {
              setPage(0);
              setSearchText(e.target.value);
            }}
            placeholder="Search by item, SKU or ref"
            sx={{ maxWidth: 320 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', mb: 1 }}>
          Summary
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          <SummaryChip label="Total Receipts" value={summary.totalEntries} />
          <SummaryChip label="Total Quantity Received" value={summary.totalQuantity} strong />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack direction="row" justifyContent="flex-end" sx={{ p: 1.5 }}>
          <ReportExportButton
            headers={['Date', 'Item', 'SKU', 'Size/Color', 'Quantity', 'Location', 'Reference', 'Reason']}
            headerKeys={['Date', 'Item', 'SKU', 'Size/Color', 'Quantity', 'Location', 'Reference', 'Reason']}
            rows={exportRows}
            filename={`daily-inward-report-${filters.dateFrom || today}.csv`}
          />
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Size/Color</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Quantity</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Source/Reason</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.length > 0 ? paginatedRows.map((row, i) => (
                <TableRow key={`${row.id}-${i}`} hover>
                  <TableCell>{row.date}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.itemName}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{row.sku}</TableCell>
                  <TableCell>{row.sizeColor}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#059669' }}>+{row.quantity}</TableCell>
                  <TableCell>{row.location}</TableCell>
                  <TableCell>{row.reference}</TableCell>
                  <TableCell>{row.reason}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                     No inward movements found for the selected date.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={inwardRows.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>
    </Box>
  );
}

export default DailyInwardReportPage;
