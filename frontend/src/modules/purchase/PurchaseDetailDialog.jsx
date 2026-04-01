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
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import LocalPrintshopOutlinedIcon from '@mui/icons-material/LocalPrintshopOutlined';
import { useDispatch } from 'react-redux';
import { postPurchase } from './purchaseSlice';
import AccountEntryDialog from '../shared/AccountEntryDialog';

// Helper to format ISO date to dd-MM-yyyy
const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return String(d); }
};

// Helper to extract name from populated object or string
const getName = (field, fallback = '—') => {
  if (!field) return fallback;
  if (typeof field === 'object') return field.name || field.supplierName || field.grnNumber || field.poNumber || field.orderNumber || fallback;
  // If it's a 24-char hex string (MongoId), it's not a name, return fallback to trigger prop usage
  if (typeof field === 'string' && /^[0-9a-fA-F]{24}$/.test(field)) return fallback;
  return String(field);
};

// Status chip color mapping
const statusColor = (status) => {
  const s = String(status || '').toUpperCase();
  if (['POSTED', 'APPROVED', 'RECEIVED', 'COMPLETED'].includes(s)) return 'success';
  if (s === 'DRAFT') return 'info';
  if (s === 'CANCELLED') return 'error';
  return 'default';
};

function PurchaseDetailDialog({ open, onClose, purchase, supplierName, warehouseName, onPrintBarcodes }) {
  const dispatch = useDispatch();
  const [accountEntryOpen, setAccountEntryOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2' && open) { e.preventDefault(); setAccountEntryOpen((prev) => !prev); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!purchase) return null;

  // Resolve names: prefer populated object, then fallback prop, then raw string ID
  const supplier = getName(purchase.supplierId) !== '—' ? getName(purchase.supplierId) : supplierName || '—';
  const warehouse = getName(purchase.storeId) !== '—' ? getName(purchase.storeId) : warehouseName || '—';
  const grnRef = getName(purchase.grnId);
  const poRef = getName(purchase.purchaseOrderId);

  // Totals: backend stores subTotal/totalTax/otherCharges/grandTotal at root level
  const subTotal  = Number(purchase.subTotal  || purchase.totals?.grossAmount || 0);
  const totalDisc = Number(purchase.totalDiscount || purchase.totals?.totalDiscount || 0);
  const totalTax  = Number(purchase.totalTax   || purchase.totals?.totalTax   || 0);
  const otherChrg = Number(purchase.otherCharges || purchase.totals?.otherCharges || 0);
  const grandTotal= Number(purchase.grandTotal || purchase.totals?.netAmount  || 0);

  const products = purchase.products || purchase.items || [];

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Purchase Bill Details
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {purchase.purchaseNumber} &nbsp;·&nbsp; {fmtDate(purchase.invoiceDate || purchase.createdAt)}
              </Typography>
            </Box>
            <Chip
              label={purchase.status || 'DRAFT'}
              color={statusColor(purchase.status)}
              variant="filled"
              size="small"
              sx={{ fontWeight: 700, fontSize: '0.75rem' }}
            />
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={3}>

            {/* Section 1: Header Info */}
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <DetailField label="Invoice No." value={purchase.invoiceNumber || '—'} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <DetailField label="Supplier / Vendor" value={supplier} highlight />
              </Grid>
              <Grid item xs={6} sm={3}>
                <DetailField label="Invoice Date" value={fmtDate(purchase.invoiceDate || purchase.billDate)} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <DetailField label="Receiving Warehouse" value={warehouse} />
              </Grid>

              <Grid item xs={6} sm={3}>
                <DetailField label="System PV No." value={purchase.purchaseNumber || '—'} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <DetailField label="Linked GRN" value={grnRef !== '—' ? grnRef : (purchase.grnId ? String(purchase.grnId).slice(-8) : '—')} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <DetailField
                  label="Linked PO"
                  value={poRef !== '—' ? poRef : (purchase.purchaseOrderId ? String(purchase.purchaseOrderId).slice(-8) + '…' : '—')}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <DetailField label="Notes / Remarks" value={purchase.notes || purchase.remarks || '—'} />
              </Grid>
            </Grid>

            <Divider />

            {/* Section 2: Item Lines Table */}
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Variant</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Rate (₹)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Disc%</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">GST%</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Amount (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 3, color: '#94a3b8' }}>
                        No items found
                      </TableCell>
                    </TableRow>
                  ) : products.map((item, idx) => {
                    const itemDoc = item.itemId && typeof item.itemId === 'object' ? item.itemId : {};
                    const variantEntry = itemDoc.sizes && item.variantId
                      ? (itemDoc.sizes.find(s => String(s._id || s.id) === String(item.variantId)) || {})
                      : {};

                    const itemName = item.itemName || itemDoc.itemName || itemDoc.name || '—';
                    const size = item.size || variantEntry.size || '—';
                    const color = item.color || itemDoc.shade || itemDoc.color || '—';
                    const sku = item.sku || variantEntry.sku || itemDoc.itemCode || '—';
                    const disc = Number(item.discountPercentage ?? item.discount ?? 0);
                    const tax = Number(item.taxPercentage ?? item.tax ?? item.gstPercent ?? 0);
                    const total = Number(item.total ?? item.amount ?? 0);

                    return (
                      <TableRow key={`${item.variantId || item._id || idx}-${idx}`} hover>
                        <TableCell sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>{idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{itemName}</TableCell>
                        <TableCell>
                          <Chip size="small" label={`${size} / ${color}`} variant="outlined" sx={{ fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', color: '#64748b' }}>{sku}</TableCell>
                        <TableCell align="right">{Number(item.quantity || item.qty || 0)}</TableCell>
                        <TableCell align="right">₹{Number(item.rate || item.price || 0).toFixed(2)}</TableCell>
                        <TableCell align="right">{disc}%</TableCell>
                        <TableCell align="right">{tax}%</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>₹{total.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider />

            {/* Section 3: Financial Summary */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="flex-end">
              <SummaryField label="Gross" value={subTotal} />
              <Box sx={{ display: 'flex', alignItems: 'center', color: '#cbd5e1', fontWeight: 700 }}>—</Box>
              <SummaryField label="Discount" value={totalDisc} color="#dc2626" />
              <Box sx={{ display: 'flex', alignItems: 'center', color: '#cbd5e1', fontWeight: 700 }}>+</Box>
              <SummaryField label="GST / Tax" value={totalTax} color="#2563eb" />
              <Box sx={{ display: 'flex', alignItems: 'center', color: '#cbd5e1', fontWeight: 700 }}>+</Box>
              <SummaryField label="Other Charges" value={otherChrg} />
              <Box sx={{ display: 'flex', alignItems: 'center', color: '#cbd5e1', fontWeight: 700 }}>=</Box>
              <SummaryField label="Net Payable" value={grandTotal} strong color="#166534" />
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
          {purchase.status === 'DRAFT' && (
            <Button 
              variant="contained" 
              color="success" 
              startIcon={<CheckCircleOutlinedIcon />}
              onClick={() => {
                if(window.confirm('Are you sure you want to post this voucher? This will finalize accounting ledgers.')) {
                  dispatch(postPurchase(purchase._id || purchase.id));
                  onClose();
                }
              }}
              sx={{ flex: 1, textTransform: 'none', fontWeight: 600 }}
            >
              Post to Accounts
            </Button>
          )}
          <Button variant="outlined" onClick={() => setAccountEntryOpen(true)} sx={{ flex: 1, textTransform: 'none', fontWeight: 600 }}>Ledger (F2)</Button>
          {(purchase.status === 'POSTED' || purchase.status === 'APPROVED') && (
            <Button 
                variant="contained" 
                color="secondary" 
                startIcon={<LocalPrintshopOutlinedIcon />}
                onClick={() => onPrintBarcodes && onPrintBarcodes(purchase)}
                sx={{ flex: 1, textTransform: 'none', fontWeight: 600 }}
            >
              Print Barcodes
            </Button>
          )}
          <Button variant="contained" onClick={onClose} sx={{ flex: 1, textTransform: 'none', fontWeight: 600 }}>Close</Button>
        </Stack>
      </DialogActions>
      </Dialog>

      <AccountEntryDialog
        open={accountEntryOpen}
        onClose={() => setAccountEntryOpen(false)}
        billType="purchase"
        bill={purchase}
        supplierName={supplier}
      />
    </>
  );
}

function DetailField({ label, value, highlight }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', mb: 0.25 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: highlight ? '#0f172a' : '#334155', fontWeight: highlight ? 700 : 600 }}
      >
        {value || '—'}
      </Typography>
    </Box>
  );
}

function SummaryField({ label, value, strong, color }) {
  return (
    <Box sx={{
      border: '1px solid #e2e8f0', borderRadius: 1.5,
      px: 1.5, py: 1, minWidth: 110, textAlign: 'right',
      bgcolor: strong ? '#f0fdf4' : 'transparent'
    }}>
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: color || '#0f172a', fontWeight: strong ? 900 : 700 }}>
        ₹{Number(value || 0).toFixed(2)}
      </Typography>
    </Box>
  );
}

export default PurchaseDetailDialog;
