import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
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

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function CustomerReportPage() {
  const sales = useSelector((state) => state.sales?.records || []);
  const customers = useSelector((state) => state.masters?.customers || []);
  const creditNotes = useSelector((state) => state.customerRewards?.creditNotes || []);
  const loyaltyTransactions = useSelector((state) => state.customerRewards?.loyaltyTransactions || []);

  const [filters, setFilters] = useState({});
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const customerRows = useMemo(() => {
    const map = {};
    const customerMap = customers.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
    customers.forEach((c) => {
      map[c.id] = {
        customerId: c.id,
        customerName: c.customerName,
        mobileNumber: c.mobileNumber || '',
        address: c.address || '',
        totalPurchases: 0,
        totalAmount: 0,
        loyaltyPoints: c.loyaltyPoints || 0,
        totalEarned: 0,
        totalRedeemed: 0,
        outstandingBalance: 0,
        lastPurchaseDate: null,
      };
    });
    loyaltyTransactions.forEach((tx) => {
      const cusId = tx.customerId;
      if (!map[cusId]) {
        map[cusId] = {
          customerId: cusId,
          customerName: customerMap[cusId]?.customerName || 'Unknown',
          mobileNumber: customerMap[cusId]?.mobileNumber || '',
          address: customerMap[cusId]?.address || '',
          totalPurchases: 0,
          totalAmount: 0,
          loyaltyPoints: 0,
          totalEarned: 0,
          totalRedeemed: 0,
          outstandingBalance: 0,
          lastPurchaseDate: null,
        };
      }
      if (tx.type === 'earned' || (tx.type === 'adjusted' && tx.points > 0)) {
        map[cusId].totalEarned += Math.max(0, tx.points);
      } else if (tx.type === 'redeemed' || (tx.type === 'adjusted' && tx.points < 0)) {
        map[cusId].totalRedeemed += Math.abs(tx.points || 0);
      }
    });
    loyaltyTransactions.forEach((tx) => {
      const cusId = tx.customerId;
      if (map[cusId]) {
        const txs = loyaltyTransactions.filter((t) => t.customerId === cusId).sort((a, b) => (b.date > a.date ? 1 : -1));
        map[cusId].loyaltyPoints = txs[0]?.balance ?? map[cusId].loyaltyPoints ?? 0;
      }
    });
    sales.forEach((sale) => {
      const cusId = sale.customerId || 'walkin';
      if (cusId === 'walkin') return;
      if (!map[cusId]) {
        map[cusId] = {
          customerId: cusId,
          customerName: sale.customerName || 'Unknown',
          mobileNumber: sale.customerMobile || '',
          address: '',
          totalPurchases: 0,
          totalAmount: 0,
          loyaltyPoints: 0,
          totalEarned: 0,
          totalRedeemed: 0,
          outstandingBalance: 0,
          lastPurchaseDate: null,
        };
      }
      map[cusId].totalPurchases += 1;
      map[cusId].totalAmount += toNum(sale.totals?.netPayable);
      if (!map[cusId].lastPurchaseDate || sale.date > map[cusId].lastPurchaseDate) {
        map[cusId].lastPurchaseDate = sale.date;
      }
    });
    creditNotes.forEach((cn) => {
      if (cn.status === 'Available' && map[cn.customerId]) {
        map[cn.customerId].outstandingBalance = (map[cn.customerId].outstandingBalance || 0) + toNum(cn.amount);
      }
    });
    customers.forEach((c) => {
      if (map[c.id]) {
        map[c.id].loyaltyPoints = c.loyaltyPoints ?? map[c.id].loyaltyPoints;
      }
    });
    return Object.values(map).filter((r) => r.totalPurchases > 0 || r.totalEarned > 0 || r.totalRedeemed > 0 || r.loyaltyPoints > 0 || r.customerId !== 'walkin');
  }, [customers, sales, creditNotes, loyaltyTransactions]);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return customerRows.filter((row) => {
      const matchesCustomer =
        !filters.customerId || filters.customerId === 'all' || row.customerId === filters.customerId;
      const matchesSearch =
        !query ||
        (row.customerName || '').toLowerCase().includes(query) ||
        (row.mobileNumber || '').includes(searchText.trim());
      return matchesCustomer && matchesSearch;
    });
  }, [customerRows, filters, searchText]);

  const paginatedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage],
  );

  const summary = useMemo(() => {
    let totalPurchases = 0;
    let totalAmount = 0;
    filteredRows.forEach((r) => {
      totalPurchases += r.totalPurchases;
      totalAmount += r.totalAmount;
    });
    return {
      totalCustomers: filteredRows.length,
      totalPurchases,
      totalAmount,
    };
  }, [filteredRows]);

  const exportRows = useMemo(
    () =>
      filteredRows.map((r) => ({
        'Customer Name': r.customerName,
        Mobile: r.mobileNumber,
        Address: r.address || '-',
        'Total Purchases': r.totalPurchases,
        'Total Amount': r.totalAmount.toFixed(2),
        'Points Earned': r.totalEarned,
        'Points Redeemed': r.totalRedeemed,
        'Balance': r.loyaltyPoints,
        Outstanding: r.outstandingBalance.toFixed(2),
        'Last Purchase': r.lastPurchaseDate || '-',
      })),
    [filteredRows],
  );

  return (
    <Box>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Customer Report
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Customer activity, purchase history, loyalty points.
          </Typography>
        </Box>

        <ReportFilterPanel filters={filters} onFiltersChange={setFilters} showCustomer />


        <TextField
          size="small"
          value={searchText}
          onChange={(e) => {
            setPage(0);
            setSearchText(e.target.value);
          }}
          placeholder="Search by name or mobile"
          sx={{ maxWidth: 320 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', mb: 1 }}>
          Summary
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          <SummaryChip label="Total Customers" value={summary.totalCustomers} />
          <SummaryChip label="Total Purchases" value={summary.totalPurchases} />
          <SummaryChip label="Total Amount" value={`₹${summary.totalAmount.toFixed(2)}`} strong />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack direction="row" justifyContent="flex-end" sx={{ p: 1.5 }}>
          <ReportExportButton
            headers={['Customer Name', 'Mobile', 'Address', 'Total Purchases', 'Total Amount', 'Points Earned', 'Points Redeemed', 'Balance', 'Outstanding', 'Last Purchase']}
            headerKeys={['Customer Name', 'Mobile', 'Address', 'Total Purchases', 'Total Amount', 'Points Earned', 'Points Redeemed', 'Balance', 'Outstanding', 'Last Purchase']}
            rows={exportRows}
            filename="customer-report.csv"
          />
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mobile</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Address</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Purchases
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Amount
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Earned
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Redeemed
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Balance
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Outstanding
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Last Purchase</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row) => (
                <TableRow key={row.customerId} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{row.customerName}</TableCell>
                  <TableCell>{row.mobileNumber}</TableCell>
                  <TableCell sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.address}>
                    {row.address || '-'}
                  </TableCell>
                  <TableCell align="right">{row.totalPurchases}</TableCell>
                  <TableCell align="right">₹{row.totalAmount.toFixed(2)}</TableCell>
                  <TableCell align="right">{row.totalEarned}</TableCell>
                  <TableCell align="right">{row.totalRedeemed}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{row.loyaltyPoints}</TableCell>
                  <TableCell align="right">₹{row.outstandingBalance.toFixed(2)}</TableCell>
                  <TableCell>{row.lastPurchaseDate || '-'}</TableCell>
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

export default CustomerReportPage;
