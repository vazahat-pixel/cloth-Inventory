import { useEffect, useCallback, useState } from 'react';
import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import useServerPagination from '../../hooks/useServerPagination';
import ServerTablePagination from '../../components/erp/ServerTablePagination';
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
  TextField,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ReceiptIcon from '@mui/icons-material/Receipt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PrintIcon from '@mui/icons-material/Print';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SearchIcon from '@mui/icons-material/Search';
import api from '../../services/api';
import { fetchGrns } from './grnSlice';
import { useNotification } from '../../context/NotificationProvider';
import { useLoading } from '../../context/LoadingProvider';
import { useConfirm } from '../../context/ConfirmProvider';

const GRNListPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { records: grns, total, loading } = useSelector((state) => state.grn);
  const { showNotification } = useNotification();
  const { showLoading, hideLoading } = useLoading();
  const { showConfirm } = useConfirm();
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebouncedValue(searchText, 300);
  const pagination = useServerPagination({ defaultPageSize: 20 });

  const loadGrns = useCallback(() => {
    dispatch(fetchGrns(pagination.buildParams({
      search: debouncedSearch || undefined,
    })));
  }, [dispatch, pagination.page, pagination.rowsPerPage, debouncedSearch]);

  useEffect(() => {
    loadGrns();
  }, [loadGrns]);

  const handleApprove = async (id) => {
    const confirmed = await showConfirm({
      title: 'Approve GRN',
      message: 'Are you sure you want to approve this GRN and post stock to inventory? This action is permanent.',
      confirmText: 'Approve & Post',
      severity: 'warning'
    });

    if (!confirmed) return;

    showLoading('Approving and posting stock to inventory...');
    try {
      await api.patch(`/grn/${id}/approve`);
      showNotification('GRN approved and stock posted successfully!', 'success');
      loadGrns();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to approve GRN', 'error');
    } finally {
      hideLoading();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'DRAFT': return 'warning';
      case 'COMPLETED': return 'info';
      case 'INVOICED': return 'primary';
      default: return 'default';
    }
  };

  const getItemCount = (grn) => grn.itemLineCount ?? grn.items?.length ?? 0;

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

      <Paper sx={{ borderRadius: 2, mb: 2, p: 2, border: '1px solid #e2e8f0' }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search GRN number or invoice..."
          value={searchText}
          onChange={(e) => { setSearchText(e.target.value); pagination.resetPage(); }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

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
              {loading && grns.length === 0 ? (
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
                  <TableCell sx={{ color: '#64748b' }}>{formatDateDDMMYYYY(grn.createdAt)}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{grn.supplierId?.name || grn.supplierId?.supplierName || 'Manual Supplier'}</TableCell>
                  <TableCell>{grn.invoiceNumber}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{getItemCount(grn)}</TableCell>
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
                        <IconButton size="small" onClick={() => navigate(`/ho/inventory/grn/view/${grn._id}`)}>
                          <VisibilityIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      {(grn.status === 'DRAFT' || grn.status === 'APPROVED') && (
                        <Tooltip title="Edit GRN">
                          <IconButton size="small" color="primary" onClick={() => navigate(`/ho/inventory/grn/edit/${grn._id}`)}>
                            <ReceiptLongIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {grn.status === 'DRAFT' && (
                        <Tooltip title="Approve & Post Stock">
                          <IconButton size="small" color="success" onClick={() => handleApprove(grn._id)}>
                            <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      )}

                      {(grn.status === 'APPROVED' || grn.status === 'INVOICED') && (
                        <>
                          {grn.status === 'APPROVED' && (
                            <Tooltip title="Generate Purchase Bill (Voucher)">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => navigate(`/ho/purchase/new?grnId=${grn._id}`)}
                              >
                                <ReceiptIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {grn.status === 'INVOICED' && (
                             <Tooltip title="View Linked Purchase Bill">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => navigate(`/ho/purchase`)}
                              >
                                <ReceiptIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}
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
        <ServerTablePagination
          count={total}
          page={pagination.page}
          rowsPerPage={pagination.rowsPerPage}
          onPageChange={pagination.handlePageChange}
          onRowsPerPageChange={pagination.handleRowsPerPageChange}
          rowsPerPageOptions={pagination.pageSizeOptions}
        />
      </Paper>
    </Box>
  );
};

export default GRNListPage;
