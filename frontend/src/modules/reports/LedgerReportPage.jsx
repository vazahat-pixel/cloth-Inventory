import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
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
import ReportFilterPanel from './ReportFilterPanel';
import ReportExportButton from './ReportExportButton';
import { SummaryChip } from './SalesReportPage';

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function LedgerReportPage() {
  const sales = useSelector((state) => state.sales?.records || []);
  const bankReceipts = useSelector((state) => state.accounts?.bankReceipts || []);
  const purchases = useSelector((state) => state.purchase?.records || []);
  const bankPayments = useSelector((state) => state.accounts?.bankPayments || []);
  const customers = useSelector((state) => state.masters?.customers || []);
  const suppliers = useSelector((state) => state.masters?.suppliers || []);

  const [accountType, setAccountType] = useState('Customer');
  const [filters, setFilters] = useState({});
  const [partyId, setPartyId] = useState('all');

  const ledgerEntries = useMemo(() => {
    const from = filters.dateFrom || '';
    const to = filters.dateTo || '';
    const inRange = (d) => (!from || d >= from) && (!to || d <= to);

    if (accountType === 'Customer') {
      const entries = [];
      sales.forEach((s) => {
        if (!inRange(s.date)) return;
        if (partyId !== 'all' && s.customerId !== partyId) return;
        const amt = toNum(s.totals?.netPayable);
        if (amt <= 0) return;
        entries.push({
          date: s.date,
          reference: s.invoiceNumber,
          narration: `Sale ${s.invoiceNumber} - ${s.customerName || 'Walk-in'}`,
          debit: amt,
          credit: 0,
          type: 'Sale',
        });
      });
      bankReceipts.forEach((r) => {
        if (!inRange(r.date)) return;
        if (partyId !== 'all' && r.customerId !== partyId) return;
        const amt = toNum(r.amount);
        if (amt <= 0) return;
        entries.push({
          date: r.date,
          reference: r.chequeNo ? `Chq ${r.chequeNo}` : 'Receipt',
          narration: r.narration || 'Bank receipt',
          debit: 0,
          credit: amt,
          type: 'Receipt',
        });
      });
      entries.sort((a, b) => a.date.localeCompare(b.date) || (a.reference || '').localeCompare(b.reference || ''));
      let balance = 0;
      entries.forEach((e) => {
        balance += toNum(e.debit) - toNum(e.credit);
        e.balance = balance;
      });
      return entries;
    }

    const entries = [];
    purchases.forEach((p) => {
      if (!inRange(p.billDate)) return;
      if (partyId !== 'all' && p.supplierId !== partyId) return;
      const amt = toNum(p.totals?.netAmount);
      if (amt <= 0) return;
      entries.push({
        date: p.billDate,
        reference: p.billNumber,
        narration: `Purchase ${p.billNumber}`,
        debit: 0,
        credit: amt,
        type: 'Purchase',
      });
    });
    bankPayments.forEach((r) => {
      if (!inRange(r.date)) return;
      if (partyId !== 'all' && r.supplierId !== partyId) return;
      const amt = toNum(r.amount);
      if (amt <= 0) return;
      entries.push({
        date: r.date,
        reference: r.chequeNo ? `Chq ${r.chequeNo}` : 'Payment',
        narration: r.narration || 'Bank payment',
        debit: amt,
        credit: 0,
        type: 'Payment',
      });
    });
    entries.sort((a, b) => a.date.localeCompare(b.date) || (a.reference || '').localeCompare(b.reference || ''));
    let balance = 0;
    entries.forEach((e) => {
      balance += toNum(e.credit) - toNum(e.debit);
      e.balance = balance;
    });
    return entries;
  }, [accountType, filters.dateFrom, filters.dateTo, partyId, sales, bankReceipts, purchases, bankPayments]);

  const currentBalance = useMemo(() => {
    if (ledgerEntries.length === 0) return 0;
    return ledgerEntries[ledgerEntries.length - 1].balance;
  }, [ledgerEntries]);

  const exportRows = useMemo(
    () =>
      ledgerEntries.map((e) => ({
        Date: e.date,
        Reference: e.reference,
        Narration: e.narration,
        Debit: e.debit,
        Credit: e.credit,
        Balance: e.balance,
      })),
    [ledgerEntries],
  );

  return (
    <Box>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Ledger Report
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Account-wise ledger with debit, credit, and running balance.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            size="small"
            select
            label="Account Type"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="Customer">Customer</MenuItem>
            <MenuItem value="Supplier">Supplier</MenuItem>
          </TextField>
          <TextField
            size="small"
            select
            label={accountType === 'Customer' ? 'Customer' : 'Supplier'}
            value={partyId}
            onChange={(e) => setPartyId(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="all">All</MenuItem>
            {accountType === 'Customer'
              ? customers.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.customerName}
                  </MenuItem>
                ))
              : suppliers.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.supplierName}
                  </MenuItem>
                ))}
          </TextField>
        </Stack>

        <ReportFilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          showDateRange
          compact
        />
      </Stack>

      {partyId !== 'all' && (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, mb: 2 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <SummaryChip
              label="Current Balance"
              value={accountType === 'Customer' ? (currentBalance >= 0 ? `₹${currentBalance.toFixed(2)} (Dr)` : `₹${Math.abs(currentBalance).toFixed(2)} (Cr)`) : (currentBalance >= 0 ? `₹${currentBalance.toFixed(2)} (Cr)` : `₹${Math.abs(currentBalance).toFixed(2)} (Dr)`)}
              strong
            />
          </Stack>
        </Paper>
      )}

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack direction="row" justifyContent="flex-end" sx={{ p: 1.5 }}>
          <ReportExportButton
            headers={['Date', 'Reference', 'Narration', 'Debit', 'Credit', 'Balance']}
            headerKeys={['date', 'reference', 'narration', 'debit', 'credit', 'balance']}
            rows={exportRows}
            filename="ledger.csv"
          />
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Narration</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Debit</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Credit</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ledgerEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#64748b' }}>
                    No ledger entries in the selected period.
                  </TableCell>
                </TableRow>
              ) : (
                ledgerEntries.map((e, i) => (
                  <TableRow key={`${e.date}-${e.reference}-${i}`} hover>
                    <TableCell>{e.date}</TableCell>
                    <TableCell>{e.reference}</TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>{e.narration}</TableCell>
                    <TableCell align="right">{e.debit ? `₹${toNum(e.debit).toFixed(2)}` : '-'}</TableCell>
                    <TableCell align="right">{e.credit ? `₹${toNum(e.credit).toFixed(2)}` : '-'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>₹{toNum(e.balance).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default LedgerReportPage;
