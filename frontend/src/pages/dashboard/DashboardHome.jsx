import { useMemo } from "react";
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
    <Box sx={{ width: '100%', minWidth: 0, px: 2 }}>
      <Box sx={{ mt: 2, mb: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box 
              sx={{ 
                width: 14, 
                height: 14, 
                borderRadius: '4px', 
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)' 
              }} 
            />
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 900, 
                color: '#1e293b', 
                letterSpacing: '-0.03em',
                fontSize: { xs: '1.75rem', md: '2.25rem' }
              }}
            >
              Analytics Overview
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 600, fontSize: 16, ml: 4 }}>
            Proactive monitoring of business throughput and operational metrics.
          </Typography>
        </Box>
        <Box 
          sx={{ 
            p: 0.75, 
            borderRadius: '16px', 
            bgcolor: 'rgba(255, 255, 255, 0.6)', 
            border: '1px solid #f1f5f9', 
            backdropFilter: 'blur(10px)',
            display: 'flex',
            gap: 0.5,
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}
        >
          <Button 
            variant="text" 
            sx={{ 
              borderRadius: '12px', 
              px: 3, 
              fontWeight: 800, 
              textTransform: 'none', 
              color: '#6366f1',
              background: '#f3f4ff',
              '&:hover': { background: '#eef2ff' }
            }}
          >
            Today
          </Button>
          <Button 
            variant="text" 
            sx={{ 
              borderRadius: '12px', 
              px: 3, 
              fontWeight: 700, 
              textTransform: 'none', 
              color: '#94a3b8',
              '&:hover': { background: '#f8fafc' }
            }}
          >
            Month
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ width: '100%', m: 0 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <KPICard
            title="Total Sales"
            value={formatCurrency(kpis.totalSales)}
            subtitle="Verified revenue stream"
            icon={TrendingUpIcon}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KPICard
            title="Total Purchase"
            value={formatCurrency(kpis.totalPurchase)}
            subtitle="Procurement total"
            icon={LocalShippingIcon}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KPICard
            title="Stock Items"
            value={kpis.totalItems}
            subtitle="Active SKU variants"
            icon={Inventory2Icon}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KPICard
            title="Low Stock"
            value={kpis.lowStockCount}
            subtitle={`At threshold (≤ ${lowStockThreshold})`}
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
