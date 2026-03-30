import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Button,
  Grid,
  MenuItem,
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
  IconButton,
  Alert,
  Autocomplete,
  Chip,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import { fetchPurchases } from '../purchase/purchaseSlice';
import { fetchMasters } from '../masters/mastersSlice';
import { fetchItems } from '../items/itemsSlice';
import { addGrn, fetchGrnById, approveGrn } from './grnSlice';
import api from '../../services/api';

const toNumber = (v) => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

const GRNPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isViewMode = Boolean(id && id !== 'new');

  const { suppliers, warehouses } = useSelector((state) => state.masters);
  const { records: purchases } = useSelector((state) => state.purchase);
  const { records: items } = useSelector((state) => state.items);
  const { loading, error } = useSelector((state) => state.grn);

  const [lines, setLines] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentGrn, setCurrentGrn] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      supplierId: '',
      purchaseId: '',
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      warehouseId: '',
      remarks: '',
    },
  });

  const selectedPurchaseId = watch('purchaseId');

  useEffect(() => {
    dispatch(fetchMasters('suppliers'));
    dispatch(fetchPurchases());
    dispatch(fetchMasters('warehouses'));
    dispatch(fetchItems());

    if (isViewMode) {
      loadGrn();
    }
  }, [dispatch, id, isViewMode]);

  const loadGrn = async () => {
    try {
      const resultAction = await dispatch(fetchGrnById(id));
      if (fetchGrnById.fulfilled.match(resultAction)) {
        const grn = resultAction.payload;
        setCurrentGrn(grn);
        reset({
          supplierId: grn.supplierId?._id || grn.supplierId || '',
          purchaseId: grn.purchaseId?._id || grn.purchaseId || '',
          invoiceNumber: grn.invoiceNumber || '',
          invoiceDate: grn.invoiceDate ? new Date(grn.invoiceDate).toISOString().split('T')[0] : '',
          warehouseId: grn.warehouseId?._id || grn.warehouseId || '',
          remarks: grn.remarks || '',
        });
        setLines(grn.items.map(i => ({
          ...i,
          tempId: Math.random().toString(36).substr(2, 9),
          productName: i.productId?.name || 'Item',
          sku: i.productId?.sku || '',
          productId: i.productId?._id || i.productId
        })));
      }
    } catch (err) {
      setErrorMessage('Failed to load GRN details');
    }
  };

  // Handle Purchase Selection -> Auto-fill Items
  useEffect(() => {
    if (selectedPurchaseId && !isViewMode) {
      const fetchPurchaseDetails = async () => {
        try {
          const response = await api.get(`/purchase/${selectedPurchaseId}`);
          const purchase = response.data.purchase || response.data.data;
          
          if (purchase) {
            setValue('supplierId', purchase.supplierId?._id || purchase.supplierId || '');
            const newLines = (purchase.products || []).map((p) => ({
              productId: p.productId?._id || p.productId,
              productName: p.productId?.name || 'Unknown Product',
              sku: p.productId?.sku || '',
              lotNumber: p.lotNumber || '',
              orderedQty: p.quantity,
              receivedQty: p.quantity,
              remarks: '',
              tempId: Math.random().toString(36).substr(2, 9),
            }));
            setLines(newLines);
          }
        } catch (err) {
          console.error('Failed to fetch purchase details', err);
          setErrorMessage('Failed to load purchase details.');
        }
      };
      fetchPurchaseDetails();
    }
  }, [selectedPurchaseId, setValue, isViewMode]);

  const addLine = () => {
    if (isViewMode) return;
    setLines([
      ...lines,
      {
        productId: '',
        productName: '',
        sku: '',
        lotNumber: '',
        orderedQty: 0,
        receivedQty: 0,
        remarks: '',
        tempId: Math.random().toString(36).substr(2, 9),
      },
    ]);
  };

  const removeLine = (tempId) => {
    if (isViewMode) return;
    setLines(lines.filter((l) => l.tempId !== tempId));
  };

  const updateLine = (tempId, field, value) => {
    if (isViewMode) return;
    setLines(
      lines.map((l) => {
        if (l.tempId === tempId) {
          const updated = { ...l, [field]: value };
          if (field === 'orderedQty' || field === 'receivedQty') {
            updated.pendingQty = Math.max(toNumber(updated.orderedQty) - toNumber(updated.receivedQty), 0);
          }
          return updated;
        }
        return l;
      })
    );
  };

  const handleApprove = async () => {
    if (!window.confirm('Post this GRN to Inventory? This action is irreversible.')) return;
    
    setErrorMessage('');
    const resultAction = await dispatch(approveGrn(id));
    if (approveGrn.fulfilled.match(resultAction)) {
      setSuccessMessage('Inventory Updated & GRN Approved!');
      await loadGrn();
    } else {
      setErrorMessage(resultAction.payload || 'Approval failed');
    }
  };

  const onSubmit = async (values) => {
    if (isViewMode) return;
    setErrorMessage('');
    
    if (lines.length === 0) {
      setErrorMessage('Please add at least one item.');
      return;
    }

    const payload = {
      ...values,
      items: lines.map((l) => ({
        productId: l.productId,
        lotNumber: l.lotNumber,
        orderedQty: toNumber(l.orderedQty),
        receivedQty: toNumber(l.receivedQty),
        remarks: l.remarks,
      })),
    };

    const resultAction = await dispatch(addGrn(payload));
    if (addGrn.fulfilled.match(resultAction)) {
      setSuccessMessage('GRN Created Successfully!');
      setTimeout(() => {
        navigate('/ho/grn'); 
      }, 2000);
    } else {
      setErrorMessage(resultAction.payload || 'Failed to create GRN');
    }
  };

  if (isViewMode && !currentGrn && loading) {
    return <Box sx={{ p: 10, textAlign: 'center' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 2 }}>
            {isViewMode ? `GRN Detail: ${currentGrn?.grnNumber}` : 'New Goods Receipt Note (GRN)'}
            {isViewMode && (
              <Chip 
                label={currentGrn?.status} 
                color={currentGrn?.status === 'APPROVED' ? 'success' : 'warning'} 
                size="small" 
                sx={{ fontWeight: 900, borderRadius: 1 }}
              />
            )}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            {isViewMode ? 'Review document details and audit trail.' : 'Receive goods against Purchase Orders and update inventory status.'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/ho/grn')}
            sx={{ textTransform: 'none' }}
          >
            Back to List
          </Button>
          {isViewMode && currentGrn?.status === 'DRAFT' && (
             <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleOutlineIcon />}
                onClick={handleApprove}
                disabled={loading}
                sx={{ textTransform: 'none', fontWeight: 700 }}
             >
                Post to Inventory
             </Button>
          )}
        </Stack>
      </Stack>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#1e293b' }}>
            General Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Supplier"
                disabled={isViewMode}
                {...register('supplierId')}
              >
                {suppliers.map((s) => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Purchase Order"
                disabled={isViewMode}
                {...register('purchaseId')}
              >
                <MenuItem value="">Manual Entry (No PO)</MenuItem>
                {purchases.map((p) => (
                  <MenuItem key={p.id || p._id} value={p.id || p._id}>
                    {p.invoiceNumber || p.purchaseNumber}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Invoice Number"
                disabled={isViewMode}
                {...register('invoiceNumber')}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                size="small"
                label="Invoice Date"
                disabled={isViewMode}
                InputLabelProps={{ shrink: true }}
                {...register('invoiceDate')}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Warehouse"
                disabled={isViewMode}
                {...register('warehouseId')}
              >
                {warehouses.map((w) => (
                  <MenuItem key={w._id} value={w._id}>
                    {w.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Remarks"
                disabled={isViewMode}
                {...register('remarks')}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 0, borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Items Received
            </Typography>
            {!isViewMode && (
              <Button size="small" startIcon={<AddIcon />} onClick={addLine} variant="contained" sx={{ borderRadius: 2 }}>
                Add Row
              </Button>
            )}
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Lot/Batch</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Ordered</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Received</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Line Remarks</TableCell>
                  {!isViewMode && <TableCell align="center">Action</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.tempId}>
                    <TableCell>
                      {isViewMode ? (
                        <Typography variant="body2">{line.productName} ({line.sku})</Typography>
                      ) : (
                        <Autocomplete
                          size="small"
                          options={items}
                          getOptionLabel={(option) => `${option.name} (${option.sku})`}
                          value={items.find((i) => i._id === line.productId) || null}
                          onChange={(_, newValue) => {
                            updateLine(line.tempId, 'productId', newValue?._id || '');
                            updateLine(line.tempId, 'productName', newValue?.name || '');
                            updateLine(line.tempId, 'sku', newValue?.sku || '');
                          }}
                          renderInput={(params) => <TextField {...params} variant="standard" />}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        variant={isViewMode ? 'standard' : 'standard'}
                        disabled={isViewMode}
                        value={line.lotNumber || line.batchNumber || ''}
                        onChange={(e) => updateLine(line.tempId, 'lotNumber', e.target.value)}
                      />
                    </TableCell>
                    <TableCell align="right">{line.orderedQty}</TableCell>
                    <TableCell align="right">
                      {isViewMode ? line.receivedQty : (
                        <TextField
                          type="number"
                          size="small"
                          variant="standard"
                          sx={{ textAlign: 'right', width: 80 }}
                          value={line.receivedQty}
                          onChange={(e) => updateLine(line.tempId, 'receivedQty', e.target.value)}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        variant="standard"
                        disabled={isViewMode}
                        value={line.remarks || ''}
                        onChange={(e) => updateLine(line.tempId, 'remarks', e.target.value)}
                      />
                    </TableCell>
                    {!isViewMode && (
                      <TableCell align="center">
                        <IconButton size="small" color="error" onClick={() => removeLine(line.tempId)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {!isViewMode && (
          <Stack direction="row" sx={{ mt: 4, justifyContent: 'flex-end' }} spacing={2}>
            <Button variant="outlined" onClick={() => navigate('/ho/grn')} disabled={loading}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />} disabled={loading}>
              Save Draft
            </Button>
          </Stack>
        )}
      </form>
    </Box>
  );
};

export default GRNPage;
