import { useState } from 'react';
import { Box, Button, Card, Grid, Stack, Typography, Alert, Paper } from '@mui/material';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import api from '../../services/api';

function DataImportExportPage() {
    const navigate = useAppNavigate();
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState({ type: '', msg: '' });
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleImport = async () => {
        if (!file) return setStatus({ type: 'error', msg: 'Please select a file first.' });

        setLoading(true);
        setStatus({ type: 'info', msg: 'Uploading and processing...' });

        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post('/products/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setStatus({ type: 'success', msg: 'Data imported successfully!' });
            setFile(null);
        } catch (err) {
            setStatus({ type: 'error', msg: err?.response?.data?.message || 'Import failed.' });
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (type) => {
        setLoading(true);
        setStatus({ type: 'info', msg: 'Generating export file...' });

        try {
            const response = await api.get(`/products/export?type=${type}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `products_export_${Date.now()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            setStatus({ type: 'success', msg: 'Export started.' });
        } catch (err) {
            setStatus({ type: 'error', msg: 'Export failed.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 4 }}>
            <Stack direction="row" spacing={2} sx={{ mb: 4, alignItems: 'center' }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Back</Button>
                <Typography variant="h4" fontWeight={700}>Data Management</Typography>
            </Stack>

            {status.msg && <Alert severity={status.type} sx={{ mb: 3 }}>{status.msg}</Alert>}

            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    <Card sx={{ p: 4, height: '100%', border: '1px solid #e2e8f0', borderRadius: 3, boxShadow: 'none' }}>
                        <Typography variant="h6" gutterBottom fontWeight={600}>Import Products</Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                            Upload an Excel file to bulk import products and variants into the system.
                        </Typography>

                        <Stack spacing={2}>
                            <input
                                accept=".xlsx, .xls"
                                style={{ display: 'none' }}
                                id="import-file"
                                type="file"
                                onChange={handleFileChange}
                            />
                            <label htmlFor="import-file">
                                <Button
                                    variant="outlined"
                                    component="span"
                                    fullWidth
                                    startIcon={<FileUploadOutlinedIcon />}
                                    sx={{ py: 2, borderStyle: 'dashed' }}
                                >
                                    {file ? file.name : 'Select Excel File'}
                                </Button>
                            </label>

                            <Button
                                variant="contained"
                                onClick={handleImport}
                                disabled={!file || loading}
                                sx={{ py: 1.5, fontWeight: 600 }}
                            >
                                Start Import
                            </Button>
                        </Stack>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card sx={{ p: 4, height: '100%', border: '1px solid #e2e8f0', borderRadius: 3, boxShadow: 'none' }}>
                        <Typography variant="h6" gutterBottom fontWeight={600}>Export Data</Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                            Download the entire product catalog, inventory records, or customer lists.
                        </Typography>

                        <Stack spacing={2}>
                            <Button
                                variant="outlined"
                                startIcon={<FileDownloadOutlinedIcon />}
                                onClick={() => handleExport('products')}
                                disabled={loading}
                                sx={{ py: 1.8 }}
                            >
                                Export Products (Excel)
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<FileDownloadOutlinedIcon />}
                                onClick={() => handleExport('inventory')}
                                disabled={loading}
                                sx={{ py: 1.8 }}
                            >
                                Export Stock Assets (Excel)
                            </Button>
                        </Stack>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

export default DataImportExportPage;
