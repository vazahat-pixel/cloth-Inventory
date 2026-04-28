import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Box, Button, Grid, Typography } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import KPICard from "./components/KPICard";
import SalesChart from "./components/SalesChart";
import LowStockAlert from "./components/LowStockAlert";
import RecentSalesTable from "./components/RecentSalesTable";
import QuickActions from "./components/QuickActions";
import { useAppNavigate } from "../../hooks/useAppNavigate";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchSales } from "../../modules/sales/salesSlice";
import { fetchPurchases } from "../../modules/purchase/purchaseSlice";
import { fetchStockOverview } from "../../modules/inventory/inventorySlice";
import { fetchCompanyProfile } from "../../modules/settings/settingsSlice";

function formatCurrency(value) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `\u20B9${amount.toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`
    : "\u20B90";
}

const RANGE_TODAY = "today";
const RANGE_MONTH = "month";

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getRecordDateKey(value) {
  if (!value) {
    return "";
  }

  const raw = String(value);
  const directMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);

  if (directMatch) {
    return directMatch[1];
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return getDateKey(parsed);
}

function getSalesAmount(record) {
  return record.payment?.amountPaid ?? record.totals?.netPayable ?? record.totals?.grossAmount ?? 0;
}

function getPurchaseAmount(record) {
  return record.totals?.netAmount ?? record.totals?.grossAmount ?? 0;
}

function getRecordTimestamp(value) {
  const parsed = new Date(value || 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function DashboardHome() {
  const dispatch = useDispatch();
  const navigate = useAppNavigate();

  useEffect(() => {
    dispatch(fetchSales());
    dispatch(fetchPurchases());
    dispatch(fetchStockOverview());
    dispatch(fetchCompanyProfile());
  }, [dispatch]);

  const sales = useSelector((state) => state.sales?.records ?? []);
  const purchase = useSelector((state) => state.purchase?.records ?? []);
  const stock = useSelector((state) => state.inventory?.stock ?? []);
  const preferences = useSelector((state) => state.settings?.preferences);
  const lowStockThreshold = preferences?.lowStockThreshold ?? 10;
  const [range, setRange] = useState(RANGE_TODAY);
  const todayKey = getDateKey(new Date());
  const monthKey = todayKey.slice(0, 7);

  const filteredSales = useMemo(() => {
    const records = sales.filter((record) => {
      const dateValue = record.date || record.saleDate || record.createdAt;
      const dateKey = getRecordDateKey(dateValue);

      return range === RANGE_TODAY
        ? dateKey === todayKey
        : dateKey.startsWith(monthKey);
    });

    return [...records].sort(
      (left, right) => getRecordTimestamp(right.date) - getRecordTimestamp(left.date),
    );
  }, [monthKey, range, sales, todayKey]);

  const filteredPurchase = useMemo(
    () =>
      purchase.filter((record) => {
        const dateKey = getRecordDateKey(
          record.invoiceDate || record.billDate || record.date,
        );

        return range === RANGE_TODAY
          ? dateKey === todayKey
          : dateKey.startsWith(monthKey);
      }),
    [monthKey, purchase, range, todayKey],
  );

  const kpis = useMemo(() => {
    const totalSales = filteredSales.reduce(
      (sum, record) => sum + getSalesAmount(record),
      0,
    );
    const totalPurchase = filteredPurchase.reduce(
      (sum, record) => sum + getPurchaseAmount(record),
      0,
    );
    const totalItems = stock.length;
    const lowStockCount = stock.filter(
      (item) => (item.quantity ?? 0) <= lowStockThreshold,
    ).length;

    return {
      totalSales,
      totalPurchase,
      totalItems,
      lowStockCount,
    };
  }, [filteredPurchase, filteredSales, lowStockThreshold, stock]);

  const chartData = useMemo(() => {
    if (range === RANGE_TODAY) {
      return [
        {
          label: "Today",
          value: Math.round(
            filteredSales.reduce((sum, record) => sum + getSalesAmount(record), 0),
          ),
        },
      ];
    }

    const today = new Date();
    const result = [];

    for (let day = 1; day <= today.getDate(); day += 1) {
      const dateKey = `${monthKey}-${String(day).padStart(2, "0")}`;
      const daySales = filteredSales
        .filter((record) => getRecordDateKey(record.date) === dateKey)
        .reduce((sum, record) => sum + getSalesAmount(record), 0);

      result.push({
        label: String(day),
        value: Math.round(daySales),
      });
    }

    return result;
  }, [filteredSales, monthKey, range]);

  const lowStockItems = useMemo(
    () =>
      stock
        .filter((item) => (item.quantity ?? 0) <= lowStockThreshold)
        .map((item) => ({
          id: item.id,
          itemName: item.itemName,
          sku: item.sku,
          quantity: item.quantity ?? 0,
        })),
    [lowStockThreshold, stock],
  );

  const isTodayRange = range === RANGE_TODAY;
  const salesChartTitle = isTodayRange
    ? "Sales Trend (Today)"
    : "Sales Trend (This Month)";
  const salesSubtitle = isTodayRange ? "Collected today" : "Collected this month";
  const purchaseSubtitle = isTodayRange
    ? "Purchased today"
    : "Purchased this month";
  const recentSalesTitle = isTodayRange ? "Today's Sales" : "Monthly Sales";
  const recentSalesSubtitle = isTodayRange
    ? "Transactions recorded today"
    : "Transactions recorded this month";
  const recentSalesEmptyTitle = isTodayRange
    ? "No Sales Recorded Today"
    : "No Sales Recorded This Month";
  const recentSalesEmptyDescription = isTodayRange
    ? "Today's transactions will appear here as invoices are created."
    : "This month's transactions will appear here as invoices are created.";

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "#0f172a",
              letterSpacing: "-0.02em",
              fontSize: "1.25rem",
            }}
          >
            Dashboard
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#64748b", fontWeight: 500 }}
          >
            Real-time business overview and metrics.
          </Typography>
        </Box>
        <Box
          sx={{
            p: 0.5,
            borderRadius: "6px",
            bgcolor: "#f1f5f9",
            display: "flex",
            gap: 0.5,
          }}
        >
          <Button
            size="small"
            variant={isTodayRange ? "contained" : "text"}
            onClick={() => setRange(RANGE_TODAY)}
            sx={{
              borderRadius: "4px",
              px: 2,
              minHeight: 28,
              fontSize: '0.75rem',
              boxShadow: 'none',
              backgroundColor: isTodayRange ? "#fff" : "transparent",
              color: isTodayRange ? "#0f172a" : "#64748b",
              "&:hover": {
                backgroundColor: isTodayRange ? "#fff" : "rgba(0,0,0,0.05)",
                boxShadow: 'none',
              },
            }}
          >
            Today
          </Button>
          <Button
            size="small"
            variant={!isTodayRange ? "contained" : "text"}
            onClick={() => setRange(RANGE_MONTH)}
            sx={{
              borderRadius: "4px",
              px: 2,
              minHeight: 28,
              fontSize: '0.75rem',
              boxShadow: 'none',
              backgroundColor: !isTodayRange ? "#fff" : "transparent",
              color: !isTodayRange ? "#0f172a" : "#64748b",
              "&:hover": {
                backgroundColor: !isTodayRange ? "#fff" : "rgba(0,0,0,0.05)",
                boxShadow: 'none',
              },
            }}
          >
            Month
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ width: "100%", m: 0 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <KPICard
            title="Total Sales"
            value={formatCurrency(kpis.totalSales)}
            subtitle={salesSubtitle}
            icon={TrendingUpIcon}
            color="primary"
            onClick={() => navigate('/reports/sales')}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KPICard
            title="Total Purchase"
            value={formatCurrency(kpis.totalPurchase)}
            subtitle={purchaseSubtitle}
            icon={LocalShippingIcon}
            color="success"
            onClick={() => navigate('/reports/purchase')}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KPICard
            title="Stock Items"
            value={kpis.totalItems}
            subtitle="Active SKU variants"
            icon={Inventory2Icon}
            color="info"
            onClick={() => navigate('/reports/stock')}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KPICard
            title="Low Stock"
            value={kpis.lowStockCount}
            subtitle={`At threshold (<= ${lowStockThreshold})`}
            icon={ShoppingCartIcon}
            color="warning"
            onClick={() => navigate('/inventory/stock-overview')}
          />
        </Grid>

        <Grid item xs={12} md={8} lg={9} sx={{ minWidth: 0 }}>
          <SalesChart data={chartData} title={salesChartTitle} />
        </Grid>
        <Grid item xs={12} md={4} lg={3}>
          <LowStockAlert items={lowStockItems} threshold={lowStockThreshold} />
        </Grid>

        <Grid item xs={12} md={3} lg={3}>
          <QuickActions />
        </Grid>
        <Grid item xs={12} md={9} lg={9} sx={{ minWidth: 0 }}>
          <RecentSalesTable
            sales={filteredSales}
            title={recentSalesTitle}
            subtitle={recentSalesSubtitle}
            emptyTitle={recentSalesEmptyTitle}
            emptyDescription={recentSalesEmptyDescription}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default DashboardHome;
