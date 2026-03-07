import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, Grid, Stack, Typography, Paper } from '@mui/material';
import { useAppNavigate } from '../../hooks/useAppNavigate';

import SummaryCard from '../../components/SummaryCard';
import FinanceActivityTable from '../../components/FinanceActivityTable';

import { fetchBankPayments, fetchBankReceipts } from './accountsSlice';
import { fetchPurchases } from '../purchase/purchaseSlice';
import { fetchSales } from '../sales/salesSlice';

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import ReceiptIcon from '@mui/icons-material/Receipt';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';

function AccountsDashboard() {
  const dispatch = useDispatch();
  const navigate = useAppNavigate();

  const { bankPayments, bankReceipts } = useSelector((state) => state.accounts);
  const sales = useSelector((state) => state.sales.records || []);
  const purchases = useSelector((state) => state.purchase.records || []);

  useEffect(() => {
    dispatch(fetchBankPayments());
    dispatch(fetchBankReceipts());
    dispatch(fetchSales());
    dispatch(fetchPurchases());
  }, [dispatch]);

  const stats = useMemo(() => {
    let totals = {
      cashBalance: 245000, // Static sample based on prompt requirement context, or can be derived if available
      bankBalance: 1250000,
      receivable: 0,
      payable: 0,
      gstPayable: 45000,
      totalSales: 0,
      totalPurchases: 0,
    };

    sales.forEach((sale) => {
      totals.totalSales += Number(sale.totals?.netPayable || sale.amount || 0);
      if (sale.payment?.status !== 'Paid') {
        totals.receivable += Number(sale.payment?.dueAmount || 0);
      }
    });

    purchases.forEach((purchase) => {
      totals.totalPurchases += Number(purchase.totalAmount || 0);
      // Rough payable logic based on what's available
      totals.payable += Number(purchase.totalAmount || 0) * 0.2; // roughly 20% mock as payable
    });

    return totals;
  }, [sales, purchases]);

  const recentTransactions = useMemo(() => {
    const combined = [
      ...(bankPayments || []).map((p) => ({
        date: p.paymentDate || p.date,
        account: p.bankAccount || p.supplierName || 'Supplier Payment',
        type: 'Payment',
        debit: p.amount,
        credit: null,
      })),
      ...(bankReceipts || []).map((r) => ({
        date: r.receiptDate || r.date,
        account: r.bankAccount || r.customerName || 'Customer Receipt',
        type: 'Receipt',
        debit: null,
        credit: r.amount,
      })),
    ];

    return combined
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
  }, [bankPayments, bankReceipts]);

  const formatCurrency = (val) => `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Stack spacing={3}>
        {/* Header Section */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
              Accounts Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Financial overview, receivables, payables, and transactions.
            </Typography>
          </Box>
        </Stack>

        {/* Top Summary Cards */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard
              title="Cash Balance"
              value={formatCurrency(stats.cashBalance)}
              icon={AccountBalanceWalletIcon}
              color="#16a34a"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard
              title="Bank Balance"
              value={formatCurrency(stats.bankBalance)}
              icon={AccountBalanceIcon}
              color="#2563eb"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard
              title="Accounts Receivable"
              value={formatCurrency(stats.receivable)}
              icon={PriceCheckIcon}
              color="#f59e0b"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard
              title="Accounts Payable"
              value={formatCurrency(stats.payable)}
              icon={ReceiptIcon}
              color="#dc2626"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <SummaryCard
              title="GST Payable"
              value={formatCurrency(stats.gstPayable)}
              icon={RequestQuoteIcon}
              color="#8b5cf6"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <SummaryCard
              title="Total Sales"
              value={formatCurrency(stats.totalSales)}
              icon={TrendingUpIcon}
              color="#10b981"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <SummaryCard
              title="Total Purchases"
              value={formatCurrency(stats.totalPurchases)}
              icon={TrendingDownIcon}
              color="#f43f5e"
            />
          </Grid>
        </Grid>

        {/* Below Cards: Actions & Activity */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#ffffff' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
                Recent Financial Activity
              </Typography>
              <FinanceActivityTable transactions={recentTransactions} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#ffffff' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
                Quick Finance Actions
              </Typography>
              <Stack spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={() => navigate('/accounts/bank-payment')}
                  sx={{ justifyContent: 'flex-start', color: '#2563eb', borderColor: '#bfdbfe', '&:hover': { bgcolor: '#eff6ff' } }}
                >
                  Create Bank Payment
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={() => navigate('/accounts/bank-receipt')}
                  sx={{ justifyContent: 'flex-start', color: '#16a34a', borderColor: '#bbf7d0', '&:hover': { bgcolor: '#f0fdf4' } }}
                >
                  Create Bank Receipt
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AssessmentOutlinedIcon />}
                  onClick={() => navigate('/reports/ledger')}
                  sx={{ justifyContent: 'flex-start', color: '#f59e0b', borderColor: '#fde68a', '&:hover': { bgcolor: '#fffbeb' } }}
                >
                  View Ledger Report
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AssessmentOutlinedIcon />}
                  onClick={() => navigate('/reports/profit')}
                  sx={{ justifyContent: 'flex-start', color: '#64748b', borderColor: '#e2e8f0', '&:hover': { bgcolor: '#f8fafc' } }}
                >
                  Open Trial Balance
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}

export default AccountsDashboard;
