import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Alert,
    CircularProgress,
    Fade
} from '@mui/material';
import {
    CloudUploadOutlined as UploadIcon,
    StorageOutlined as DatabaseIcon,
    DeleteOutline as DeleteIcon,
    CheckCircleOutline as SuccessIcon,
    ErrorOutline as ErrorIcon,
    InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import api from '../../services/api';

const DataImportPage = () => {
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        const fetchWarehouses = async () => {
            try {
                const res = await api.get('/warehouses');
                if (res.data?.success) {
                    setWarehouses(res.data.data.warehouses || []);
                }
            } catch (err) {
                console.error('Failed to fetch warehouses', err);
            }
        };
        fetchWarehouses();
    }, []);

    const processExcel = (selectedFile) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length > 0) {
                    const keys = Object.keys(jsonData[0]);
                    setColumns(keys);
                    setPreviewData(jsonData);
                    setStatus({ type: 'success', message: `Loaded ${jsonData.length} rows for preview.` });
                } else {
                    setStatus({ type: 'warning', message: 'The selected Excel file is empty.' });
                }
            } catch (err) {
                console.error(err);
                setStatus({ type: 'error', message: 'Failed to parse Excel file.' });
            }
        };
        reader.readAsArrayBuffer(selectedFile);
    };

    const handleFileSelect = (event) => {
        const selectedFile = event.target.files[0];
        if (!selectedFile) return;

        const isExcel = selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            selectedFile.type === 'application/vnd.ms-excel' ||
            selectedFile.name.endsWith('.xlsx') ||
            selectedFile.name.endsWith('.xls');

        if (!isExcel) {
            setStatus({ type: 'error', message: 'You can only upload Excel files (.xlsx, .xls)!' });
            return;
        }

        setFile(selectedFile);
        processExcel(selectedFile);
    };

    const handleRemoveFile = () => {
        setFile(null);
        setPreviewData([]);
        setColumns([]);
        setStatus({ type: '', message: '' });
    };

    const handleUpload = async () => {
        if (previewData.length === 0) {
            return setStatus({ type: 'error', message: 'No data to import.' });
        }

        setImporting(true);
        setStatus({ type: 'info', message: 'Importing data, please wait...' });

        try {
            const payload = {
                products: previewData.map(row => ({
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
                })),
                warehouseId: selectedWarehouseId || null
            };

            const res = await api.post('/products/bulk-import', payload);
            if (res.data?.success) {
                setStatus({ type: 'success', message: res.data.message || 'Bulk import successful!' });
                setPreviewData([]);
                setFile(null);
                setColumns([]);
            }
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', message: error.response?.data?.message || 'Bulk import failed' });
        } finally {
            setImporting(false);
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1600px', mx: 'auto' }}>
            <Stack direction="row" spacing={2} sx={{ mb: 4, alignItems: 'center' }}>
                <Box sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    boxShadow: '0 8px 16px -4px rgba(37, 99, 235, 0.4)'
                }}>
                    <DatabaseIcon sx={{ color: '#fff', fontSize: 28 }} />
                </Box>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        Data Import Engine
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Bulk upload products and initial inventory via Excel
                    </Typography>
                </Box>
            </Stack>

            <Grid container spacing={4}>
                <Grid item xs={12} lg={4}>
                    <Stack spacing={3}>
                        <Card sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <InfoIcon color="primary" /> Instructions
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6 }}>
                                    Prepare your Excel file with column headers:
                                    <br />
                                    <b>Name, SKU, Category, Brand, CostPrice, SalePrice, Size, Color, Stock.</b>
                                    <br /><br />
                                    Stock is optional and requires a target warehouse to be selected.
                                </Typography>
                            </CardContent>
                        </Card>

                        <Card sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Configuration</Typography>

                                <Stack spacing={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Target Warehouse</InputLabel>
                                        <Select
                                            value={selectedWarehouseId}
                                            label="Target Warehouse"
                                            onChange={(e) => setSelectedWarehouseId(e.target.value)}
                                        >
                                            <MenuItem value=""><em>None (Import Products Only)</em></MenuItem>
                                            {warehouses.map(wh => (
                                                <MenuItem key={wh._id} value={wh._id}>
                                                    {wh.name} ({wh.code})
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <Box
                                        sx={{
                                            border: '2px dashed #cbd5e1',
                                            borderRadius: '12px',
                                            p: 3,
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                borderColor: 'primary.main',
                                                bgcolor: 'rgba(37, 99, 235, 0.02)'
                                            }
                                        }}
                                        onClick={() => document.getElementById('excel-upload').click()}
                                    >
                                        <input
                                            type="file"
                                            id="excel-upload"
                                            hidden
                                            accept=".xlsx, .xls"
                                            onChange={handleFileSelect}
                                        />
                                        <UploadIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                            {file ? file.name : "Choose Excel File"}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                                            Select Excel (.xlsx or .xls)
                                        </Typography>
                                    </Box>

                                    {file && (
                                        <Button
                                            size="small"
                                            color="error"
                                            startIcon={<DeleteIcon />}
                                            onClick={handleRemoveFile}
                                        >
                                            Remove File
                                        </Button>
                                    )}

                                    <Button
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        disabled={!previewData.length || importing}
                                        onClick={handleUpload}
                                        startIcon={importing ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
                                        sx={{
                                            py: 1.5,
                                            borderRadius: '12px',
                                            fontWeight: 700
                                        }}
                                    >
                                        {importing ? "Processing..." : "Start Import"}
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>

                        {status.message && (
                            <Fade in={true}>
                                <Alert
                                    severity={status.type || 'info'}
                                    sx={{ borderRadius: '12px' }}
                                    icon={status.type === 'success' ? <SuccessIcon /> : status.type === 'error' ? <ErrorIcon /> : undefined}
                                >
                                    {status.message}
                                </Alert>
                            </Fade>
                        )}
                    </Stack>
                </Grid>

                <Grid item xs={12} lg={8}>
                    {previewData.length > 0 ? (
                        <Paper sx={{
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                        }}>
                            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    Excel Preview
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                    {previewData.length} records found
                                </Typography>
                            </Box>
                            <TableContainer sx={{ maxHeight: 600 }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ bgcolor: '#f1f5f9', fontWeight: 700 }}>#</TableCell>
                                            {columns.map((col) => (
                                                <TableCell key={col} sx={{ bgcolor: '#f1f5f9', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                    {col}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {previewData.slice(0, 50).map((row, idx) => (
                                            <TableRow key={idx} hover>
                                                <TableCell sx={{ color: '#94a3b8' }}>{idx + 1}</TableCell>
                                                {columns.map((col) => (
                                                    <TableCell key={col} sx={{ whiteSpace: 'nowrap' }}>
                                                        {String(row[col] || '')}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            {previewData.length > 50 && (
                                <Box sx={{ p: 2, textAlign: 'center', bgcolor: '#fff' }}>
                                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                                        Showing first 50 rows only for performance
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    ) : (
                        <Box
                            sx={{
                                height: '100%',
                                minHeight: 400,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: '#f8fafc',
                                borderRadius: '24px',
                                border: '2px dashed #e2e8f0',
                                p: 4
                            }}
                        >
                            <UploadIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                            <Typography variant="h6" sx={{ color: '#334155' }}>
                                No file selected
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                                Browse and select an Excel sheet to preview data
                            </Typography>
                        </Box>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default DataImportPage;
