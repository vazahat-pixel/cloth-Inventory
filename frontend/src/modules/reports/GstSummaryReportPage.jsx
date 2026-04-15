import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Grid,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import ReportFilterPanel from './ReportFilterPanel';
import ReportExportButton from './ReportExportButton';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { getFriendlyErrorMessage } from '../../utils/errorMessageHelper';

function GstSummaryReportPage() {
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
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/reports/gst-summary`, {
        params: {
            startDate: filters.dateFrom,
            endDate: filters.dateTo
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data.report);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'GST summary load karne mein dikkat hui.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const SummaryCard = ({ title, data }) => (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 4, bgcolor: '#ffffff' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b', mb: 2 }}>{title}</Typography>
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" sx={{ color: '#64748b' }}>Taxable Value:</Typography>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{data?.taxableValue?.toLocaleString() || 0}</Typography>
        </Stack>
        <Divider sx={{ borderStyle: 'dashed' }} />
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" sx={{ color: '#64748b' }}>CGST:</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{data?.cgst?.toLocaleString() || 0}</Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" sx={{ color: '#64748b' }}>SGST:</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{data?.sgst?.toLocaleString() || 0}</Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" sx={{ color: '#64748b' }}>IGST:</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{data?.igst?.toLocaleString() || 0}</Typography>
        </Stack>
        <Divider />
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>Total Tax:</Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#3b82f6' }}>₹{data?.totalTax?.toLocaleString() || 0}</Typography>
        </Stack>
      </Stack>
    </Paper>
  );

  return (
    <Box>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>GST Summary Report</Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Consolidated view of output tax on sales and input tax on purchases.</Typography>
        </Box>

        <Paper elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 3, bgcolor: '#ffffff' }}>
          <ReportFilterPanel filters={filters} onFiltersChange={setFilters} />
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <SummaryCard title="Sales (Output GST)" data={data?.sales} />
            </Grid>
            <Grid item xs={12} md={6}>
              <SummaryCard title="Purchases (Input GST)" data={data?.purchases} />
            </Grid>
          </Grid>
        )}
      </Stack>
    </Box>
  );
}

export default GstSummaryReportPage;
