import { useEffect, useMemo, useRef, useState } from 'react';
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
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import { useForm } from 'react-hook-form';
import { fetchStockOverview, transferStock } from './inventorySlice';
import { fetchMasters } from '../masters/mastersSlice';
import { parseTransferExcel } from './transferImportService';

const getTodayDate = () => new Date().toISOString().slice(0, 10);

function StockTransferPage() {
  const dispatch = useDispatch();
  const warehouses = useSelector((state) => state.masters.warehouses || []);
  const stockRows = useSelector((state) => state.inventory.stock || []);

  const [lines, setLines] = useState([]);
  const [variantPickerValue, setVariantPickerValue] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [importError, setImportError] = useState('');
  const importInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fromStoreId: '',
      toStoreId: '',
      transferDate: getTodayDate(),
      remarks: '',
    },
  });

  const fromStoreId = watch('fromStoreId');
  const toStoreId = watch('toStoreId');

  useEffect(() => {
    dispatch(fetchMasters('warehouses'));
    dispatch(fetchStockOverview());
  }, [dispatch]);

  useEffect(() => {
    setLines([]);
    setVariantPickerValue(null);
  }, [fromStoreId]);

  const availableRows = useMemo(() => {
    if (!fromStoreId) {
      return [];
    }

    const selectedIds = new Set(lines.map((line) => line.stockId));

    return stockRows
      .filter((row) => row.storeId === fromStoreId || row.warehouseId === fromStoreId)
      .filter((row) => Number(row.quantity) - Number(row.reserved || 0) > 0)
      .filter((row) => !selectedIds.has(row.id));
  }, [fromStoreId, lines, stockRows]);

  const warehouseMap = useMemo(
    () =>
      warehouses.reduce((accumulator, warehouse) => {
        accumulator[warehouse.id] = warehouse.name;
        return accumulator;
      }, {}),
    [warehouses],
  );

  const lineRows = useMemo(
    () =>
      lines
        .map((line) => {
          const stockRow = stockRows.find((stock) => stock.id === line.stockId);
          if (!stockRow) {
            return null;
          }

          const availableQty = Number(stockRow.quantity) - Number(stockRow.reserved || 0);
          return {
            ...line,
            stockRow,
            availableQty,
          };
        })
        .filter(Boolean),
    [lines, stockRows],
  );

  const handleAddLine = () => {
    if (!variantPickerValue) {
      return;
    }

    setLines((previous) => [...previous, { stockId: variantPickerValue.id, transferQty: 1 }]);
    setVariantPickerValue(null);
    setErrorMessage('');
  };

  const handleUpdateQty = (stockId, transferQty) => {
    setLines((previous) =>
      previous.map((line) =>
        line.stockId === stockId ? { ...line, transferQty: Number(transferQty) } : line,
      ),
    );
  };

  const handleRemoveLine = (stockId) => {
    setLines((previous) => previous.filter((line) => line.stockId !== stockId));
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !fromStoreId) return;
    setImportError('');
    setErrorMessage('');
    try {
      const { rows, errors } = await parseTransferExcel(file);
      if (errors?.length) {
        setImportError(errors.join(' '));
        return;
      }
      const sourceStock = stockRows.filter(
        (r) => (r.storeId === fromStoreId || r.warehouseId === fromStoreId) && Number(r.quantity) - Number(r.reserved || 0) > 0,
      );
      const skuToStock = sourceStock.reduce((acc, row) => {
        if (!acc[row.sku]) acc[row.sku] = row;
        return acc;
      }, {});
      const existingIds = new Set(lines.map((l) => l.stockId));
      const seenStockIds = new Set();
      const newLines = rows
        .filter((r) => skuToStock[r.sku] && !existingIds.has(skuToStock[r.sku].id) && !seenStockIds.has(skuToStock[r.sku].id))
        .map((r) => {
          const stock = skuToStock[r.sku];
          seenStockIds.add(stock.id);
          const available = Number(stock.quantity) - Number(stock.reserved || 0);
          const transferQty = Math.min(r.transferQty, available);
          return { stockId: stock.id, transferQty };
        })
        .filter((l) => l.transferQty > 0);
      setLines((prev) => [...prev, ...newLines]);
      setImportError('');
    } catch (err) {
      setImportError(err?.message || 'Import failed.');
    }
    e.target.value = '';
  };

  const handleTransferAll = () => {
    if (!fromStoreId) return;
    const selectedIds = new Set(lines.map((l) => l.stockId));
    const toAdd = availableRows
      .filter((row) => !selectedIds.has(row.id))
      .map((row) => {
        const available = Number(row.quantity) - Number(row.reserved || 0);
        return { stockId: row.id, transferQty: Math.max(1, available) };
      });
    setLines((prev) => [...prev, ...toAdd]);
    setErrorMessage('');
  };

  const onSubmit = (values) => {
    setErrorMessage('');
    setSuccessMessage('');

    if (values.fromStoreId === values.toStoreId) {
      setErrorMessage('From and To warehouse must be different.');
      return;
    }

    if (!lineRows.length) {
      setErrorMessage('Add at least one variant to transfer.');
      return;
    }

    const preparedProducts = lineRows.map((line) => {
      if (line.transferQty <= 0) {
        throw new Error('Transfer quantity must be greater than zero.');
      }
      if (line.transferQty > line.availableQty) {
        throw new Error(`Transfer exceeds available quantity for ${line.stockRow.sku}.`);
      }
      return {
        productId: line.stockRow.variantId || line.stockRow.productId,
        quantity: Number(line.transferQty),
      };
    });

    const payload = {
      storeId: values.toStoreId, // Backend uses storeId for destination
      products: preparedProducts,
      notes: values.remarks,
    };

    console.log('[DEBUG] Submitting Dispatch Payload:', payload);

    dispatch(transferStock(payload))
      .unwrap()
      .then(() => {
        setSuccessMessage('Stock transfer saved successfully.');
        setLines([]);
        setVariantPickerValue(null);
        reset({
          ...values,
          remarks: '',
        });
      })
      .catch((err) => {
        setErrorMessage(err || 'Failed to save transfer');
      });
  };

  const totalTransferQty = lineRows.reduce((sum, line) => sum + Number(line.transferQty || 0), 0);

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
          Stock Transfer
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
          Move variant stock between warehouses with quantity controls.
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            label="From Store"
            size="small"
            select
            fullWidth
            {...register('fromStoreId', { required: 'From store is required.' })}
            error={Boolean(errors.fromStoreId)}
            helperText={errors.fromStoreId?.message || ' '}
          >
            {warehouses.map((warehouse) => (
              <MenuItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="To Store"
            size="small"
            select
            fullWidth
            {...register('toStoreId', { required: 'To store is required.' })}
            error={Boolean(errors.toStoreId)}
            helperText={errors.toStoreId?.message || ' '}
          >
            {warehouses.map((warehouse) => (
              <MenuItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            label="Transfer Date"
            type="date"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            {...register('transferDate', { required: true })}
          />

          <TextField
            label="Remarks"
            size="small"
            fullWidth
            {...register('remarks')}
          />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, mb: 2 }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
              Transfer Items
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Add variants from source warehouse and enter transfer quantity.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <ChipLike label={`Lines: ${lineRows.length}`} />
            <ChipLike label={`Qty: ${totalTransferQty}`} />
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems="center">
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={handleImportExcel}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={() => importInputRef.current?.click()}
            disabled={!fromStoreId}
          >
            Import from Excel
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleTransferAll}
            disabled={!fromStoreId || availableRows.length === 0}
          >
            Transfer All Stock
          </Button>
          <Autocomplete
            fullWidth
            size="small"
            value={variantPickerValue}
            onChange={(_, value) => setVariantPickerValue(value)}
            options={availableRows}
            getOptionLabel={(option) =>
              `${option.itemName} (${option.size}/${option.color}) - ${option.sku}`
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Variant"
                placeholder={fromStoreId ? 'Search variant...' : 'Select source warehouse first'}
              />
            )}
          />
          <Button
            variant="outlined"
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleAddLine}
            disabled={!variantPickerValue}
          >
            Add
          </Button>
        </Stack>

        {lineRows.length ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Item / Variant</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Lot</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Available
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Transfer Qty
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Remove</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lineRows.map((line) => (
                  <TableRow key={line.stockId}>
                    <TableCell>{`${line.stockRow.itemName} (${line.stockRow.size}/${line.stockRow.color})`}</TableCell>
                    <TableCell>{line.stockRow.lotNumber || '-'}</TableCell>
                    <TableCell>{line.stockRow.sku}</TableCell>
                    <TableCell align="right">{line.availableQty}</TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={line.transferQty}
                        onChange={(event) =>
                          handleUpdateQty(line.stockId, Math.max(0, Number(event.target.value)))
                        }
                        sx={{ width: 120 }}
                      />
                    </TableCell>
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
              No variants selected for transfer.
            </Typography>
          </Box>
        )}

        <Typography variant="caption" sx={{ display: 'block', color: '#64748b', mt: 1.5 }}>
          Transfer from: {warehouseMap[fromStoreId] || '-'} | Transfer to:{' '}
          {warehouseMap[toStoreId] || '-'}
        </Typography>
      </Paper>

      {(errorMessage || importError) && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errorMessage || importError}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button type="submit" variant="contained" startIcon={<SendOutlinedIcon />}>
          Submit Transfer
        </Button>
      </Stack>
    </Box>
  );
}

function ChipLike({ label }) {
  return (
    <Box
      sx={{
        border: '1px solid #cbd5e1',
        borderRadius: 10,
        px: 1.5,
        py: 0.5,
        fontSize: 12,
        fontWeight: 700,
        color: '#334155',
      }}
    >
      {label}
    </Box>
  );
}

export default StockTransferPage;
