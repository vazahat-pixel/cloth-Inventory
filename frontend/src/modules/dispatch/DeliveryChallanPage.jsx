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
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import { fetchChallans, updateChallanStatus } from './dispatchSlice';
import BillPrintDialog from '../../components/BillPrintDialog';
import StandardInvoicePrint from '../sales/StandardInvoicePrint';
import SaleChallanPrint from '../sales/SaleChallanPrint';
import { useNotification } from '../../context/NotificationProvider';
import { useLoading } from '../../context/LoadingProvider';

function DeliveryChallanPage({
    pageTitle = 'Delivery Challans',
    pageDescription = 'Manage dispatches from warehouse to store and confirm receipts.',
    createPath = '/orders/delivery-challan/new',
    createLabel = 'Create Challan',
}) {
    const navigate = useAppNavigate();
    const dispatch = useDispatch();
    const { records: challans = [], loading, error } = useSelector((state) => state.dispatch);
    const { user } = useSelector((state) => state.auth);
    const { showNotification } = useNotification();
    const { showLoading, hideLoading } = useLoading();

    const normalizedRole = String(user?.role || '').toLowerCase();
    const isStoreUser = normalizedRole.includes('staff') || normalizedRole.includes('manager') || normalizedRole.includes('accountant');

    const [printTarget, setPrintTarget] = useState(null);

    useEffect(() => {
        dispatch(fetchChallans());
    }, [dispatch]);

    const handleMarkReceived = async (row) => {
        const id = row.id || row._id;
        if (!id) return;
        showLoading('Processing receipt...');
        try {
            await dispatch(updateChallanStatus({ id, status: 'RECEIVED' })).unwrap();
            showNotification('Stock received and updated successfully!', 'success');
        } catch (err) {
            showNotification(err?.message || 'Failed to update receipt status.', 'error');
        } finally {
            hideLoading();
        }
    };

    const handleMarkPacked = async (id) => {
        showLoading('Updating status...');
        try {
            await dispatch(updateChallanStatus({ id, status: 'PACKED' })).unwrap();
            showNotification('Challan marked as packed.', 'success');
        } catch (err) {
            showNotification(err?.message || 'Failed to update status.', 'error');
        } finally {
            hideLoading();
        }
    };

    const renderStatusChip = (status) => {
        const value = status || 'PENDING';
        let color = 'default';
        let label = value;
        if (value === 'PENDING') { color = 'info'; label = 'SALE CHALLAN (DRAFT)'; }
        if (value === 'PACKED') { color = 'secondary'; label = 'PACKED / READY FOR BILLING'; }
        if (value === 'DISPATCHED') { color = 'warning'; label = 'SALE BILL (SENT)'; }
        if (value === 'RECEIVED') { color = 'success'; label = 'STOCK IN'; }
        if (value === 'CANCELLED') { color = 'error'; label = 'CANCELLED'; }
        return <Chip label={label} color={color} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />;
    };

    const canReceive = (row) => {
        const status = row.status || 'PENDING';
        return status === 'DISPATCHED';
    };

    return (
        <>
            <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <Stack spacing={2} sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 2 }}>
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={2}
                        sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
                    >
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                                {pageTitle}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                                {pageDescription}
                            </Typography>
                        </Box>

                        {!isStoreUser && (
                            <Button
                                variant="contained"
                                startIcon={<AddCircleOutlineIcon />}
                                onClick={() => navigate(createPath)}
                            >
                                {createLabel}
                            </Button>
                        )}
                    </Stack>

                    {error && (
                        <Alert severity="error">
                            {error}
                        </Alert>
                    )}
                </Stack>

                {challans.length > 0 ? (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Challan No</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>To Store</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="right">
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {challans.map((row) => {
                                    const status = row.status || 'PENDING';
                                    return (
                                        <TableRow key={row.id || row._id} hover>
                                            <TableCell sx={{ fontWeight: 700 }}>
                                                {row.challanNumber || row.dispatchNumber}
                                            </TableCell>
                                            <TableCell>
                                                {row.dispatchedAt ? new Date(row.dispatchedAt).toLocaleDateString() : (row.date || row.dispatchDate || '-')}
                                            </TableCell>
                                            <TableCell>
                                                {row.destinationStoreId?.name || row.storeName || row.destination?.name || 'Store'}
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

                                                    <Button
                                                        variant="text"
                                                        size="small"
                                                        disabled={loading}
                                                        onClick={() => {
                                                            const id = row.id || row._id;
                                                            if (status === 'DISPATCHED' && isStoreUser) {
                                                                navigate(`/orders/delivery-challan/${id}/receive`);
                                                            } else if ((status === 'PENDING' || status === 'PACKED') && !isStoreUser) {
                                                                navigate(`/orders/delivery-challan/${id}/edit`);
                                                            } else {
                                                                navigate(`/orders/delivery-challan/${id}`);
                                                            }
                                                        }}
                                                    >
                                                        {(status === 'DISPATCHED' && isStoreUser) ? 'Process Receipt' : ((status === 'PENDING' || status === 'PACKED') ? 'Edit' : 'View')}
                                                    </Button>

                                                    {status === 'PENDING' && !isStoreUser && (
                                                        <Button
                                                            variant="outlined"
                                                            color="secondary"
                                                            size="small"
                                                            sx={{ fontWeight: 700, borderRadius: 1.5 }}
                                                            disabled={loading}
                                                            onClick={() => handleMarkPacked(row.id || row._id)}
                                                        >
                                                            Mark Packed
                                                        </Button>
                                                    )}

                                                    {status === 'PACKED' && !isStoreUser && (
                                                        <Button
                                                            variant="contained"
                                                            color="primary"
                                                            size="small"
                                                            sx={{ fontWeight: 700, borderRadius: 1.5 }}
                                                            disabled={loading}
                                                            onClick={() => navigate(`/orders/delivery-challan/${row.id || row._id}/billing`)}
                                                        >
                                                            Billing Review
                                                        </Button>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Box sx={{ py: 10, textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: '#64748b', mb: 2 }}>
                            {isStoreUser ? 'No incoming dispatches found for your store.' : 'You haven\'t dispatched any items to the stores yet.'}
                        </Typography>
                        {!isStoreUser && (
                            <Button variant="contained" onClick={() => navigate(createPath)}>
                                {createLabel}
                            </Button>
                        )}
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
        </>
    );
}

export default DeliveryChallanPage;
