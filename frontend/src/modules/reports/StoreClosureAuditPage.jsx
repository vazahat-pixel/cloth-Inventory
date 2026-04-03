import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
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
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { InfoOutlined as InfoIcon, Search as SearchIcon, WarningAmberOutlined as WarnIcon } from '@mui/icons-material';
import api from '../../services/api';
import PageHeader from '../../components/erp/PageHeader';
import ReportFilterPanel from './ReportFilterPanel';

function StoreClosureAuditPage() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [filters, setFilters] = useState({ storeId: '', startDate: '', endDate: '' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports/closure/history', { params: filters });
      setHistory(data.data.history || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filters]);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <PageHeader
        title="Store Closure Audit"
        subtitle="Z-Report history and cash variance monitoring across all locations"
        breadcrumbs={[{ label: 'Reports' }, { label: 'Closure Audit', active: true }]}
      />

      <ReportFilterPanel
        filters={filters}
        onFiltersChange={setFilters}
        showStore
        showDateRange
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress color="inherit" />
        </Box>
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, mt: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                  <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Store</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">System Total</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Physical Cash</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Variance</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                  const hasVariance = Math.abs(row.cashDifference) > 1; // Tolerance for small change
                  return (
                    <TableRow key={row._id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{new Date(row.closureDate).toLocaleDateString()}</TableCell>
                      <TableCell>{row.storeId?.name || 'Unknown Store'}</TableCell>
                      <TableCell align="right">₹{row.expectedClosingCash.toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>₹{row.physicalCash.toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ color: hasVariance ? '#ef4444' : '#10b981', fontWeight: 800 }}>
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                          {hasVariance ? `₹${row.cashDifference.toFixed(2)}` : 'PerfectMatch'}
                          {hasVariance && <WarnIcon fontSize="small" sx={{ color: '#ef4444' }} />}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip label="Finalized" size="small" color="success" variant="outlined" />
                      </TableCell>
                      <TableCell>
                         <Tooltip title={row.remarks || 'No remarks'}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="caption" sx={{ maxWidth: 120 }} noWrap>{row.remarks || '-'}</Typography>
                                <Typography variant="caption" color="text.secondary">By {row.closedBy?.name}</Typography>
                            </Stack>
                         </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {history.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                      <Typography color="text.secondary">No closure records found for the period.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={history.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}
    </Box>
  );
}

export default StoreClosureAuditPage;
