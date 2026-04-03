import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
  Autocomplete,
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
import { fetchRawMaterials } from '../rawMaterials/rawMaterialSlice';
import useRoleBasePath from '../../hooks/useRoleBasePath';

const SupplierOutwardFormPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const basePath = useRoleBasePath();

    const suppliers = useSelector((s) => s.masters.suppliers || []);
    const warehouses = useSelector((s) => s.masters.warehouses || []);
    const rawMaterials = useSelector((s) => s.rawMaterial.records || []);

    const { control, handleSubmit, register, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            supplierId: '',
            warehouseId: '',
            notes: ''
        }
    });

    const [lines, setLines] = useState([]);

    useEffect(() => {
        dispatch(fetchMasters('suppliers'));
        dispatch(fetchMasters('warehouses'));
        dispatch(fetchRawMaterials());
    }, [dispatch]);

    // Auto-select warehouse if only one exists
    useEffect(() => {
        if (warehouses.length > 0 && !watch('warehouseId')) {
            setValue('warehouseId', warehouses[0]._id);
        }
    }, [warehouses, setValue, watch]);

    const handleAddMaterial = (material) => {
        if (!material) return;
        
        const existingLine = lines.find(l => l.rawMaterialId === (material._id || material.id));
        if (existingLine) {
            setLines(prev => prev.map(l => l.rawMaterialId === (material._id || material.id) ? { ...l, quantity: l.quantity + 1 } : l));
        } else {
            setLines(prev => [...prev, {
                rawMaterialId: material._id || material.id,
                name: material.name,
                code: material.code,
                uom: material.uom,
                quantity: 1,
                id: Math.random().toString(36).substr(2, 9)
            }]);
        }
    };

    const onSubmit = async (data) => {
        if (!lines.length) return alert('Please add at least one material');
        if (!data.warehouseId && warehouses.length > 0) {
            data.warehouseId = warehouses[0]._id;
        }
        
        const payload = {
            ...data,
            items: lines.map(l => ({
                rawMaterialId: l.rawMaterialId,
                code: l.code,
                quantity: l.quantity,
                uom: l.uom
            }))
        };

        try {
            await dispatch(addSupplierOutward(payload)).unwrap();
            navigate(`${basePath}/inventory/supplier-outward`);
        } catch (e) {
            alert(e || 'Failed to save issue record');
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        Material Issue (Outward)
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Select fabric or accessories and provide them to your stitcher/supplier.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Back</Button>
                    <Button 
                        variant="contained" 
                        startIcon={<SaveOutlinedIcon />} 
                        onClick={handleSubmit(onSubmit)}
                        sx={{ px: 4, bgcolor: '#2563eb', fontWeight: 700 }}
                    >
                        Save Issue Entry
                    </Button>
                </Stack>
            </Stack>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 3 }}>
                        <Typography variant="subtitle1" sx={{ mb: 2.5, fontWeight: 700 }}>Outward Info</Typography>
                        <Stack spacing={2.5}>
                            <Controller
                                name="supplierId"
                                control={control}
                                rules={{ required: 'Select a supplier' }}
                                render={({ field }) => (
                                    <TextField 
                                      select fullWidth size="small" 
                                      label="Target Supplier (Stitcher / Unit)"
                                      {...field}
                                      error={!!errors.supplierId}
                                      helperText={errors.supplierId?.message}
                                    >
                                        {suppliers.map(s => <MenuItem key={s._id} value={s._id}>{s.name || s.supplierName}</MenuItem>)}
                                    </TextField>
                                )}
                            />
                            
                            <TextField 
                                fullWidth multiline rows={4} 
                                label="Production Instructions / Notes" 
                                {...register('notes')}
                                placeholder="Add specific roll handling or batch instructions..."
                            />
                        </Stack>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#64748b' }}>Search Factory Material</Typography>
                        <Autocomplete
                            fullWidth
                            size="small"
                            options={rawMaterials}
                            getOptionLabel={(o) => `${o.code} - ${o.name} (${o.uom})`}
                            onChange={(_, v) => handleAddMaterial(v)}
                            sx={{ mb: 3 }}
                            renderInput={(params) => <TextField {...params} variant="outlined" placeholder="Search by roll code or material name..." />}
                        />

                        <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Material Code</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Amount (Qty)</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>UOM</TableCell>
                                        <TableCell align="center"></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {lines.map((line) => (
                                        <TableRow key={line.id}>
                                            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{line.code}</TableCell>
                                            <TableCell sx={{ color: '#444' }}>{line.name}</TableCell>
                                            <TableCell align="right">
                                                <TextField 
                                                  type="number" size="small" 
                                                  sx={{ width: 100 }} 
                                                  value={line.quantity}
                                                  slotProps={{ htmlInput: { step: 0.1 } }}
                                                  onChange={(e) => setLines(prev => prev.map(l => l.id === line.id ? { ...l, quantity: Number(e.target.value) } : l))}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>{line.uom}</TableCell>
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
                                            <TableCell colSpan={5} align="center" sx={{ py: 8, color: '#94a3b8' }}>
                                                Select a material from search box to add for issue.
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
