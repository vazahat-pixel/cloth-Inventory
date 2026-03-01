import { useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

function getPurchaseEntries(bill, supplierName) {
  if (!bill?.totals) return [];
  const t = bill.totals;
  const netAmount = Number(t.netAmount || 0);
  const totalTax = Number(t.totalTax || 0);
  const purchases = netAmount - totalTax;
  const narration = `Purchase Bill ${bill.billNumber || ''}`.trim();
  const supplier = supplierName || bill.supplierId || 'Supplier';

  return [
    { date: bill.billDate, narration, account: 'Purchases', debit: purchases, credit: 0 },
    { date: bill.billDate, narration, account: 'Input GST', debit: totalTax, credit: 0 },
    { date: bill.billDate, narration, account: supplier, debit: 0, credit: netAmount },
  ];
}

function getSaleEntries(bill, customerName) {
  if (!bill?.totals) return [];
  const t = bill.totals;
  const netPayable = Number(t.netPayable || 0);
  const taxAmount = Number(t.taxAmount || 0);
  const sales = netPayable - taxAmount;
  const narration = `Sales Invoice ${bill.invoiceNumber || ''}`.trim();
  const customer = customerName || bill.customerName || 'Customer';

  return [
    { date: bill.date, narration, account: customer, debit: netPayable, credit: 0 },
    { date: bill.date, narration, account: 'Sales', debit: 0, credit: sales },
    { date: bill.date, narration, account: 'Output GST', debit: 0, credit: taxAmount },
  ];
}

function AccountEntryDialog({ open, onClose, billType, bill, supplierName, customerName }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2' && open) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const entries = useMemo(() => {
    if (!bill) return [];
    if (billType === 'purchase') return getPurchaseEntries(bill, supplierName);
    if (billType === 'sale') return getSaleEntries(bill, customerName);
    return [];
  }, [bill, billType, supplierName, customerName]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Account Entries (Ledger)</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
          Press F2 to close
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Narration</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Account</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Debit
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Credit
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.narration}</TableCell>
                  <TableCell>{row.account}</TableCell>
                  <TableCell align="right">
                    {row.debit > 0 ? Number(row.debit).toFixed(2) : '-'}
                  </TableCell>
                  <TableCell align="right">
                    {row.credit > 0 ? Number(row.credit).toFixed(2) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default AccountEntryDialog;
