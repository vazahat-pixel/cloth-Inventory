import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  ButtonGroup,
  Button,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ReportFilterPanel from './ReportFilterPanel';
import ReportExportButton from './ReportExportButton';
import { SummaryChip } from './SalesReportPage';
import { fetchPurchases } from '../purchase/purchaseSlice';

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function PurchaseReportPage() {
  const dispatch = useDispatch();
  const purchases = useSelector((state) => state.purchase?.records || []);
  const suppliers = useSelector((state) => state.masters?.suppliers || []);

  useEffect(() => {
    dispatch(fetchPurchases());
  }, [dispatch]);

  const supplierMap = useMemo(
    () => suppliers.reduce((acc, s) => ({ ...acc, [s.id]: s.supplierName }), {}),
    [suppliers],
  );

  const [filters, setFilters] = useState({});
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState('summary'); // 'summary' | 'detail' | 'sizeWise'
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return purchases.filter((p) => {
      const matchesDateFrom = !filters.dateFrom || p.billDate >= filters.dateFrom;
      const matchesDateTo = !filters.dateTo || p.billDate <= filters.dateTo;
      const matchesWarehouse =
        !filters.warehouseId || filters.warehouseId === 'all' || p.warehouseId === filters.warehouseId;
      const matchesSupplier =
        !filters.supplierId || filters.supplierId === 'all' || p.supplierId === filters.supplierId;
      const matchesSearch =
        !query ||
        (p.billNumber || '').toLowerCase().includes(query) ||
        ((supplierMap[p.supplierId] || '').toLowerCase().includes(query));
      return matchesDateFrom && matchesDateTo && matchesWarehouse && matchesSupplier && matchesSearch;
    });
  }, [purchases, filters, searchText, supplierMap]);

  const paginatedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage],
  );

  const summary = useMemo(() => {
    let totalQty = 0;
    let totalCost = 0;
    let totalTax = 0;
    let totalNet = 0;
    filteredRows.forEach((p) => {
      const t = p.totals || {};
      totalQty += toNum(t.totalQuantity);
      totalCost += toNum(t.grossAmount) - toNum(t.totalDiscount);
      totalTax += toNum(t.totalTax);
      totalNet += toNum(t.netAmount);
    });
    return {
      totalBills: filteredRows.length,
      totalQuantity: totalQty,
      totalCost,
      totalTax,
      totalNet,
    };
  }, [filteredRows]);

  const detailRows = useMemo(() => {
    const out = [];
    filteredRows.forEach((p) => {
      (p.items || []).forEach((line) => {
        out.push({
          billDate: p.billDate,
          billNumber: p.billNumber,
          supplierName: supplierMap[p.supplierId] || p.supplierId,
          itemName: line.itemName,
          size: line.size,
          color: line.color,
          sku: line.sku,
          lot: line.lotNumber || '-',
          quantity: toNum(line.quantity),
          rate: toNum(line.rate),
          discount: toNum(line.discount),
          tax: toNum(line.tax),
          amount: toNum(line.amount),
        });
      });
    });
    out.sort((a, b) => a.billDate.localeCompare(b.billDate) || (a.billNumber || '').localeCompare(b.billNumber || ''));
    return out;
  }, [filteredRows, supplierMap]);

  const paginatedDetailRows = useMemo(
    () => detailRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [detailRows, page, rowsPerPage],
  );

  const sizeWiseRows = useMemo(() => {
    const bySize = {};
    detailRows.forEach((r) => {
      const size = r.size || 'N/A';
      if (!bySize[size]) bySize[size] = { size, quantity: 0, amount: 0 };
      bySize[size].quantity += r.quantity;
      bySize[size].amount += r.amount;
    });
    return Object.values(bySize).sort((a, b) => b.quantity - a.quantity);
  }, [detailRows]);

  const paginatedSizeWise = useMemo(
    () => sizeWiseRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sizeWiseRows, page, rowsPerPage],
  );

  const exportSummaryRows = useMemo(
    () =>
      filteredRows.map((row) => {
        const t = row.totals || {};
        return {
          'Bill Number': row.billNumber,
          Date: row.billDate,
          Supplier: supplierMap[row.supplierId] || row.supplierId,
          Items: row.items?.length || 0,
          Quantity: toNum(t.totalQuantity),
          'Total Cost': (toNum(row.totals?.grossAmount) - toNum(row.totals?.totalDiscount)).toFixed(2),
          Tax: toNum(t.totalTax).toFixed(2),
          'Net Amount': toNum(t.netAmount).toFixed(2),
        };
      }),
    [filteredRows, supplierMap],
  );

  const exportDetailRows = useMemo(
    () =>
      detailRows.map((r) => ({
        Date: r.billDate,
        'Bill Number': r.billNumber,
        Supplier: r.supplierName,
        Item: r.itemName,
        Size: r.size,
        Color: r.color,
        SKU: r.sku,
        Lot: r.lot,
        Qty: r.quantity,
        Rate: r.rate,
        Discount: r.discount,
        Tax: r.tax,
        Amount: r.amount,
      })),
    [detailRows],
  );

  return (
    <Box>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Purchase Report
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Purchase bills, costs, and supplier transactions.
          </Typography>
        </Box>

        <ReportFilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          showDateRange
          showWarehouse
          showSupplier
        />

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            value={searchText}
            onChange={(e) => {
              setPage(0);
              setSearchText(e.target.value);
            }}
            placeholder="Search by bill no or supplier"
            sx={{ maxWidth: 320 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <ButtonGroup size="small" sx={{ ml: 1 }}>
            <Button variant={viewMode === 'summary' ? 'contained' : 'outlined'} onClick={() => { setViewMode('summary'); setPage(0); }}>
              Summary
            </Button>
            <Button variant={viewMode === 'detail' ? 'contained' : 'outlined'} onClick={() => { setViewMode('detail'); setPage(0); }}>
              Detail
            </Button>
            <Button variant={viewMode === 'sizeWise' ? 'contained' : 'outlined'} onClick={() => { setViewMode('sizeWise'); setPage(0); }}>
              By Size
            </Button>
          </ButtonGroup>
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', mb: 1 }}>
          Summary
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          <SummaryChip label="Total Bills" value={summary.totalBills} />
          <SummaryChip label="Total Quantity" value={summary.totalQuantity} />
          <SummaryChip label="Total Cost" value={`₹${summary.totalCost.toFixed(2)}`} />
          <SummaryChip label="Tax" value={`₹${summary.totalTax.toFixed(2)}`} />
          <SummaryChip label="Net Amount" value={`₹${summary.totalNet.toFixed(2)}`} strong />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack direction="row" justifyContent="flex-end" sx={{ p: 1.5 }}>
          {viewMode === 'sizeWise' ? (
            <ReportExportButton
              headers={['Size', 'Quantity', 'Amount']}
              headerKeys={['size', 'quantity', 'amount']}
              rows={sizeWiseRows.map((r) => ({ size: r.size, quantity: r.quantity, amount: r.amount.toFixed(2) }))}
              filename="purchase-size-wise.csv"
            />
          ) : viewMode === 'summary' ? (
            <ReportExportButton
              headers={['Bill Number', 'Date', 'Supplier', 'Items', 'Quantity', 'Total Cost', 'Tax', 'Net Amount']}
              headerKeys={['Bill Number', 'Date', 'Supplier', 'Items', 'Quantity', 'Total Cost', 'Tax', 'Net Amount']}
              rows={exportSummaryRows}
              filename="purchase-register-summary.csv"
            />
          ) : (
            <ReportExportButton
              headers={['Date', 'Bill Number', 'Supplier', 'Item', 'Size', 'Color', 'SKU', 'Lot', 'Qty', 'Rate', 'Discount', 'Tax', 'Amount']}
              headerKeys={['Date', 'Bill Number', 'Supplier', 'Item', 'Size', 'Color', 'SKU', 'Lot', 'Qty', 'Rate', 'Discount', 'Tax', 'Amount']}
              rows={exportDetailRows}
              filename="purchase-register-detail.csv"
            />
          )}
        </Stack>
        <TableContainer>
          <Table size="small">
            {viewMode === 'sizeWise' ? (
              <>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedSizeWise.map((row) => (
                    <TableRow key={row.size} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.size}</TableCell>
                      <TableCell align="right">{row.quantity}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>₹{row.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </>
            ) : viewMode === 'summary' ? (
              <>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Bill Number</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Supplier</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Total Cost</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Tax</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Net Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRows.map((row) => {
                    const t = row.totals || {};
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{row.billNumber}</TableCell>
                        <TableCell>{row.billDate}</TableCell>
                        <TableCell>{supplierMap[row.supplierId] || row.supplierId}</TableCell>
                        <TableCell>{row.items?.length || 0}</TableCell>
                        <TableCell align="right">{toNum(t.totalQuantity)}</TableCell>
                        <TableCell align="right">₹{(toNum(t.grossAmount) - toNum(t.totalDiscount)).toFixed(2)}</TableCell>
                        <TableCell align="right">₹{toNum(t.totalTax).toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>₹{toNum(t.netAmount).toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </>
            ) : (
              <>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Bill Number</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Supplier</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Size/Color</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Lot</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Rate</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Tax</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedDetailRows.map((row, i) => (
                    <TableRow key={`${row.billNumber}-${row.sku}-${i}`} hover>
                      <TableCell>{row.billDate}</TableCell>
                      <TableCell>{row.billNumber}</TableCell>
                      <TableCell>{row.supplierName}</TableCell>
                      <TableCell>{row.itemName}</TableCell>
                      <TableCell>{row.size} / {row.color}</TableCell>
                      <TableCell>{row.sku}</TableCell>
                      <TableCell>{row.lot}</TableCell>
                      <TableCell align="right">{row.quantity}</TableCell>
                      <TableCell align="right">₹{row.rate.toFixed(2)}</TableCell>
                      <TableCell align="right">{row.tax}%</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>₹{row.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </>
            )}
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={viewMode === 'summary' ? filteredRows.length : viewMode === 'sizeWise' ? sizeWiseRows.length : detailRows.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Paper>
    </Box>
  );
}

export default PurchaseReportPage;
