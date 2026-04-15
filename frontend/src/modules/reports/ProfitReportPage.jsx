import { useEffect, useState } from 'react';
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
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import ReportFilterPanel from './ReportFilterPanel';
import ReportExportButton from './ReportExportButton';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { getFriendlyErrorMessage } from '../../utils/errorMessageHelper';

const SummaryChip = ({ label, value, strong }) => (
    <Box sx={{ 
      p: 1.5, 
      border: '1px solid #e2e8f0', 
      borderRadius: 2, 
      minWidth: 120,
      bgcolor: strong ? '#f8fafc' : 'transparent'
    }}>
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>{label}</Typography>
      <Typography variant="body1" sx={{ fontWeight: 800, color: '#0f172a' }}>{value}</Typography>
    </Box>
);

function ProfitReportPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateFrom: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const token = useSelector((state) => state.auth.token);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/reports/profit`, {
        params: {
          startDate: filters.dateFrom,
          endDate: filters.dateTo
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      // The backend returns { report: [...] }
      setData(response.data.report || []);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Profit data load karne mein dikkat hui.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const summary = {
    totalTransactions: data.length,
    totalQuantity: data.reduce((acc, curr) => acc + curr.qtySold, 0),
    totalRevenue: data.reduce((acc, curr) => acc + curr.revenue, 0),
    totalCost: data.reduce((acc, curr) => acc + curr.totalCost, 0),
    totalProfit: data.reduce((acc, curr) => acc + curr.profit, 0),
  };
  summary.profitPct = summary.totalRevenue > 0 ? (summary.totalProfit / summary.totalRevenue) * 100 : 0;

  const paginatedRows = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const exportRows = data.map((r) => ({
    Item: r.name,
    SKU: r.sku,
    Variant: r.variant || '-',
    'Qty Sold': r.qtySold,
    'Total Cost': r.totalCost.toFixed(2),
    Revenue: r.revenue.toFixed(2),
    Profit: r.profit.toFixed(2),
    'Margin %': r.margin.toFixed(1),
  }));

  return (
    <Box>
      <Stack spacing={3} sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    Profit Analysis & Margins
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Monitor your item-wise profitability and cost performance.
                </Typography>
            </Box>
            <ReportExportButton 
                rows={exportRows} 
                filename="Profit_Analysis_Report" 
                headers={['Item', 'SKU', 'Variant', 'Qty Sold', 'Total Cost', 'Revenue', 'Profit', 'Margin %']}
                headerKeys={['Item', 'SKU', 'Variant', 'Qty Sold', 'Total Cost', 'Revenue', 'Profit', 'Margin %']}
            />
        </Box>

        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 2 }}>
            <ReportFilterPanel filters={filters} onFiltersChange={setFilters} />
        </Paper>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      ) : (
        <>
          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 2, mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Performance Summary
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <SummaryChip label="Items Group" value={summary.totalTransactions} />
              <SummaryChip label="Quantity Sold" value={summary.totalQuantity} />
              <SummaryChip label="Total Revenue" value={`₹${summary.totalRevenue.toLocaleString()}`} />
              <SummaryChip label="Total Cost" value={`₹${summary.totalCost.toLocaleString()}`} />
              <SummaryChip label="Total Profit" value={`₹${summary.totalProfit.toLocaleString()}`} strong />
              <SummaryChip label="Avg Margin" value={`${summary.profitPct.toFixed(1)}%`} />
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Item Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>SKU</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Variant</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Qty Sold</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Revenue</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Cost Value</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Profit</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Margin%</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRows.map((row, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                      <TableCell sx={{ color: '#64748b', fontSize: '12px' }}>{row.sku}</TableCell>
                      <TableCell>{row.variant || '-'}</TableCell>
                      <TableCell align="right">{row.qtySold}</TableCell>
                      <TableCell align="right">₹{row.revenue.toLocaleString()}</TableCell>
                      <TableCell align="right">₹{row.totalCost.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: row.profit >= 0 ? '#10b981' : '#ef4444' }}>
                        ₹{row.profit.toLocaleString()}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{row.margin.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                  {paginatedRows.length === 0 && (
                      <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#64748b' }}>
                              Iss period mein koi data nahi mila.
                          </TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={data.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50]}
            />
          </Paper>
        </>
      )}
    </Box>
  );
}

export default ProfitReportPage;
