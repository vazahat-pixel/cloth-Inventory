import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import PrintIcon from '@mui/icons-material/Print';
import AssignmentIcon from '@mui/icons-material/Assignment';

import api from '../../../services/api';
import useRoleBasePath from '../../../hooks/useRoleBasePath';

const SupplierOutwardViewPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const basePath = useRoleBasePath();
    const [loading, setLoading] = useState(true);
    const [outward, setOutward] = useState(null);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await api.get(`/supplier-outward/${id}`);
                setOutward(res.data.outward);
            } catch (error) {
                console.error('Error fetching outward detail:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
        </Box>
    );

    if (!outward) return <Typography color="error">Record not found</Typography>;

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Button 
                        variant="outlined" 
                        startIcon={<ArrowBackIcon />} 
                        onClick={() => navigate(`${basePath}/inventory/supplier-outward`)}
                        sx={{ borderRadius: 2 }}
                    >
                        Back
                    </Button>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                            {outward.outwardNumber}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                            Created on {new Date(outward.createdAt).toLocaleString()}
                        </Typography>
                    </Box>
                </Stack>
                <Stack direction="row" spacing={2}>
                    <Button variant="outlined" startIcon={<PrintIcon />}>Print Challan</Button>
                    <Chip 
                        label={outward.status} 
                        color={outward.status === 'COMPLETED' ? 'success' : 'warning'} 
                        sx={{ fontWeight: 700, px: 2, height: 36 }} 
                    />
                </Stack>
            </Stack>

            <Grid container spacing={3}>
                {/* Information Sidebar */}
                <Grid item xs={12} md={4}>
                    <Stack spacing={3}>
                        <Card elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 3 }}>
                            <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                                Entity Details
                            </Typography>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Supplier (Stitcher)</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{outward.supplierId?.name || outward.supplierId?.supplierName}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Warehouse (Source)</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{outward.warehouseId?.name || 'Main Warehouse'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Issued By</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{outward.createdBy?.name || 'Administrator'}</Typography>
                                </Box>
                            </Stack>
                        </Card>

                        <Card elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 3, bgcolor: '#fef3c7' }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                <AssignmentIcon sx={{ color: '#d97706', fontSize: 20 }} />
                                <Typography variant="subtitle2" sx={{ color: '#d97706', fontWeight: 700 }}>Production Notes</Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ color: '#92400e', fontStyle: outward.notes ? 'normal' : 'italic' }}>
                                {outward.notes || 'No special instructions provided for this issue.'}
                            </Typography>
                        </Card>
                    </Stack>
                </Grid>

                {/* Main Items Table */}
                <Grid item xs={12} md={8}>
                    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                        <Box sx={{ p: 2.5, borderBottom: '1px solid #f1f5f9', bgcolor: 'white' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Materials Dispatched</Typography>
                        </Box>
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Material Code</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Issued Qty</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>UOM</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {outward.items.map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>{item.code}</TableCell>
                                            <TableCell>{item.rawMaterialId?.name || 'Raw Material'}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 800 }}>{item.quantity}</TableCell>
                                            <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>{item.uom}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                    {/* Stock Activity Suggestion Placeholder */}
                    <Box sx={{ mt: 3, p: 3, borderRadius: 3, border: '1px dashed #cbd5e1', bgcolor: '#f1f5f9' }}>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                            <HistoryIcon sx={{ color: '#64748b' }} />
                            <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 700 }}>Consumption Log Suggestion</Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                            This material is currently in the **Supplier's Custody**. To track usage:
                            <br />• Implement a "Production Receipt" flow.
                            <br />• Link finished goods (garments) to this outward challan.
                            <br />• Calculate balance material (Waste/Leftover) upon final return.
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default SupplierOutwardViewPage;
