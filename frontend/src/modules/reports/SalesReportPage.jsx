import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { fetchSales } from '../sales/salesSlice';
import { fetchItems } from '../items/itemsSlice';
import { fetchStockOverview } from '../inventory/inventorySlice';
import { fetchMasters } from '../masters/mastersSlice';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import useServerPagination from '../../hooks/useServerPagination';
import ServerTablePagination from '../../components/erp/ServerTablePagination';
import {
  buildVariantItemMap,
  buildClosingStockMap,
  enrichSaleDetailRow,
  matchesLocationFilter,
  buildPaymentSplitValues,
  formatPaymentDisplay,
  SALE_REGISTER_EXPORT_HEADERS,
  toSaleRegisterExportRow,
} from './saleReportUtils';

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function SalesReportPage() {
  const dispatch = useDispatch();
  const sales = useSelector((state) => state.sales?.records || []);
  const salesTotal = useSelector((state) => state.sales?.total || 0);
  const salesLoading = useSelector((state) => state.sales?.loading);
  const salesReturns = useSelector((state) => state.sales?.returns || []);
  const warehouses = useSelector((state) => state.masters?.warehouses || []);
  const stores = useSelector((state) => state.masters?.stores || []);
  const stock = useSelector((state) => state.inventory?.storeStock || state.inventory?.stock || []);
  const itemGroups = useSelector((state) => state.masters?.itemGroups || []);
  const items = useSelector((state) => state.items?.records || []);

  const user = useSelector((state) => state.auth.user);
  const isStoreStaff = user?.role !== 'Admin' && user?.role !== 'admin';

  const [filters, setFilters] = useState({});
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebouncedValue(searchText, 300);
  const [viewMode, setViewMode] = useState('summary');
  const serverPagination = useServerPagination({ defaultPageSize: 25 });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const storeFilter = filters.warehouseIds?.[0] || (filters.warehouseId && filters.warehouseId !== 'all' ? filters.warehouseId : undefined);
    dispatch(fetchSales(serverPagination.buildParams({
      startDate: filters.dateFrom,
      endDate: filters.dateTo,
      storeId: storeFilter,
      search: debouncedSearch || undefined,
      paymentStatus: filters.paymentStatus,
    })));
  }, [dispatch, serverPagination.page, serverPagination.rowsPerPage, filters.dateFrom, filters.dateTo, filters.warehouseId, filters.warehouseIds, filters.paymentStatus, debouncedSearch]);

  useEffect(() => {
    dispatch(fetchMasters('stores'));
    dispatch(fetchMasters('itemGroups'));
    if (isStoreStaff && user?.shopId) {
      setFilters((prev) => ({
        ...prev,
        warehouseId: user.shopId,
        warehouseIds: [user.shopId],
      }));
    }
  }, [dispatch, isStoreStaff, user?.shopId]);

  const locationMap = useMemo(() => {
    const map = {};
    warehouses.forEach((w) => { map[w.id] = w.name; });
    stores.forEach((s) => { map[s.id || s._id] = s.name; });
    return map;
  }, [warehouses, stores]);

  const variantItemMap = useMemo(
    () => buildVariantItemMap(items, itemGroups),
    [items, itemGroups],
  );

  const closingStockMap = useMemo(() => buildClosingStockMap(stock), [stock]);

  const itemGroupMap = useMemo(() => {
    const map = {};
    const groupNameMap = itemGroups.reduce((acc, g) => ({ ...acc, [g.id || g._id]: g.groupName || g.name }), {});
    
    items.forEach((item) => {
      // Find Category among groupIds
      const catId = (item.groupIds || []).find(id => {
          const group = itemGroups.find(g => (g.id || g._id) === (id?.id || id?._id || id));
          return group?.groupType === 'Category';
      });
      const groupName = groupNameMap[catId?.id || catId?._id || catId] || String(item.category || 'Ungrouped');
      
      const variants = item.variants || item.sizes || [];
      variants.forEach((v) => {
        map[v.id || v._id] = groupName;
      });
    });
    return map;
  }, [items, itemGroups]);

  const filteredRows = useMemo(() => {
    return sales.filter((sale) => {
      const selectedLocations = filters.warehouseIds || [];
      const matchesWarehouse = selectedLocations.length
        ? matchesLocationFilter(sale, selectedLocations)
        : (!filters.warehouseId || filters.warehouseId === 'all' || sale.warehouseId === filters.warehouseId);
      const matchesCustomer =
        !filters.customerId || filters.customerId === 'all' || sale.customerId === filters.customerId;
      const matchesSalesman =
        !filters.salesmanId || filters.salesmanId === 'all' || sale.salesmanId === filters.salesmanId;
      const selectedGroupName = itemGroups.find((g) => g.id === filters.categoryId)?.groupName;
      const matchesCategory =
        !filters.categoryId || filters.categoryId === 'all' || !selectedGroupName
          ? true
          : (sale.items || []).some((line) => itemGroupMap[line.variantId] === selectedGroupName);
      const matchesVoided = !['CANCELLED', 'REFUNDED'].includes(sale.status);
      return (
        matchesWarehouse &&
        matchesCustomer &&
        matchesSalesman &&
        matchesCategory &&
        matchesVoided
      );
    });
  }, [sales, filters, itemGroups, itemGroupMap]);

  const groupedAndSortedRows = useMemo(() => {
    const salesByStore = {};
    filteredRows.forEach((sale) => {
      const storeName = locationMap[sale.warehouseId || sale.storeId] || 'Main Office';
      if (!salesByStore[storeName]) {
        salesByStore[storeName] = [];
      }
      salesByStore[storeName].push(sale);
    });

    const sortedStoreNames = Object.keys(salesByStore).sort();
    const result = [];
    sortedStoreNames.forEach((storeName) => {
      const storeSales = salesByStore[storeName];
      storeSales.sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateB !== dateA) return dateB.localeCompare(dateA);
        return (b.invoiceNumber || '').localeCompare(a.invoiceNumber || '');
      });
      storeSales.forEach((sale, idx) => {
        result.push({
          ...sale,
          storeGroupName: storeName,
          isFirstInStoreGroup: idx === 0,
        });
      });
    });
    return result;
  }, [filteredRows, locationMap]);

  const paginatedRows = useMemo(
    () => groupedAndSortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [groupedAndSortedRows, page, rowsPerPage],
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
      totalDiscount += toNum(t.discount);
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
          variantId: line.variantId,
          mrp: toNum(line.mrp),
          lot: line.lotNumber || '-',
          quantity: toNum(line.quantity),
          rate: toNum(line.rate),
          discount: toNum(line.discount),
          amount: toNum(line.amount),
          isReturn: false,
          warehouseId: sale.warehouseId || sale.storeId,
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
          variantId: line.variantId,
          mrp: toNum(line.mrp),
          lot: line.lotNumber || '-',
          quantity: -qty,
          rate: toNum(line.rate),
          discount: toNum(line.discount),
          amount: -(toNum(line.amount) * (qty / (toNum(line.quantity) || 1))),
          isReturn: true,
          warehouseId: ret.warehouseId || sale?.warehouseId || ret.storeId || sale?.storeId,
        });
      });
    });
    return out;
  }, [filteredRows, salesReturns, sales, filters.dateFrom, filters.dateTo]);

  const groupedAndSortedDetailRows = useMemo(() => {
    const detailsByStore = {};
    detailRows.forEach((row) => {
      const storeName = locationMap[row.warehouseId] || 'Main Office';
      if (!detailsByStore[storeName]) {
        detailsByStore[storeName] = [];
      }
      detailsByStore[storeName].push(row);
    });

    const sortedStoreNames = Object.keys(detailsByStore).sort();
    const result = [];
    sortedStoreNames.forEach((storeName) => {
      const storeDetails = detailsByStore[storeName];
      storeDetails.sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateB !== dateA) return dateB.localeCompare(dateA);
        return (b.invoiceNumber || '').localeCompare(a.invoiceNumber || '');
      });
      storeDetails.forEach((row, idx) => {
        result.push({
          ...row,
          storeGroupName: storeName,
          isFirstInStoreGroup: idx === 0,
        });
      });
    });
    return result;
  }, [detailRows, locationMap]);

  const enrichedDetailRows = useMemo(
    () =>
      groupedAndSortedDetailRows.map((row) =>
        enrichSaleDetailRow(row, {
          variantMap: variantItemMap,
          closingStockMap,
          locationMap,
        }),
      ),
    [groupedAndSortedDetailRows, variantItemMap, closingStockMap, locationMap],
  );

  const paginatedDetailRows = useMemo(
    () => groupedAndSortedDetailRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [groupedAndSortedDetailRows, page, rowsPerPage],
  );

  const accountWiseRows = useMemo(() => {
    const byMode = {};
    filteredRows.forEach((sale) => {
      const rawPayments = sale.payment?.payments?.length ? sale.payment.payments : sale.payments || [];
      const { splitValues, isSplit } = buildPaymentSplitValues(
        rawPayments,
        sale.payment?.mode,
        sale.payment?.amountPaid || sale.totals?.netPayable,
      );

      if (isSplit) {
        [
          ['Cash', splitValues.cash],
          ['Card', splitValues.card],
          ['UPI', splitValues.upi],
          ['Gift Voucher', splitValues['gift voucher']],
        ].forEach(([mode, amt]) => {
          const amount = toNum(amt);
          if (amount > 0) {
            byMode[mode] = (byMode[mode] || 0) + amount;
            byMode[`${mode}_count`] = (byMode[`${mode}_count`] || 0) + 1;
          }
        });
      } else {
        const mode = sale.payment?.mode || 'Other';
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
      groupedAndSortedRows.map((row) => {
        const t = row.totals || {};
        return {
          Invoice: row.invoiceNumber,
          Date: row.date,
          Branch: locationMap[row.warehouseId || row.storeId] || 'Main Office',
          Customer: row.customerName || 'Walk-in',
          Items: row.items?.length || 0,
          Qty: toNum(t.totalQuantity),
          Gross: toNum(t.grossAmount),
          Discount: (toNum(t.lineDiscount) + toNum(t.billDiscount)).toFixed(2),
          Tax: toNum(t.taxAmount),
          Net: toNum(t.netPayable),
          Payment: formatPaymentDisplay(row.payment, row.payments),
        };
      }),
    [groupedAndSortedRows, locationMap],
  );

  const exportDetailRows = useMemo(
    () => enrichedDetailRows.map(toSaleRegisterExportRow),
    [enrichedDetailRows],
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
          multiSelectWarehouse={!isStoreStaff}
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
              headers={['Invoice', 'Date', 'Branch', 'Customer', 'Items', 'Qty', 'Gross', 'Discount', 'Tax', 'Net', 'Payment']}
              headerKeys={['Invoice', 'Date', 'Branch', 'Customer', 'Items', 'Qty', 'Gross', 'Discount', 'Tax', 'Net', 'Payment']}
              rows={exportSummaryRows}
              filename="sale-register-summary.csv"
            />
          ) : (
            <ReportExportButton
              headers={SALE_REGISTER_EXPORT_HEADERS}
              headerKeys={SALE_REGISTER_EXPORT_HEADERS}
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
                    <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
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
                  {paginatedRows.map((row, idx) => {
                    const t = row.totals || {};
                    const showStoreHeader = !isStoreStaff && (idx === 0 || row.storeGroupName !== paginatedRows[idx - 1]?.storeGroupName);
                    return (
                      <>
                        {showStoreHeader && (
                          <TableRow sx={{ bgcolor: '#eff6ff' }}>
                            <TableCell colSpan={11} sx={{ fontWeight: 800, py: 1.2, color: '#1e3a8a', fontSize: '0.85rem' }}>
                              🏢 {row.storeGroupName}
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow key={row.id || row._id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{row.invoiceNumber}</TableCell>
                          <TableCell>{row.date}</TableCell>
                          <TableCell>{locationMap[row.warehouseId || row.storeId] || 'Main Office'}</TableCell>
                          <TableCell>{row.customerName || 'Walk-in'}</TableCell>
                          <TableCell>{row.items?.length || 0}</TableCell>
                          <TableCell align="right">{toNum(t.totalQuantity)}</TableCell>
                          <TableCell align="right">₹{toNum(t.grossAmount).toFixed(2)}</TableCell>
                          <TableCell align="right">₹{toNum(t.discount).toFixed(2)}</TableCell>
                          <TableCell align="right">₹{toNum(t.taxAmount).toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>₹{toNum(t.netPayable).toFixed(2)}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap', maxWidth: 220 }}>
                            {formatPaymentDisplay(row.payment, row.payments)}
                          </TableCell>
                        </TableRow>
                      </>
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
                  {paginatedDetailRows.map((row, i) => {
                    const showStoreHeader = !isStoreStaff && (i === 0 || row.storeGroupName !== paginatedDetailRows[i - 1]?.storeGroupName);
                    return (
                      <>
                        {showStoreHeader && (
                          <TableRow sx={{ bgcolor: '#eff6ff' }}>
                            <TableCell colSpan={11} sx={{ fontWeight: 800, py: 1.2, color: '#1e3a8a', fontSize: '0.85rem' }}>
                              🏢 {row.storeGroupName}
                            </TableCell>
                          </TableRow>
                        )}
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
                      </>
                    );
                  })}
                </TableBody>
              </>
            )}
          </Table>
        </TableContainer>
        <ServerTablePagination
          count={salesTotal}
          page={serverPagination.page}
          rowsPerPage={serverPagination.rowsPerPage}
          onPageChange={serverPagination.handlePageChange}
          onRowsPerPageChange={serverPagination.handleRowsPerPageChange}
          rowsPerPageOptions={serverPagination.pageSizeOptions}
        />
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
