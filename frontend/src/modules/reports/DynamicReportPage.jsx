import { useEffect, useMemo, useState } from 'react';
import {
  Box,
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
  CircularProgress,
  Alert,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ReportFilterPanel from './ReportFilterPanel';
import ReportExportButton from './ReportExportButton';
import axios from 'axios';
import { useSelector } from 'react-redux';

/**
 * DynamicReportPage - A reusable engine for various ERP reports.
 * 
 * @param {object} config - Configuration object
 * @param {string} config.title - Page title
 * @param {string} config.description - Page subtitle
 * @param {string} config.endpoint - Backend API endpoint (relative to /api)
 * @param {array} config.columns - Column definitions { field, headerName, align, render, transform }
 * @param {object} config.filterConfig - Boolean flags for ReportFilterPanel (showWarehouse, etc.)
 * @param {string} config.dataKey - Key in response JSON that contains the data array (default: 'report')
 */
function DynamicReportPage({ config }) {
  const { title, description, endpoint, columns = [], filterConfig = {}, dataKey = 'report' } = config;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateFrom: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
  });
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/reports${endpoint}`, {
        params: filters,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const result = response.data.data?.[dataKey] || response.data.data || [];
      setData(Array.isArray(result) ? result : [result]);
    } catch (err) {
      console.error(`Error fetching ${title}:`, err);
      setError(err.response?.data?.message || 'Failed to fetch report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters, endpoint]);

  const filteredRows = useMemo(() => {
    const query = searchText.toLowerCase();
    if (!query) return data;
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.field];
        return String(val || '').toLowerCase().includes(query);
      })
    );
  }, [data, searchText, columns]);

  const paginatedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage]
  );

  const exportRows = useMemo(() => {
    return filteredRows.map(row => {
      const exportRow = {};
      columns.forEach(col => {
        let val = row[col.field];
        if (col.transform) val = col.transform(val, row);
        exportRow[col.headerName] = val;
      });
      return exportRow;
    });
  }, [filteredRows, columns]);

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
            onFiltersChange={setFilters}
            {...filterConfig}
          />
        </Paper>

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <TextField
            size="small"
            placeholder="Search report..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ maxWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                </InputAdornment>
              ),
              sx: { borderRadius: 2, bgcolor: '#ffffff' }
            }}
          />
          
          <ReportExportButton
            headers={columns.map(c => c.headerName)}
            headerKeys={columns.map(c => c.headerName)}
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
                      borderBottom: '2px solid #e2e8f0'
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
                  <TableRow key={index} hover sx={{ '&:last-child td': { border: 0 } }}>
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
        <TablePagination
          component="div"
          count={filteredRows.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{ borderTop: '1px solid #e2e8f0' }}
        />
      </Paper>
    </Box>
  );
}

export default DynamicReportPage;
