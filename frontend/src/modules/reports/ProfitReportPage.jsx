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
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import ReportFilterPanel from './ReportFilterPanel';
import ReportExportButton from './ReportExportButton';
import { SummaryChip } from './SalesReportPage';

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function ProfitReportPage() {
  const sales = useSelector((state) => state.sales?.records || []);
  const items = useSelector((state) => state.items?.records || []);

  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const variantCostMap = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      item.variants?.forEach((v) => {
        map[v.id] = toNum(v.costPrice) || toNum(v.sellingPrice) * 0.6;
      });
    });
    return map;
  }, [items]);

  const profitRows = useMemo(() => {
    const rows = [];
    sales.forEach((sale) => {
      (sale.items || []).forEach((line, idx) => {
        const qty = toNum(line.quantity);
        const sellingPrice = toNum(line.rate);
        const costPrice = variantCostMap[line.variantId] || sellingPrice * 0.6;
        const revenue = qty * sellingPrice;
        const cost = qty * costPrice;
        const profit = revenue - cost;
        const profitPct = revenue > 0 ? (profit / revenue) * 100 : 0;
        rows.push({
          id: `${sale.id}-${line.variantId}-${idx}`,
          itemName: line.itemName,
          variant: `${line.size || ''}/${line.color || ''}`.replace(/\/$/, ''),
          quantity: qty,
          costPrice,
          sellingPrice,
          revenue,
          profit,
          profitPct,
          invoiceNumber: sale.invoiceNumber,
          date: sale.date,
          warehouseId: sale.warehouseId,
        });
      });
    });
    return rows;
  }, [sales, variantCostMap]);

  const filteredRows = useMemo(() => {
    return profitRows.filter((row) => {
      const matchesDateFrom = !filters.dateFrom || row.date >= filters.dateFrom;
      const matchesDateTo = !filters.dateTo || row.date <= filters.dateTo;
      const matchesWarehouse =
        !filters.warehouseId || filters.warehouseId === 'all' || row.warehouseId === filters.warehouseId;
      return matchesDateFrom && matchesDateTo && matchesWarehouse;
    });
  }, [profitRows, filters]);

  const paginatedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage],
  );

  const summary = useMemo(() => {
    let totalQty = 0;
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    filteredRows.forEach((r) => {
      totalQty += r.quantity;
      totalRevenue += r.revenue;
      totalCost += r.cost;
      totalProfit += r.profit;
    });
    const profitPct = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    return {
      totalTransactions: filteredRows.length,
      totalQuantity: totalQty,
      totalRevenue,
      totalCost,
      totalProfit,
      profitPct,
    };
  }, [filteredRows]);

  const exportRows = useMemo(
    () =>
      filteredRows.map((r) => ({
        Item: r.itemName,
        Variant: r.variant || '-',
        'Qty Sold': r.quantity,
        'Cost Price': r.costPrice.toFixed(2),
        'Selling Price': r.sellingPrice.toFixed(2),
        Revenue: r.revenue.toFixed(2),
        Profit: r.profit.toFixed(2),
        'Profit %': r.profitPct.toFixed(1),
      })),
    [filteredRows],
  );

  return (
    <Box>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Profit Analysis
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Margin analysis, cost vs revenue, profit percentage.
          </Typography>
        </Box>

        <ReportFilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          showDateRange
          showWarehouse
        />
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', mb: 1 }}>
          Summary
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          <SummaryChip label="Total Transactions" value={summary.totalTransactions} />
          <SummaryChip label="Quantity Sold" value={summary.totalQuantity} />
          <SummaryChip label="Revenue" value={`₹${summary.totalRevenue.toFixed(2)}`} />
          <SummaryChip label="Cost" value={`₹${summary.totalCost.toFixed(2)}`} />
          <SummaryChip label="Profit" value={`₹${summary.totalProfit.toFixed(2)}`} strong />
          <SummaryChip label="Profit %" value={`${summary.profitPct.toFixed(1)}%`} />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack direction="row" justifyContent="flex-end" sx={{ p: 1.5 }}>
          <ReportExportButton
            headers={['Item', 'Variant', 'Qty Sold', 'Cost Price', 'Selling Price', 'Revenue', 'Profit', 'Profit %']}
            headerKeys={['Item', 'Variant', 'Qty Sold', 'Cost Price', 'Selling Price', 'Revenue', 'Profit', 'Profit %']}
            rows={exportRows}
            filename="margin-report.csv"
          />
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Variant</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Qty Sold
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Cost Price
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Selling Price
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Revenue
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Profit
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Profit %
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{row.itemName}</TableCell>
                  <TableCell>{row.variant || '-'}</TableCell>
                  <TableCell align="right">{row.quantity}</TableCell>
                  <TableCell align="right">₹{row.costPrice.toFixed(2)}</TableCell>
                  <TableCell align="right">₹{row.sellingPrice.toFixed(2)}</TableCell>
                  <TableCell align="right">₹{row.revenue.toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: row.profit >= 0 ? 'inherit' : 'error.main' }}>
                    ₹{row.profit.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">{row.profitPct.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredRows.length}
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

export default ProfitReportPage;
