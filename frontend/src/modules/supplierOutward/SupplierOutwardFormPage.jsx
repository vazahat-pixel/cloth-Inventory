import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';

import { addSupplierOutward } from './supplierOutwardSlice';
import { fetchMasters } from '../masters/mastersSlice';
import useRoleBasePath from '../../hooks/useRoleBasePath';
import api from '../../services/api';

const SupplierOutwardFormPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const basePath = useRoleBasePath();

    const suppliers = useSelector((s) => s.masters.suppliers || []);
    const warehouses = useSelector((s) => s.masters.warehouses || []);

    const { control, handleSubmit, register, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            supplierId: '',
            warehouseId: '',
            notes: ''
        }
    });

    const [lines, setLines] = useState([]);
    const [barcodeSearch, setBarcodeSearch] = useState('');

    useEffect(() => {
        dispatch(fetchMasters('suppliers'));
        dispatch(fetchMasters('warehouses'));
    }, [dispatch]);

    const handleScanner = async (barcode) => {
        if (!barcode) return;
        try {
            const response = await api.get(`/items/scan/${barcode}`);
            const { item, variant } = response.data.data;
            
            const existingLine = lines.find(l => l.sku === variant.sku);
            if (existingLine) {
                setLines(prev => prev.map(l => l.sku === variant.sku ? { ...l, quantity: l.quantity + 1 } : l));
            } else {
                setLines(prev => [...prev, {
                    itemId: item._id,
                    variantId: variant._id,
                    itemName: item.itemName,
                    sku: variant.sku,
                    size: variant.size,
                    color: item.shade || '-',
                    quantity: 1,
                    id: Math.random().toString(36).substr(2, 9)
                }]);
            }
            setBarcodeSearch('');
        } catch (e) {
            alert('Item not found or stock insufficient.');
        }
    };

    const onSubmit = async (data) => {
        if (!lines.length) return alert('Please add at least one item');
        try {
            await dispatch(addSupplierOutward({ ...data, items: lines })).unwrap();
            navigate(`${basePath}/inventory/supplier-outward`);
        } catch (e) {
            alert(e || 'Failed to save outward challan');
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        Supplier Outward Creation
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Provide raw materials and accessories to a selected vendor.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    <Button 
                      variant="outlined" 
                      startIcon={<ArrowBackIcon />} 
                      onClick={() => navigate(-1)}
                    >
                      Back
                    </Button>
                    <Button 
                      variant="contained" 
                      startIcon={<SaveOutlinedIcon />} 
                      onClick={handleSubmit(onSubmit)}
                      sx={{ px: 4, fontWeight: 700 }}
                    >
                      Save Outward
                    </Button>
                </Stack>
            </Stack>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 3 }}>
                        <Typography variant="subtitle1" sx={{ mb: 2.5, fontWeight: 700 }}>Outward Details</Typography>
                        <Stack spacing={2.5}>
                            <Controller
                                name="supplierId"
                                control={control}
                                rules={{ required: 'Select a supplier' }}
                                render={({ field }) => (
                                    <TextField 
                                      select fullWidth size="small" 
                                      label="Select Supplier / Vendor"
                                      {...field}
                                      error={!!errors.supplierId}
                                      helperText={errors.supplierId?.message}
                                    >
                                        {suppliers.map(s => <MenuItem key={s._id} value={s._id}>{s.name || s.supplierName}</MenuItem>)}
                                    </TextField>
                                )}
                            />
                            <Controller
                                name="warehouseId"
                                control={control}
                                rules={{ required: 'Select source warehouse' }}
                                render={({ field }) => (
                                    <TextField 
                                      select fullWidth size="small" 
                                      label="Source Warehouse"
                                      {...field}
                                      error={!!errors.warehouseId}
                                      helperText={errors.warehouseId?.message}
                                    >
                                        {warehouses.map(w => <MenuItem key={w._id} value={w._id}>{w.name}</MenuItem>)}
                                    </TextField>
                                )}
                            />
                            <TextField 
                              fullWidth multiline rows={3} 
                              label="Notes" 
                              {...register('notes')}
                            />
                        </Stack>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 3 }}>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>Add Items (Scan Mode)</Typography>
                        <TextField
                            fullWidth size="medium"
                            placeholder="🔍 Scan Raw Material Barcode here..."
                            value={barcodeSearch}
                            onChange={(e) => setBarcodeSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleScanner(barcodeSearch);
                                }
                            }}
                            InputProps={{
                              sx: { bgcolor: '#f0f9ff', border: '1px dashed #0ea5e9', fontSize: '1.1rem', fontWeight: 600 }
                            }}
                            helperText="Stock will be automatically verified against selected warehouse."
                        />

                        <TableContainer sx={{ mt: 4 }}>
                            <Table size="small">
                                <TableHead component={Paper} elevation={0} sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Item Style</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Qty</TableCell>
                                        <TableCell align="center">Del</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {lines.map((line) => (
                                        <TableRow key={line.id}>
                                            <TableCell sx={{ fontWeight: 600 }}>{line.itemName}</TableCell>
                                            <TableCell sx={{ color: '#64748b' }}>{line.sku}</TableCell>
                                            <TableCell>{line.size}</TableCell>
                                            <TableCell align="right">
                                                <TextField 
                                                  type="number" size="small" 
                                                  sx={{ width: 80 }} 
                                                  value={line.quantity}
                                                  onChange={(e) => setLines(prev => prev.map(l => l.id === line.id ? { ...l, quantity: Number(e.target.value) } : l))}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton 
                                                  color="error" size="small"
                                                  onClick={() => setLines(prev => prev.filter(l => l.id !== line.id))}
                                                >
                                                  <DeleteOutlineIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!lines.length && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                                                No items added yet. Use the scanner above.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default SupplierOutwardFormPage;
