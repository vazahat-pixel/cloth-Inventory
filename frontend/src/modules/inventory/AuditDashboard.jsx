import React, { useState, useEffect } from 'react';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  LinearProgress, 
  Avatar, 
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Stack,
  Button
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HistoryIcon from '@mui/icons-material/History';
import api from '../../services/api';

/**
 * AuditDashboard — The 'Wow' factor for client demos.
 * Visualizes total system health, real-time activity, and audit status.
 */
const AuditDashboard = () => {
  const navigate = useAppNavigate();
  const [metrics, setMetrics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mRes, sRes] = await Promise.all([
        api.get('/inventory/demo-metrics'),
        api.get('/inventory/dashboard-summary')
      ]);
      setMetrics(mRes.data.data);
      setSummary(sRes.data.data);
    } catch (err) {
      console.error('Audit Load Failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LinearProgress />;

  const statCards = [
    { title: 'Total Revenue', value: `₹${metrics?.totalSales?.toLocaleString()}`, icon: <TrendingUpIcon />, color: '#10b981' },
    { title: 'Total Inventory Items', value: metrics?.totalStock, icon: <Inventory2Icon />, color: '#3b82f6' },
    { title: 'Pending GRNs', value: metrics?.pendingGRNCount, icon: <PendingActionsIcon />, color: '#f59e0b' },
    { title: 'Pending Payments', value: metrics?.pendingPaymentCount, icon: <ReceiptLongIcon />, color: '#ef4444' },
  ];

  return (
    <Box sx={{ p: 1, bgcolor: 'transparent' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>
            System Audit & Demo Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Real-time visibility into the Garment ERP traceability engine and health metrics.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button 
            variant="contained" 
            startIcon={<HistoryIcon />} 
            onClick={() => navigate('/inventory/item-journey')}
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, borderRadius: 2, fontWeight: 800, px: 3 }}
          >
            Trace Item Journey
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<Inventory2Icon />}
            onClick={() => navigate('/inventory/audit-view')}
            sx={{ borderRadius: 2, fontWeight: 800, px: 3, borderColor: '#3b82f6', color: '#3b82f6' }}
          >
            Stock Audit View
          </Button>
        </Stack>
      </Box>

      {/* Primary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ 
              borderRadius: 4, 
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.05)',
              overflow: 'visible',
              position: 'relative'
            }}>
              <CardContent sx={{ pt: 3 }}>
                <Avatar sx={{ 
                  bgcolor: `${card.color}15`, 
                  color: card.color, 
                  width: 56, 
                  height: 56,
                  position: 'absolute',
                  top: -20,
                  right: 20,
                  boxShadow: `0 8px 16px ${card.color}20`
                }}>
                  {card.icon}
                </Avatar>
                <Typography variant="overline" sx={{ color: '#94a3b8', fontWeight: 700 }}>{card.title}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b' }}>{card.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent System Activity */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5 }}>
              <HistoryIcon sx={{ color: '#3b82f6' }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Global Activity Stream</Typography>
              <Chip label="Live Trace" size="small" sx={{ ml: 'auto', bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} />
            </Box>
            <List>
              {summary?.recentActivity?.map((log, idx) => (
                <React.Fragment key={log._id}>
                  <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 45 }}>
                      <CheckCircleOutlineIcon sx={{ color: '#10b981', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{log.action.replace(/_/g, ' ')}</Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>{new Date(log.createdAt).toLocaleTimeString()}</Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                          {log.userId?.name} performed {log.module} action. Trace ID: {log._id.slice(-6).toUpperCase()}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {idx < (summary.recentActivity.length - 1) && <Divider variant="inset" component="li" sx={{ opacity: 0.5 }} />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* System Health / Errors */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 4, bgcolor: '#0f172a', border: '1px solid #1e293b' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5 }}>
              <ErrorOutlineIcon sx={{ color: '#f43f5e' }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#f8fafc' }}>Health Monitoring</Typography>
            </Box>
            
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>Traceability Score</Typography>
                <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 800 }}>100%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={100} sx={{ height: 8, borderRadius: 10, bgcolor: '#1e293b', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }} />
            </Box>

            <Typography variant="overline" sx={{ color: '#475569', fontWeight: 800 }}>Recent Exceptions</Typography>
            <Box sx={{ mt: 2 }}>
              {summary?.recentErrors?.length === 0 ? (
                <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(16, 185, 129, 0.05)', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: '#10b981' }}>All systems nominal. No errors detected.</Typography>
                </Box>
              ) : (
                summary?.recentErrors?.map(error => (
                  <Box key={error._id} sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.1)' }}>
                    <Typography variant="body2" sx={{ color: '#fca5a5', fontWeight: 700, mb: 0.5 }}>{error.message}</Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>{error.method} {error.path}</Typography>
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AuditDashboard;
