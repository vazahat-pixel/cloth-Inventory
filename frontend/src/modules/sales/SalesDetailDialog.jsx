import { useEffect, useState } from 'react';
import {
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import AccountEntryDialog from '../shared/AccountEntryDialog';

function SalesDetailDialog({
  open,
  onClose,
  sale,
  customerName,
  customerMobile,
  warehouseName,
}) {
  const [accountEntryOpen, setAccountEntryOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2' && open) {
        e.preventDefault();
        setAccountEntryOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!sale) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle>Sales Invoice Details</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <DetailField label="Invoice Number" value={sale.invoiceNumber} />
              <DetailField label="Date" value={sale.date} />
              <DetailField label="Warehouse" value={warehouseName || sale.warehouseId} />
              <DetailField label="Status" value={<Chip size="small" label={sale.status} />} />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <DetailField label="Customer" value={customerName || sale.customerName} />
              <DetailField label="Mobile" value={customerMobile || sale.customerMobile || '-'} />
              <DetailField label="Salesman" value={sale.salesmanName || '-'} />
              <DetailField label="Payment Status" value={sale.payment?.status || 'Pending'} />
            </Stack>

            <Divider />

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Variant</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Qty
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Rate
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Discount %
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Amount
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(sale.items || []).map((item, index) => (
                    <TableRow key={`${item.variantId || index}-${index}`}>
                      <TableCell>{item.itemName || item.name || '-'}</TableCell>
                      <TableCell>{`${item.size || '-'} / ${item.color || '-'}`}</TableCell>
                      <TableCell>{item.sku || '-'}</TableCell>
                      <TableCell align="right">{Number(item.quantity || 0)}</TableCell>
                      <TableCell align="right">{Number(item.rate || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">{Number(item.discount || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">{Number(item.amount || item.total || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider />

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="flex-end">
              <SummaryField label="Gross" value={sale.totals.grossAmount} />
              <SummaryField label="Discount" value={sale.totals.lineDiscount + sale.totals.billDiscount} />
              <SummaryField label="Tax" value={sale.totals.taxAmount} />
              <SummaryField label="Loyalty" value={sale.totals.loyaltyRedeemed} />
              <SummaryField label="Net" value={sale.totals.netPayable} strong />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="flex-end">
              <SummaryField label="Paid" value={sale.payment?.amountPaid} />
              <SummaryField label="Due" value={sale.payment?.dueAmount} />
              <SummaryField label="Change" value={sale.payment?.changeReturned} />
              <SummaryField label="Mode" value={sale.payment?.mode || '-'} text />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setAccountEntryOpen(true)}>
            Ledger (F2)
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
      <AccountEntryDialog
        open={accountEntryOpen}
        onClose={() => setAccountEntryOpen(false)}
        billType="sale"
        bill={sale}
        customerName={customerName || sale.customerName}
      />
    </>
  );
}

function DetailField({ label, value }) {
  return (
    <Box sx={{ minWidth: 170 }}>
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  );
}

function SummaryField({ label, value, strong, text }) {
  return (
    <Box
      sx={{
        border: '1px solid #e2e8f0',
        borderRadius: 1.5,
        px: 1.5,
        py: 1,
        minWidth: 120,
        textAlign: 'right',
      }}
    >
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: strong ? 800 : 700 }}>
        {text ? value : Number(value || 0).toFixed(2)}
      </Typography>
    </Box>
  );
}

export default SalesDetailDialog;
