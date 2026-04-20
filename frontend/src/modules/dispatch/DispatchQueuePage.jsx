import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import {
    Alert,
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    IconButton,
} from '@mui/material';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { fetchChallans, updateChallanStatus } from './dispatchSlice';
import BillPrintDialog from '../../components/BillPrintDialog';
import SaleChallanPrint from '../sales/SaleChallanPrint';
import StandardInvoicePrint from '../sales/StandardInvoicePrint';
import { useNotification } from '../../context/NotificationProvider';
import { useLoading } from '../../context/LoadingProvider';

function DispatchQueuePage() {
    const navigate = useAppNavigate();
    const dispatch = useDispatch();
    const { records: challans = [], loading, error } = useSelector((state) => state.dispatch);
    const { showNotification } = useNotification();
    const { showLoading, hideLoading } = useLoading();
    
    const [printTarget, setPrintTarget] = useState(null);

    useEffect(() => {
        dispatch(fetchChallans());
    }, [dispatch]);

    // Keep challans visible after dispatch so invoice stays downloadable
    const queueChallans = challans.filter(row => 
        ['PENDING', 'PACKED', 'DISPATCHED'].includes(row.status || 'PENDING')
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const renderStatusChip = (status) => {
        const value = status || 'PENDING';
        let color = 'default';
        let label = value;
        if (value === 'PENDING') { color = 'info'; label = 'READY TO PACK'; }
        if (value === 'PACKED') { color = 'secondary'; label = 'PACKED / READY FOR BILLING'; }
        if (value === 'DISPATCHED') { color = 'warning'; label = 'DISPATCHED / IN TRANSIT'; }
        return <Chip label={label} color={color} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />;
    };

    const handleReviewDispatch = async (id, status) => {
        showLoading('Loading dispatch details...');
        try {
            if (status === 'PENDING') {
                await dispatch(updateChallanStatus({ id, status: 'PACKED' })).unwrap();
                hideLoading();
                navigate(`/orders/delivery-challan/${id}/billing`);
                return;
            }
            if (status === 'PACKED') {
                hideLoading();
                navigate(`/orders/delivery-challan/${id}/billing`);
                return;
            }
            // DISPATCHED: allow quick access to finalized document/invoice view
            hideLoading();
            navigate(`/orders/delivery-challan/${id}`);
        } catch (err) {
            hideLoading();
            // Surface backend validation in a simple way for operators.
            showNotification(err?.message || 'Unable to continue review/dispatch flow.', 'error');
        }
    };

    const handleMarkPacked = async (id) => {
        showLoading('Marking as packed...');
        try {
            await dispatch(updateChallanStatus({ id, status: 'PACKED' })).unwrap();
            showNotification('Challan marked as packed successfully.', 'success');
        } catch (err) {
            showNotification(err?.message || 'Failed to update status.', 'error');
        } finally {
            hideLoading();
        }
    };

    return (
        <Box sx={{ p: 1 }}>
            <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                <Stack spacing={2} sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 2 }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                            Billing & Dispatch Queue
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                            Process pending delivery challans for final billing and dispatch.
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}
                </Stack>

                {queueChallans.length > 0 ? (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                    <TableCell sx={{ fontWeight: 700, py: 2 }}>Challan No</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Created Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Destination Store / Customer</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="right">
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {queueChallans.map((row) => {
                                    const status = row.status || 'PENDING';
                                    const id = row.id || row._id;
                                    return (
                                        <TableRow key={id} hover>
                                            <TableCell sx={{ fontWeight: 700 }}>
                                                {row.challanNumber || row.dispatchNumber}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(row.createdAt || row.date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                                    {row.destinationStoreId?.name || row.storeName || row.customerName || 'Store'}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                                    {row.destinationStoreId?.location?.city || row.customerMobile || ''}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{renderStatusChip(status)}</TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                    <IconButton
                                                        size="small"
                                                        color="info"
                                                        onClick={() => setPrintTarget(row)}
                                                    >
                                                        <PrintOutlinedIcon fontSize="small" />
                                                    </IconButton>

                                                    {status === 'PENDING' && (
                                                        <Button
                                                            variant="outlined"
                                                            color="secondary"
                                                            size="small"
                                                            sx={{ fontWeight: 700, borderRadius: 1.5, textTransform: 'none' }}
                                                            onClick={() => handleMarkPacked(id)}
                                                        >
                                                            Mark Packed
                                                        </Button>
                                                    )}

                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        size="small"
                                                        startIcon={<PlayArrowIcon fontSize="small" />}
                                                        sx={{ fontWeight: 700, borderRadius: 1.5, textTransform: 'none', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}
                                                        onClick={() => handleReviewDispatch(id, status)}
                                                        disabled={loading}
                                                    >
                                                        {status === 'DISPATCHED' ? 'View Invoice' : 'Review & Dispatch'}
                                                    </Button>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Box sx={{ py: 12, textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: '#94a3b8', mb: 2, fontWeight: 600 }}>
                            Your dispatch queue is empty.
                        </Typography>
                        <Button 
                            variant="contained" 
                            color="inherit" 
                            sx={{ borderRadius: 100, px: 4, fontWeight: 700 }}
                            onClick={() => navigate('/orders/delivery-challan/new')}
                        >
                            Create New Challan
                        </Button>
                    </Box>
                )}
            </Paper>

            <BillPrintDialog open={Boolean(printTarget)} onClose={() => setPrintTarget(null)}>
                {printTarget && (
                    printTarget.status === 'DISPATCHED' || printTarget.status === 'RECEIVED' ? (
                        <StandardInvoicePrint
                            sale={printTarget}
                            isTransfer={(printTarget.sourceWarehouseId?.gstNumber || '').trim().toUpperCase() === (printTarget.destinationStoreId?.gstNumber || '').trim().toUpperCase()}
                        />
                    ) : (
                        <SaleChallanPrint challan={printTarget} />
                    )
                )}
            </BillPrintDialog>
        </Box>
    );
}

export default DispatchQueuePage;
