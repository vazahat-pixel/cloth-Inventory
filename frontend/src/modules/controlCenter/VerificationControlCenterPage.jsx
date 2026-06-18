import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from '../../utils/formatters';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Grid,
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
  TextField,
  Typography,
  MenuItem,
} from '@mui/material';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import PageHeader from '../../components/erp/PageHeader';
import api, { VERIFY_REQUEST_TIMEOUT_MS } from '../../services/api';
import { useAppNavigate } from '../../hooks/useAppNavigate';

const fmtQty = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtAmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const blameChipColor = (blame) => {
  if (blame === 'USER') return 'warning';
  if (blame === 'MIXED') return 'info';
  if (blame === 'SYSTEM') return 'error';
  return 'default';
};

function StatusHero({ passed, status, verifiedAt, mismatchCount, onRun, running }) {
  const isPass = passed === true;
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: `2px solid ${isPass ? '#10b981' : '#ef4444'}`,
        bgcolor: isPass ? '#ecfdf5' : '#fef2f2',
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
        <Stack direction="row" spacing={2} alignItems="center">
          {isPass ? (
            <CheckCircleOutlineIcon sx={{ fontSize: 48, color: '#059669' }} />
          ) : (
            <WarningAmberOutlinedIcon sx={{ fontSize: 48, color: '#dc2626' }} />
          )}
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: isPass ? '#065f46' : '#991b1b' }}>
              {isPass ? 'PRODUCTION SAFE — ZERO MISMATCH' : 'MISMATCH DETECTED — ACTION REQUIRED'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', mt: 0.5 }}>
              {status || (isPass ? 'All checks passed' : `${mismatchCount || 0} issue(s) found`)}
            </Typography>
            {verifiedAt && (
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Last verified: {formatDateTimeDDMMYYYY(verifiedAt)}
              </Typography>
            )}
            {running && (
              <Typography variant="caption" sx={{ color: '#0369a1', display: 'block', mt: 0.5 }}>
                Full audit in progress — checking stores, warehouse, sales, and dispatch. This may take 1–3 minutes.
              </Typography>
            )}
          </Box>
        </Stack>
        <Button
          variant="contained"
          size="large"
          startIcon={running ? <CircularProgress size={18} color="inherit" /> : <PlayArrowOutlinedIcon />}
          onClick={onRun}
          disabled={running}
          sx={{ fontWeight: 800, borderRadius: 2, minWidth: 200 }}
        >
          {running ? 'Verifying…' : 'Run Full Verify Now'}
        </Button>
      </Stack>
    </Paper>
  );
}

function MetricCard({ label, value, sub, color, icon: Icon }) {
  return (
    <Card elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 3, height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
            {label}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, color: color || '#0f172a', mt: 0.5 }}>
            {value}
          </Typography>
          {sub && (
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              {sub}
            </Typography>
          )}
        </Box>
        {Icon && <Icon sx={{ color: color || '#94a3b8', fontSize: 28 }} />}
      </Stack>
    </Card>
  );
}

function VerificationControlCenterPage() {
  const navigate = useAppNavigate();
  const [report, setReport] = useState(null);
  const [dailyReport, setDailyReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [mismatchFilter, setMismatchFilter] = useState('all');
  const [reconcilingStoreId, setReconcilingStoreId] = useState(null);

  const loadLatest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/inventory/daily-verify/latest');
      const latest = res.data?.report || res.data?.data?.report;
      setDailyReport(latest);
      if (latest && !report) setReport(latest);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load verification status');
    } finally {
      setLoading(false);
    }
  }, [report]);

  useEffect(() => {
    loadLatest();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const runVerify = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await api.post(
        '/inventory/zero-mismatch-verify/run',
        {},
        { timeout: VERIFY_REQUEST_TIMEOUT_MS },
      );
      const data = res.data?.data || res.data;
      setReport(data);
      setDailyReport(data);
    } catch (err) {
      const apiMsg = err.response?.data?.message;
      if (err.code === 'ECONNABORTED') {
        setError('Verification timed out — the server may still be running checks. Wait 1 minute, then click Refresh.');
      } else if (err.response?.status === 500) {
        setError(apiMsg || 'Server error during verification. The backend may have restarted — please try again.');
      } else {
        setError(apiMsg || err.message || 'Verification failed');
      }
    } finally {
      setRunning(false);
    }
  };

  const activeReport = report || dailyReport;

  const checksByType = useMemo(() => {
    const checks = activeReport?.checks || [];
    const inTransitAll = checks.filter((c) => c.check === 'IN_TRANSIT_POOL' || c.check === 'DISPATCH_IN_TRANSIT');
    return {
      store: checks.filter((c) => c.check === 'STORE_STOCK_REPORT'),
      warehouse: checks.filter((c) => c.check === 'WAREHOUSE_STOCK_REPORT'),
      sales: checks.filter((c) => c.check === 'BRANCH_SALES_CONSOLIDATION' || c.check === 'STORE_SALES_REGISTER'),
      salesRegister: checks.filter((c) => c.check === 'STORE_SALES_REGISTER'),
      financial: checks.filter((c) => c.check === 'GSTR_SALES_PARITY' || c.check === 'STORE_GSTR_SALES_PARITY' || c.check === 'SALE_INVOICE_MATH'),
      stockFields: checks.filter((c) => c.check === 'STOCK_FIELD_PARITY'),
      inTransit: inTransitAll,
      inTransitPool: checks.filter((c) => c.check === 'IN_TRANSIT_POOL'),
      inTransitDispatch: checks.filter((c) => c.check === 'DISPATCH_IN_TRANSIT'),
    };
  }, [activeReport]);

  const handleReconcileStore = async (storeId, storeName) => {
    if (!window.confirm(`Sync in-transit pool for "${storeName}" from open dispatches?\n\nThis fixes system pool numbers only — physical receipt at the store is a separate step.`)) {
      return;
    }
    setReconcilingStoreId(storeId || 'ALL');
    setError(null);
    try {
      const res = await api.post('/inventory/reconcile-in-transit', { storeId: storeId || undefined });
      const data = res.data?.data || res.data;
      await runVerify();
      alert(`Pool synced — ${data?.adjustedLines ?? 0} line(s) updated. Verification has been run again.`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Reconcile failed');
    } finally {
      setReconcilingStoreId(null);
    }
  };

  const mismatches = activeReport?.mismatches || [];
  const mismatchTotal = activeReport?.mismatchMeta?.total ?? activeReport?.summary?.mismatchCount ?? mismatches.length;
  const mismatchTypes = useMemo(() => {
    const types = new Set(mismatches.map((m) => m.type));
    return ['all', ...Array.from(types)];
  }, [mismatches]);

  const filteredMismatches = useMemo(() => {
    if (mismatchFilter === 'all') return mismatches;
    return mismatches.filter((m) => m.type === mismatchFilter);
  }, [mismatches, mismatchFilter]);

  const summary = activeReport?.summary || {};
  const byCategory = summary.byCategory || {};

  const quickLinks = [
    { label: 'Stock Overview', path: '/inventory/stock-overview' },
    { label: 'Physical vs Actual', path: '/reports/physical-vs-actual-stock' },
    { label: 'Branch Sales & Stock', path: '/reports/branch-sales-stock' },
    { label: 'GSTR-1 Detailed', path: '/reports/gstr1' },
    { label: 'In-Transit Monitor', path: '/reports/in-transit' },
    { label: 'Dispatch Queue', path: '/orders/dispatch-queue' },
    { label: 'Collection Report', path: '/reports/collection' },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="HO Control Center — Zero Mismatch"
        subtitle="Live audit of every store, warehouse, sales, dispatch, and stock. Any quantity or amount mismatch shows up here immediately."
        actions={(
          <Button
            variant="outlined"
            startIcon={<RefreshOutlinedIcon />}
            onClick={loadLatest}
            disabled={loading || running}
            sx={{ fontWeight: 700 }}
          >
            Refresh
          </Button>
        )}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading && !activeReport ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={3}>
          <StatusHero
            passed={activeReport?.passed}
            status={activeReport?.status}
            verifiedAt={activeReport?.verifiedAt}
            mismatchCount={mismatchTotal}
            onRun={runVerify}
            running={running}
          />

          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <MetricCard label="Stores Checked" value={summary.storesChecked ?? '—'} icon={StorefrontOutlinedIcon} />
            </Grid>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <MetricCard label="Warehouses" value={summary.warehousesChecked ?? '—'} icon={WarehouseOutlinedIcon} />
            </Grid>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <MetricCard
                label="Mismatches"
                value={fmtQty(mismatchTotal)}
                color={mismatchTotal ? '#dc2626' : '#059669'}
                sub={mismatchTotal ? 'Needs review' : 'All clear'}
                icon={VerifiedUserOutlinedIcon}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <MetricCard
                label="Sales Register"
                value={summary.salesRegisterTotal != null ? fmtAmt(summary.salesRegisterTotal) : '—'}
                sub={summary.salesRegisterQty != null ? `${fmtQty(summary.salesRegisterQty)} pcs` : undefined}
                icon={PaymentsOutlinedIcon}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <MetricCard
                label="Dispatches In-Transit"
                value={fmtQty(summary.dispatchesInTransit)}
                icon={LocalShippingOutlinedIcon}
              />
            </Grid>
          </Grid>

          {(byCategory.stock || byCategory.sales || byCategory.dispatch || byCategory.financial) ? (
            <Grid container spacing={2}>
              {[
                { label: 'Stock Issues', count: byCategory.stock, color: '#7c3aed' },
                { label: 'Sales Issues', count: byCategory.sales, color: '#2563eb' },
                { label: 'Dispatch Issues', count: byCategory.dispatch, color: '#d97706' },
                { label: 'Financial Issues', count: byCategory.financial, color: '#dc2626' },
              ].map((cat) => (
                <Grid size={{ xs: 6, md: 3 }} key={cat.label}>
                  <MetricCard
                    label={cat.label}
                    value={fmtQty(cat.count || 0)}
                    color={cat.count ? cat.color : '#059669'}
                    sub={cat.count ? 'Click Mismatches tab' : 'Clear'}
                  />
                </Grid>
              ))}
            </Grid>
          ) : null}

          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <Tab label="Overview" sx={{ fontWeight: 700 }} />
              <Tab label={`Store Stock (${checksByType.store.length})`} sx={{ fontWeight: 700 }} />
              <Tab label={`Warehouse (${checksByType.warehouse.length})`} sx={{ fontWeight: 700 }} />
              <Tab label={`Sales (${checksByType.salesRegister.length})`} sx={{ fontWeight: 700 }} />
              <Tab label={`Financial (${checksByType.financial.length})`} sx={{ fontWeight: 700 }} />
              <Tab label={`Dispatch / In-Transit (${checksByType.inTransit.length})`} sx={{ fontWeight: 700 }} />
              <Tab label={`Mismatches (${mismatchTotal})`} sx={{ fontWeight: 700 }} />
            </Tabs>

            <Box sx={{ p: 2 }}>
              {tab === 0 && (
                <Stack spacing={2}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#475569' }}>
                    What is checked?
                  </Typography>
                  <Grid container spacing={2}>
                    {[
                      { title: 'Store Stock', desc: 'Live inventory = Branch Sales & Stock closing (per store)', ok: checksByType.store.every((c) => c.passed) },
                      { title: 'Warehouse Stock', desc: 'Warehouse live totals + negative stock scan', ok: checksByType.warehouse.every((c) => c.passed) },
                      { title: 'Sales Register', desc: 'Invoice qty/revenue vs Branch Report & GSTR-1 (per store)', ok: checksByType.salesRegister.every((c) => c.passed) },
                      { title: 'Invoice Math', desc: 'Every bill: grandTotal = subTotal − discount + tax; paid + due = grand', ok: checksByType.financial.filter((c) => c.check === 'SALE_INVOICE_MATH').every((c) => c.passed) },
                      { title: 'GSTR Parity', desc: 'GSTR-1 grand total = Sales register total', ok: checksByType.financial.filter((c) => c.check === 'GSTR_SALES_PARITY').every((c) => c.passed) },
                      { title: 'Dispatch Chain', desc: 'Dispatch → In-Transit pool → Receipt', ok: checksByType.inTransit.every((c) => c.passed) },
                    ].map((item) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.title}>
                        <Card elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                          <Chip
                            size="small"
                            label={item.ok ? 'PASS' : 'CHECK'}
                            color={item.ok ? 'success' : 'warning'}
                            sx={{ fontWeight: 800, mb: 1 }}
                          />
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{item.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                  <Divider />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Quick Reports</Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {quickLinks.map((link) => (
                      <Button key={link.path} size="small" variant="outlined" onClick={() => navigate(link.path)}>
                        {link.label}
                      </Button>
                    ))}
                  </Stack>
                  <Alert severity="info" icon={<PaymentsOutlinedIcon />}>
                    Daily auto-verify can run at 6:00 AM (.env: DAILY_ZERO_MISMATCH_CRON=true). Admins receive a notification on failure.
                  </Alert>
                </Stack>
              )}

              {tab === 1 && (
                <CheckTable
                  rows={checksByType.store}
                  columns={[
                    { key: 'store', label: 'Store' },
                    { key: 'liveInventory', label: 'Live Stock', align: 'right', fmt: fmtQty },
                    { key: 'reportTotal', label: 'Report Stock', align: 'right', fmt: fmtQty },
                    { key: 'differenceQty', label: 'Diff', align: 'right', fmt: fmtQty },
                  ]}
                />
              )}

              {tab === 2 && (
                <CheckTable
                  rows={checksByType.warehouse}
                  columns={[
                    { key: 'warehouse', label: 'Warehouse' },
                    { key: 'liveInventory', label: 'Live Stock', align: 'right', fmt: fmtQty },
                    { key: 'reportTotal', label: 'Report Stock', align: 'right', fmt: fmtQty },
                    { key: 'differenceQty', label: 'Diff', align: 'right', fmt: fmtQty },
                  ]}
                />
              )}

              {tab === 3 && (
                <CheckTable
                  rows={checksByType.salesRegister}
                  columns={[
                    { key: 'store', label: 'Store' },
                    { key: 'invoiceCount', label: 'Invoices', align: 'right', fmt: fmtQty },
                    { key: 'netRevenue', label: 'Net Revenue', align: 'right', fmt: fmtAmt },
                    { key: 'salesRegisterQty', label: 'Sale Qty', align: 'right', fmt: fmtQty },
                    { key: 'branchReportNetSaleQty', label: 'Branch Rpt Qty', align: 'right', fmt: fmtQty },
                    { key: 'differenceQty', label: 'Qty Diff', align: 'right', fmt: fmtQty },
                  ]}
                />
              )}

              {tab === 4 && (
                <Stack spacing={2}>
                  <CheckTable
                    rows={checksByType.financial.filter((c) => c.check !== 'SALE_INVOICE_MATH')}
                    columns={[
                      { key: 'check', label: 'Check' },
                      { key: 'store', label: 'Store' },
                      { key: 'gstrGrandTotal', label: 'GSTR Total', align: 'right', fmt: fmtAmt },
                      { key: 'salesRegisterGrandTotal', label: 'Sales Total', align: 'right', fmt: fmtAmt },
                      { key: 'gstrInvoiceValue', label: 'GSTR Store', align: 'right', fmt: fmtAmt },
                      { key: 'salesRegisterRevenue', label: 'Sales Store', align: 'right', fmt: fmtAmt },
                      { key: 'differenceAmount', label: '₹ Diff', align: 'right', fmt: fmtAmt },
                    ]}
                  />
                  {checksByType.financial.filter((c) => c.check === 'SALE_INVOICE_MATH').map((c) => (
                    <Alert key="invoice-math" severity={c.passed ? 'success' : 'error'}>
                      Invoice math: {c.invoicesChecked} bills checked — {c.failures} failure(s)
                      {c.passed ? ' — all bills balance correctly.' : ' — see Mismatches tab for invoice numbers.'}
                    </Alert>
                  ))}
                </Stack>
              )}

              {tab === 5 && (
                <InTransitTab
                  poolChecks={checksByType.inTransitPool}
                  dispatchChecks={checksByType.inTransitDispatch}
                  onReconcile={handleReconcileStore}
                  reconcilingStoreId={reconcilingStoreId}
                  onNavigate={navigate}
                />
              )}

              {tab === 6 && (
                <Stack spacing={2}>
                  {activeReport?.mismatchMeta?.truncated && (
                    <Alert severity="warning" sx={{ mb: 1 }}>
                      Showing first {activeReport.mismatchMeta.shown} of {activeReport.mismatchMeta.total} mismatches.
                      Full list: backend/reports/daily/latest.json
                    </Alert>
                  )}
                  <TextField
                    select
                    size="small"
                    label="Filter by type"
                    value={mismatchFilter}
                    onChange={(e) => setMismatchFilter(e.target.value)}
                    sx={{ maxWidth: 320 }}
                  >
                    {mismatchTypes.map((t) => (
                      <MenuItem key={t} value={t}>{t === 'all' ? 'All types' : t}</MenuItem>
                    ))}
                  </TextField>
                  <TableContainer sx={{ maxHeight: 520 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800 }}>Invoice</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Store / WH</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Dispatch</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Barcode</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>Qty Diff</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>₹ Diff</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Root Cause</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Blame</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredMismatches.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={10} align="center" sx={{ py: 4, color: '#64748b' }}>
                              No mismatches — all clear!
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredMismatches.map((m, i) => (
                            <TableRow key={`${m.type}-${i}`} hover>
                              <TableCell>{m.invoiceNumber || '—'}</TableCell>
                              <TableCell>
                                <Chip size="small" label={m.type} color="error" variant="outlined" sx={{ fontSize: 10 }} />
                              </TableCell>
                              <TableCell>{m.store || m.warehouse || '—'}</TableCell>
                              <TableCell>{m.dispatchNumber || '—'}</TableCell>
                              <TableCell>{m.barcode || '—'}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: m.differenceQty ? '#dc2626' : 'inherit' }}>
                                {fmtQty(m.differenceQty)}
                              </TableCell>
                              <TableCell align="right">{m.differenceAmount != null ? fmtAmt(m.differenceAmount) : '—'}</TableCell>
                              <TableCell sx={{ maxWidth: 280, fontSize: 12 }}>{m.rootCause}</TableCell>
                              <TableCell>
                                {m.blameLabel ? (
                                  <Chip size="small" label={m.blameLabel} color={blameChipColor(m.blame)} variant="outlined" sx={{ fontSize: 10 }} />
                                ) : '—'}
                              </TableCell>
                              <TableCell>
                                <MismatchActionCell mismatch={m} onNavigate={navigate} onReconcile={handleReconcileStore} />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Stack>
              )}
            </Box>
          </Paper>
        </Stack>
      )}
    </Box>
  );
}

function MismatchActionCell({ mismatch, onNavigate, onReconcile }) {
  const action = mismatch?.resolution?.action;
  const label = mismatch?.resolution?.label;

  if (action === 'RECONCILE' && mismatch.storeId) {
    return (
      <Button
        size="small"
        variant="contained"
        color="warning"
        startIcon={<BuildOutlinedIcon />}
        onClick={() => onReconcile(mismatch.storeId, mismatch.store)}
        sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
      >
        {label || 'Pool Sync'}
      </Button>
    );
  }

  if (action === 'STORE_RECEIVE') {
    return (
      <Button
        size="small"
        variant="outlined"
        startIcon={<OpenInNewOutlinedIcon />}
        onClick={() => onNavigate('/reports/in-transit')}
        sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
      >
        {label || 'In-Transit'}
      </Button>
    );
  }

  if (action === 'VIEW_SALES') {
    return (
      <Button size="small" variant="outlined" startIcon={<OpenInNewOutlinedIcon />} onClick={() => onNavigate('/reports/sales')} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
        {label || 'Sales Report'}
      </Button>
    );
  }

  if (action === 'VIEW_GSTR') {
    return (
      <Button size="small" variant="outlined" startIcon={<OpenInNewOutlinedIcon />} onClick={() => onNavigate('/reports/gstr1')} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
        {label || 'GSTR-1'}
      </Button>
    );
  }

  if (action === 'VIEW_STOCK') {
    return (
      <Button size="small" variant="outlined" startIcon={<OpenInNewOutlinedIcon />} onClick={() => onNavigate('/reports/branch-sales-stock')} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
        {label || 'Branch Stock'}
      </Button>
    );
  }

  if (action === 'VIEW_DISPATCH' || mismatch.dispatchNumber) {
    return (
      <Button
        size="small"
        variant="outlined"
        startIcon={<OpenInNewOutlinedIcon />}
        onClick={() => onNavigate('/orders/dispatch-queue')}
        sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
      >
        {label || 'Dispatch Queue'}
      </Button>
    );
  }

  return <Typography variant="caption" color="text.secondary">—</Typography>;
}

function InTransitTab({ poolChecks, dispatchChecks, onReconcile, reconcilingStoreId, onNavigate }) {
  const failedPool = poolChecks.filter((c) => !c.passed);
  const failedDispatch = dispatchChecks.filter((c) => !c.passed);

  return (
    <Stack spacing={3}>
      <Alert severity="info">
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>What does the dispatch chain check?</Typography>
        <Typography variant="body2">
          Warehouse dispatch → store <strong>in-transit pool</strong> should increase → store receives → pool clears.
          A failure means either the system did not update the pool (historical bug) or the store did not mark receipt (user action).
        </Typography>
      </Alert>

      {failedPool.length > 0 && (
        <Alert severity="warning">
          {failedPool.length} store(s) have a pool mismatch.
          <strong> System / Historical Data</strong> — fix with pool sync.
          <strong> User Action</strong> — store must mark receipt in the system.
        </Alert>
      )}

      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Store-wise In-Transit Pool</Typography>
          {failedPool.length > 0 && (
            <Button
              size="small"
              variant="contained"
              color="warning"
              startIcon={reconcilingStoreId === 'ALL' ? <CircularProgress size={14} color="inherit" /> : <BuildOutlinedIcon />}
              disabled={Boolean(reconcilingStoreId)}
              onClick={() => onReconcile(null, 'All Stores')}
            >
              Sync All Stores
            </Button>
          )}
        </Stack>
        <InTransitCheckTable
          rows={poolChecks}
          mode="pool"
          onReconcile={onReconcile}
          reconcilingStoreId={reconcilingStoreId}
          onNavigate={onNavigate}
        />
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
          Dispatch-wise Check ({failedDispatch.length} fail / {dispatchChecks.length} total)
        </Typography>
        <InTransitCheckTable
          rows={dispatchChecks}
          mode="dispatch"
          onReconcile={onReconcile}
          reconcilingStoreId={reconcilingStoreId}
          onNavigate={onNavigate}
        />
      </Box>
    </Stack>
  );
}

function InTransitCheckTable({ rows, mode, onReconcile, reconcilingStoreId, onNavigate }) {
  if (!rows?.length) {
    return <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No data — run verification first.</Typography>;
  }

  return (
    <TableContainer sx={{ maxHeight: 480 }}>
      <Table size="small" stickyHeader>
        <TableHead sx={{ bgcolor: '#f1f5f9' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Store</TableCell>
            {mode === 'dispatch' && <TableCell sx={{ fontWeight: 800 }}>Dispatch</TableCell>}
            <TableCell align="right" sx={{ fontWeight: 800 }}>Dispatched Qty</TableCell>
            <TableCell align="right" sx={{ fontWeight: 800 }}>In-Transit Pool</TableCell>
            <TableCell align="right" sx={{ fontWeight: 800 }}>Diff</TableCell>
            <TableCell sx={{ fontWeight: 800, minWidth: 260 }}>Failure reason</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Blame</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Resolve</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => {
            const storeName = row.store || row.destination || '—';
            const dispatchedQty = row.dispatchedNotReceived ?? row.totalDispatchedQty ?? 0;
            const poolQty = row.poolTotal ?? row.inTransitPoolQty ?? 0;
            const isReconciling = reconcilingStoreId && String(reconcilingStoreId) === String(row.storeId);

            return (
              <TableRow key={`${mode}-${row.dispatchNumber || row.store}-${i}`} hover sx={{ bgcolor: row.passed ? 'inherit' : '#fff5f5' }}>
                <TableCell>
                  <Chip size="small" label={row.passed ? 'OK' : 'FAIL'} color={row.passed ? 'success' : 'error'} sx={{ fontWeight: 800 }} />
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{storeName}</TableCell>
                {mode === 'dispatch' && (
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{row.dispatchNumber || '—'}</TableCell>
                )}
                <TableCell align="right">{fmtQty(dispatchedQty)}</TableCell>
                <TableCell align="right">{fmtQty(poolQty)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: row.differenceQty ? '#dc2626' : 'inherit' }}>
                  {fmtQty(row.differenceQty)}
                </TableCell>
                <TableCell sx={{ fontSize: 12, maxWidth: 320 }}>
                  {row.passed ? (
                    <Typography variant="caption" color="text.secondary">All matched — dispatch and pool are aligned.</Typography>
                  ) : (
                    row.failureReason || 'Pool and dispatch do not match.'
                  )}
                </TableCell>
                <TableCell>
                  {!row.passed && row.blame ? (
                    <Chip size="small" label={row.blameLabel || row.blame} color={blameChipColor(row.blame)} variant="outlined" sx={{ fontSize: 10 }} />
                  ) : '—'}
                </TableCell>
                <TableCell>
                  {row.passed ? '—' : (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {(row.resolution?.action === 'RECONCILE' || row.blame === 'SYSTEM') && row.storeId && (
                        <Button
                          size="small"
                          variant="contained"
                          color="warning"
                          disabled={Boolean(reconcilingStoreId)}
                          startIcon={isReconciling ? <CircularProgress size={12} color="inherit" /> : <BuildOutlinedIcon />}
                          onClick={() => onReconcile(row.storeId, storeName)}
                          sx={{ fontWeight: 700 }}
                        >
                          Pool Sync
                        </Button>
                      )}
                      {mode === 'dispatch' && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<OpenInNewOutlinedIcon />}
                          onClick={() => onNavigate('/orders/dispatch-queue')}
                          sx={{ fontWeight: 700 }}
                        >
                          Dispatch
                        </Button>
                      )}
                      {(row.resolution?.action === 'STORE_RECEIVE' || row.blame === 'USER') && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => onNavigate('/reports/in-transit')}
                          sx={{ fontWeight: 700 }}
                        >
                          In-Transit
                        </Button>
                      )}
                    </Stack>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function CheckTable({ rows, columns }) {
  if (!rows?.length) {
    return <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No data — run verification first.</Typography>;
  }
  return (
    <TableContainer>
      <Table size="small">
        <TableHead sx={{ bgcolor: '#f1f5f9' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
            {columns.map((col) => (
              <TableCell key={col.key} align={col.align || 'left'} sx={{ fontWeight: 800 }}>{col.label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i} hover>
              <TableCell>
                <Chip size="small" label={row.passed ? 'OK' : 'FAIL'} color={row.passed ? 'success' : 'error'} sx={{ fontWeight: 800 }} />
              </TableCell>
              {columns.map((col) => (
                <TableCell key={col.key} align={col.align || 'left'}>
                  {col.fmt ? col.fmt(row[col.key]) : (row[col.key] ?? '—')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default VerificationControlCenterPage;
