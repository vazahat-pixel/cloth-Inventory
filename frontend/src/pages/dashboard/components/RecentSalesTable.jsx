import { Link as RouterLink } from "react-router-dom";
import useRoleBasePath from "../../../hooks/useRoleBasePath";
import {
  Box,
  Button,
  Card,
  CardContent,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

function RecentSalesTable({
  sales,
  title = "Recent Sales",
  subtitle = "Live transaction stream",
  emptyTitle = "Starting Your Sales Journey",
  emptyDescription = "Your recent transactions will appear here. Ready to make your first sale?",
}) {
  const basePath = useRoleBasePath();
  const recent = sales.slice(0, 5);

  const formatCurrency = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount)
      ? `\u20B9${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
      : "-";
  };

  const formatDate = (value) => {
    try {
      const date = new Date(value);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      });
    } catch {
      return value || "-";
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: '6px',
        background: "#fff",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <ReceiptLongIcon sx={{ fontSize: 18, color: "#2563eb" }} />
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            {title}
          </Typography>
        </Box>

        {recent.length ? (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ py: 1, fontWeight: 700, color: "#64748b", fontSize: '0.7rem', textTransform: 'uppercase' }}>Invoice</TableCell>
                    <TableCell sx={{ py: 1, fontWeight: 700, color: "#64748b", fontSize: '0.7rem', textTransform: 'uppercase' }}>Date</TableCell>
                    <TableCell sx={{ py: 1, fontWeight: 700, color: "#64748b", fontSize: '0.7rem', textTransform: 'uppercase' }}>Customer</TableCell>
                    <TableCell align="right" sx={{ py: 1, fontWeight: 700, color: "#64748b", fontSize: '0.7rem', textTransform: 'uppercase' }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recent.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell sx={{ py: 0.75 }}>
                        <Link
                          component={RouterLink}
                          to={`${basePath}/sales/${row.id}`}
                          underline="none"
                          sx={{ fontWeight: 600, color: "#2563eb", fontSize: '0.8125rem' }}
                        >
                          #{String(row.invoiceNumber || row.id).slice(-6).toUpperCase()}
                        </Link>
                      </TableCell>
                      <TableCell sx={{ py: 0.75, color: "#64748b", fontSize: '0.8125rem' }}>{formatDate(row.date)}</TableCell>
                      <TableCell sx={{ py: 0.75, color: "#334155", fontWeight: 500, fontSize: '0.8125rem' }}>{row.customerName || "Walk-in"}</TableCell>
                      <TableCell align="right" sx={{ py: 0.75, fontWeight: 700, color: "#0f172a", fontSize: '0.8125rem' }}>
                        {formatCurrency(row.totals?.netPayable ?? row.totals?.grossAmount ?? 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
              <Button
                component={RouterLink}
                to={`${basePath}/sales`}
                size="small"
                variant="contained"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                sx={{
                  textTransform: "none",
                  fontWeight: 800,
                  fontSize: 12,
                  borderRadius: 100,
                  bgcolor: "#111827",
                  color: "#fff",
                  px: 2.5,
                  py: 1,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  "&:hover": { bgcolor: "#1f2937", transform: "translateX(4px)" },
                }}
              >
                All Sales
              </Button>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              py: 8,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                p: 2,
                borderRadius: 100,
                bgcolor: "rgba(79, 70, 229, 0.05)",
                color: "#4f46e5",
              }}
            >
              <ReceiptLongIcon sx={{ fontSize: 48 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#111827", mb: 0.5 }}>
                {emptyTitle}
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280", px: 4, fontSize: 13 }}>
                {emptyDescription}
              </Typography>
              <Button
                component={RouterLink}
                to={`${basePath}/sales/new`}
                variant="outlined"
                sx={{ mt: 3, borderRadius: 100, fontWeight: 700, textTransform: "none" }}
              >
                Create Invoice
              </Button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentSalesTable;
