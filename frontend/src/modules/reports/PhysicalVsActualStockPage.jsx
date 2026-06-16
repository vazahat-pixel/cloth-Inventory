import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import SearchIcon from '@mui/icons-material/Search';
import PageHeader from '../../components/erp/PageHeader';
import api from '../../services/api';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMasters } from '../masters/mastersSlice';

const fmtQty = (n) => Number(n || 0).toLocaleString('en-IN');
const PAGE_SIZE = 100;

function PhysicalVsActualStockPage() {
  const dispatch = useDispatch();
  const warehouses = useSelector((state) => state.masters.warehouses || []);

  const [warehouseId, setWarehouseId] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [onlyVariance, setOnlyVariance] = useState(false);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [editVersion, setEditVersion] = useState(0);
  const editMapRef = useRef(new Map());

  useEffect(() => {
    dispatch(fetchMasters('warehouses'));
  }, [dispatch]);

  useEffect(() => {
    if (!warehouseId && warehouses.length === 1) {
      setWarehouseId(warehouses[0].id || warehouses[0]._id);
    }
  }, [warehouses, warehouseId]);

  const loadReport = useCallback(async (targetPage = page) => {
    if (!warehouseId) return;
    setLoading(true);
    setError(null);
    setSuccess('');
    try {
      const res = await api.get('/inventory/physical-vs-actual', {
        params: {
          warehouseId,
          search: appliedSearch || undefined,
          page: targetPage,
          limit: PAGE_SIZE,
        },
      });
      const data = res.data?.data || res.data;
      const nextRows = (data.rows || []).map((row) => {
        const edited = editMapRef.current.get(String(row.inventoryId));
        const physicalQty = edited ? edited.physicalQty : Number(row.physicalQty ?? row.systemQty ?? 0);
        return {
          ...row,
          physicalQty,
          systemQty: Number(row.systemQty || 0),
          differenceQty: physicalQty - Number(row.systemQty || 0),
        };
      });
      setRows(nextRows);
      setSummary(data.summary || null);
      setPagination(data.pagination || { page: targetPage, totalPages: 1, total: nextRows.length });
      setPage(data.pagination?.page || targetPage);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load report');
      setRows([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [warehouseId, appliedSearch, page]);

  useEffect(() => {
    if (warehouseId) {
      loadReport(1);
    }
  }, [warehouseId, appliedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayRows = useMemo(() => {
    if (!onlyVariance) return rows;
    return rows.filter((r) => r.differenceQty !== 0);
  }, [rows, onlyVariance]);

  const pendingEditsCount = editMapRef.current.size;

  const updatePhysicalQty = (row, value) => {
    const qty = Math.max(0, Number(value) || 0);
    const key = String(row.inventoryId);
    const systemQty = Number(row.systemQty || 0);
    if (qty === systemQty) {
      editMapRef.current.delete(key);
    } else {
      editMapRef.current.set(key, {
        physicalQty: qty,
        systemQty,
        variantId: row.variantId,
        barcode: row.barcode,
      });
    }
    setEditVersion((v) => v + 1);
    setRows((prev) =>
      prev.map((r) =>
        String(r.inventoryId) === key
          ? { ...r, physicalQty: qty, differenceQty: qty - systemQty }
          : r,
      ),
    );
  };

  const handleSearch = () => {
    setAppliedSearch(searchInput.trim());
    setPage(1);
    editMapRef.current.clear();
    setEditVersion((v) => v + 1);
  };

  const handleWarehouseChange = (id) => {
    setWarehouseId(id);
    setPage(1);
    setAppliedSearch('');
    setSearchInput('');
    editMapRef.current.clear();
    setEditVersion((v) => v + 1);
    setSuccess('');
  };

  const handleSave = async () => {
    if (!warehouseId || !editMapRef.current.size) return;

    const changed = [...editMapRef.current.values()];

    if (!window.confirm(`Apply ${changed.length} adjustment(s) to warehouse stock immediately?`)) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess('');
    try {
      const res = await api.post('/inventory/physical-vs-actual/apply', {
        warehouseId,
        items: changed,
      });
      const data = res.data?.data || res.data;
      editMapRef.current.clear();
      setEditVersion((v) => v + 1);
      setSuccess(`Warehouse stock updated — ${data.adjustedLines ?? changed.length} line(s) adjusted.`);
      await loadReport(page);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save adjustments');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Physical vs Actual Stock"
        subtitle="Compare physical warehouse count with system stock. Edit physical qty and save — warehouse inventory updates immediately."
        actions={(
          <Button
            variant="outlined"
            startIcon={<RefreshOutlinedIcon />}
            onClick={() => loadReport(page)}
            disabled={!warehouseId || loading || saving}
          >
            Refresh
          </Button>
        )}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap" alignItems="center">
          <TextField
            select
            size="small"
            label="Warehouse"
            value={warehouseId}
            onChange={(e) => handleWarehouseChange(e.target.value)}
            sx={{ minWidth: 260 }}
          >
            <MenuItem value="" disabled>Select warehouse</MenuItem>
            {warehouses.map((wh) => (
              <MenuItem key={wh.id || wh._id} value={wh.id || wh._id}>
                {wh.name || wh.warehouseName}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            size="small"
            label="Search barcode / item / brand"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ minWidth: 240, flex: 1 }}
          />
          <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearch} disabled={!warehouseId || loading}>
            Apply
          </Button>

          <FormControlLabel
            control={(
              <Switch
                checked={onlyVariance}
                onChange={(e) => setOnlyVariance(e.target.checked)}
                size="small"
              />
            )}
            label="Show variances only (this page)"
          />
        </Stack>

        {summary && (
          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 2 }}>
            <Chip label={`Total lines: ${fmtQty(summary.lineCount)}`} variant="outlined" />
            <Chip label={`System total: ${fmtQty(summary.totalSystemQty)}`} color="primary" variant="outlined" />
            {appliedSearch && (
              <Chip label={`Filtered: ${fmtQty(summary.filteredCount)}`} variant="outlined" />
            )}
            <Chip
              label={`Pending edits: ${editVersion >= 0 ? pendingEditsCount : 0}`}
              color={pendingEditsCount ? 'warning' : 'success'}
              variant="outlined"
            />
          </Stack>
        )}
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        {!warehouseId ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography color="text.secondary">Select a warehouse to load the report.</Typography>
          </Box>
        ) : loading && !rows.length ? (
          <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 380px)' }}>
              <Table size="small" stickyHeader>
                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Item</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Barcode / SKU</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Size / Color</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>System Qty</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>Physical Qty</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>Difference</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#64748b' }}>
                        No stock lines found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayRows.map((row) => (
                      <TableRow
                        key={row.inventoryId}
                        hover
                        sx={{ bgcolor: row.differenceQty !== 0 ? '#fffbeb' : 'inherit' }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.itemName}</Typography>
                          <Typography variant="caption" color="text.secondary">{row.brand || row.category || row.itemCode}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{row.barcode || row.sku}</TableCell>
                        <TableCell>{row.size} / {row.color}</TableCell>
                        <TableCell align="right">{fmtQty(row.systemQty)}</TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            value={row.physicalQty}
                            onChange={(e) => updatePhysicalQty(row, e.target.value)}
                            inputProps={{ min: 0, style: { textAlign: 'right' } }}
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 700,
                            color: row.differenceQty === 0 ? 'inherit' : row.differenceQty > 0 ? '#15803d' : '#dc2626',
                          }}
                        >
                          {row.differenceQty > 0 ? `+${fmtQty(row.differenceQty)}` : fmtQty(row.differenceQty)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {pagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: '1px solid #e2e8f0' }}>
                <Pagination
                  count={pagination.totalPages}
                  page={page}
                  onChange={(_e, p) => loadReport(p)}
                  color="primary"
                  disabled={loading}
                />
              </Box>
            )}

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ p: 2, justifyContent: 'space-between', alignItems: { md: 'center' }, borderTop: '1px solid #e2e8f0' }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Showing page {page} of {pagination.totalPages} ({fmtQty(pagination.total)} lines)
                  {pendingEditsCount > 0 && (
                    <> · <strong>{pendingEditsCount}</strong> unsaved edit(s)</>
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Save applies adjustments to warehouse inventory immediately (stock ledger + movements).
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
                onClick={handleSave}
                disabled={saving || !pendingEditsCount}
                sx={{ fontWeight: 800 }}
              >
                {saving ? 'Saving…' : 'Save to Warehouse'}
              </Button>
            </Stack>
          </>
        )}
      </Paper>
    </Box>
  );
}

export default PhysicalVsActualStockPage;
