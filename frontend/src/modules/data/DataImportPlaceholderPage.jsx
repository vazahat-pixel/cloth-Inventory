import { Box, Typography, Button, Paper, Stack, Breadcrumbs, Link, Divider, Checkbox, FormControlLabel, TextField, Grid, MenuItem } from '@mui/material';
import { useLocation, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import useAppNavigate from '../../hooks/useAppNavigate';
import { dataImportPlaceholderContent } from './dataImportNavConfig';

const DataImportPlaceholderPage = () => {
    const { subKey } = useParams();
    const navigate = useAppNavigate();
    const location = useLocation();
    
    // Extract key from path if not in params
    const currentKey = subKey || location.pathname.split('/').pop();
    const content = dataImportPlaceholderContent[currentKey] || {
        title: 'Data Utility',
        description: 'Bulk data processing tool for masters and transactions.',
        highlights: ['Ready for background processing.', 'Supports large file uploads.', 'Audit log integration.']
    };

    const isImport = content.title.toLowerCase().includes('import');

    const renderFormFields = () => {
        const isExport = !isImport;
        
        return (
            <Stack spacing={4}>
                <Grid container spacing={3}>
                    {/* Common Export Options */}
                    {isExport && (
                        <Grid item xs={12}>
                            <Stack direction="row" spacing={4}>
                                <FormControlLabel 
                                    control={<Checkbox defaultChecked sx={{ color: '#94a3b8' }} />} 
                                    label={<Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>{currentKey === 'export-item-master' ? 'Select Items' : 'Select Voucher'}</Typography>} 
                                />
                                <FormControlLabel 
                                    control={<Checkbox sx={{ color: '#94a3b8' }} />} 
                                    label={<Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>Export Group Details</Typography>} 
                                />
                            </Stack>
                        </Grid>
                    )}

                    {/* File Path Selection - Common for most */}
                    {(currentKey === 'export-purchase-text' || isImport) && (
                        <Grid item xs={12}>
                            <Stack direction="row" spacing={1} alignItems="flex-end">
                                <TextField 
                                    label="File Path" 
                                    fullWidth 
                                    variant="outlined" 
                                    size="small" 
                                    placeholder="C:\Exports\data.txt"
                                    sx={{ bgcolor: '#fff' }}
                                />
                                <Button variant="outlined" sx={{ height: 40, px: 3, whiteSpace: 'nowrap', fontWeight: 700 }}>
                                    Select File
                                </Button>
                            </Stack>
                        </Grid>
                    )}

                    {/* Import Specific Header Fields */}
                    {isImport && currentKey.includes('purchase') && (
                        <>
                            <Grid item xs={12} sm={4}>
                                <TextField label="Invoice Number" fullWidth size="small" variant="filled" />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField label="Invoice Date" fullWidth size="small" variant="filled" type="date" InputLabelProps={{ shrink: true }} />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField label="Invoice Amount" fullWidth size="small" variant="filled" type="number" />
                            </Grid>
                        </>
                    )}

                    {/* Footer Dropdowns for Import (Image 5) */}
                    {isImport && (
                        <>
                            <Grid item xs={12}>
                                <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                                    Workflow Configuration
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField select label="Receipt Date" fullWidth size="small">
                                    <MenuItem value="today">26/03/2026</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField select label="Purchase Config" fullWidth size="small">
                                    <MenuItem value="voucher">PURCHASE VOUCHER</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField select label="Supplier Name" fullWidth size="small">
                                    <MenuItem value="jaikumar">JAIKUMAR ARJANDAS</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField select label="Purchase Account" fullWidth size="small">
                                    <MenuItem value="gst1">GST PURCHASE 1%</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField select label="Godown" fullWidth size="small">
                                    <MenuItem value="nil">(NIL)</MenuItem>
                                </TextField>
                            </Grid>
                        </>
                    )}
                </Grid>

                {/* Main Action Buttons */}
                <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
                    <Button 
                        variant="contained" 
                        size="large"
                        startIcon={isImport ? <FileUploadOutlinedIcon /> : <FileDownloadOutlinedIcon />}
                        sx={{ px: 5, py: 1.5, borderRadius: 2, fontWeight: 700, textTransform: 'none', minWidth: 200 }}
                    >
                        {isImport ? 'Convert & Import' : 'Export File'}
                    </Button>
                    <Button 
                        variant="outlined" 
                        size="large"
                        onClick={() => navigate(-1)}
                        sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: 700, textTransform: 'none', color: '#64748b' }}
                    >
                        Close
                    </Button>
                </Stack>
            </Stack>
        );
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 4 }, minHeight: '100%', bgcolor: '#f8fafc' }}>
            {/* Header & Breadcrumbs */}
            <Stack spacing={1} sx={{ mb: 4 }}>
                <Breadcrumbs sx={{ '& .MuiBreadcrumbs-li': { fontSize: 13, fontWeight: 600, color: '#64748b' } }}>
                    <Link underline="hover" color="inherit" onClick={() => navigate('/data-import')} sx={{ cursor: 'pointer' }}>
                        Data Import/Export
                    </Link>
                    <Typography fontSize={13} fontWeight={700} color="primary">
                        {content.title}
                    </Typography>
                </Breadcrumbs>
                
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Button 
                        startIcon={<ArrowBackIcon />} 
                        onClick={() => navigate(-1)}
                        sx={{ color: '#64748b', fontWeight: 700 }}
                    >
                        Back
                    </Button>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: -1 }}>
                        {content.title}
                    </Typography>
                </Stack>
            </Stack>

            <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="body1" sx={{ color: '#64748b', lineHeight: 1.8 }}>
                        {content.description}
                    </Typography>
                </Box>

                <Divider sx={{ mb: 4 }} />

                {renderFormFields()}

                <Divider sx={{ my: 4 }} />

                <Box sx={{ maxWidth: 700 }}>
                    <Typography variant="overline" sx={{ fontWeight: 800, color: '#3b82f6', letterSpacing: 1.5 }}>
                        Feature Highlights
                    </Typography>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                        {content.highlights.map((text, i) => (
                            <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#3b82f6', mt: 1 }} />
                                <Typography sx={{ fontSize: 14, color: '#475569', fontWeight: 600 }}>
                                    {text}
                                </Typography>
                            </Stack>
                        ))}
                    </Stack>
                </Box>
            </Paper>
        </Box>
    );
};

export default DataImportPlaceholderPage;
