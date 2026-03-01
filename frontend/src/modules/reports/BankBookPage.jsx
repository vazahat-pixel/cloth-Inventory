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

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function BankBookPage() {
  const banks = useSelector((state) => state.masters?.banks || []);
  const bankPayments = useSelector((state) => state.accounts?.bankPayments || []);
  const bankReceipts = useSelector((state) => state.accounts?.bankReceipts || []);

  const [filters, setFilters] = useState({});
  const [bankId, setBankId] = useState('all');

  const entries = useMemo(() => {
    const from = filters.dateFrom || '';
    const to = filters.dateTo || '';
    const inRange = (d) => (!from || d >= from) && (!to || d <= to);

    const list = [];
    bankReceipts.forEach((r) => {
      if (bankId !== 'all' && r.bankId !== bankId) return;
      if (!inRange(r.date)) return;
      list.push({
        date: r.date,
        reference: r.chequeNo ? `Rcpt Chq ${r.chequeNo}` : 'Receipt',
        narration: r.narration || 'Bank receipt',
        debit: toNum(r.amount),
        credit: 0,
        type: 'Receipt',
      });
    });
    bankPayments.forEach((p) => {
      if (bankId !== 'all' && p.bankId !== bankId) return;
      if (!inRange(p.date)) return;
      list.push({
        date: p.date,
        reference: p.chequeNo ? `Pay Chq ${p.chequeNo}` : 'Payment',
        narration: p.narration || 'Bank payment',
        debit: 0,
        credit: toNum(p.amount),
        type: 'Payment',
      });
    });
    list.sort((a, b) => a.date.localeCompare(b.date));
    let balance = 0;
    list.forEach((e) => {
      balance += toNum(e.debit) - toNum(e.credit);
      e.balance = balance;
    });
    return list;
  }, [bankId, filters.dateFrom, filters.dateTo, bankPayments, bankReceipts]);

  const exportRows = useMemo(
    () =>
      entries.map((e) => ({
        Date: e.date,
        Reference: e.reference,
        Narration: e.narration,
        Debit: e.debit,
        Credit: e.credit,
        Balance: e.balance,
      })),
    [entries],
  );

  return (
    <Box>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Bank Book
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Bank-wise receipts and payments with running balance.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2 }>
          <TextField
            size="small"
            select
            label="Bank"
            value={bankId}
            onChange={(e) => setBankId(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="all">All Banks</MenuItem>
            {banks.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.bankName || b.accountName} - {b.accountNumber}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <ReportFilterPanel filters={filters} onFiltersChange={setFilters} showDateRange compact />
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack direction="row" justifyContent="flex-end" sx={{ p: 1.5 }}>
          <ReportExportButton
            headers={['Date', 'Reference', 'Narration', 'Debit', 'Credit', 'Balance']}
            headerKeys={['date', 'reference', 'narration', 'debit', 'credit', 'balance']}
            rows={exportRows}
            filename="bank-book.csv"
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
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#64748b' }}>
                    No bank transactions in the selected period.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((e, i) => (
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

export default BankBookPage;
