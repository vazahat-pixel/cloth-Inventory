import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  LinearProgress,
  Tooltip,
} from '@mui/material';
import PageHeader from '../../components/erp/PageHeader';
import { fetchYieldAnalysis } from './reportsSlice';
import ReportFilterPanel from './ReportFilterPanel';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import RecyclingIcon from '@mui/icons-material/Recycling';
import BarChartIcon from '@mui/icons-material/BarChart';

function YieldAnalysisPage() {
  const dispatch = useDispatch();
  const { yieldData, loading } = useSelector((state) => state.reports);
  const [filters, setFilters] = useState({
     startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
     endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    dispatch(fetchYieldAnalysis(filters));
  }, [dispatch, filters]);

  const summary = useMemo(() => {
    if (!yieldData.length) return { avgWaste: 0, totalProduced: 0, bestSupplier: 'N/A' };
    const totalW = yieldData.reduce((a, b) => a + Number(b.wastagePercentage), 0);
    const totalP = yieldData.reduce((a, b) => a + b.garmentsProduced, 0);
    const sorted = [...yieldData].sort((a, b) => a.wastagePercentage - b.wastagePercentage);
    return {
      avgWaste: (totalW / yieldData.length).toFixed(2),
      totalProduced: totalP,
      bestSupplier: sorted[0]?.supplierName || 'N/A'
    };
  }, [yieldData]);

  return (
    <Box>
      <PageHeader
        title="Production Yield Analysis"
        subtitle="Track material consumption efficiency and supplier wastage / उत्पादन क्षमता रिपोर्ट"
        breadcrumbs={[{ label: 'Reports' }, { label: 'Yield Analysis', active: true }]}
      />

      <ReportFilterPanel 
        filters={filters} 
        onFiltersChange={setFilters} 
        showDateRange 
        showSupplier 
      />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <SummaryCard 
            title="Total Finished Goods" 
            value={summary.totalProduced} 
            subtitle="Units Received" 
            icon={<PrecisionManufacturingIcon sx={{ color: '#3b82f6' }} />}
            color="#dbeafe"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <SummaryCard 
            title="Avg. Fabrication Wastage" 
            value={`${summary.avgWaste}%`} 
            subtitle="Overall Efficiency" 
            icon={<RecyclingIcon sx={{ color: '#10b981' }} />}
            color="#dcfce7"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <SummaryCard 
            title="Best Performing Contractor" 
            value={summary.bestSupplier} 
            subtitle="Lowest Wastage Ratio" 
            icon={<BarChartIcon sx={{ color: '#8b5cf6' }} />}
            color="#f3e8ff"
          />
        </Grid>
      </Grid>

      {loading ? (
        <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>SUPPLIER / CONTRACTOR</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>BATCHES</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>PRODUCED (PCS)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>MATERIAL USED</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>WASTAGE ANALYSIS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>EFFICIENCY</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {yieldData.map((row) => (
                <TableRow key={row.supplierId} hover>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{row.supplierName}</Typography>
                  </TableCell>
                  <TableCell align="right">{row.batchCount}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{row.garmentsProduced}</TableCell>
                  <TableCell align="right">{row.totalMaterialUsed} Units</TableCell>
                  <TableCell align="center" sx={{ minWidth: 200 }}>
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ flex: 1 }}>
                           <LinearProgress 
                             variant="determinate" 
                             value={Math.min(row.wastagePercentage * 5, 100)} // Visual multiplier
                             sx={{ 
                               height: 8, 
                               borderRadius: 4, 
                               bgcolor: '#f1f5f9',
                               '& .MuiLinearProgress-bar': {
                                 bgcolor: row.wastagePercentage > 5 ? '#ef4444' : '#10b981'
                               }
                             }} 
                           />
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: row.wastagePercentage > 5 ? '#b91c1c' : '#15803d' }}>
                           {row.wastagePercentage}%
                        </Typography>
                     </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Average material consumed per garment">
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>
                        {row.yieldRatio} <Typography component="span" variant="caption">/ pc</Typography>
                      </Typography>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {yieldData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#94a3b8', fontStyle: 'italic' }}>
                    No production data found for the selected period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

function SummaryCard({ title, value, subtitle, icon, color }) {
  return (
    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 700, mb: 1, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{title}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', mb: 0.5 }}>{value}</Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>{subtitle}</Typography>
          </Box>
          <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: color }}>
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default YieldAnalysisPage;
