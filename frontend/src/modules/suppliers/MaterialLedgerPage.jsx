import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import PageHeader from '../../components/erp/PageHeader';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import api from '../../services/api';

function MaterialLedgerPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [balances, setBalances] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Fetch all suppliers
    api.get('/suppliers')
      .then(res => setSuppliers(res.data.suppliers || []))
      .catch(err => console.error('Failed to fetch suppliers', err));
  }, []);

  useEffect(() => {
    if (!selectedSupplier) {
      setBalances([]);
      setHistory([]);
      return;
    }

    setLoading(true);
    api.get(`/suppliers/${selectedSupplier}/material-ledger`)
      .then(res => {
        setBalances(res.data.balances || []);
        
        // Flatten the consumption history
        const flatHistory = [];
        const records = res.data.history || [];
        records.forEach(record => {
          record.items.forEach(item => {
            flatHistory.push({
              ...item,
              consumptionNumber: record.consumptionNumber,
              date: record.consumptionDate,
              grnNumber: record.grnId?.grnNumber || 'N/A',
              jobWorkNumber: record.jobWorkId?.outwardNumber || 'Direct'
            });
          });
        });
        setHistory(flatHistory);
      })
      .catch(err => {
        setError('Failed to fetch material ledger data');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [selectedSupplier]);

  return (
    <Box>
      <PageHeader
        title="Supplier Material Ledger"
        subtitle="Track raw material balances and manufacturing consumption history."
        breadcrumbs={[
          { label: 'Inventory' },
          { label: 'Material Ledger', active: true }
        ]}
      />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', mb: 1, display: 'block', textTransform: 'uppercase' }}>
              Select Supplier / Job Worker
            </Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value="" disabled>Select a supplier...</MenuItem>
              {suppliers.map(s => (
                <MenuItem key={s._id || s.id} value={s._id || s.id}>{s.name || s.supplierName}</MenuItem>
              ))}
            </TextField>
          </Paper>
        </Grid>
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}

      {!loading && selectedSupplier && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssessmentOutlinedIcon color="primary" /> Pending Balance at Supplier
              </Typography>
              <TableContainer sx={{ border: '1px solid #f1f5f9', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Material / Fabric</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Barcode</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Available Balance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {balances.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 3, color: '#64748b' }}>No pending balance data.</TableCell>
                      </TableRow>
                    ) : (
                      balances.map((row, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.itemId?.itemName}</Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>{row.itemId?.itemCode}</Typography>
                          </TableCell>
                          <TableCell>{row.barcode}</TableCell>
                          <TableCell align="right">
                            <Chip label={`${row.quantity} ${row.itemId?.uom || 'MTR'}`} color="primary" size="small" sx={{ fontWeight: 700 }} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: '#1e293b' }}>
                Consumption History
              </Typography>
              <TableContainer sx={{ border: '1px solid #f1f5f9', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>DATE</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>RECORD #</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>JOB WORK / GRN</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>MATERIAL</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>USED</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>WASTE</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>PENDING</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3, color: '#64748b' }}>No consumption history found.</TableCell>
                      </TableRow>
                    ) : (
                      history.map((row, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                          <TableCell><Typography variant="body2" sx={{ fontWeight: 700, p:0.5, bgcolor: '#f1f5f9', borderRadius: 1 }}>{row.consumptionNumber}</Typography></TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ display: 'block' }}>Job: {row.jobWorkNumber}</Typography>
                            <Typography variant="caption" sx={{ color: '#059669' }}>GRN: {row.grnNumber}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{row.itemName || row.itemCode}</Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>{row.barcode}</Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#059669', fontWeight: 600 }}>{row.usedQty}</TableCell>
                          <TableCell align="right" sx={{ color: '#dc2626', fontWeight: 600 }}>{row.wasteQty}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>{row.pendingQty}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {!loading && !selectedSupplier && (
        <Box sx={{ p: 5, textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: 2 }}>
          <Typography variant="body1" sx={{ color: '#64748b' }}>Please select a supplier from the dropdown above to view their material ledger.</Typography>
        </Box>
      )}

    </Box>
  );
}

export default MaterialLedgerPage;
