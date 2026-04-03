import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
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
  Alert,
} from '@mui/material';
import PageHeader from '../../components/erp/PageHeader';
import { fetchClosurePreview, postFinalizeClosure } from './reportsSlice';
import SaveIcon from '@mui/icons-material/Save';
import CalculateIcon from '@mui/icons-material/Calculate';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const DENOMINATIONS = ['2000', '500', '200', '100', '50', '20', '10', 'Coins'];

function DayEndClosurePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const { closurePreview, loading, error } = useSelector((state) => state.reports);

  const [noteCounts, setNoteCounts] = useState(
    DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d]: 0 }), {})
  );
  const [remarks, setRemarks] = useState('');
  const [success, setSuccess] = useState('');

  const storeId = user?.shopId;

  useEffect(() => {
    if (storeId) {
      dispatch(fetchClosurePreview({ storeId }));
    }
  }, [dispatch, storeId]);

  const physicalCashTotal = useMemo(() => {
    return Object.entries(noteCounts).reduce((acc, [denom, qty]) => {
      const val = denom === 'Coins' ? Number(qty) : Number(denom) * Number(qty);
      return acc + val;
    }, 0);
  }, [noteCounts]);

  const variance = useMemo(() => {
    if (!closurePreview) return 0;
    return physicalCashTotal - closurePreview.expectedClosingCash;
  }, [physicalCashTotal, closurePreview]);

  const handleFinalize = async () => {
    if (!closurePreview) return;
    try {
      await dispatch(postFinalizeClosure({
        storeId,
        physicalCash: physicalCashTotal,
        remarks,
        denominations: noteCounts,
        previewData: closurePreview
      })).unwrap();
      
      setSuccess('Store closed successfully. Redirecting...');
      setTimeout(() => navigate('/reports/dashboard'), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !closurePreview) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box>
      <PageHeader
        title="Day-End Closure (Z-Report)"
        subtitle="Finalize store sales and reconcile physical cash / दिन की समाप्ति की रिपोर्ट"
        breadcrumbs={[{ label: 'Reports' }, { label: 'Closure', active: true }]}
      />

      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Left: Denominations Entry */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalculateIcon sx={{ color: '#6366f1' }} /> PHYSICAL CASH COUNT
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stack spacing={1.5}>
              {DENOMINATIONS.map((denom) => (
                <Box key={denom} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ width: 80, fontWeight: 700 }}>
                    {denom === 'Coins' ? 'Coins' : `₹${denom}`}
                  </Typography>
                  <TextField
                    size="small"
                    type="number"
                    value={noteCounts[denom]}
                    onChange={(e) => setNoteCounts({ ...noteCounts, [denom]: Math.max(0, parseInt(e.target.value || 0)) })}
                    sx={{ width: 100 }}
                  />
                  <Typography variant="body2" sx={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#64748b' }}>
                    = ₹{(denom === 'Coins' ? noteCounts[denom] : Number(denom) * noteCounts[denom]).toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </Stack>

            <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>Total Physical Cash</Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a' }}>₹{physicalCashTotal.toLocaleString()}</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Right: System Totals & Variance */}
        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>SYSTEM CALCULATED TOTALS</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="textSecondary">Opening Cash</Typography>
                    <Typography variant="h6">₹{closurePreview?.openingCash?.toLocaleString() || 0}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="textSecondary">Cash Sales (+)</Typography>
                    <Typography variant="h6" sx={{ color: '#10b981' }}>+₹{closurePreview?.salesCash?.toLocaleString() || 0}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="textSecondary">Expenses (-)</Typography>
                    <Typography variant="h6" sx={{ color: '#ef4444' }}>-₹{closurePreview?.totalExpenses?.toLocaleString() || 0}</Typography>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Expected Cash in Drawer:</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900 }}>₹{closurePreview?.expectedClosingCash?.toLocaleString() || 0}</Typography>
                </Box>
              </CardContent>
            </Card>

            <Paper sx={{ p: 3, borderRadius: 3, bgcolor: variance === 0 ? '#f0fdf4' : variance > 0 ? '#fffbeb' : '#fef2f2', border: '1px solid', borderColor: variance === 0 ? '#bbf7d0' : variance > 0 ? '#fef3c7' : '#fecaca' }}>
               <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Cash Variance / अंतर</Typography>
                    <Typography variant="caption">Difference between physical and system cash</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: variance === 0 ? '#166534' : variance > 0 ? '#92400e' : '#b91c1c' }}>
                      {variance === 0 ? 'CLEARED' : `${variance > 0 ? '+' : ''}₹${variance.toLocaleString()}`}
                    </Typography>
                    {variance !== 0 && (
                       <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#b91c1c' }}>
                         <WarningAmberIcon fontSize="inherit" /> Caution: Discrepancy detected
                       </Typography>
                    )}
                  </Box>
               </Stack>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
               <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>FINAL REMARKS</Typography>
               <TextField
                 fullWidth
                 multiline
                 rows={3}
                 placeholder="Enter reason for variance or any cash notes..."
                 value={remarks}
                 onChange={(e) => setRemarks(e.target.value)}
                 sx={{ mb: 3 }}
               />
               <Button 
                 fullWidth 
                 variant="contained" 
                 size="large" 
                 startIcon={<SaveIcon />} 
                 onClick={handleFinalize}
                 disabled={!closurePreview || loading}
                 sx={{ py: 1.5, borderRadius: 2, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
               >
                 FINALIZE & CLOSE STORE
               </Button>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DayEndClosurePage;
