import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Button,
  Card,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { addRawMaterial, updateRawMaterial, fetchRawMaterials } from './rawMaterialSlice';
import useRoleBasePath from '../../hooks/useRoleBasePath';
import PageHeader from '../../components/erp/PageHeader';

const RawMaterialFormPage = () => {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const basePath = useRoleBasePath();

    const { records } = useSelector(s => s.rawMaterial);
    const [loading, setLoading] = useState(false);

    const { control, handleSubmit, register, watch, reset, formState: { errors } } = useForm({
        defaultValues: {
            code: '',
            name: '',
            materialType: 'FABRIC',
            uom: 'METER',
            composition: '',
            gsm: 0,
            width: '',
            shadeNo: '',
            purchasePrice: 0,
            openingStock: 0,
            status: 'Active',
            notes: ''
        }
    });

    const materialType = watch('materialType');

    useEffect(() => {
        if (isEdit) {
            const material = records.find(r => r._id === id);
            if (material) {
                reset(material);
            } else {
                dispatch(fetchRawMaterials()).unwrap().then(res => {
                    const m = res.find(r => r._id === id);
                    if (m) reset(m);
                });
            }
        }
    }, [id, records, isEdit, reset, dispatch]);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            if (isEdit) {
                await dispatch(updateRawMaterial({ id, data })).unwrap();
            } else {
                await dispatch(addRawMaterial(data)).unwrap();
            }
            navigate(`${basePath}/inventory/raw-materials`);
        } catch (e) {
            alert(e || 'Failed to save material');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <PageHeader 
                title={isEdit ? 'Edit Raw Material' : 'Create Raw Material'}
                subtitle="Define technical specifications and opening stock for factory supplies."
                breadcrumbs={[{ label: 'Inventory' }, { label: 'Raw Materials', path: `${basePath}/inventory/raw-materials` }, { label: isEdit ? 'Edit' : 'New', active: true }]}
                actions={[
                    <Button 
                        key="back"
                        variant="outlined" 
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate(-1)}
                    >
                        Back to List
                    </Button>,
                    <Button 
                        key="save"
                        variant="contained" 
                        startIcon={<SaveOutlinedIcon />}
                        onClick={handleSubmit(onSubmit)}
                        disabled={loading}
                        sx={{ bgcolor: '#2563eb' }}
                    >
                        {isEdit ? 'Update Material' : 'Save Material'}
                    </Button>
                ]}
            />

            <Box sx={{ px: { xs: 2, md: 4 }, py: 2 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Card elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 3 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>Core Material Details</Typography>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} md={4}>
                                    <TextField 
                                        fullWidth size="small" 
                                        label="Material Code (Roll/LOT #)" 
                                        {...register('code', { required: 'Code is required' })} 
                                        error={!!errors.code}
                                        helperText={errors.code?.message}
                                        disabled={isEdit}
                                    />
                                </Grid>
                                <Grid item xs={12} md={8}>
                                    <TextField 
                                        fullWidth size="small" 
                                        label="Material Name / Style Name" 
                                        {...register('name', { required: 'Name is required' })} 
                                        error={!!errors.name}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField 
                                        select fullWidth size="small" 
                                        label="Material Type" 
                                        {...register('materialType')}
                                    >
                                        <MenuItem value="FABRIC">Fabric Roll</MenuItem>
                                        <MenuItem value="BASE_MATERIAL">Base / Raw Supply</MenuItem>
                                        <MenuItem value="YARN">Yarn / Thread Stock</MenuItem>
                                        <MenuItem value="OTHER">Other Material</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField 
                                        select fullWidth size="small" 
                                        label="Inward UOM" 
                                        {...register('uom')}
                                    >
                                        <MenuItem value="METER">Meter</MenuItem>
                                        <MenuItem value="YARD">Yard</MenuItem>
                                        <MenuItem value="KG">Kilogram</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField 
                                        select fullWidth size="small" 
                                        label="Status" 
                                        {...register('status')}
                                    >
                                        <MenuItem value="Active">Operational State</MenuItem>
                                        <MenuItem value="Draft">Pending Stock Prep</MenuItem>
                                        <MenuItem value="Inactive">Archive / Finished</MenuItem>
                                    </TextField>
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 5 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>Fabric Technical Specifications</Typography>
                                <Grid container spacing={2.5}>
                                    <Grid item xs={12} md={6}>
                                        <TextField fullWidth size="small" label="Material Composition" placeholder="e.g. 100% Cotton, Poly-Blended" {...register('composition')} />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <TextField fullWidth size="small" type="number" label="Fabric GSM" {...register('gsm')} />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <TextField fullWidth size="small" label="Fabric Width" {...register('width')} />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField fullWidth size="small" label="Fabric Shade / Color Code" {...register('shadeNo')} />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField fullWidth size="small" label="Fabric Shrinkage %" {...register('shrinkage')} />
                                    </Grid>
                                </Grid>
                            </Box>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 2.5, height: '100%', bgcolor: '#fdfdfd' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2.5, color: '#1e293b' }}>Stock & Notes</Typography>
                            <Stack spacing={2.5}>
                                <TextField 
                                    fullWidth size="small" type="number" 
                                    label="Opening Inward Stock" 
                                    {...register('openingStock')} 
                                    disabled={isEdit}
                                    helperText="Initial roll balance in warehouse"
                                />
                                <TextField 
                                    fullWidth size="small" type="number" 
                                    label="Low Stock Warning Level" 
                                    {...register('reorderLevel')} 
                                />
                                <Box sx={{ pt: 1, borderTop: '1px dashed #e2e8f0' }}>
                                    <TextField 
                                        fullWidth multiline rows={6} 
                                        label="Quality / Procurement Notes" 
                                        {...register('notes')} 
                                        placeholder="Add roll defects, contractor details, or procurement history..."
                                    />
                                </Box>
                            </Stack>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default RawMaterialFormPage;
