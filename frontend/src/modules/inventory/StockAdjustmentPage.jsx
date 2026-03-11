import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  IconButton,
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
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useForm } from 'react-hook-form';
import { applyStockAdjustment, fetchStockOverview } from './inventorySlice';
import { fetchMasters } from '../masters/mastersSlice';

const getTodayDate = () => new Date().toISOString().slice(0, 10);

function StockAdjustmentPage() {
  const dispatch = useDispatch();
  const warehouses = useSelector((state) => state.masters.warehouses || []);
  const stockRows = useSelector((state) => state.inventory.stock || []);

  const [lines, setLines] = useState([]);
  const [pickerValue, setPickerValue] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      warehouseId: '',
      adjustmentType: 'Increase',
      reason: '',
      date: getTodayDate(),
    },
  });

  const warehouseId = watch('warehouseId');
  const adjustmentType = watch('adjustmentType');

  useEffect(() => {
    dispatch(fetchMasters('warehouses'));
    dispatch(fetchStockOverview());
  }, [dispatch]);

  useEffect(() => {
    setLines([]);
    setPickerValue(null);
  }, [warehouseId]);

  const warehouseStock = useMemo(
    () => stockRows.filter((row) => row.warehouseId === warehouseId),
    [stockRows, warehouseId],
  );

  const lineRows = useMemo(
    () =>
      lines
        .map((line) => {
          const stockRow = stockRows.find((stock) => stock.id === line.stockId);
          if (!stockRow) {
            return null;
          }

          const currentQty = Number(stockRow.quantity);
          const change = Number(line.adjustmentQty || 0);
          const finalQty =
            adjustmentType === 'Increase' ? currentQty + change : Math.max(currentQty - change, 0);

          return {
            ...line,
            stockRow,
            currentQty,
            finalQty,
          };
        })
        .filter(Boolean),
    [adjustmentType, lines, stockRows],
  );

  const options = useMemo(() => {
    if (!warehouseId) {
      return [];
    }

    const selectedIds = new Set(lines.map((line) => line.stockId));
    return warehouseStock.filter((row) => !selectedIds.has(row.id));
  }, [lines, warehouseId, warehouseStock]);

  const handleAddLine = () => {
    if (!pickerValue) {
      return;
    }
    setLines((previous) => [...previous, { stockId: pickerValue.id, adjustmentQty: 1 }]);
    setPickerValue(null);
  };

  const handleChangeQty = (stockId, adjustmentQty) => {
    setLines((previous) =>
      previous.map((line) =>
        line.stockId === stockId ? { ...line, adjustmentQty: Number(adjustmentQty) } : line,
      ),
    );
  };

  const handleRemoveLine = (stockId) => {
    setLines((previous) => previous.filter((line) => line.stockId !== stockId));
  };

  const onSubmit = (values) => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!lineRows.length) {
      setErrorMessage('Add at least one variant line for adjustment.');
      return;
    }

    for (const line of lineRows) {
      if (line.adjustmentQty <= 0) {
        setErrorMessage('Adjustment quantity must be greater than zero.');
        return;
      }

      if (values.adjustmentType === 'Decrease' && line.adjustmentQty > line.currentQty) {
        setErrorMessage(`Decrease quantity cannot exceed current stock for ${line.stockRow.sku}.`);
        return;
      }
    }

    dispatch(
      applyStockAdjustment({
        warehouseId: values.warehouseId,
        adjustmentType: values.adjustmentType,
        reason: values.reason,
        date: values.date,
        lines,
        user: 'Admin',
      }),
    );

    setSuccessMessage('Stock adjustment saved successfully.');
    setLines([]);
    setPickerValue(null);
    reset({
      ...values,
      reason: '',
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
          Stock Adjustment
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
          Apply manual stock increase or decrease with reason and date tracking.
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            select
            label="Warehouse"
            size="small"
            fullWidth
            {...register('warehouseId', { required: 'Warehouse is required.' })}
            error={Boolean(errors.warehouseId)}
            helperText={errors.warehouseId?.message || ' '}
          >
            {warehouses.map((warehouse) => (
              <MenuItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Adjustment Type"
            size="small"
            fullWidth
            {...register('adjustmentType', { required: true })}
          >
            <MenuItem value="Increase">Increase</MenuItem>
            <MenuItem value="Decrease">Decrease</MenuItem>
          </TextField>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            label="Reason"
            size="small"
            fullWidth
            {...register('reason', { required: 'Reason is required.' })}
            error={Boolean(errors.reason)}
            helperText={errors.reason?.message || ' '}
          />

          <TextField
            label="Date"
            type="date"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            {...register('date', { required: true })}
          />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <Autocomplete
            fullWidth
            size="small"
            options={options}
            value={pickerValue}
            onChange={(_, value) => setPickerValue(value)}
            getOptionLabel={(option) =>
              `${option.itemName} (${option.size}/${option.color}) - ${option.sku}`
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Add Variant"
                placeholder={warehouseId ? 'Search variant' : 'Select warehouse first'}
              />
            )}
          />
          <Button variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={handleAddLine} disabled={!pickerValue}>
            Add
          </Button>
        </Stack>

        {lineRows.length ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Variant</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Current Qty</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Adjustment Qty</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Final Qty</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Remove</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lineRows.map((line) => (
                  <TableRow key={line.stockId}>
                    <TableCell>{`${line.stockRow.itemName} (${line.stockRow.size}/${line.stockRow.color})`}</TableCell>
                    <TableCell>{line.currentQty}</TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={line.adjustmentQty}
                        onChange={(event) => handleChangeQty(line.stockId, Math.max(0, Number(event.target.value)))}
                        sx={{ width: 120 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{line.finalQty}</TableCell>
                    <TableCell>
                      <IconButton color="error" size="small" onClick={() => handleRemoveLine(line.stockId)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Add variant rows to apply adjustment.
            </Typography>
          </Box>
        )}
      </Paper>

      {errorMessage && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errorMessage}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />}>
          Save Adjustment
        </Button>
      </Stack>
    </Box>
  );
}

export default StockAdjustmentPage;
