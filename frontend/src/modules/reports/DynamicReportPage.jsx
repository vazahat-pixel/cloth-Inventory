import { useCallback, useEffect, useMemo, useState } from 'react';
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
  Alert,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ReportFilterPanel from './ReportFilterPanel';
import ReportExportButton from './ReportExportButton';
import api from '../../services/api';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import useServerPagination from '../../hooks/useServerPagination';
import ServerTablePagination from '../../components/erp/ServerTablePagination';
import { extractListPayload, extractPaginationMeta } from '../../utils/paginationMeta';

function DynamicReportPage({ config }) {
  const {
    title,
    description,
    endpoint,
    columns = [],
    filterConfig = {},
    dataKey = 'report',
    apiBase = '/reports',
    serverPagination = false,
    listKeys,
  } = config;

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateFrom: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
  });
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebouncedValue(searchText, 300);
  const {
    page,
    rowsPerPage,
    resetPage,
    handlePageChange,
    handleRowsPerPageChange,
    buildParams,
    pageSizeOptions,
  } = useServerPagination({ defaultPageSize: 10 });

  const resolvedListKeys = listKeys || [dataKey, 'report', 'records', 'challans', 'entries', 'visits', 'logs'];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        ...filters,
        ...(serverPagination ? buildParams({ search: debouncedSearch }) : {}),
      };
      const url = apiBase ? `${apiBase}${endpoint}` : endpoint;
      const response = await api.get(url, { params });

      const rows = extractListPayload(response.data, resolvedListKeys);
      setData(Array.isArray(rows) ? rows : []);

      if (serverPagination) {
        const meta = extractPaginationMeta(response.data);
        setTotal(meta.total);
      } else {
        setTotal(Array.isArray(rows) ? rows.length : 0);
      }
    } catch (err) {
      console.error(`Error fetching ${title}:`, err);
      setError(err.response?.data?.message || 'Failed to fetch report data.');
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [apiBase, buildParams, debouncedSearch, endpoint, filters, resolvedListKeys, serverPagination, title]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRows = useMemo(() => {
    if (serverPagination) return data;
    const query = debouncedSearch.toLowerCase();
    if (!query) return data;
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.field];
        return String(val || '').toLowerCase().includes(query);
      }),
    );
  }, [columns, data, debouncedSearch, serverPagination]);

  const paginatedRows = useMemo(() => {
    if (serverPagination) return filteredRows;
    return filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredRows, page, rowsPerPage, serverPagination]);

  const exportRows = useMemo(() => filteredRows.map((row) => {
    const exportRow = {};
    columns.forEach((col) => {
      let val = row[col.field];
      if (col.transform) val = col.transform(val, row);
      exportRow[col.headerName] = val;
    });
    return exportRow;
  }), [columns, filteredRows]);

  const paginationCount = serverPagination ? total : filteredRows.length;

  return (
    <Box>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
            {description}
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 3, bgcolor: '#ffffff' }}>
          <ReportFilterPanel
            filters={filters}
            onFiltersChange={(next) => { resetPage(); setFilters(next); }}
            {...filterConfig}
          />
        </Paper>

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <TextField
            size="small"
            placeholder="Search report..."
            value={searchText}
            onChange={(e) => { resetPage(); setSearchText(e.target.value); }}
            sx={{ maxWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                </InputAdornment>
              ),
              sx: { borderRadius: 2, bgcolor: '#ffffff' },
            }}
          />

          <ReportExportButton
            headers={columns.map((c) => c.headerName)}
            headerKeys={columns.map((c) => c.headerName)}
            rows={exportRows}
            filename={`${title.toLowerCase().replace(/\s+/g, '-')}.csv`}
          />
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden', bgcolor: '#ffffff' }}>
        <TableContainer sx={{ maxHeight: '60vh' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col.field}
                    align={col.align || 'left'}
                    sx={{
                      fontWeight: 800,
                      bgcolor: '#f8fafc',
                      color: '#475569',
                      py: 1.5,
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      letterSpacing: '0.05em',
                      borderBottom: '2px solid #e2e8f0',
                    }}
                  >
                    {col.headerName}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={32} thickness={5} sx={{ color: '#3b82f6' }} />
                    <Typography variant="body2" sx={{ mt: 2, color: '#64748b', fontWeight: 600 }}>
                      Loading dynamic data...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                      No records found for the selected criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row, index) => (
                  <TableRow key={row.id || row._id || index} hover sx={{ '&:last-child td': { border: 0 } }}>
                    {columns.map((col) => (
                      <TableCell key={col.field} align={col.align || 'left'} sx={{ py: 1.25, color: '#1e293b', fontWeight: 500 }}>
                        {col.render ? col.render(row[col.field], row) : (col.transform ? col.transform(row[col.field], row) : row[col.field])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <ServerTablePagination
          count={paginationCount}
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

export default DynamicReportPage;
