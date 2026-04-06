import { useState } from 'react';
import { Box, Button, Card, Grid, Stack, Typography, Alert, Paper } from '@mui/material';
import { useSelector } from 'react-redux';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import api from '../../services/api';
import * as XLSX from 'xlsx';

function DataImportExportPage() {
    const navigate = useAppNavigate();
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState({ type: '', msg: '' });
    const [loading, setLoading] = useState(false);
    const user = useSelector((state) => state.auth.user);
    const isAdmin = user?.role === 'Admin';

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleImport = async () => {
        if (!file) return setStatus({ type: 'error', msg: 'Please select a file first.' });

        setLoading(true);
        setStatus({ type: 'info', msg: 'Reading Excel and importing...' });

        try {
            // Read Excel on the client and reuse the same mapping as DataImportPage
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
            const firstSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheet];
            const rows = XLSX.utils.sheet_to_json(worksheet);

            if (!rows.length) {
                setStatus({ type: 'error', msg: 'The selected Excel file is empty.' });
                setLoading(false);
                return;
            }

            const payload = {
                products: rows.map(row => ({
                    name: row.Name || row.name || row['Product Name'],
                    category: row.Category || row.category || 'General',
                    brand: row.Brand || row.brand || 'None',
                    costPrice: parseFloat(row.CostPrice || row.costPrice || row['Cost Price'] || 0),
                    salePrice: parseFloat(row.SalePrice || row.salePrice || row['Sale Price'] || 0),
                    // Backend enum: 'S','M','L','XL','XXL','FREE'
                    size: row.Size || row.size || 'FREE',
                    color: row.Color || row.color || 'Standard',
                    factoryStock: parseInt(row.Stock || row.stock || row.factoryStock || row['Initial Stock'] || 0, 10),
                    sku: row.SKU || row.sku || null,
                    barcode: row.Barcode || row.barcode || null
                }))
            };

            await api.post('/products/bulk-import', payload);
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
            if (type === 'products') {
                // Use new backend-optimized export
                const auth = localStorage.getItem('cloth_erp_auth');
                const token = auth ? JSON.parse(auth).token : '';
                const url = `${import.meta.env.VITE_API_URL}/api/import/export-items?token=${token}`;
                window.open(url, '_blank');
                setStatus({ type: 'success', msg: 'Product export started.' });
                setLoading(false);
                return;
            } else if (type === 'inventory') {
                // Use backend inventory-export report (admin only)
                const res = await api.get('/reports/inventory-export');
                const rows = res.data?.data?.rows || [];

                if (!rows.length) {
                    setStatus({ type: 'error', msg: 'No inventory data to export.' });
                    return;
                }

                const worksheet = XLSX.utils.json_to_sheet(rows);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');

                const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                const blob = new Blob([wbout], { type: 'application/octet-stream' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `inventory_export_${Date.now()}.xlsx`);
                document.body.appendChild(link);
                link.click();
                setStatus({ type: 'success', msg: 'Inventory exported successfully.' });
            }
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
                <Typography variant="h4" fontWeight={700}>Data Import & Export</Typography>
            </Stack>

            {status.msg && <Alert severity={status.type} sx={{ mb: 3 }}>{status.msg}</Alert>}

            <Grid container spacing={4}>
                {isAdmin && (
                    <Grid item xs={12} md={6}>
                        <Card sx={{ p: 4, height: '100%', border: '1px solid #e2e8f0', borderRadius: 3, boxShadow: 'none' }}>
                            <Typography variant="h6" gutterBottom fontWeight={600}>Import Products</Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                                Upload an Excel file to bulk import products into the global catalog.
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
                )}

                <Grid item xs={12} md={isAdmin ? 6 : 12}>
                    <Card sx={{ p: 4, height: '100%', border: '1px solid #e2e8f0', borderRadius: 3, boxShadow: 'none' }}>
                        <Typography variant="h6" gutterBottom fontWeight={600}>Export Data</Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                            Download the product catalog or {isAdmin ? 'global' : 'store'} inventory records.
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
                                Export {isAdmin ? 'All' : 'Store'} Inventory (Excel)
                            </Button>
                        </Stack>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

export default DataImportExportPage;
