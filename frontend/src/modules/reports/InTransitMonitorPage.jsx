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
  TableRow,
  Typography,
  Chip,
  IconButton,
  Button,
} from '@mui/material';
import { LocalShipping as TruckIcon, Refresh as RefreshIcon, Visibility as ViewIcon } from '@mui/icons-material';
import api from '../../services/api';
import PageHeader from '../../components/erp/PageHeader';

function InTransitMonitorPage() {
  const [loading, setLoading] = useState(false);
  const [transits, setTransits] = useState([]);

  const fetchTransits = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports/inventory/in-transit');
      setTransits(data.data.report || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransits();
  }, []);

  return (
    <Box>
      <PageHeader
        title="In-Transit Stock Monitor"
        subtitle="Real-time tracking of inter-store shipments and warehouse dispatches"
        breadcrumbs={[{ label: 'Logistics' }, { label: 'In-Transit', active: true }]}
      />

      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 3 }}>
        <Button startIcon={<RefreshIcon />} onClick={fetchTransits} variant="outlined">Refresh Data</Button>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, bgcolor: '#f0fdfa' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: '#ccfbf1' }}>
                  <TruckIcon sx={{ color: '#0d9488' }} />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#134e4a' }}>{transits.length}</Typography>
                  <Typography variant="body2" sx={{ color: '#115e59', fontWeight: 600 }}>Active Shipments</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          {/* Total Units in Transit */}
          <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, bgcolor: '#eff6ff' }}>
             <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: '#dbeafe' }}>
                  <TruckIcon sx={{ color: '#2563eb' }} />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e3a8a' }}>
                    {transits.reduce((acc, t) => acc + t.itemsCount, 0)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#1e40af', fontWeight: 600 }}>Total Units on Road</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress color="inherit" />
        </Box>
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, mt: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Dispatch #</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Source</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Destination</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Qty</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Est. Value</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Sent On</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Logistics</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transits.map((t) => (
                  <TableRow key={t.dispatchNumber} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>{t.dispatchNumber}</TableCell>
                    <TableCell>{t.source}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t.destination}</TableCell>
                    <TableCell align="right">{t.itemsCount} units</TableCell>
                    <TableCell align="right">₹{t.estimatedValue.toLocaleString()}</TableCell>
                    <TableCell>{new Date(t.dispatchedAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>{t.vehicle || 'Standard'}</Typography>
                      <Typography variant="caption" color="text.secondary">{t.driver || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label="IN-TRANSIT" size="small" color="primary" sx={{ fontWeight: 800, borderRadius: 1 }} />
                    </TableCell>
                  </TableRow>
                ))}
                {transits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                      <Typography color="text.secondary">No items currently in transit.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}

export default InTransitMonitorPage;
