import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  ButtonGroup,
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

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function SalesReportPage() {
  const sales = useSelector((state) => state.sales?.records || []);
  const salesReturns = useSelector((state) => state.sales?.returns || []);
  const warehouses = useSelector((state) => state.inventory?.warehouses || []);
  const itemGroups = useSelector((state) => state.masters?.itemGroups || []);
  const items = useSelector((state) => state.items?.records || []);
  const warehouseMap = useMemo(
    () => warehouses.reduce((acc, w) => ({ ...acc, [w.id]: w.name }), {}),
    [warehouses],
  );

  const itemGroupMap = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      const groupName = item.category || 'Ungrouped';
      item.variants?.forEach((v) => {
        map[v.id] = groupName;
      });
    });
    return map;
  }, [items]);

  const [filters, setFilters] = useState({});
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState('summary'); // 'summary' | 'detail' | 'accountWise' | 'sizeWise' | 'groupWise'
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return sales.filter((sale) => {
      const matchesDateFrom = !filters.dateFrom || sale.date >= filters.dateFrom;
      const matchesDateTo = !filters.dateTo || sale.date <= filters.dateTo;
      const matchesWarehouse =
        !filters.warehouseId || filters.warehouseId === 'all' || sale.warehouseId === filters.warehouseId;
      const matchesCustomer =
        !filters.customerId || filters.customerId === 'all' || sale.customerId === filters.customerId;
      const matchesPayment =
        !filters.paymentStatus || filters.paymentStatus === 'all'
          ? true
          : (sale.payment?.status || '') === filters.paymentStatus;
      const matchesSalesman =
        !filters.salesmanId || filters.salesmanId === 'all' || sale.salesmanId === filters.salesmanId;
      const selectedGroupName = itemGroups.find((g) => g.id === filters.categoryId)?.groupName;
      const matchesCategory =
        !filters.categoryId || filters.categoryId === 'all' || !selectedGroupName
          ? true
          : (sale.items || []).some((line) => itemGroupMap[line.variantId] === selectedGroupName);
      const matchesSearch =
        !query ||
        (sale.invoiceNumber || '').toLowerCase().includes(query) ||
        (sale.customerName || '').toLowerCase().includes(query);
      return (
        matchesDateFrom &&
        matchesDateTo &&
        matchesWarehouse &&
        matchesCustomer &&
        matchesPayment &&
        matchesSalesman &&
        matchesCategory &&
        matchesSearch
      );
    });
  }, [sales, filters, searchText, itemGroups, itemGroupMap]);

  const paginatedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage],
  );

  const summary = useMemo(() => {
    let totalQuantity = 0;
    let totalGross = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalNet = 0;
    filteredRows.forEach((s) => {
      const t = s.totals || {};
      totalQuantity += toNum(t.totalQuantity);
      totalGross += toNum(t.grossAmount);
      totalDiscount += toNum(t.lineDiscount) + toNum(t.billDiscount);
      totalTax += toNum(t.taxAmount);
      totalNet += toNum(t.netPayable);
    });
    return {
      totalInvoices: filteredRows.length,
      totalQuantity,
      totalGross,
      totalDiscount,
      totalTax,
      totalNet,
    };
  }, [filteredRows]);

  const detailRows = useMemo(() => {
    const from = filters.dateFrom || '';
    const to = filters.dateTo || '';
    const inRange = (d) => (!d ? false : (!from || d >= from) && (!to || d <= to));
    const out = [];
    filteredRows.forEach((sale) => {
      (sale.items || []).forEach((line) => {
        out.push({
          date: sale.date,
          invoiceNumber: sale.invoiceNumber,
          customerName: sale.customerName || 'Walk-in',
          itemName: line.itemName,
          size: line.size,
          color: line.color,
          sku: line.sku,
          lot: line.lotNumber || '-',
          quantity: toNum(line.quantity),
          rate: toNum(line.rate),
          discount: toNum(line.discount),
          amount: toNum(line.amount),
          isReturn: false,
        });
      });
    });
    (salesReturns || []).forEach((ret) => {
      const retDate = ret.date || ret.returnDate;
      if (!inRange(retDate) || !ret.items) return;
      const sale = sales.find((s) => s.id === ret.saleId);
      const inv = sale?.invoiceNumber || ret.saleId;
      const cust = sale?.customerName || 'Walk-in';
      ret.items.forEach((line) => {
        const qty = toNum(line.returnQty);
        if (qty <= 0) return;
        out.push({
          date: retDate,
          invoiceNumber: inv,
          customerName: cust,
          itemName: line.itemName,
          size: line.size,
          color: line.color,
          sku: line.sku,
          lot: line.lotNumber || '-',
          quantity: -qty,
          rate: toNum(line.rate),
          discount: toNum(line.discount),
          amount: -(toNum(line.amount) * (qty / (toNum(line.quantity) || 1))),
          isReturn: true,
        });
      });
    });
    out.sort((a, b) => a.date.localeCompare(b.date) || (a.invoiceNumber || '').localeCompare(b.invoiceNumber || ''));
    return out;
  }, [filteredRows, salesReturns, sales, filters.dateFrom, filters.dateTo]);

  const paginatedDetailRows = useMemo(
    () => detailRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [detailRows, page, rowsPerPage],
  );

  const accountWiseRows = useMemo(() => {
    const byMode = {};
    filteredRows.forEach((sale) => {
      const mode = sale.payment?.mode || 'Other';
      if (sale.payment?.mode === 'Split' && sale.payment?.splitValues) {
        const sv = sale.payment.splitValues;
        ['Cash', 'Card', 'UPI'].forEach((m) => {
          const amt = toNum(sv[m.toLowerCase()]);
          if (amt > 0) {
            byMode[m] = (byMode[m] || 0) + amt;
            byMode[`${m}_count`] = (byMode[`${m}_count`] || 0) + 1;
          }
        });
      } else {
        const net = toNum(sale.totals?.netPayable);
        byMode[mode] = (byMode[mode] || 0) + net;
        byMode[`${mode}_count`] = (byMode[`${mode}_count`] || 0) + 1;
      }
    });
    const modes = ['Cash', 'Card', 'UPI', 'Gift Voucher', 'Split', 'Other'];
    return modes
      .filter((m) => byMode[m] > 0 || byMode[`${m}_count`] > 0)
      .map((m) => ({ mode: m, amount: byMode[m] || 0, count: byMode[`${m}_count`] || 0 }));
  }, [filteredRows]);

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

  const groupWiseRows = useMemo(() => {
    const byGroup = {};
    filteredRows.forEach((sale) => {
      (sale.items || []).forEach((line) => {
        const group = itemGroupMap[line.variantId] || 'Ungrouped';
        if (!byGroup[group]) byGroup[group] = { group, quantity: 0, amount: 0 };
        byGroup[group].quantity += toNum(line.quantity);
        byGroup[group].amount += toNum(line.amount);
      });
    });
    return Object.values(byGroup).sort((a, b) => b.amount - a.amount);
  }, [filteredRows, itemGroupMap]);

  const paginatedAccountWise = useMemo(() => accountWiseRows, [accountWiseRows]);
  const paginatedSizeWise = useMemo(
    () => sizeWiseRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sizeWiseRows, page, rowsPerPage],
  );
  const paginatedGroupWise = useMemo(
    () => groupWiseRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [groupWiseRows, page, rowsPerPage],
  );

  const exportSummaryRows = useMemo(
    () =>
      filteredRows.map((row) => {
        const t = row.totals || {};
        return {
          Invoice: row.invoiceNumber,
          Date: row.date,
          Customer: row.customerName || 'Walk-in',
          Items: row.items?.length || 0,
          Qty: toNum(t.totalQuantity),
          Gross: toNum(t.grossAmount),
          Discount: (toNum(t.lineDiscount) + toNum(t.billDiscount)).toFixed(2),
          Tax: toNum(t.taxAmount),
          Net: toNum(t.netPayable),
          Payment: row.payment?.mode || '-',
        };
      }),
    [filteredRows],
  );

  const exportDetailRows = useMemo(
    () =>
      detailRows.map((r) => ({
        Date: r.date,
        Invoice: r.invoiceNumber,
        Customer: r.customerName,
        Item: r.itemName,
        Size: r.size,
        Color: r.color,
        SKU: r.sku,
        Lot: r.lot,
        Qty: r.quantity,
        Rate: r.rate,
        Discount: r.discount,
        Amount: r.amount,
        'Return': r.isReturn ? 'Yes' : '',
      })),
    [detailRows],
  );

  return (
    <Box>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Sales Report
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Sales invoices, revenue, and payment summary.
          </Typography>
        </Box>

        <ReportFilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          showDateRange
          showWarehouse
          showCustomer
          showSalesman
          showPaymentStatus
          showCategory
        />

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            value={searchText}
            onChange={(e) => {
              setPage(0);
              setSearchText(e.target.value);
            }}
            placeholder="Search by invoice or customer"
            sx={{ maxWidth: 320 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <ButtonGroup size="small" sx={{ ml: 1 }} variant="outlined">
            <Button variant={viewMode === 'summary' ? 'contained' : 'outlined'} onClick={() => { setViewMode('summary'); setPage(0); }}>
              Summary
            </Button>
            <Button variant={viewMode === 'detail' ? 'contained' : 'outlined'} onClick={() => { setViewMode('detail'); setPage(0); }}>
              Detail
            </Button>
            <Button variant={viewMode === 'accountWise' ? 'contained' : 'outlined'} onClick={() => { setViewMode('accountWise'); setPage(0); }}>
              By Payment
            </Button>
            <Button variant={viewMode === 'sizeWise' ? 'contained' : 'outlined'} onClick={() => { setViewMode('sizeWise'); setPage(0); }}>
              By Size
            </Button>
            <Button variant={viewMode === 'groupWise' ? 'contained' : 'outlined'} onClick={() => { setViewMode('groupWise'); setPage(0); }}>
              By Group
            </Button>
          </ButtonGroup>
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', mb: 1 }}>
          Summary
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          <SummaryChip label="Total Invoices" value={summary.totalInvoices} />
          <SummaryChip label="Total Quantity" value={summary.totalQuantity} />
          <SummaryChip label="Gross Amount" value={`₹${summary.totalGross.toFixed(2)}`} />
          <SummaryChip label="Discount" value={`₹${summary.totalDiscount.toFixed(2)}`} />
          <SummaryChip label="Tax" value={`₹${summary.totalTax.toFixed(2)}`} />
          <SummaryChip label="Net Amount" value={`₹${summary.totalNet.toFixed(2)}`} strong />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ p: 1.5 }}>
          {viewMode === 'accountWise' ? (
            <ReportExportButton
              headers={['Payment Mode', 'Invoices', 'Amount']}
              headerKeys={['mode', 'count', 'amount']}
              rows={accountWiseRows.map((r) => ({ mode: r.mode, count: r.count, amount: r.amount.toFixed(2) }))}
              filename="account-wise-sale.csv"
            />
          ) : viewMode === 'sizeWise' ? (
            <ReportExportButton
              headers={['Size', 'Quantity', 'Amount']}
              headerKeys={['size', 'quantity', 'amount']}
              rows={sizeWiseRows.map((r) => ({ size: r.size, quantity: r.quantity, amount: r.amount.toFixed(2) }))}
              filename="size-wise-sale.csv"
            />
          ) : viewMode === 'groupWise' ? (
            <ReportExportButton
              headers={['Item Group', 'Quantity', 'Amount']}
              headerKeys={['group', 'quantity', 'amount']}
              rows={groupWiseRows.map((r) => ({ group: r.group, quantity: r.quantity, amount: r.amount.toFixed(2) }))}
              filename="group-wise-sale.csv"
            />
          ) : viewMode === 'summary' ? (
            <ReportExportButton
              headers={['Invoice', 'Date', 'Customer', 'Items', 'Qty', 'Gross', 'Discount', 'Tax', 'Net', 'Payment']}
              headerKeys={['Invoice', 'Date', 'Customer', 'Items', 'Qty', 'Gross', 'Discount', 'Tax', 'Net', 'Payment']}
              rows={exportSummaryRows}
              filename="sale-register-summary.csv"
            />
          ) : (
            <ReportExportButton
              headers={['Date', 'Invoice', 'Customer', 'Item', 'Size', 'Color', 'SKU', 'Lot', 'Qty', 'Rate', 'Discount', 'Amount', 'Return']}
              headerKeys={['Date', 'Invoice', 'Customer', 'Item', 'Size', 'Color', 'SKU', 'Lot', 'Qty', 'Rate', 'Discount', 'Amount', 'Return']}
              rows={exportDetailRows}
              filename="sale-register-detail.csv"
            />
          )}
        </Stack>
        <TableContainer>
          <Table size="small">
            {viewMode === 'accountWise' ? (
              <>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Payment Mode</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Invoices</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedAccountWise.map((row) => (
                    <TableRow key={row.mode} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.mode}</TableCell>
                      <TableCell align="right">{row.count}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>₹{row.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </>
            ) : viewMode === 'sizeWise' ? (
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
            ) : viewMode === 'groupWise' ? (
              <>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Item Group</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedGroupWise.map((row) => (
                    <TableRow key={row.group} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.group}</TableCell>
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
                    <TableCell sx={{ fontWeight: 700 }}>Invoice</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Gross</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Discount</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Tax</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Net</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRows.map((row) => {
                    const t = row.totals || {};
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{row.invoiceNumber}</TableCell>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.customerName || 'Walk-in'}</TableCell>
                        <TableCell>{row.items?.length || 0}</TableCell>
                        <TableCell align="right">{toNum(t.totalQuantity)}</TableCell>
                        <TableCell align="right">₹{toNum(t.grossAmount).toFixed(2)}</TableCell>
                        <TableCell align="right">₹{(toNum(t.lineDiscount) + toNum(t.billDiscount)).toFixed(2)}</TableCell>
                        <TableCell align="right">₹{toNum(t.taxAmount).toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>₹{toNum(t.netPayable).toFixed(2)}</TableCell>
                        <TableCell>{row.payment?.mode || '-'}</TableCell>
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
                    <TableCell sx={{ fontWeight: 700 }}>Invoice</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Size/Color</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Lot</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Rate</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Discount</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedDetailRows.map((row, i) => (
                    <TableRow
                      key={`${row.invoiceNumber}-${row.sku}-${i}`}
                      hover
                      sx={{ bgcolor: row.isReturn ? 'rgba(254, 226, 226, 0.5)' : undefined }}
                    >
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.invoiceNumber}</TableCell>
                      <TableCell>{row.customerName}</TableCell>
                      <TableCell>{row.itemName}</TableCell>
                      <TableCell>{row.size} / {row.color}</TableCell>
                      <TableCell>{row.sku}</TableCell>
                      <TableCell>{row.lot}</TableCell>
                      <TableCell align="right" sx={{ color: row.isReturn ? '#b91c1c' : undefined }}>{row.quantity}</TableCell>
                      <TableCell align="right">₹{row.rate.toFixed(2)}</TableCell>
                      <TableCell align="right">{row.discount}%</TableCell>
                      <TableCell align="right" sx={{ color: row.isReturn ? '#b91c1c' : undefined, fontWeight: 600 }}>
                        ₹{row.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </>
            )}
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={
            viewMode === 'summary' ? filteredRows.length
            : viewMode === 'detail' ? detailRows.length
            : viewMode === 'accountWise' ? accountWiseRows.length
            : viewMode === 'sizeWise' ? sizeWiseRows.length
            : viewMode === 'groupWise' ? groupWiseRows.length : 0
          }
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

function SummaryChip({ label, value, strong }) {
  return (
    <Box
      sx={{
        border: '1px solid #e2e8f0',
        borderRadius: 1.5,
        px: 2,
        py: 1,
        minWidth: 120,
      }}
    >
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: '#0f172a', fontWeight: strong ? 800 : 700 }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default SalesReportPage;
export { SummaryChip };
