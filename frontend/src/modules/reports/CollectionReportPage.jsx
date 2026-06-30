import { useEffect, useMemo, useState } from 'react';
import { formatDateDDMMYYYY } from '../../utils/formatters';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ReportFilterPanel from './ReportFilterPanel';
import ReportExportButton from './ReportExportButton';
import { SummaryChip } from './SalesReportPage';
import ServerTablePagination from '../../components/erp/ServerTablePagination';
import { REPORT_FETCH_PARAMS } from './reportConstants';
import { buildCollectionRowsFromSales } from './saleReportUtils';
import { fetchBankReceipts } from '../accounts/accountsSlice';
import { fetchSalesForReport } from '../sales/salesSlice';

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function CollectionReportPage() {
  const dispatch = useDispatch();
  const sales = useSelector((state) => state.sales?.reportRecords || []);
  const bankReceipts = useSelector((state) => state.accounts?.bankReceipts || []);
  const customers = useSelector((state) => state.masters?.customers || []);
  const user = useSelector((state) => state.auth.user);
  const isStoreStaff = user?.role !== 'Admin' && user?.role !== 'admin';

  const [filters, setFilters] = useState({});
  const [paymentModeFilter, setPaymentModeFilter] = useState('all');

  const PAYMENT_MODE_OPTIONS = ['all', 'Cash', 'Card', 'UPI', 'Cheque', 'Credit', 'Gift Voucher'];
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    if (isStoreStaff && user?.shopId) {
      setFilters((prev) => ({
        ...prev,
        warehouseId: user.shopId,
      }));
    }
  }, [isStoreStaff, user?.shopId]);

  useEffect(() => {
    const storeFilter = isStoreStaff
      ? user?.shopId
      : (filters.warehouseId && filters.warehouseId !== 'all' ? filters.warehouseId : undefined);
    dispatch(fetchSalesForReport({
      ...REPORT_FETCH_PARAMS,
      startDate: filters.dateFrom,
      endDate: filters.dateTo,
      storeId: storeFilter,
    }));
    dispatch(fetchBankReceipts());
  }, [dispatch, isStoreStaff, user?.shopId, filters.dateFrom, filters.dateTo, filters.warehouseId]);

  useEffect(() => {
    setPage(0);
  }, [filters.dateFrom, filters.dateTo, filters.warehouseId]);

  const customerMap = useMemo(
    () => (customers || []).reduce((acc, c) => ({ ...acc, [c.id]: c.customerName }), {}),
    [customers],
  );

  const rows = useMemo(() => {
    const from = filters.dateFrom || '';
    const to = filters.dateTo || '';
    const inRange = (d) => (!from || d >= from) && (!to || d <= to);

    const list = buildCollectionRowsFromSales(sales, {
      customerMap,
      dateFrom: from,
      dateTo: to,
    });

    bankReceipts.forEach((r) => {
      if (!inRange(r.date)) return;
      const amt = toNum(r.amount);
      if (amt <= 0) return;
      list.push({
        date: r.date,
        source: r.chequeNo ? `Chq ${r.chequeNo}` : 'Receipt',
        sourceType: 'Bank Receipt',
        customerId: r.customerId,
        customerName: customerMap[r.customerId] || '-',
        amount: amt,
        mode: 'Cheque',
      });
    });
    list.sort((a, b) => a.date.localeCompare(b.date));
    return list;
  }, [filters.dateFrom, filters.dateTo, sales, bankReceipts, customerMap]);

  const filteredRows = useMemo(() => {
    if (paymentModeFilter === 'all') return rows;
    return rows.filter((r) => r.mode === paymentModeFilter);
  }, [rows, paymentModeFilter]);

  const paginatedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage],
  );

  const summary = useMemo(() => {
    const byMode = {};
    let total = 0;
    filteredRows.forEach((r) => {
      total += r.amount;
      byMode[r.mode] = (byMode[r.mode] || 0) + r.amount;
    });
    return { total, byMode };
  }, [filteredRows]);

  const exportRows = useMemo(
    () =>
      filteredRows.map((r) => ({
        Date: formatDateDDMMYYYY(r.date),
        Source: r.source,
        'Source Type': r.sourceType,
        Customer: r.customerName,
        Amount: r.amount,
        Mode: r.mode,
      })),
    [filteredRows],
  );

  return (
    <Box>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Collection Report
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Cash and cheque collections from sales and bank receipts.
          </Typography>
        </Box>

        <ReportFilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          showDateRange
          showWarehouse={!isStoreStaff}
          compact
        />
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
          {PAYMENT_MODE_OPTIONS.map((mode) => (
            <Chip
              key={mode}
              label={mode === 'all' ? 'All Modes' : mode}
              color={paymentModeFilter === mode ? 'primary' : 'default'}
              variant={paymentModeFilter === mode ? 'filled' : 'outlined'}
              onClick={() => { setPaymentModeFilter(mode); setPage(0); }}
              sx={{ fontWeight: 700, cursor: 'pointer' }}
            />
          ))}
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', mb: 1 }}>
          Summary
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          <SummaryChip label="Total Collections" value={`₹${summary.total.toFixed(2)}`} strong />
          {Object.entries(summary.byMode).map(([mode, amt]) => (
            <SummaryChip key={mode} label={mode} value={`₹${amt.toFixed(2)}`} />
          ))}
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack direction="row" justifyContent="flex-end" sx={{ p: 1.5 }}>
          <ReportExportButton
            headers={['Date', 'Source', 'Source Type', 'Customer', 'Amount', 'Mode']}
            headerKeys={['Date', 'Source', 'Source Type', 'Customer', 'Amount', 'Mode']}
            rows={exportRows}
            filename="collection-report.csv"
          />
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mode</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#64748b' }}>
                    No collections in the selected period.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((r, i) => (
                  <TableRow key={`${r.date}-${r.source}-${i}`} hover>
                    <TableCell>{formatDateDDMMYYYY(r.date)}</TableCell>
                    <TableCell>{r.source}</TableCell>
                    <TableCell>{r.sourceType}</TableCell>
                    <TableCell>{r.customerName}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>₹{toNum(r.amount).toFixed(2)}</TableCell>
                    <TableCell>{r.mode}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <ServerTablePagination
          count={filteredRows.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>
    </Box>
  );
}

export default CollectionReportPage;
