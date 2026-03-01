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

function PurchaseDetailDialog({
  open,
  onClose,
  purchase,
  supplierName,
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

  if (!purchase) {
    return null;
  }

  return (
    <>
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Purchase Bill Details</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <DetailField label="Bill Number" value={purchase.billNumber} />
            <DetailField label="Supplier" value={supplierName || purchase.supplierId} />
            <DetailField label="Bill Date" value={purchase.billDate} />
            <DetailField label="Warehouse" value={warehouseName || purchase.warehouseId} />
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <DetailField label="Purchase Type" value={purchase.purchaseType || '-'} />
            <DetailField label="Status" value={<Chip size="small" label={purchase.status} />} />
            <DetailField label="Remarks" value={purchase.remarks || '-'} />
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
                    GST %
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Amount
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {purchase.items.map((item, index) => (
                  <TableRow key={`${item.variantId}-${index}`}>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell>{`${item.size} / ${item.color}`}</TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">{item.rate}</TableCell>
                    <TableCell align="right">{item.discount}</TableCell>
                    <TableCell align="right">{item.tax}</TableCell>
                    <TableCell align="right">{item.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider />

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="flex-end">
            <SummaryField label="Gross" value={purchase.totals.grossAmount} />
            <SummaryField label="Discount" value={purchase.totals.totalDiscount} />
            <SummaryField label="Tax" value={purchase.totals.totalTax} />
            <SummaryField label="Other" value={purchase.totals.otherCharges} />
            <SummaryField label="Net" value={purchase.totals.netAmount} strong />
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
      billType="purchase"
      bill={purchase}
      supplierName={supplierName}
    />
  </>
  );
}

function DetailField({ label, value }) {
  return (
    <Box sx={{ minWidth: 180 }}>
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  );
}

function SummaryField({ label, value, strong }) {
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
      <Typography
        variant="body2"
        sx={{ color: '#0f172a', fontWeight: strong ? 800 : 700 }}
      >
        {Number(value || 0).toFixed(2)}
      </Typography>
    </Box>
  );
}

export default PurchaseDetailDialog;
