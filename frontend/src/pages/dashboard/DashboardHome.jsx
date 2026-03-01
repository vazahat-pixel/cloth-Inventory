import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Box, Grid, Typography } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import KPICard from "./components/KPICard";
import SalesChart from "./components/SalesChart";
import LowStockAlert from "./components/LowStockAlert";
import RecentSalesTable from "./components/RecentSalesTable";
import QuickActions from "./components/QuickActions";

function formatCurrency(v) {
  const n = Number(v);
  return Number.isFinite(n)
    ? `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : "₹0";
}

function DashboardHome() {
  const sales = useSelector((state) => state.sales?.records ?? []);
  const purchase = useSelector((state) => state.purchase?.records ?? []);
  const stock = useSelector((state) => state.inventory?.stock ?? []);
  const preferences = useSelector((state) => state.settings?.preferences);
  const lowStockThreshold = preferences?.lowStockThreshold ?? 10;

  const kpis = useMemo(() => {
    const totalSales = sales.reduce(
      (sum, s) => sum + (s.totals?.netPayable ?? s.totals?.grossAmount ?? 0),
      0,
    );
    const totalPurchase = purchase.reduce(
      (sum, p) => sum + (p.totals?.netAmount ?? p.totals?.grossAmount ?? 0),
      0,
    );
    const totalItems = stock.length;
    const lowStockCount = stock.filter(
      (s) => (s.quantity ?? 0) <= lowStockThreshold,
    ).length;
    return {
      totalSales,
      totalPurchase,
      totalItems,
      lowStockCount,
    };
  }, [sales, purchase, stock, lowStockThreshold]);

  const chartData = useMemo(() => {
    const today = new Date();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const daySales = sales
        .filter((s) => (s.date || "").slice(0, 10) === dateStr)
        .reduce(
          (sum, s) =>
            sum + (s.totals?.netPayable ?? s.totals?.grossAmount ?? 0),
          0,
        );
      result.push({
        label: d.toLocaleDateString("en-IN", { weekday: "short" }),
        value: Math.round(daySales),
      });
    }
    return result;
  }, [sales]);

  const lowStockItems = useMemo(
    () =>
      stock
        .filter((s) => (s.quantity ?? 0) <= lowStockThreshold)
        .map((s) => ({
          id: s.id,
          itemName: s.itemName,
          sku: s.sku,
          quantity: s.quantity ?? 0,
        })),
    [stock, lowStockThreshold],
  );

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Overview of sales, purchases, and inventory.
        </Typography>
      </Box>

      <Grid container spacing={2.5} sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Sales"
            value={formatCurrency(kpis.totalSales)}
            subtitle="This period"
            icon={TrendingUpIcon}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Purchase"
            value={formatCurrency(kpis.totalPurchase)}
            subtitle="This period"
            icon={LocalShippingIcon}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Stock Items"
            value={kpis.totalItems}
            subtitle="SKU variants"
            icon={Inventory2Icon}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Low Stock"
            value={kpis.lowStockCount}
            subtitle={`≤ ${lowStockThreshold} qty`}
            icon={ShoppingCartIcon}
            color="warning"
          />
        </Grid>

        <Grid item xs={12} md={8} lg={9} sx={{ minWidth: 0 }}>
          <SalesChart data={chartData} />
        </Grid>
        <Grid item xs={12} md={4} lg={3}>
          <LowStockAlert items={lowStockItems} threshold={lowStockThreshold} />
        </Grid>

        <Grid item xs={12} md={3} lg={3}>
          <QuickActions />
        </Grid>
        <Grid item xs={12} md={9} lg={9} sx={{ minWidth: 0 }}>
          <RecentSalesTable sales={sales} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default DashboardHome;
