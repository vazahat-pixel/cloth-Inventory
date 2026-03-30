import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { fetchPurchases } from '../purchase/purchaseSlice';
import { fetchMasters } from '../masters/mastersSlice';
import { fetchItems } from '../items/itemsSlice';
import { addGrn } from './grnSlice';
import api from '../../services/api';

const toNumber = (v) => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

const GRNPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { suppliers, warehouses } = useSelector((state) => state.masters);
  const { records: purchases } = useSelector((state) => state.purchase);
  const { records: items } = useSelector((state) => state.items);
  const { loading, error } = useSelector((state) => state.grn);

  const [lines, setLines] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
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
  }, [dispatch]);

  // Handle Purchase Selection -> Auto-fill Items
  useEffect(() => {
    if (selectedPurchaseId) {
      const fetchPurchaseDetails = async () => {
        try {
          const response = await api.get(`/purchase/${selectedPurchaseId}`);
          const purchase = response.data.purchase || response.data.data;
          
          if (purchase) {
            // Set Supplier if not set
            setValue('supplierId', purchase.supplierId?._id || purchase.supplierId || '');
            
            // Map products to lines
            const newLines = (purchase.products || []).map((p) => ({
              productId: p.productId?._id || p.productId,
              productName: p.productId?.name || 'Unknown Product',
              sku: p.productId?.sku || '',
              lotNumber: p.lotNumber || '',
              orderedQty: p.quantity,
              receivedQty: p.quantity, // Default to full receipt
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
  }, [selectedPurchaseId, setValue]);

  const addLine = () => {
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
    setLines(lines.filter((l) => l.tempId !== tempId));
  };

  const updateLine = (tempId, field, value) => {
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

  const onSubmit = async (values) => {
    setErrorMessage('');
    
    if (lines.length === 0) {
      setErrorMessage('Please add at least one item.');
      return;
    }

    // Validation
    for (const line of lines) {
      if (!line.productId) {
        setErrorMessage('All lines must have a selected product.');
        return;
      }
      if (toNumber(line.receivedQty) <= 0) {
        setErrorMessage(`Received quantity for ${line.productName || 'product'} must be greater than 0.`);
        return;
      }
      if (toNumber(line.receivedQty) > toNumber(line.orderedQty)) {
        setErrorMessage(`Received quantity for ${line.productName} cannot exceed ordered quantity (${line.orderedQty}).`);
        return;
      }
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
        navigate('/ho/purchase/purchase-voucher'); // Redirect to purchase list or GRN list if it exists
      }, 2000);
    } else {
      setErrorMessage(resultAction.payload || 'Failed to create GRN');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Goods Receipt Note (GRN)
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Receive goods against Purchase Orders and update inventory status.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ textTransform: 'none' }}
        >
          Back
        </Button>
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
                {...register('supplierId', { required: 'Please select supplier' })}
                error={Boolean(errors.supplierId)}
                helperText={errors.supplierId?.message}
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
                {...register('purchaseId')}
                helperText="Select to auto-populate items"
              >
                <MenuItem value="">Manual Entry (No PO)</MenuItem>
                {purchases.map((p) => (
                  <MenuItem key={p.id || p._id} value={p.id || p._id}>
                    {p.invoiceNumber || p.purchaseNumber} ({new Date(p.invoiceDate).toLocaleDateString()})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Invoice/Challan Number"
                {...register('invoiceNumber', { required: 'Invoice number is required' })}
                error={Boolean(errors.invoiceNumber)}
                helperText={errors.invoiceNumber?.message}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                size="small"
                label="Invoice Date"
                InputLabelProps={{ shrink: true }}
                {...register('invoiceDate', { required: 'Invoice date is required' })}
                error={Boolean(errors.invoiceDate)}
                helperText={errors.invoiceDate?.message}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Receiving Warehouse"
                {...register('warehouseId', { required: 'Please select warehouse' })}
                error={Boolean(errors.warehouseId)}
                helperText={errors.warehouseId?.message}
              >
                {warehouses.map((w) => (
                  <MenuItem key={w._id} value={w._id}>
                    {w.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Remarks"
                multiline
                rows={1}
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
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={addLine}
              variant="contained"
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Add Row
            </Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                  <TableCell sx={{ fontWeight: 700, width: '25%' }}>Product / Variant</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Lot No.</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Ordered Qty</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Received Qty</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Pending</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Line Remarks</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 50 }} align="center"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.tempId} hover>
                    <TableCell>
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
                        renderInput={(params) => (
                          <TextField {...params} placeholder="Select Product" variant="standard" />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        variant="standard"
                        value={line.lotNumber}
                        onChange={(e) => updateLine(line.tempId, 'lotNumber', e.target.value)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        variant="standard"
                        sx={{ textAlign: 'right', width: 80 }}
                        value={line.orderedQty}
                        onChange={(e) => updateLine(line.tempId, 'orderedQty', e.target.value)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        variant="standard"
                        sx={{ textAlign: 'right', width: 80 }}
                        value={line.receivedQty}
                        onChange={(e) => updateLine(line.tempId, 'receivedQty', e.target.value)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {toNumber(line.orderedQty) - toNumber(line.receivedQty)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        variant="standard"
                        value={line.remarks}
                        onChange={(e) => updateLine(line.tempId, 'remarks', e.target.value)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => removeLine(line.tempId)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {lines.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ py: 4, textAlign: 'center', color: '#64748b' }}>
                      No items added. Select a Purchase Order or click 'Add Row'.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Stack direction="row" sx={{ mt: 4, justifyContent: 'flex-end' }} spacing={2}>
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            disabled={loading}
            sx={{ textTransform: 'none', px: 4 }}
          >
            Cancel
          </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              disabled={loading}
              sx={{ textTransform: 'none', px: 4, borderRadius: 2 }}
            >
            Save GRN
          </Button>
        </Stack>
      </form>
    </Box>
  );
};

export default GRNPage;
