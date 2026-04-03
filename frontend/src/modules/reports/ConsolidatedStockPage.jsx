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
  Chip,
  IconButton,
} from '@mui/material';
import PageHeader from '../../components/erp/PageHeader';
import { fetchConsolidatedStock } from './reportsSlice';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import StoreIcon from '@mui/icons-material/Store';
import EngineeringIcon from '@mui/icons-material/Engineering';
import Inventory2Icon from '@mui/icons-material/Inventory2';

function ConsolidatedStockPage() {
  const dispatch = useDispatch();
  const { consolidatedStock, loading } = useSelector((state) => state.reports);
  const warehouses = useSelector((state) => state.masters.warehouses || []);
  const stores = useSelector((state) => state.masters.stores || []);
  const suppliers = useSelector((state) => state.masters.suppliers || []);

  useEffect(() => {
    dispatch(fetchConsolidatedStock());
  }, [dispatch]);

  const getName = (type, id) => {
    if (type === 'WH') return warehouses.find(w => (w._id || w.id) === id)?.name || 'Unknown Warehouse';
    if (type === 'STORE') return stores.find(s => (s._id || s.id) === id)?.name || 'Unknown Store';
    if (type === 'CONT') return suppliers.find(s => (s._id || s.id) === id)?.name || 'Unknown Contractor';
    return id;
  };

  const dashboardData = useMemo(() => {
    if (!consolidatedStock) return [];
    return [
      ...(consolidatedStock.warehouseStock || []).map(s => ({ ...s, typeLabel: 'Warehouse', type: 'WH', icon: <WarehouseIcon />, color: '#3b82f6' })),
      ...(consolidatedStock.storeStock || []).map(s => ({ ...s, typeLabel: 'Retail Store', type: 'STORE', icon: <StoreIcon />, color: '#10b981' })),
      ...(consolidatedStock.contractorStock || []).map(s => ({ ...s, typeLabel: 'In Production', type: 'CONT', icon: <EngineeringIcon />, color: '#f59e0b' }))
    ];
  }, [consolidatedStock]);

  const summary = consolidatedStock?.summary || { warehouseUnits: 0, storeUnits: 0, contractorUnits: 0 };
  const grandTotal = summary.warehouseUnits + summary.storeUnits + summary.contractorUnits;

  return (
    <Box>
       <PageHeader
        title="Consolidated Multi-Store Inventory"
        subtitle="Live stock visibility across Warehouses, Stores, and Contractors."
        breadcrumbs={[{ label: 'Reports' }, { label: 'Consolidated Stock', active: true }]}
        actions={[
           <IconButton key="refresh" onClick={() => dispatch(fetchConsolidatedStock())} color="primary" sx={{ bgcolor: '#eff6ff' }}>
             <RefreshIcon />
           </IconButton>
        ]}
      />

      <Grid container spacing={3} sx={{ mb: 4 }}>
         <Grid item xs={12} md={3}>
            <SummaryStat title="Global Stock Pool" value={grandTotal} subtitle="All Locations Consolidated" icon={<Inventory2Icon />} />
         </Grid>
         <Grid item xs={12} md={3}>
            <SummaryStat title="Warehouse Stock" value={summary.warehouseUnits} subtitle="Bulk Material & Ready Stock" icon={<WarehouseIcon sx={{ color: '#3b82f6' }} />} color="#3b82f6" />
         </Grid>
         <Grid item xs={12} md={3}>
            <SummaryStat title="Retail Inventory" value={summary.storeUnits} subtitle="Live at Showrooms" icon={<StoreIcon sx={{ color: '#10b981' }} />} color="#10b981" />
         </Grid>
         <Grid item xs={12} md={3}>
            <SummaryStat title="Work-in-Progress" value={summary.contractorUnits} subtitle="Stock with Suppliers" icon={<EngineeringIcon sx={{ color: '#f59e0b' }} />} color="#f59e0b" />
         </Grid>
      </Grid>

      {loading ? (
        <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
           <Table>
             <TableHead sx={{ bgcolor: '#f8fafc' }}>
               <TableRow>
                 <TableCell sx={{ fontWeight: 800 }}>LOCATION TYPE</TableCell>
                 <TableCell sx={{ fontWeight: 800 }}>LOCATION NAME</TableCell>
                 <TableCell align="right" sx={{ fontWeight: 800 }}>STOCK QUANTITY</TableCell>
                 <TableCell align="right" sx={{ fontWeight: 800 }}>DISTRIBUTION %</TableCell>
               </TableRow>
             </TableHead>
             <TableBody>
               {dashboardData.map((row) => (
                 <TableRow key={`${row.type}-${row._id}`} hover>
                   <TableCell>
                      <Chip 
                        icon={row.icon} 
                        label={row.typeLabel} 
                        size="small" 
                        sx={{ 
                          bgcolor: `${row.color}15`, 
                          color: row.color, 
                          fontWeight: 700,
                          '& .MuiChip-icon': { color: 'inherit' }
                        }} 
                      />
                   </TableCell>
                   <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{getName(row.type, row._id)}</Typography>
                   </TableCell>
                   <TableCell align="right">
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>{row.totalQty}</Typography>
                   </TableCell>
                   <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#64748b' }}>
                          {((row.totalQty / (grandTotal || 1)) * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                   </TableCell>
                 </TableRow>
               ))}
               {dashboardData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    No global stock data available yet.
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

function SummaryStat({ title, value, subtitle, icon, color = '#6366f1' }) {
    return (
        <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, height: '100%', position: 'relative', overflow: 'hidden' }}>
            <CardContent>
                <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ color }}>{icon}</Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{title}</Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 900 }}>{value}</Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>{subtitle}</Typography>
                </Stack>
                <Box sx={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.05 }}>
                    {/* Ghost icon in background for aesthetics */}
                    {icon && <Box sx={{ fontSize: 80 }}>{icon}</Box>}
                </Box>
            </CardContent>
        </Card>
    );
}

export default ConsolidatedStockPage;
