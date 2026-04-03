import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';

import { fetchSupplierOutwards } from './supplierOutwardSlice';
import useRoleBasePath from '../../hooks/useRoleBasePath';

const SupplierOutwardListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const basePath = useRoleBasePath();
  
  const { records, loading } = useSelector((state) => state.supplierOutward);

  useEffect(() => {
    dispatch(fetchSupplierOutwards());
  }, [dispatch]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Supplier Outward Challans
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Track raw material and accessories provided to suppliers.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
           <Button variant="outlined" startIcon={<DownloadOutlinedIcon />}>Export</Button>
           <Button 
             variant="contained" 
             startIcon={<AddCircleOutlineIcon />}
             onClick={() => navigate(`${basePath}/inventory/supplier-outward/new`)}
           >
             New Outward
           </Button>
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }}>Outward #</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }}>Supplier</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }}>Source</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }}>Total Items</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((row) => (
                <TableRow key={row._id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{row.outwardNumber}</TableCell>
                  <TableCell>{new Date(row.outwardDate).toLocaleDateString()}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.supplierId?.name || row.supplierId?.supplierName || '-'}</TableCell>
                  <TableCell>{row.warehouseId?.name || 'Warehouse'}</TableCell>
                  <TableCell>{row.items?.length || 0}</TableCell>
                  <TableCell>
                    <Chip 
                      label={row.status} 
                      size="small" 
                      color={row.status === 'COMPLETED' ? 'success' : 'warning'}
                      sx={{ fontWeight: 700, borderRadius: 1.5 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="info" size="small">
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>No outward challans found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default SupplierOutwardListPage;
