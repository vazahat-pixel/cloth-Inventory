import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Grid,
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
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import PageHeader from '../../components/erp/PageHeader';
import FilterBar from '../../components/erp/FilterBar';
import FormSection from '../../components/erp/FormSection';
import StatusBadge from '../../components/erp/StatusBadge';
import SummaryCard from '../../components/erp/SummaryCard';
import { buildSizeLabelLookup, resolveSizeLabel } from '../../common/sizeDisplay';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import { fetchWarehouseStock } from './inventorySlice';
import { fetchMasters } from '../masters/mastersSlice';
import { stockOverviewSeed } from '../erp/erpUiMocks';
import { loadModuleRecords, upsertModuleRecord } from '../erp/erpLocalStore';
import { fallbackStockTransfers, normalizeStockTransfer, stockTransferStorageKey } from './stockTransferUi';
import api from '../../services/api';

const defaultForm = {
  transferNumber: '',
  transferDate: new Date().toISOString().slice(0, 10),
  fromLocation: '',
  toLocation: '',
  notes: '',
  vehicleDetails: '',
  transferType: 'HO_TO_STORE',
  status: 'Draft',
};

const normalizeStockRows = (items = []) => {
  const flattenedRows = [];
  
  items.forEach((item) => {
    if (item.sizes && Array.isArray(item.sizes)) {
      item.sizes.forEach((sz) => {
        // Only include variants that have stock in the warehouse
        if (Number(sz.stock || 0) > 0) {
          flattenedRows.push({
            id: sz._id,
            itemCode: sz.sku || item.itemCode,
            itemName: item.itemName,
            size: sz._id, // Store size ID for label resolution
            availableQty: Number(sz.stock || 0),
            locationId: item.defaultWarehouse || '',
            uom: item.uom || 'PCS',
            productId: sz._id, // This is the variant ID needed for dispatch
          });
        }
      });
    }
  });

  return flattenedRows;
};

function StockTransferFormPage({ mode = 'edit' }) {
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const { id } = useParams();
  const isViewMode = mode === 'view';
  const isEditMode = Boolean(id);

  const backendStock = useSelector((state) => state.inventory.stock || []);
  const sizes = useSelector((state) => state.masters.sizes || []);
  const warehouses = useSelector((state) => state.masters.warehouses || []);
  const stores = useSelector((state) => state.masters.stores || []);

  const [formValues, setFormValues] = useState(defaultForm);
  const [lines, setLines] = useState([]);
  const [linePicker, setLinePicker] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    dispatch(fetchMasters('warehouses'));
    dispatch(fetchMasters('stores'));
    dispatch(fetchMasters('sizes'));
  }, [dispatch]);

  useEffect(() => {
    if (formValues.fromLocation) {
      dispatch(fetchWarehouseStock(formValues.fromLocation));
    }
  }, [dispatch, formValues.fromLocation]);

  const sizeLabelLookup = useMemo(() => buildSizeLabelLookup(sizes), [sizes]);
  const getSizeLabel = (value) => resolveSizeLabel(value, sizeLabelLookup);

  const existingTransfers = useMemo(
    () => loadModuleRecords(stockTransferStorageKey, fallbackStockTransfers).map((record) => normalizeStockTransfer(record)),
    [],
  );
  const existingTransfer = useMemo(() => existingTransfers.find((record) => record.id === id), [existingTransfers, id]);

  useEffect(() => {
    if (isEditMode && !existingTransfer) {
      return;
    }
    if (existingTransfer) {
      setFormValues({
        transferNumber: existingTransfer.transferNumber,
        transferDate: existingTransfer.transferDate,
        fromLocation: existingTransfer.fromLocationId || existingTransfer.fromLocation,
        toLocation: existingTransfer.toLocationId || existingTransfer.toLocation,
        notes: existingTransfer.notes || '',
        vehicleDetails: existingTransfer.vehicleDetails || '',
        transferType: existingTransfer.transferType || 'HO_TO_STORE',
        status: existingTransfer.status || 'Draft',
      });
      setLines(existingTransfer.items || []);
      return;
    }
    setFormValues({
      ...defaultForm,
      transferNumber: `TRN-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    });
    setLines([]);
  }, [existingTransfer, isEditMode]);

  const fromLocationOptions = useMemo(() => {
    if (formValues.transferType === 'HO_TO_STORE' || formValues.transferType === 'WAREHOUSE_TO_STORE') {
      return warehouses.map((w) => ({ id: w._id || w.id, name: w.warehouseName || w.name }));
    }
    if (formValues.transferType === 'INTER_STORE') {
      return stores.map((s) => ({ id: s._id || s.id, name: s.name }));
    }
    return [
      ...warehouses.map((w) => ({ id: w._id || w.id, name: w.warehouseName || w.name })),
      ...stores.map((s) => ({ id: s._id || s.id, name: s.name })),
    ].filter(l => l.id && l.name);
  }, [formValues.transferType, stores, warehouses]);

  const toLocationOptions = useMemo(() => {
    if (formValues.transferType === 'HO_TO_STORE' || formValues.transferType === 'WAREHOUSE_TO_STORE' || formValues.transferType === 'INTER_STORE') {
      return stores.map((s) => ({ id: s._id || s.id, name: s.name }));
    }
    return [
      ...warehouses.map((w) => ({ id: w._id || w.id, name: w.warehouseName || w.name })),
      ...stores.map((s) => ({ id: s._id || s.id, name: s.name })),
    ].filter(l => l.id && l.name);
  }, [formValues.transferType, stores, warehouses]);

  const stockRows = useMemo(
    () => normalizeStockRows([...(Array.isArray(backendStock?.items) ? backendStock.items : [])]),
    [backendStock],
  );

  const availableRows = useMemo(() => {
    if (!formValues.fromLocation) {
      return [];
    }
    const selectedIds = new Set(lines.map((line) => line.id));
    // When using fetchWarehouseStock, stockRows (backendStock) is already filtered by locationId at source
    return stockRows.filter(
      (row) =>
        !selectedIds.has(`line-${row.itemCode}-${row.size}`),
    );
  }, [formValues.fromLocation, lines, stockRows]);

  const totalQty = useMemo(() => lines.reduce((sum, line) => sum + Number(line.transferQty || 0), 0), [lines]);

  const addLine = () => {
    const row = availableRows.find((option) => `${option.itemCode}-${option.size}` === linePicker);
    if (!row) {
      return;
    }
    setLines((previous) => [
      ...previous,
      {
        id: `line-${row.itemCode}-${row.size}`,
        productId: row.productId,
        itemCode: row.itemCode,
        itemName: row.itemName,
        size: row.size,
        availableQty: row.availableQty,
        transferQty: 1,
        uom: row.uom,
        remarks: '',
      },
    ]);
    setLinePicker('');
  };

  const saveTransfer = (status) => {
    if (!formValues.fromLocation || !formValues.toLocation) {
      setErrorMessage('From and To locations are required.');
      return;
    }
    if (formValues.fromLocation === formValues.toLocation) {
      setErrorMessage('From and To locations must be different.');
      return;
    }
    if (!lines.length) {
      setErrorMessage('Add at least one transfer line.');
      return;
    }
    const invalidLine = lines.find((line) => Number(line.transferQty || 0) <= 0 || Number(line.transferQty || 0) > Number(line.availableQty || 0));
    if (invalidLine) {
      setErrorMessage('Transfer quantity must be greater than zero and not exceed available quantity.');
      return;
    }

    const transferData = normalizeStockTransfer({
      id: existingTransfer?.id || `transfer-${Date.now()}`,
      transferNumber: formValues.transferNumber,
      transferDate: formValues.transferDate,
      fromLocation: formValues.fromLocation,
      toLocation: formValues.toLocation,
      notes: formValues.notes,
      vehicleDetails: formValues.vehicleDetails,
      transferType: formValues.transferType,
      status,
      createdBy: existingTransfer?.createdBy || 'Warehouse Admin',
      createdAt: existingTransfer?.createdAt || new Date().toISOString(),
      items: lines,
    });

    if (status === 'Draft') {
      upsertModuleRecord(stockTransferStorageKey, transferData);
      setFormValues((previous) => ({ ...previous, status }));
      setSuccessMessage('Transfer saved as draft locally.');
      return;
    }

    // ACTUAL API CALL FOR DISPATCH
    const executeTransfer = async () => {
      try {
        setErrorMessage('');
        setSuccessMessage('Processing transfer...');
        
        const payload = {
          sourceWarehouseId: formValues.fromLocation,
          destinationStoreId: formValues.toLocation,
          notes: formValues.notes,
          vehicleDetails: formValues.vehicleDetails,
          products: lines.map(line => ({
            productId: line.productId,
            quantity: Number(line.transferQty)
          }))
        };

        const res = await api.post('/dispatch', payload);
        
        if (res.data?.success) {
          setSuccessMessage(`Transfer successful! Dispatch No: ${res.data.dispatchNumber}`);
          // Clear local draft if it exists
          if (existingTransfer?.id) {
            // (Optional logic to remove from local storage)
          }
          setTimeout(() => navigate('/inventory/transfer'), 2000);
        }
      } catch (err) {
        console.error('Transfer failed:', err);
        setErrorMessage(err.response?.data?.message || 'Failed to execute transfer. Please try again.');
        setSuccessMessage('');
      }
    };

    executeTransfer();
  };

  return (
    <Box>
      <PageHeader
        title={isViewMode ? 'Stock Transfer Details' : isEditMode ? 'Edit Stock Transfer' : 'New Stock Transfer'}
        subtitle="Build HO to store dispatches with location, vehicle, transfer type, and item matrix controls."
        breadcrumbs={[
          { label: 'Inventory' },
          { label: 'Stock Transfer' },
          { label: isViewMode ? 'View' : isEditMode ? 'Edit' : 'New', active: true },
        ]}
        actions={[
          <Button key="back" variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/inventory/transfer')}>
            Back
          </Button>,
          !isViewMode ? (
            <Button key="draft" variant="outlined" startIcon={<SaveOutlinedIcon />} onClick={() => saveTransfer('Draft')}>
              Save Draft
            </Button>
          ) : null,
          !isViewMode ? (
            <Button key="submit" variant="contained" startIcon={<SendOutlinedIcon />} onClick={() => saveTransfer('In Transit')}>
              Transfer / Submit
            </Button>
          ) : null,
        ].filter(Boolean)}
      />

      {errorMessage ? <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid #fecaca', bgcolor: '#fff1f2', color: '#b91c1c', borderRadius: 2 }}>{errorMessage}</Paper> : null}
      {successMessage ? <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid #bbf7d0', bgcolor: '#f0fdf4', color: '#166534', borderRadius: 2 }}>{successMessage}</Paper> : null}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
        <SummaryCard label="Transfer No" value={formValues.transferNumber || '--'} helper="Auto-generated transfer reference." />
        <SummaryCard label="Status" value={<StatusBadge value={formValues.status} />} helper="Draft, in transit, completed, or cancelled." tone="warning" />
        <SummaryCard label="Total Items" value={lines.length} helper="Distinct item rows in this transfer." tone="info" />
        <SummaryCard label="Total Qty" value={totalQty} helper="Total units moving from HO to store." tone="success" />
      </Box>

      <FormSection title="Header" subtitle="Transfer date, origin, destination, notes, dispatch, and transfer type.">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField fullWidth size="small" label="Transfer Number" value={formValues.transferNumber} disabled />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField fullWidth size="small" type="date" label="Transfer Date" value={formValues.transferDate} onChange={(event) => setFormValues((previous) => ({ ...previous, transferDate: event.target.value }))} InputLabelProps={{ shrink: true }} disabled={isViewMode} />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField fullWidth size="small" select label="From Location" value={formValues.fromLocation} onChange={(event) => setFormValues((previous) => ({ ...previous, fromLocation: event.target.value }))} disabled={isViewMode}>
              <MenuItem value="">Select Source</MenuItem>
              {fromLocationOptions.map((location) => (
                <MenuItem key={`from-${location.id}`} value={location.id}>
                  {location.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField fullWidth size="small" select label="To Location" value={formValues.toLocation} onChange={(event) => setFormValues((previous) => ({ ...previous, toLocation: event.target.value }))} disabled={isViewMode}>
              <MenuItem value="">Select Destination</MenuItem>
              {toLocationOptions.map((location) => (
                <MenuItem key={`to-${location.id}`} value={location.id}>
                  {location.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth size="small" label="Vehicle / Dispatch Details" value={formValues.vehicleDetails} onChange={(event) => setFormValues((previous) => ({ ...previous, vehicleDetails: event.target.value }))} disabled={isViewMode} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              select
              label="Transfer Type"
              value={formValues.transferType}
              onChange={(event) => {
                const newType = event.target.value;
                setFormValues((previous) => ({
                  ...previous,
                  transferType: newType,
                  fromLocation: '',
                  toLocation: '',
                }));
              }}
              disabled={isViewMode}
            >
              <MenuItem value="HO_TO_STORE">HO to Store</MenuItem>
              <MenuItem value="WAREHOUSE_TO_STORE">Warehouse to Store</MenuItem>
              <MenuItem value="INTER_STORE">Inter Store</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth size="small" label="Notes" value={formValues.notes} onChange={(event) => setFormValues((previous) => ({ ...previous, notes: event.target.value }))} disabled={isViewMode} />
          </Grid>
        </Grid>
      </FormSection>

      {!isViewMode ? (
        <FilterBar sx={{ mt: 2, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            select
            label="Item Search"
            value={linePicker}
            onChange={(event) => setLinePicker(event.target.value)}
            SelectProps={{
              renderValue: (selected) => {
                if (!selected) {
                  return 'Select item / size';
                }

                const matchedRow = availableRows.find((row) => `${row.itemCode}-${row.size}` === selected);

                return matchedRow
                  ? `${matchedRow.itemCode} | ${matchedRow.itemName} | ${getSizeLabel(matchedRow.size)} | Avl ${matchedRow.availableQty}`
                  : selected;
              },
            }}
          >
            <MenuItem value="">Select item / size</MenuItem>
            {availableRows.map((row) => (
              <MenuItem key={`${row.itemCode}-${row.size}`} value={`${row.itemCode}-${row.size}`}>
                {`${row.itemCode} | ${row.itemName} | ${getSizeLabel(row.size)} | Avl ${row.availableQty}`}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={addLine} disabled={!linePicker}>
            Add Item
          </Button>
        </FilterBar>
      ) : null}

      <FormSection title="Item Matrix" subtitle="Review available quantity, transfer quantity, UOM, and remarks before submitting.">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Item Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Available Qty</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Transfer Qty</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>UOM</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                {!isViewMode ? <TableCell sx={{ fontWeight: 700 }} align="right">Remove</TableCell> : null}
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell sx={{ fontWeight: 700 }}>{line.itemCode}</TableCell>
                  <TableCell>{line.itemName}</TableCell>
                  <TableCell>{getSizeLabel(line.size)}</TableCell>
                  <TableCell align="right">{line.availableQty}</TableCell>
                  <TableCell align="right">
                    {isViewMode ? (
                      line.transferQty
                    ) : (
                      <TextField size="small" type="number" value={line.transferQty} onChange={(event) => setLines((previous) => previous.map((item) => item.id === line.id ? { ...item, transferQty: Math.max(0, Number(event.target.value)) } : item))} sx={{ width: 96 }} />
                    )}
                  </TableCell>
                  <TableCell>{line.uom}</TableCell>
                  <TableCell>
                    {isViewMode ? (
                      line.remarks || '--'
                    ) : (
                      <TextField size="small" value={line.remarks} onChange={(event) => setLines((previous) => previous.map((item) => item.id === line.id ? { ...item, remarks: event.target.value } : item))} />
                    )}
                  </TableCell>
                  {!isViewMode ? (
                    <TableCell align="right">
                      <IconButton color="error" size="small" onClick={() => setLines((previous) => previous.filter((item) => item.id !== line.id))}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </FormSection>
    </Box>
  );
}

export default StockTransferFormPage;
