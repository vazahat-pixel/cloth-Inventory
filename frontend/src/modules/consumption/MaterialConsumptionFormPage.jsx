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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';

import { addConsumption } from './consumptionSlice';
import { fetchSupplierOutwards } from '../supplierOutward/supplierOutwardSlice';
import useRoleBasePath from '../../hooks/useRoleBasePath';

const MaterialConsumptionFormPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const basePath = useRoleBasePath();

    const outwards = useSelector((s) => s.supplierOutward.records || []);

    const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            sourceOutwardId: '',
            supplierId: '',
            consumptionDate: new Date().toISOString().split('T')[0],
            notes: ''
        }
    });

    const [consumptionLines, setConsumptionLines] = useState([]);

    useEffect(() => {
        dispatch(fetchSupplierOutwards());
    }, [dispatch]);

    // Track selected issue to populate items
    const selectedOutwardId = watch('sourceOutwardId');
    useEffect(() => {
        if (selectedOutwardId) {
            const outward = outwards.find(o => o._id === selectedOutwardId);
            if (outward) {
                setValue('supplierId', outward.supplierId?._id || outward.supplierId);
                // Initialize consumption lines from issued items
                setConsumptionLines(outward.items.map(i => ({
                    rawMaterialId: i.rawMaterialId?._id || i.rawMaterialId,
                    code: i.code,
                    issuedQty: i.quantity,
                    uom: i.uom,
                    quantityUsed: i.quantity, // Default to full use
                    wastage: 0,
                    notes: ''
                })));
            }
        }
    }, [selectedOutwardId, outwards, setValue]);

    const onSubmit = async (data) => {
        if (!consumptionLines.length) return alert('No items found in selected issue');
        
        const payload = {
            ...data,
            items: consumptionLines.map(l => ({
                rawMaterialId: l.rawMaterialId,
                quantityUsed: Number(l.quantityUsed),
                wastage: Number(l.wastage),
                notes: l.notes
            }))
        };

        try {
            await dispatch(addConsumption(payload)).unwrap();
            navigate(`${basePath}/inventory/consumption`);
        } catch (e) {
            alert(e || 'Failed to save consumption log');
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        Record Material Consumption
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Log how much of the issued material was used or wasted during production.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Back</Button>
                    <Button 
                        variant="contained" 
                        startIcon={<HistoryEduIcon />} 
                        onClick={handleSubmit(onSubmit)}
                        sx={{ px: 4, bgcolor: '#d946ef', fontWeight: 700 }}
                    >
                        Save Consumption entry
                    </Button>
                </Stack>
            </Stack>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 3 }}>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>Source Information</Typography>
                        <Stack spacing={2.5}>
                            <Controller
                                name="sourceOutwardId"
                                control={control}
                                rules={{ required: 'Select an outward issue' }}
                                render={({ field }) => (
                                    <TextField 
                                      select fullWidth size="small" 
                                      label="Original Material Issue #"
                                      {...field}
                                      error={!!errors.sourceOutwardId}
                                    >
                                        {outwards.map(o => (
                                            <MenuItem key={o._id} value={o._id}>{o.outwardNumber} - {o.supplierId?.name}</MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                            
                            <TextField 
                                fullWidth type="date" size="small" 
                                label="Date of Consumption" 
                                {...control.register('consumptionDate')}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />

                            <TextField 
                                fullWidth multiline rows={3} 
                                label="General Observation / Remarks" 
                                {...control.register('notes')}
                            />
                        </Stack>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                        <Box sx={{ p: 2, bgcolor: '#fdf4ff', borderBottom: '1px solid #f5d0fe' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#86198f' }}>Usage Reconcilation Table</Typography>
                        </Box>
                        <TableContainer>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Material</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Issued</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Consumed</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Wastage</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Short Notes</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {consumptionLines.map((line, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell sx={{ fontWeight: 700, color: '#333' }}>{line.code}</TableCell>
                                            <TableCell align="right" sx={{ color: '#64748b' }}>{line.issuedQty} {line.uom}</TableCell>
                                            <TableCell align="right">
                                                <TextField 
                                                  type="number" size="small" 
                                                  variant="standard"
                                                  sx={{ width: 80, '& input': { textAlign: 'right', fontWeight: 800 } }} 
                                                  value={line.quantityUsed}
                                                  onChange={(e) => setConsumptionLines(prev => prev.map((l, i) => i === idx ? { ...l, quantityUsed: e.target.value } : l))}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <TextField 
                                                  type="number" size="small" 
                                                  variant="standard"
                                                  sx={{ width: 60, '& input': { textAlign: 'right', color: '#dc2626' } }} 
                                                  value={line.wastage}
                                                  onChange={(e) => setConsumptionLines(prev => prev.map((l, i) => i === idx ? { ...l, wastage: e.target.value } : l))}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField 
                                                  fullWidth size="small" 
                                                  variant="standard"
                                                  placeholder="e.g. Broken cone, stain..."
                                                  value={line.notes}
                                                  onChange={(e) => setConsumptionLines(prev => prev.map((l, i) => i === idx ? { ...l, notes: e.target.value } : l))}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!consumptionLines.length && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                                                Select an issue on the left to reconcile usage logs.
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

export default MaterialConsumptionFormPage;
