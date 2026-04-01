import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
  CircularProgress,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import {
  TrendingUp as SalesIcon,
  ShoppingCart as PurchaseIcon,
  Store as StoreIcon,
  Inventory as ProductIcon,
  ArrowUpward,
} from '@mui/icons-material';
import api from '../../services/api';

function HoMasterDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/daily-summary');
      setData(res.data?.summary);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 20 }}>
        <CircularProgress size={60} thickness={4} sx={{ color: '#10b981' }} />
      </Box>
    );
  }

  const { sales, purchase, storeBreakdown = [], topItems = [] } = data || {};

  return (
    <Box sx={{ p: 4, bgcolor: '#f1f5f9', minHeight: '100vh' }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b', mb: 1, letterSpacing: '-0.025em' }}>
            Management Overview
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
            Real-time daily performance metrics across all stores & warehouse.
          </Typography>
        </Box>

        {/* Top Metric Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <StatCard 
              title="Today's Total Sales" 
              value={`₹${sales?.totalRevenue?.toLocaleString() || 0}`} 
              count={sales?.count || 0}
              label="Invoices Generated"
              icon={<SalesIcon sx={{ color: '#fbbf24', fontSize: 32 }} />}
              gradient="linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
              color="#fff"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <StatCard 
              title="Today's Purchase (Inward)" 
              value={`₹${purchase?.totalCost?.toLocaleString() || 0}`} 
              count={purchase?.count || 0}
              label="GRNs Processed"
              icon={<PurchaseIcon sx={{ color: '#3b82f6', fontSize: 32 }} />}
              gradient="linear-gradient(135deg, #fff 0%, #f8fafc 100%)"
              color="#1e293b"
              border="1px solid #e2e8f0"
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Store Breakdown */}
          <Grid item xs={12} lg={7}>
            <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Store Performance Ranking</Typography>
                  <StoreIcon sx={{ color: '#94a3b8' }} />
                </Stack>
                {storeBreakdown.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                    No sales recorded in any store today yet.
                  </Typography>
                ) : (
                  <Stack spacing={2.5}>
                    {storeBreakdown.map((store, idx) => (
                      <Box key={store.name}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>
                            {store.name}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                            ₹{store.revenue.toLocaleString()}
                          </Typography>
                        </Stack>
                        <LinearProgress 
                          variant="determinate" 
                          value={(store.revenue / (sales?.totalRevenue || 1)) * 100} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4, 
                            bgcolor: '#f1f5f9',
                            '& .MuiLinearProgress-bar': { bgcolor: idx === 0 ? '#10b981' : '#3b82f6' }
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Top Selling Items */}
          <Grid item xs={12} lg={5}>
            <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Top Moving SKUs Today</Typography>
                  <ProductIcon sx={{ color: '#94a3b8' }} />
                </Stack>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Item Name</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b' }}>Qty</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topItems.map((item) => (
                        <TableRow key={item.name}>
                          <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{item.name}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: '#10b981' }}>
                            {item.qty} pcs
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {topItems.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                    No items sold today.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Detailed Sales Report Link */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: 4, 
            bgcolor: '#eff6ff', 
            border: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e40af' }}>
              Want deeper insights?
            </Typography>
            <Typography variant="body2" sx={{ color: '#60a5fa' }}>
              Detailed multi-date range reports are available in the Reports section.
            </Typography>
          </Box>
          <SalesIcon sx={{ color: '#3b82f6', opacity: 0.5, fontSize: 40 }} />
        </Paper>
      </Stack>
    </Box>
  );
}

function StatCard({ title, value, count, label, icon, gradient, color, border }) {
  return (
    <Card 
      elevation={0} 
      sx={{ 
        background: gradient, 
        color: color, 
        borderRadius: 5, 
        border: border,
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-4px)' }
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{ opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 900 }}>
              {value}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: color === '#fff' ? 'rgba(255,255,255,0.1)' : 'rgba(16,185,129,0.1)', display: 'flex' }}>
                <ArrowUpward sx={{ fontSize: 16, color: color === '#fff' ? '#10b981' : '#10b981' }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {count} {label}
              </Typography>
            </Stack>
          </Stack>
          <Box 
            sx={{ 
              p: 2, 
              borderRadius: 4, 
              bgcolor: color === '#fff' ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
              boxShadow: color === '#fff' ? 'none' : 'inset 0 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default HoMasterDashboard;
