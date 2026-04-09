import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
    Box, Button, Grid, IconButton, MenuItem, Paper, Stack,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Typography, Autocomplete, Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';

import { addOutward } from './productionSlice';
import { fetchMasters } from '../masters/mastersSlice';
import { fetchItems } from '../items/itemsSlice';
import useRoleBasePath from '../../hooks/useRoleBasePath';

const getTodayDate = () => new Date().toISOString().slice(0, 10);

function SupplierOutwardFormPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const basePath = useRoleBasePath();

    const suppliers = useSelector((s) => s.masters.suppliers || []);
    const warehouses = useSelector((s) => s.masters.warehouses || []);
    const items = useSelector((s) => s.items.records || []);

    const { control, handleSubmit, register, formState: { errors } } = useForm({
        defaultValues: {
            supplierId: '',
            warehouseId: '',
            outwardDate: getTodayDate(),
            targetItemId: '',
            notes: ''
        }
    });

    const [lines, setLines] = useState([]);

    useEffect(() => {
        dispatch(fetchMasters('suppliers'));
        dispatch(fetchMasters('warehouses'));
        dispatch(fetchItems());
    }, [dispatch]);

    const finishedGoods = useSelector((s) => (s.items.records || []).filter(i => i.type === 'GARMENT'));

    const handleAddItem = (item) => {
        if (!item) return;
        const newLine = {
            id: Math.random().toString(36).substr(2, 9),
            itemId: item._id || item.id,
            itemName: item.itemName,
            itemCode: item.itemCode,
            uom: item.uom || 'MTR',
            quantity: 1,
            code: '' // Roll Number / Batch
        };
        setLines(prev => [...prev, newLine]);
    };

    const updateLineField = (id, field, value) => {
        setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    const removeLine = (id) => {
        setLines(prev => prev.filter(l => l.id !== id));
    };

    const onSubmit = async (data) => {
        if (!lines.length) return alert('Please add at least one material line.');
        
        const payload = {
            ...data,
            items: lines.map(l => ({
                itemId: l.itemId,
                quantity: Number(l.quantity),
                code: l.code,
                uom: l.uom
            }))
        };

        try {
            await dispatch(addOutward(payload)).unwrap();
            alert('Material outward recorded successfully!');
            navigate(`${basePath}/production/outwards`);
        } catch (e) {
            alert(e || 'Failed to save record');
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        New Material Issue (Job Work Out)
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Issue raw fabric and accessories to tailors/factories.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Back</Button>
                    <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={handleSubmit(onSubmit)}>
                        Post Outward
                    </Button>
                </Stack>
            </Stack>

            <Grid container spacing={3}>
                {/* Headers */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#475569' }}>
                            OUTWARD DETAILS
                        </Typography>
                        <Stack spacing={2}>
                            <Controller
                                name="supplierId"
                                control={control}
                                rules={{ required: 'Select a Tailor/Supplier' }}
                                render={({ field: { onChange, value } }) => (
                                    <Autocomplete
                                        fullWidth
                                        size="small"
                                        options={suppliers}
                                        getOptionLabel={(s) => s.name || s.supplierName || ''}
                                        value={suppliers.find(s => s._id === value) || null}
                                        onChange={(_, newValue) => onChange(newValue?._id || '')}
                                        renderInput={(params) => (
                                            <TextField {...params} label="Tailor / Job Worker" error={Boolean(errors.supplierId)} helperText={errors.supplierId?.message} />
                                        )}
                                    />
                                )}
                            />
                            <Controller
                                name="warehouseId"
                                control={control}
                                rules={{ required: 'Select Source Warehouse' }}
                                render={({ field: { onChange, value } }) => (
                                    <Autocomplete
                                        fullWidth
                                        size="small"
                                        options={warehouses}
                                        getOptionLabel={(w) => w.name || ''}
                                        value={warehouses.find(w => w._id === value) || null}
                                        onChange={(_, newValue) => onChange(newValue?._id || '')}
                                        renderInput={(params) => (
                                            <TextField {...params} label="Source Warehouse (Fabric Stock)" error={Boolean(errors.warehouseId)} helperText={errors.warehouseId?.message} />
                                        )}
                                    />
                                )}
                            />
                            <TextField
                                fullWidth size="small" type="date" label="Issue Date"
                                InputLabelProps={{ shrink: true }}
                                {...register('outwardDate', { required: true })}
                            />
                            <Controller
                                name="targetItemId"
                                control={control}
                                render={({ field: { onChange, value } }) => (
                                    <Autocomplete
                                        fullWidth
                                        size="small"
                                        options={finishedGoods}
                                        getOptionLabel={(o) => `${o.itemName} (${o.itemCode})`}
                                        value={finishedGoods.find(i => (i._id || i.id) === value) || null}
                                        onChange={(_, newValue) => onChange(newValue?._id || newValue?.id || '')}
                                        renderInput={(params) => (
                                            <TextField {...params} label="Target Finished Garment (Optional)" helperText="Select which shirt/pant is being made" />
                                        )}
                                    />
                                )}
                            />
                            <TextField
                                fullWidth size="small" multiline rows={3} label="Notes / Work Instructions"
                                {...register('notes')}
                            />
                        </Stack>
                    </Paper>
                </Grid>

                {/* Items */}
                <Grid item xs={12} md={8}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 3 }}>
                        <Box sx={{ mb: 3 }}>
                            <Autocomplete
                                options={items.filter(i => i.type === 'FABRIC' || i.type === 'ACCESSORY' || !i.type)}
                                getOptionLabel={(o) => `${o.itemName} (${o.itemCode})`}
                                renderInput={(params) => (
                                    <TextField {...params} label="Search Raw Material / Fabric" placeholder="Type name or SKU..." size="small" />
                                )}
                                onChange={(_, val) => handleAddItem(val)}
                            />
                        </Box>

                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                        <TableCell sx={{ fontWeight: 700 }}>Item Description</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Roll # / Code</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Qty (Mtr/Pcs)</TableCell>
                                        <TableCell align="center">Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {lines.map((line) => (
                                        <TableRow key={line.id}>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{line.itemName}</Typography>
                                                <Typography variant="caption" sx={{ color: '#64748b' }}>{line.itemCode}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small" placeholder="Optional"
                                                    value={line.code}
                                                    onChange={(e) => updateLineField(line.id, 'code', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <TextField
                                                    size="small" type="number" sx={{ width: 100 }}
                                                    value={line.quantity}
                                                    onChange={(e) => updateLineField(line.id, 'quantity', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton color="error" onClick={() => removeLine(line.id)}>
                                                    <DeleteOutlineIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!lines.length && (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                                                No materials added yet. Use the search bar above.
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
}

export default SupplierOutwardFormPage;
