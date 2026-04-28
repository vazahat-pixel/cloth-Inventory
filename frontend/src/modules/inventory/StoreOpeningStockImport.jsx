import React, { useState, useMemo, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    CircularProgress,
    Autocomplete,
    TextField,
    Chip,
    Divider,
    LinearProgress
} from '@mui/material';
import {
    CloudUpload as CloudUploadIcon,
    Save as SaveIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Download as DownloadIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { useDispatch, useSelector } from 'react-redux';
import { useNotification } from '../../context/NotificationProvider';
import api from '../../services/api';
import useAppNavigate from '../../hooks/useAppNavigate';
import { fetchMasters } from '../masters/mastersSlice';

const StoreOpeningStockImport = () => {
    const dispatch = useDispatch();
    const navigate = useAppNavigate();
    const { showNotification } = useNotification();
    
    const masters = useSelector((state) => state.masters || {});
    const stores = masters.stores || [];
    const loadingMasters = masters.loading;
    
    const auth = useSelector((state) => state.auth || {});
    const user = auth.user || {};
    const isStoreStaff = ['Staff', 'store_staff', 'store_manager', 'accountant', 'Manager', 'Accountant'].includes(user.role);

    const [selectedStore, setSelectedStore] = useState(null);
    const [fileData, setFileData] = useState([]);
    const [skippedRows, setSkippedRows] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [validationResults, setValidationResults] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Initial Load: Fetch stores if not present
    useEffect(() => {
        if (stores.length === 0 && !loadingMasters) {
            dispatch(fetchMasters('stores'));
        }
    }, [dispatch, stores.length, loadingMasters]);

    // Auto-select store for staff
    useEffect(() => {
        if (isStoreStaff && user.shopId && stores.length > 0) {
            const myStore = stores.find(s => String(s.id || s._id) === String(user.shopId));
            if (myStore) {
                setSelectedStore(myStore);
            }
        }
    }, [isStoreStaff, user.shopId, stores]);

    // Columns mapping from requirement
    const columnMapping = {
        itemCode: ['ITEM CODE', 'Barcode', 'Item Code', 'CODE', 'SKU', 'BARCODE'],
        itemName: ['ITEM NAME', 'Item Name', 'Name', 'PRODUCT'],
        closingStock: ['CLOSING STOCK', 'Closing Stock', 'Qty', 'Quantity', 'Stock', 'QTY', 'QUANTITY'],
        shadeName: ['SHADE NAME'],
        description: ['ITEM DESCRIPTION'],
        size: ['PACK/SIZE'],
        fabric: ['FABRIC'],
        type: ['TYPE']
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsLoading(true);
        setValidationResults(null);
        setSkippedRows(0);
        
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                
                // Merge data from ALL sheets (to handle 2800+ rows if split)
                let allData = [];
                wb.SheetNames.forEach(sheetName => {
                    const ws = wb.Sheets[sheetName];
                    const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
                    allData = [...allData, ...data];
                });

                if (allData.length === 0) {
                    showNotification('Excel file is empty', 'error');
                    setIsLoading(false);
                    return;
                }

                // Map Excel columns to our expected format
                const mappedData = allData.map((row, index) => {
                    const findVal = (keys) => {
                        const key = keys.find(k => row[k] !== undefined && row[k] !== null && row[k] !== "");
                        return key ? row[key] : '';
                    };

                    const itemCode = String(findVal(columnMapping.itemCode) || '').trim();
                    const itemName = String(findVal(columnMapping.itemName) || '').trim();
                    const closingStock = Number(findVal(columnMapping.closingStock) || 0);

                    return {
                        sno: index + 1,
                        itemCode,
                        itemName,
                        closingStock,
                        shadeName: findVal(columnMapping.shadeName),
                        description: findVal(columnMapping.description),
                        size: findVal(columnMapping.size),
                        fabric: findVal(columnMapping.fabric),
                        type: findVal(columnMapping.type),
                        raw: row
                    };
                });

                const filtered = mappedData.filter(d => d.itemCode);
                const skipped = mappedData.length - filtered.length;
                
                setFileData(filtered);
                setSkippedRows(skipped);
                
                showNotification(`Loaded ${filtered.length} items. ${skipped > 0 ? skipped + ' rows skipped (missing code).' : ''}`, 'success');
            } catch (err) {
                console.error(err);
                showNotification('Failed to parse Excel file', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleValidate = async () => {
        if (!selectedStore) {
            showNotification('Please select a target store first', 'warning');
            return;
        }
        if (!fileData.length) return;

        setIsLoading(true);
        try {
            // We'll send the barcodes to backend to check existence in bulk
            const barcodes = fileData.map(d => d.itemCode);
            const response = await api.post('/items/validate-barcodes', { barcodes });
            const masterMap = response.data.data || {}; 

            const results = fileData.map(row => {
                const match = masterMap[row.itemCode];
                let status = 'NOT_FOUND';
                let message = 'Item code not found in master';

                if (match) {
                    const masterName = String(match.item?.itemName || '').toLowerCase();
                    const excelName = row.itemName.toLowerCase();
                    
                    if (excelName && masterName && !masterName.includes(excelName) && !excelName.includes(masterName)) {
                        status = 'MISMATCH';
                        message = `Name mismatch: Master(${match.item.itemName})`;
                    } else {
                        status = 'MATCHED';
                        message = 'Perfect Match';
                    }
                }

                return { ...row, status, message, masterData: match };
            });

            setValidationResults(results);
            showNotification('Validation completed', 'success');
        } catch (err) {
            console.error(err);
            showNotification('Validation failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedStore || !validationResults) return;

        const strictlyValid = validationResults.filter(r => r.status === 'MATCHED');

        if (strictlyValid.length === 0) {
            showNotification('No valid items to import', 'error');
            return;
        }

        setIsSaving(true);
        setUploadProgress(10);
        
        try {
            const payload = {
                storeId: selectedStore.id || selectedStore._id,
                items: strictlyValid.map(v => ({
                    itemCode: v.itemCode,
                    closingStock: v.closingStock,
                    itemName: v.itemName
                }))
            };

            setUploadProgress(30);
            // Increased timeout for 2800+ items
            const res = await api.post('/store-inventory/bulk-import', payload, { timeout: 300000 });
            setUploadProgress(100);
            
            showNotification(`Import Successful! ${res.data.data.successCount} items added as Opening Stock.`, 'success');
            setValidationResults(null);
            setFileData([]);
        } catch (err) {
            console.error(err);
            showNotification(err.response?.data?.message || 'Failed to save opening stock (Timeout or Network Error)', 'error');
        } finally {
            setIsSaving(false);
            setUploadProgress(0);
        }
    };

    const stats = useMemo(() => {
        if (!validationResults) return null;
        return {
            total: validationResults.length,
            matched: validationResults.filter(r => r.status === 'MATCHED').length,
            mismatch: validationResults.filter(r => r.status === 'MISMATCH').length,
            notFound: validationResults.filter(r => r.status === 'NOT_FOUND').length
        };
    }, [validationResults]);

    return (
        <Box sx={{ p: 3 }}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#fff' }}>
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b' }}>
                            Bulk Store Opening Stock Import
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
                            Upload Excel directly into Store Inventory. High-performance bulk processing (2800+ rows).
                        </Typography>
                    </Box>

                    <Divider />

                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Select Target Store</Typography>
                            <Autocomplete
                                options={stores}
                                getOptionLabel={(option) => option.name || option.storeName || ''}
                                value={selectedStore}
                                onChange={(_, newValue) => setSelectedStore(newValue)}
                                disabled={isStoreStaff}
                                renderInput={(params) => (
                                    <TextField 
                                        {...params} 
                                        placeholder={isStoreStaff ? "Your Store" : "Choose store..."} 
                                        size="small" 
                                        sx={{ 
                                            '& .MuiOutlinedInput-root': { height: 45 },
                                            bgcolor: isStoreStaff ? '#f1f5f9' : '#fff'
                                        }}
                                    />
                                )}
                            />
                            {isStoreStaff && selectedStore && (
                                <Typography variant="caption" sx={{ color: '#64748b', mt: 0.5, display: 'block' }}>
                                    Store: {selectedStore.name}
                                </Typography>
                            )}
                        </Box>

                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Step 1: Upload Excel</Typography>
                            <Button
                                component="label"
                                variant="outlined"
                                startIcon={<CloudUploadIcon />}
                                sx={{ height: 45, width: '100%', borderRadius: 2, textTransform: 'none', fontWeight: 700, borderStyle: 'dashed', borderWidth: 2 }}
                                disabled={isLoading || isSaving}
                            >
                                Choose File
                                <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileUpload} />
                            </Button>
                        </Box>

                        <Box sx={{ pt: 3.5 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleValidate}
                                disabled={!fileData.length || isLoading || isSaving || !selectedStore}
                                sx={{ height: 45, borderRadius: 2, px: 4, textTransform: 'none', fontWeight: 700, boxShadow: '0 4px 14px 0 rgba(79,70,229,0.39)' }}
                            >
                                {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Step 2: Validate Data'}
                            </Button>
                        </Box>
                    </Stack>

                    {fileData.length > 0 && !validationResults && (
                        <Alert severity="info" icon={<CheckCircleIcon />}>
                            File loaded: <strong>{fileData.length} items found</strong>. {skippedRows > 0 ? `(${skippedRows} blank/invalid rows skipped).` : ''} Click 'Validate' to check against Item Master.
                        </Alert>
                    )}

                    {stats && (
                        <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                            <Stack direction="row" spacing={4} divider={<Divider orientation="vertical" flexItem />}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>TOTAL ROWS</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 800 }}>{stats.total}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 700 }}>MATCHED (SUCCESS)</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#16a34a' }}>{stats.matched}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#ca8a04', fontWeight: 700 }}>MISMATCH</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#ca8a04' }}>{stats.mismatch}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700 }}>NOT FOUND</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#dc2626' }}>{stats.notFound}</Typography>
                                </Box>
                            </Stack>
                        </Box>
                    )}

                    {validationResults && (
                        <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>Preview Validation Results</Typography>
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<SaveIcon />}
                                    onClick={handleSave}
                                    disabled={isSaving || stats.matched === 0}
                                    sx={{ borderRadius: 2, px: 4, textTransform: 'none', fontWeight: 800, height: 45 }}
                                >
                                    {isSaving ? `Saving (${uploadProgress}%)` : 'Final Step: Save Opening Stock'}
                                </Button>
                            </Stack>

                            {isSaving && <LinearProgress variant="determinate" value={uploadProgress} sx={{ mb: 2, borderRadius: 1, height: 8 }} />}

                            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500, borderRadius: 2 }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Item Code</TableCell>
                                            <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Excel Item Name</TableCell>
                                            <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Qty (Closing Stock)</TableCell>
                                            <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Details</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {validationResults.slice(0, 100).map((row, idx) => (
                                            <TableRow key={idx} hover>
                                                <TableCell sx={{ fontWeight: 600 }}>{row.itemCode}</TableCell>
                                                <TableCell>{row.itemName}</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>{row.closingStock}</TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        size="small"
                                                        label={row.status}
                                                        color={row.status === 'MATCHED' ? 'success' : (row.status === 'MISMATCH' ? 'warning' : 'error')}
                                                        icon={row.status === 'MATCHED' ? <CheckCircleIcon /> : <ErrorIcon />}
                                                        sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                    {row.message}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {validationResults.length > 100 && (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ py: 2, color: '#64748b' }}>
                                                    Showing first 100 rows of {validationResults.length}. All {stats.matched} matched rows will be imported.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </Stack>
            </Paper>

            <Box sx={{ mt: 3 }}>
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Important Notes:</Typography>
                    <Typography variant="caption" component="block">
                        • System uses <strong>ITEM CODE</strong> as the primary unique identifier.<br />
                        • Items not found in Master will be <strong>skipped</strong>.<br />
                        • Ensure <strong>CLOSING STOCK</strong> column contains numeric values.<br />
                        • High performance: 2800+ rows usually take less than 60 seconds.
                    </Typography>
                </Alert>
            </Box>
        </Box>
    );
};

export default StoreOpeningStockImport;
