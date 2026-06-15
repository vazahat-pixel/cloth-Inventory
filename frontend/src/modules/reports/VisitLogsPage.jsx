import { useEffect, useState } from 'react';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import useServerPagination from '../../hooks/useServerPagination';
import ServerTablePagination from '../../components/erp/ServerTablePagination';
import api from '../../services/api';
import { extractPaginationMeta } from '../../utils/paginationMeta';
import {
  Box,
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
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PageHeader from '../../components/erp/PageHeader';
import ReportFilterPanel from './ReportFilterPanel';

function VisitLogsPage() {
  const [visits, setVisits] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebouncedValue(searchText, 350);
  const [filters, setFilters] = useState({});
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
    const loadVisits = async () => {
      setLoading(true);
      try {
        const params = buildParams({
          search: debouncedSearch,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          storeId: filters.storeId,
        });
        const response = await api.get('/reports/visit-logs', { params });
        const data = response.data.data || response.data;
        setVisits(data.visits || []);
        setTotal(extractPaginationMeta(response.data).total);
      } catch (err) {
        console.error('Failed to load visit logs', err);
        setVisits([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    loadVisits();
  }, [debouncedSearch, filters, page, rowsPerPage, buildParams]);

  return (
    <Box>
      <PageHeader
        title="Visit Logs"
        subtitle="Store visit history derived from completed sales transactions."
        breadcrumbs={[{ label: 'Reports' }, { label: 'Visit Logs', active: true }]}
      />

      <Stack spacing={2} sx={{ mb: 2 }}>
        <ReportFilterPanel
          filters={filters}
          onFiltersChange={(next) => { resetPage(); setFilters(next); }}
          showDateRange
          showStore
        />
        <TextField
          size="small"
          placeholder="Search customer, mobile, or invoice..."
          value={searchText}
          onChange={(e) => { resetPage(); setSearchText(e.target.value); }}
          sx={{ maxWidth: 360 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Visit Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mobile</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Store</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Invoice</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : visits.length ? (
                visits.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.visitDate ? new Date(row.visitDate).toLocaleString() : '—'}</TableCell>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell>{row.customerMobile || '—'}</TableCell>
                    <TableCell>{row.storeName || '—'}</TableCell>
                    <TableCell>{row.invoiceNumber}</TableCell>
                    <TableCell align="right">₹ {(row.amount || 0).toLocaleString()}</TableCell>
                    <TableCell>{row.paymentMode || '—'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#64748b' }}>
                    No visit logs found.
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
    </Box>
  );
}

export default VisitLogsPage;
