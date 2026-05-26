import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import api from '../../services/api';
import {
    Alert,
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    Tab,
    Tabs,
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
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { fetchChallans } from './dispatchSlice';
import BillPrintDialog from '../../components/BillPrintDialog';
import StandardInvoicePrint from '../sales/StandardInvoicePrint';
import ReportExportButton from '../reports/ReportExportButton';
import { useLoading } from '../../context/LoadingProvider';
import {
    filterBillingRegisterRows,
    getBillingDocNumber,
    getBillingDocType,
    getBillingTypeChipColor,
    getBillingTypeLabel,
    getDispatchDate,
    getDispatchRef,
    getDispatchStatusLabel,
} from './dispatchBillingUtils';

const BILL_TYPE_TABS = [
    { value: 'ALL', label: 'All Bills' },
    { value: 'TRANSFER_BILL', label: 'Transfer Bills (DC)' },
    { value: 'TAX_INVOICE', label: 'Tax Invoices (REB)' },
];

function buildPrintPayload(dispatchRecord) {
    const billingType = getBillingDocType(dispatchRecord);
    const isTransfer = billingType === 'TRANSFER_BILL';
    const ref = dispatchRecord.referenceId;

    if (ref && typeof ref === 'object' && dispatchRecord.referenceType === 'Sale') {
        return { sale: { ...ref, items: dispatchRecord.items || ref.products || ref.items }, isTransfer: false };
    }

    if (ref && typeof ref === 'object' && dispatchRecord.referenceType === 'DeliveryChallan') {
        const items = (dispatchRecord.items || []).map((item) => ({
            ...item,
            quantity: item.qty ?? item.quantity,
        }));
        return {
            sale: {
                ...dispatchRecord,
                ...ref,
                items,
                storeId: dispatchRecord.sourceWarehouseId,
                destinationStoreId: dispatchRecord.destinationStoreId,
            },
            isTransfer: true,
        };
    }

    const items = (dispatchRecord.items || []).map((item) => ({
        ...item,
        quantity: item.qty ?? item.quantity,
    }));

    return {
        sale: {
            ...dispatchRecord,
            items,
            storeId: dispatchRecord.sourceWarehouseId,
            destinationStoreId: dispatchRecord.destinationStoreId,
        },
        isTransfer,
    };
}

function TransferBillsListPage() {
    const navigate = useAppNavigate();
    const dispatch = useDispatch();
    const { records: rawChallans = [], loading, error } = useSelector((state) => state.dispatch);
    const { showLoading, hideLoading } = useLoading();

    const [billTypeFilter, setBillTypeFilter] = useState('ALL');
    const [printTarget, setPrintTarget] = useState(null);
    const [printPayload, setPrintPayload] = useState(null);

    useEffect(() => {
        dispatch(fetchChallans());
    }, [dispatch]);

    const billingRows = useMemo(
        () => filterBillingRegisterRows(rawChallans, billTypeFilter),
        [rawChallans, billTypeFilter]
    );

    const tabCounts = useMemo(() => {
        const all = filterBillingRegisterRows(rawChallans, 'ALL');
        return {
            ALL: all.length,
            TRANSFER_BILL: all.filter((r) => getBillingDocType(r) === 'TRANSFER_BILL').length,
            TAX_INVOICE: all.filter((r) => getBillingDocType(r) === 'TAX_INVOICE').length,
        };
    }, [rawChallans]);

    const handlePrint = async (row) => {
        const id = row.id || row._id;
        showLoading('Loading bill for print...');
        try {
            const response = await api.get(`/dispatch/${id}`);
            const full = response.data.data?.dispatch || response.data.dispatch || response.data.data;
            setPrintPayload(buildPrintPayload(full || row));
            setPrintTarget(row);
        } catch {
            setPrintPayload(buildPrintPayload(row));
            setPrintTarget(row);
        } finally {
            hideLoading();
        }
    };

    return (
        <>
            <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <Stack spacing={2} sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 2 }}>
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={2}
                        sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-start' } }}
                    >
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                                Transfer Bills & Tax Invoices
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 720 }}>
                                Single ya combined dispatch — sab ek hi register mein.{' '}
                                <strong>DC-</strong> = Transfer Bill, <strong>REB-</strong> = Tax Invoice,{' '}
                                <strong>SCH-/DSP-</strong> = dispatch reference.
                            </Typography>
                        </Box>
                        <ReportExportButton
                            headers={['Bill No', 'Bill Type', 'Challan Ref', 'Date', 'To Store', 'Status']}
                            headerKeys={['Bill No', 'Bill Type', 'Challan Ref', 'Date', 'To Store', 'Status']}
                            rows={billingRows.map((row) => ({
                                'Bill No': getBillingDocNumber(row),
                                'Bill Type': getBillingTypeLabel(getBillingDocType(row)),
                                'Challan Ref': getDispatchRef(row),
                                Date: getDispatchDate(row),
                                'To Store': row.destinationStoreId?.name || 'Store',
                                Status: getDispatchStatusLabel(row.status),
                            }))}
                            filename="Transfer_Bills_And_Tax_Invoices.csv"
                        />
                    </Stack>

                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                        Combine kiye gaye challan yahan sirf <strong>ek baar</strong> dikhenge (master DSP).
                        Purane alag SCH rows duplicate nahi hongi.
                    </Alert>

                    {error && <Alert severity="error">{error}</Alert>}

                    <Tabs
                        value={billTypeFilter}
                        onChange={(_, val) => setBillTypeFilter(val)}
                        sx={{ borderBottom: 1, borderColor: 'divider' }}
                    >
                        {BILL_TYPE_TABS.map((tab) => (
                            <Tab
                                key={tab.value}
                                value={tab.value}
                                label={`${tab.label} (${tabCounts[tab.value] || 0})`}
                                sx={{ fontWeight: 700, textTransform: 'none' }}
                            />
                        ))}
                    </Tabs>
                </Stack>

                {billingRows.length > 0 ? (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                    <TableCell sx={{ fontWeight: 700 }}>Bill No</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Bill Type</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Challan Ref</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>To Store</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Dispatch Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {billingRows.map((row) => {
                                    const id = row.id || row._id;
                                    const billType = getBillingDocType(row);
                                    return (
                                        <TableRow key={id} hover>
                                            <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>
                                                {getBillingDocNumber(row)}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={getBillingTypeLabel(billType)}
                                                    color={getBillingTypeChipColor(billType)}
                                                    size="small"
                                                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                                                />
                                                {row.isCombinedMaster && (
                                                    <Chip
                                                        label="Combined"
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ ml: 0.5, fontWeight: 600, fontSize: '0.65rem' }}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                    {getDispatchRef(row)}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                                    {row.dispatchNumber?.startsWith('DSP-') ? 'Combined dispatch' : 'Sale challan'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{getDispatchDate(row)}</TableCell>
                                            <TableCell>
                                                {row.destinationStoreId?.name || row.storeName || 'Store'}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={getDispatchStatusLabel(row.status)}
                                                    color={row.status === 'RECEIVED' ? 'success' : 'warning'}
                                                    size="small"
                                                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                    <IconButton size="small" color="info" onClick={() => handlePrint(row)}>
                                                        <PrintOutlinedIcon fontSize="small" />
                                                    </IconButton>
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        startIcon={<VisibilityOutlinedIcon fontSize="small" />}
                                                        onClick={() => navigate(`/orders/delivery-challan/${id}`)}
                                                    >
                                                        View
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
                    <Box sx={{ py: 10, textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
                            {loading ? 'Loading bills...' : 'No finalized bills found for this filter.'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                            Pehle challan pack karein, phir Billing Review ya Combine & Dispatch se bill generate karein.
                        </Typography>
                    </Box>
                )}
            </Paper>

            <BillPrintDialog
                open={Boolean(printTarget)}
                onClose={() => {
                    setPrintTarget(null);
                    setPrintPayload(null);
                }}
            >
                {printPayload && (
                    <StandardInvoicePrint
                        sale={printPayload.sale}
                        isTransfer={printPayload.isTransfer}
                        title={printPayload.isTransfer ? 'STOCK TRANSFER NOTE' : 'TAX INVOICE'}
                    />
                )}
            </BillPrintDialog>
        </>
    );
}

export default TransferBillsListPage;
