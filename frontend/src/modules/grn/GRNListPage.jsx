import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Stack,
  IconButton,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ReceiptIcon from '@mui/icons-material/Receipt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PrintIcon from '@mui/icons-material/Print';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import api from '../../services/api';

const GRNListPage = () => {
  const navigate = useNavigate();
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrns();
  }, []);

  const fetchGrns = async () => {
    try {
      const res = await api.get('/grn');
      setGrns(res.data.grns || res.data.data || []);
    } catch (err) {
      console.error('Fetch GRNs failed', err);
      // Fallback: search in purchases to show something if /all isn't ready
      try {
        const fallback = await api.get('/purchase');
        // Mock some status for demo if needed
      } catch (e) { }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this GRN and post stock to inventory?')) return;
    setLoading(true);
    try {
      await api.patch(`/grn/${id}/approve`);
      fetchGrns();
    } catch (err) {
      console.error('Approve failed', err);
      alert(err.response?.data?.message || 'Failed to approve');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'DRAFT': return 'warning';
      case 'COMPLETED': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>
            GRN Register
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Tracking all inward goods receipt documents and their inventory impact.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/ho/inventory/grn/new')}
          sx={{ borderRadius: 2, px: 3, py: 1, textTransform: 'none', fontWeight: 700 }}
        >
          Create New GRN
        </Button>
      </Stack>

      <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: '#94a3b8' }}>GRN NUMBER</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#94a3b8' }}>DATE</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#94a3b8' }}>SUPPLIER</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#94a3b8' }}>INVOICE</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#94a3b8' }} align="right">ITEMS</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#94a3b8' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#94a3b8' }} align="center">ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                    <CircularProgress size={30} sx={{ mb: 2 }} />
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>Loading inward register...</Typography>
                  </TableCell>
                </TableRow>
              ) : grns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                    <Typography variant="body1" sx={{ color: '#94a3b8' }}>No GRN records found in the system.</Typography>
                  </TableCell>
                </TableRow>
              ) : grns.map((grn) => (
                <TableRow key={grn._id} hover>
                  <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{grn.grnNumber}</TableCell>
                  <TableCell sx={{ color: '#64748b' }}>{new Date(grn.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{grn.supplierId?.name || 'Manual Supplier'}</TableCell>
                  <TableCell>{grn.invoiceNumber}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{grn.items?.length || 0}</TableCell>
                  <TableCell>
                    <Chip
                      label={grn.status}
                      size="small"
                      color={getStatusColor(grn.status)}
                      sx={{ fontWeight: 800, fontSize: 10, height: 20 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => navigate(`/ho/grn/${grn._id}`)}>
                          <VisibilityIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      {grn.status === 'DRAFT' && (
                        <Tooltip title="Approve & Post Stock">
                          <IconButton size="small" color="success" onClick={() => handleApprove(grn._id)}>
                            <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      )}

                      {grn.status === 'APPROVED' && (
                        <>
                          <Tooltip title="Generate Bill">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/purchase/purchase-voucher/new?grnId=${grn._id}`)}
                            >
                              <ReceiptIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Print Barcodes / Labels">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => navigate(`/ho/setup/barcode-print?grnId=${grn._id}`)}
                            >
                              <PrintIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default GRNListPage;
