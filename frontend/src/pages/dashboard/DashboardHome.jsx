import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Box, Button, Grid, Typography, Stack, Paper, CircularProgress } from "@mui/material";
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
  const user = useSelector((state) => state.auth?.user);
  const isAdmin = user?.role === "Admin" || user?.role === "admin" || user?.role === "superadmin";

  const [discountKey, setDiscountKey] = useState("");
  const [generatingKey, setGeneratingKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateKey = async () => {
    setGeneratingKey(true);
    setCopied(false);
    try {
      const api = (await import("../../services/api")).default;
      const res = await api.post("/settings/generate-discount-key");
      setDiscountKey(res.data.key || res.data.data?.key || "");
    } catch (err) {
      console.error("Failed to generate discount OTP key", err);
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleCopyKey = () => {
    if (discountKey) {
      navigator.clipboard.writeText(discountKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
    <Box sx={{ width: "100%", minWidth: 0, p: { xs: 1, sm: 2, md: 3 } }}>
      <Box
        sx={{
          mb: 2,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.025em",
              lineHeight: 1,
              mb: 0.5
            }}
          >
            Dashboard
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "#64748b", fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}
          >
            Real-time business performance
          </Typography>
        </Box>
        <Box
          sx={{
            p: 0.5,
            borderRadius: "8px",
            bgcolor: "#f1f5f9",
            display: "flex",
            gap: 0.5,
            border: '1px solid #e2e8f0'
          }}
        >
          <Button
            size="small"
            variant={isTodayRange ? "contained" : "text"}
            onClick={() => setRange(RANGE_TODAY)}
            sx={{
              borderRadius: "6px",
              px: 2,
              minHeight: 32,
              fontSize: '0.75rem',
              fontWeight: 700,
              boxShadow: isTodayRange ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              backgroundColor: isTodayRange ? "#fff" : "transparent",
              color: isTodayRange ? "#0f172a" : "#64748b",
              "&:hover": {
                backgroundColor: isTodayRange ? "#fff" : "rgba(0,0,0,0.05)",
                boxShadow: isTodayRange ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
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
              borderRadius: "6px",
              px: 2,
              minHeight: 32,
              fontSize: '0.75rem',
              fontWeight: 700,
              boxShadow: !isTodayRange ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              backgroundColor: !isTodayRange ? "#fff" : "transparent",
              color: !isTodayRange ? "#0f172a" : "#64748b",
              "&:hover": {
                backgroundColor: !isTodayRange ? "#fff" : "rgba(0,0,0,0.05)",
                boxShadow: !isTodayRange ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              },
            }}
          >
            Month
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} alignItems="flex-start">
        {/* Main Content Column */}
        <Grid item xs={12} lg={9}>
          <Stack spacing={3}>
            {/* KPI Cards Grid */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <KPICard
                  title="Total Sales"
                  value={formatCurrency(kpis.totalSales)}
                  subtitle={salesSubtitle}
                  icon={TrendingUpIcon}
                  color="primary"
                  onClick={() => navigate('/reports/sales')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KPICard
                  title="Total Purchase"
                  value={formatCurrency(kpis.totalPurchase)}
                  subtitle={purchaseSubtitle}
                  icon={LocalShippingIcon}
                  color="success"
                  onClick={() => navigate('/reports/purchase')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KPICard
                  title="Stock Items"
                  value={kpis.totalItems}
                  subtitle="Active SKU variants"
                  icon={Inventory2Icon}
                  color="info"
                  onClick={() => navigate('/reports/stock')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KPICard
                  title="Low Stock"
                  value={kpis.lowStockCount}
                  subtitle={`Threshold: <= ${lowStockThreshold}`}
                  icon={ShoppingCartIcon}
                  color="warning"
                  onClick={() => navigate('/inventory/stock-overview')}
                />
              </Grid>
            </Grid>

            {/* Sales Chart */}
            <SalesChart data={chartData} title={salesChartTitle} />

            {/* Recent Sales Table */}
            <RecentSalesTable
              sales={filteredSales}
              title={recentSalesTitle}
              subtitle={recentSalesSubtitle}
              emptyTitle={recentSalesEmptyTitle}
              emptyDescription={recentSalesEmptyDescription}
            />
          </Stack>
        </Grid>

        {/* Sidebar Column */}
        <Grid item xs={12} lg={3}>
          <Stack spacing={3}>
            {isAdmin && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: "1px solid #e2e8f0",
                  background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                  color: "#fff",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                }}
              >
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "#94a3b8" }}>
                      Discount Authorization
                    </Typography>
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff" }}>
                    One-Time POS Discount OTP
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: "0.825rem" }}>
                    Generate a single-use OTP key valid for 15 minutes to authorize extra POS manual discounts.
                  </Typography>
                  
                  {discountKey && (
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, fontFamily: "monospace", letterSpacing: 1.5, color: "#38bdf8" }}>
                        {discountKey}
                      </Typography>
                      <Button
                        size="small"
                        variant="text"
                        onClick={handleCopyKey}
                        sx={{ color: copied ? "#4ade80" : "#38bdf8", fontWeight: 700, minWidth: 0, textTransform: "none" }}
                      >
                        {copied ? "Copied!" : "Copy"}
                      </Button>
                    </Box>
                  )}

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleGenerateKey}
                    disabled={generatingKey}
                    sx={{
                      bgcolor: "#38bdf8",
                      color: "#0f172a",
                      fontWeight: 800,
                      textTransform: "none",
                      borderRadius: 2,
                      "&:hover": {
                        bgcolor: "#0ea5e9"
                      }
                    }}
                  >
                    {generatingKey ? <CircularProgress size={20} color="inherit" /> : "Generate Discount OTP"}
                  </Button>
                </Stack>
              </Paper>
            )}
            <LowStockAlert items={lowStockItems} threshold={lowStockThreshold} />
            <QuickActions />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DashboardHome;
