import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
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

import { fetchConsumptions } from './consumptionSlice';
import useRoleBasePath from '../../hooks/useRoleBasePath';
import PageHeader from '../../components/erp/PageHeader';

const MaterialConsumptionListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const basePath = useRoleBasePath();

  const { records, loading } = useSelector((state) => state.consumption);

  useEffect(() => {
    dispatch(fetchConsumptions());
  }, [dispatch]);

  return (
    <Box>
      <PageHeader
        title="Production Consumption Logs"
        subtitle="Track how much material was actually used by stitchers/suppliers."
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Consumption Logging', active: true }]}
        actions={[
          <Button key="export" variant="outlined" startIcon={<DownloadOutlinedIcon />}>Export All</Button>,
          <Button
            key="add"
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => navigate(`${basePath}/inventory/consumption/new`)}
            sx={{ bgcolor: '#d946ef' }}
          >
            Log New Consumption
          </Button>,
        ]}
      />

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }}>Log #</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }}>Supplier</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }}>Source Issue #</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }}>Items Count</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((row) => (
                <TableRow key={row._id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{row.consumptionNumber}</TableCell>
                  <TableCell>{new Date(row.consumptionDate).toLocaleDateString()}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.supplierId?.name || row.supplierId?.supplierName || '-'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={row.sourceOutwardId?.outwardNumber || '-'} variant="outlined" />
                  </TableCell>
                  <TableCell>{row.items?.length || 0} Materials</TableCell>
                  <TableCell align="right">
                    <IconButton color="info" size="small">
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>No consumption logs found yet.</Typography>
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

export default MaterialConsumptionListPage;
