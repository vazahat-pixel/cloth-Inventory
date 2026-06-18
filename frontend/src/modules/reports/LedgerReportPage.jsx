import { useEffect, useMemo, useState } from 'react';
import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from '../../utils/formatters';
import { useDispatch, useSelector } from 'react-redux';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import useServerPagination from '../../hooks/useServerPagination';
import ServerTablePagination from '../../components/erp/ServerTablePagination';
import api from '../../services/api';
import { extractPaginationMeta } from '../../utils/paginationMeta';
import {
  Box,
  MenuItem,
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
  CircularProgress,
} from '@mui/material';
import ReportFilterPanel from './ReportFilterPanel';
import ReportExportButton from './ReportExportButton';
import { SummaryChip } from './SalesReportPage';
import { fetchMasters } from '../masters/mastersSlice';

function LedgerReportPage() {
  const dispatch = useDispatch();
  const customers = useSelector((state) => state.masters?.customers || []);
  const suppliers = useSelector((state) => state.masters?.suppliers || []);

  const [accountType, setAccountType] = useState('Customer');
  const [filters, setFilters] = useState({});
  const [partyId, setPartyId] = useState('all');
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebouncedValue(searchText, 350);
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({ openingBalance: 0, currentBalance: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const {
    page,
    rowsPerPage,
    resetPage,
    handlePageChange,
    handleRowsPerPageChange,
    buildParams,
    pageSizeOptions,
  } = useServerPagination({ defaultPageSize: 20 });

  useEffect(() => {
    dispatch(fetchMasters('customers'));
    dispatch(fetchMasters('suppliers'));
  }, [dispatch]);

  useEffect(() => {
    const loadLedger = async () => {
      setLoading(true);
      try {
        const params = buildParams({
          accountType,
          partyId,
          search: debouncedSearch,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        });
        const response = await api.get('/reports/party-ledger', { params });
        const data = response.data.data || response.data;
        setEntries(data.entries || []);
        setSummary(data.summary || { openingBalance: 0, currentBalance: 0 });
        setTotal(extractPaginationMeta(response.data).total);
      } catch (err) {
        console.error('Failed to load party ledger', err);
        setEntries([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    loadLedger();
  }, [accountType, partyId, filters, debouncedSearch, page, rowsPerPage, buildParams]);

  const exportRows = useMemo(
    () =>
      entries.map((e) => ({
        Date: formatDateDDMMYYYY(e.date),
        Reference: e.reference,
        Narration: e.narration,
        Debit: e.debit,
        Credit: e.credit,
        Balance: e.balance,
      })),
    [entries],
  );

  return (
    <Box>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Ledger Report
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Account-wise ledger with debit, credit, and running balance.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            size="small"
            select
            label="Account Type"
            value={accountType}
            onChange={(e) => { resetPage(); setAccountType(e.target.value); }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="Customer">Customer</MenuItem>
            <MenuItem value="Supplier">Supplier</MenuItem>
          </TextField>
          <TextField
            size="small"
            select
            label={accountType === 'Customer' ? 'Customer' : 'Supplier'}
            value={partyId}
            onChange={(e) => { resetPage(); setPartyId(e.target.value); }}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="all">All</MenuItem>
            {accountType === 'Customer'
              ? customers.map((c) => (
                  <MenuItem key={c.id || c._id} value={c.id || c._id}>{c.customerName || c.name}</MenuItem>
                ))
              : suppliers.map((s) => (
                  <MenuItem key={s.id || s._id} value={s.id || s._id}>{s.supplierName || s.name}</MenuItem>
                ))}
          </TextField>
          <TextField
            size="small"
            placeholder="Search reference or narration"
            value={searchText}
            onChange={(e) => { resetPage(); setSearchText(e.target.value); }}
            sx={{ flex: 1 }}
          />
        </Stack>

        <ReportFilterPanel
          filters={filters}
          onFiltersChange={(next) => { resetPage(); setFilters(next); }}
          showDateRange
        />

        <Stack direction="row" spacing={2}>
          <SummaryChip label="Opening Balance" value={`₹ ${summary.openingBalance?.toLocaleString() || 0}`} />
          <SummaryChip label="Current Balance" value={`₹ ${summary.currentBalance?.toLocaleString() || 0}`} />
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Narration</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Debit</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Credit</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : entries.length ? (
                entries.map((e, idx) => (
                  <TableRow key={`${e.reference}-${idx}`} hover>
                    <TableCell>{formatDateDDMMYYYY(e.date)}</TableCell>
                    <TableCell>{e.reference}</TableCell>
                    <TableCell>{e.narration}</TableCell>
                    <TableCell align="right">{e.debit ? `₹ ${e.debit.toLocaleString()}` : '—'}</TableCell>
                    <TableCell align="right">{e.credit ? `₹ ${e.credit.toLocaleString()}` : '—'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>₹ {(e.balance || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#64748b' }}>
                    No ledger entries for the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <ServerTablePagination
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={pageSizeOptions}
          disabled={loading}
        />
      </Paper>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <ReportExportButton
          headers={['Date', 'Reference', 'Narration', 'Debit', 'Credit', 'Balance']}
          headerKeys={['Date', 'Reference', 'Narration', 'Debit', 'Credit', 'Balance']}
          rows={exportRows}
          filename="ledger-report.csv"
        />
      </Box>
    </Box>
  );
}

export default LedgerReportPage;
