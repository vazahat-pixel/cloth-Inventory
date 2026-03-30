import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Collapse,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HistoryIcon from '@mui/icons-material/History';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { fetchStockOverview, applyStockAudit } from './inventorySlice';
import { fetchMasters } from '../masters/mastersSlice';

const getTodayDate = () => new Date().toISOString().slice(0, 10);

function StockAuditPage({
  pageTitle = 'Stock Audit',
  pageDescription = 'Verify physical quantity against system stock and apply audit corrections.',
}) {
  const dispatch = useDispatch();
  const stores = useSelector((state) => state.masters.stores || []);
  const stockRows = useSelector((state) => state.inventory.stock || []);
  const audits = useSelector((state) => state.inventory.audits || []);

  const [warehouseId, setWarehouseId] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [auditDate, setAuditDate] = useState(getTodayDate());
  const [physicalMap, setPhysicalMap] = useState({});
  const [resultMessage, setResultMessage] = useState('');

  useEffect(() => {
    dispatch(fetchMasters('stores'));
    dispatch(fetchStockOverview());
  }, [dispatch]);

  const brands = useMemo(
    () => Array.from(new Set(stockRows.map((row) => row.brand))).filter(Boolean),
    [stockRows],
  );
  const categories = useMemo(
    () => Array.from(new Set(stockRows.map((row) => row.category))).filter(Boolean),
    [stockRows],
  );

  const warehouseRows = useMemo(() => {
    let rows = stockRows.filter((row) => row.locationType === 'STORE' && row.storeId === warehouseId);
    if (brandFilter !== 'all') rows = rows.filter((row) => row.brand === brandFilter);
    if (categoryFilter !== 'all') rows = rows.filter((row) => row.category === categoryFilter);
    return rows;
  }, [stockRows, warehouseId, brandFilter, categoryFilter]);

  useEffect(() => {
    if (!warehouseId) {
      setPhysicalMap({});
      return;
    }

    setPhysicalMap(
      warehouseRows.reduce((accumulator, row) => {
        accumulator[row.id] = Number(row.quantity);
        return accumulator;
      }, {}),
    );
  }, [warehouseId, warehouseRows]);

  const auditRows = useMemo(
    () =>
      warehouseRows.map((row) => {
        const physicalQty = Number(physicalMap[row.id] ?? row.quantity);
        const difference = physicalQty - Number(row.quantity);
        return {
          ...row,
          physicalQty,
          difference,
        };
      }),
    [physicalMap, warehouseRows],
  );

  const discrepancyRows = auditRows.filter((row) => row.difference !== 0);
  const shortageRows = discrepancyRows.filter((row) => row.difference < 0);
  const excessRows = discrepancyRows.filter((row) => row.difference > 0);
  const shortageQty = shortageRows.reduce((sum, row) => sum + row.difference, 0);
  const excessQty = excessRows.reduce((sum, row) => sum + row.difference, 0);

  const updatePhysicalQty = (stockId, value) => {
    setPhysicalMap((previous) => ({
      ...previous,
      [stockId]: Math.max(0, Number(value)),
    }));
  };

  const handleSaveAudit = async () => {
    if (!warehouseId) {
      return;
    }

    try {
      await dispatch(
        applyStockAudit({
          storeId: warehouseId,
          date: auditDate,
          items: auditRows.map((row) => ({
            productId: row.productId || row.id,
            physicalQty: row.physicalQty,
          })),
          user: 'Admin',
        }),
      ).unwrap();

      setResultMessage(
        discrepancyRows.length
          ? `Issue/Receive applied: ${shortageRows.length} shortage(s), ${excessRows.length} excess(es).`
          : 'Audit saved. No discrepancy found.',
      );
    } catch (error) {
      setResultMessage(error?.message || error || 'Audit failed.');
    }
  };

  return (
    <Stack spacing={2}>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
          {pageTitle}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
          {pageDescription}
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap">
          <TextField
            select
            size="small"
            label="Store"
            value={warehouseId}
            onChange={(event) => {
              setResultMessage('');
              setWarehouseId(event.target.value);
            }}
            sx={{ minWidth: 200 }}
          >
              <MenuItem value="" disabled>
              Select Store
              </MenuItem>
            {stores.map((store) => (
              <MenuItem key={store.id || store._id} value={store.id || store._id}>
                {store.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Brand / Company"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All Brands</MenuItem>
            {brands.map((b) => (
              <MenuItem key={b} value={b}>
                {b}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Item Group"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All Groups</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            size="small"
            label="Audit Date"
            type="date"
            value={auditDate}
            onChange={(event) => setAuditDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            size="small"
            label="Barcode / SKU Scan"
            value={barcodeSearch}
            onChange={(event) => setBarcodeSearch(event.target.value)}
            placeholder="Type SKU to highlight rows"
            sx={{ flex: 1 }}
          />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        {warehouseId ? (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Item / Variant</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Lot</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      System Qty
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Physical Qty
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Difference
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditRows.map((row) => {
                    const isHighlighted = barcodeSearch
                      ? row.sku.toLowerCase().includes(barcodeSearch.toLowerCase())
                      : false;

                    return (
                      <TableRow
                        key={row.id}
                        hover
                        sx={{
                          backgroundColor: row.difference !== 0 ? '#fff1f2' : undefined,
                          ...(isHighlighted ? { outline: '2px solid #2563eb' } : {}),
                        }}
                      >
                        <TableCell>{`${row.itemName} (${row.size}/${row.color})`}</TableCell>
                        <TableCell>{row.lotNumber || '-'}</TableCell>
                        <TableCell>{row.sku}</TableCell>
                        <TableCell align="right">{row.quantity}</TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            value={row.physicalQty}
                            onChange={(event) => updatePhysicalQty(row.id, event.target.value)}
                            sx={{ width: 120 }}
                          />
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 700, color: row.difference === 0 ? '#0f172a' : '#be123c' }}
                        >
                          {row.difference > 0 ? `+${row.difference}` : row.difference}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ p: 2, justifyContent: 'space-between', alignItems: { md: 'center' } }}
            >
              <Box>
                <Typography variant="body2" sx={{ color: '#475569', mb: 0.5 }}>
                  Discrepancies: <strong>{discrepancyRows.length}</strong>
                </Typography>
                {shortageRows.length > 0 && (
                  <Typography variant="caption" sx={{ color: '#b91c1c', display: 'block' }}>
                    Shortages (Issue): {shortageRows.length} items, {shortageQty} qty
                  </Typography>
                )}
                {excessRows.length > 0 && (
                  <Typography variant="caption" sx={{ color: '#15803d', display: 'block' }}>
                    Excess (Receive): {excessRows.length} items, +{excessQty} qty
                  </Typography>
                )}
              </Box>

              <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={handleSaveAudit}>
                Apply Issue / Receive
              </Button>
            </Stack>
          </>
        ) : (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Select a warehouse to begin stock audit.
            </Typography>
          </Box>
        )}
      </Paper>

      {resultMessage && <Alert severity="success">{resultMessage}</Alert>}

      {audits.length > 0 && (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Accordion defaultExpanded={false} disableGutters elevation={0} sx={{ '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={1} alignItems="center">
                <HistoryIcon fontSize="small" color="action" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Audit History ({audits.length} documents)
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Stack spacing={1}>
                {audits.slice(0, 20).map((audit) => (
                  <AuditDocumentItem key={audit.id} audit={audit} warehouses={warehouses} stockRows={stockRows} />
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        </Paper>
      )}
    </Stack>
  );
}

function AuditDocumentItem({ audit, warehouses, stockRows }) {
  const [expanded, setExpanded] = useState(false);
  const warehouseName = warehouses.find((w) => w.id === audit.warehouseId)?.name || audit.warehouseId;

  const entriesWithStock = useMemo(() => {
    return (audit.entries || []).map((e) => {
      const stock = stockRows.find((s) => s.id === e.stockId);
      return {
        ...e,
        itemName: stock?.itemName || '-',
        size: stock?.size || '-',
        color: stock?.color || '-',
        sku: stock?.sku || '-',
      };
    });
  }, [audit.entries, stockRows]);

  const discrepancyCount = (audit.entries || []).filter((e) => e.difference !== 0).length;

  return (
    <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 1 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, py: 1.5, cursor: 'pointer' }}
        onClick={() => setExpanded((x) => !x)}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {audit.reference || audit.id}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            {audit.date} · {warehouseName}
          </Typography>
          {discrepancyCount > 0 && (
            <Typography variant="caption" sx={{ color: '#b91c1c' }}>
              {discrepancyCount} discrepancy(ies)
            </Typography>
          )}
        </Stack>
        <ExpandMoreIcon sx={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} fontSize="small" />
      </Stack>
      <Collapse in={expanded}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">System</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Physical</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Difference</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entriesWithStock.map((e) => (
                <TableRow key={e.stockId}>
                  <TableCell>{`${e.itemName} (${e.size}/${e.color})`}</TableCell>
                  <TableCell>{e.sku}</TableCell>
                  <TableCell align="right">{e.systemQty}</TableCell>
                  <TableCell align="right">{e.physicalQty}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: e.difference !== 0 ? '#b91c1c' : 'inherit' }}>
                    {e.difference > 0 ? `+${e.difference}` : e.difference}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Collapse>
    </Box>
  );
}

export default StockAuditPage;
