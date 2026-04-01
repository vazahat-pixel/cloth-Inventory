import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from '@mui/material';
import ReportFilterPanel from './ReportFilterPanel';
import ReportExportButton from './ReportExportButton';
import axios from 'axios';
import { useSelector } from 'react-redux';

function OrderReportPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateFrom: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
  });

  const token = useSelector((state) => state.auth.token);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/reports/orders`, {
        params: filters,
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch Order report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const OrderTable = ({ title, rows = [] }) => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b', mb: 2 }}>{title}</Typography>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Count</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Total Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4, color: '#94a3b8' }}>No records found</TableCell>
                </TableRow>
              ) : (
                rows.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ fontWeight: 600 }}>{row._id || 'N/A'}</TableCell>
                    <TableCell>{row.count}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>₹{row.total?.toLocaleString() || 0}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );

  const exportRows = useMemo(() => {
    const saleRows = (data?.saleOrders || []).map(r => ({ type: 'SALE ORDER', status: r._id, count: r.count, total: r.total }));
    const purchaseRows = (data?.purchaseOrders || []).map(r => ({ type: 'PURCHASE ORDER', status: r._id, count: r.count, total: r.total }));
    return [...saleRows, ...purchaseRows];
  }, [data]);

  return (
    <Box>
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>Order Reports Summary</Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Summary of Sales and Purchase Orders across lifecycle statuses.</Typography>
            </Box>
            <ReportExportButton
              headers={['Order Type', 'Status', 'Count', 'Total Value']}
              headerKeys={['type', 'status', 'count', 'total']}
              rows={exportRows}
              filename="order-summary-report.csv"
            />
        </Box>

        <Paper elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 3, bgcolor: '#ffffff' }}>
          <ReportFilterPanel filters={filters} onFiltersChange={setFilters} />
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <OrderTable title="Sale Orders Statistics" rows={data?.saleOrders} />
            </Grid>
            <Grid item xs={12} md={6}>
              <OrderTable title="Purchase Orders Statistics" rows={data?.purchaseOrders} />
            </Grid>
          </Grid>
        )}
      </Stack>
    </Box>
  );
}

export default OrderReportPage;
