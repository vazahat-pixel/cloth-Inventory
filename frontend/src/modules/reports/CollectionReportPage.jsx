import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ReportFilterPanel from './ReportFilterPanel';
import ReportExportButton from './ReportExportButton';
import { SummaryChip } from './SalesReportPage';

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function CollectionReportPage() {
  const sales = useSelector((state) => state.sales?.records || []);
  const bankReceipts = useSelector((state) => state.accounts?.bankReceipts || []);
  const customers = useSelector((state) => state.masters?.customers || []);

  const [filters, setFilters] = useState({});

  const customerMap = useMemo(
    () => (customers || []).reduce((acc, c) => ({ ...acc, [c.id]: c.customerName }), {}),
    [customers],
  );

  const rows = useMemo(() => {
    const from = filters.dateFrom || '';
    const to = filters.dateTo || '';
    const inRange = (d) => (!from || d >= from) && (!to || d <= to);

    const list = [];
    sales.forEach((s) => {
      if (!inRange(s.date)) return;
      const paid = toNum(s.payment?.amountPaid);
      if (paid <= 0) return;
      list.push({
        date: s.date,
        source: s.invoiceNumber,
        sourceType: 'Invoice',
        customerId: s.customerId,
        customerName: s.customerName || customerMap[s.customerId] || 'Walk-in',
        amount: paid,
        mode: s.payment?.mode || 'Cash',
      });
    });
    bankReceipts.forEach((r) => {
      if (!inRange(r.date)) return;
      const amt = toNum(r.amount);
      if (amt <= 0) return;
      list.push({
        date: r.date,
        source: r.chequeNo ? `Chq ${r.chequeNo}` : `Receipt`,
        sourceType: 'Bank Receipt',
        customerId: r.customerId,
        customerName: customerMap[r.customerId] || '-',
        amount: amt,
        mode: 'Cheque',
      });
    });
    list.sort((a, b) => a.date.localeCompare(b.date));
    return list;
  }, [filters.dateFrom, filters.dateTo, sales, bankReceipts, customerMap]);

  const summary = useMemo(() => {
    const byMode = {};
    let total = 0;
    rows.forEach((r) => {
      total += r.amount;
      byMode[r.mode] = (byMode[r.mode] || 0) + r.amount;
    });
    return { total, byMode };
  }, [rows]);

  const exportRows = useMemo(
    () =>
      rows.map((r) => ({
        Date: r.date,
        Source: r.source,
        'Source Type': r.sourceType,
        Customer: r.customerName,
        Amount: r.amount,
        Mode: r.mode,
      })),
    [rows],
  );

  return (
    <Box>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Collection Report
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Cash and cheque collections from sales and bank receipts.
          </Typography>
        </Box>

        <ReportFilterPanel filters={filters} onFiltersChange={setFilters} showDateRange compact />
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', mb: 1 }}>
          Summary
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          <SummaryChip label="Total Collections" value={`₹${summary.total.toFixed(2)}`} strong />
          {Object.entries(summary.byMode).map(([mode, amt]) => (
            <SummaryChip key={mode} label={mode} value={`₹${amt.toFixed(2)}`} />
          ))}
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack direction="row" justifyContent="flex-end" sx={{ p: 1.5 }}>
          <ReportExportButton
            headers={['Date', 'Source', 'Source Type', 'Customer', 'Amount', 'Mode']}
            headerKeys={['date', 'source', 'sourceType', 'customerName', 'amount', 'mode']}
            rows={exportRows}
            filename="collection-report.csv"
          />
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mode</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#64748b' }}>
                    No collections in the selected period.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, i) => (
                  <TableRow key={`${r.date}-${r.source}-${i}`} hover>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{r.source}</TableCell>
                    <TableCell>{r.sourceType}</TableCell>
                    <TableCell>{r.customerName}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>₹{toNum(r.amount).toFixed(2)}</TableCell>
                    <TableCell>{r.mode}</TableCell>
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

export default CollectionReportPage;
