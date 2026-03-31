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
        borderRadius: 5,
        background: "rgba(255, 255, 255, 0.45)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        boxShadow: "0 15px 35px -10px rgba(0, 0, 0, 0.04)",
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: 3.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <Box
            sx={{
              p: 1.25,
              borderRadius: 3,
              background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
              color: "#fff",
              boxShadow: "0 8px 16px -4px rgba(79, 70, 229, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ReceiptLongIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                color: "#111827",
                letterSpacing: -0.5,
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>
            <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600 }}>
              {subtitle}
            </Typography>
          </Box>
        </Box>

        {recent.length ? (
          <>
            <TableContainer sx={{ overflow: "hidden" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        borderBottom: "1px solid rgba(0,0,0,0.05)",
                        py: 1.5,
                        fontWeight: 700,
                        color: "#6b7280",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      Invoice
                    </TableCell>
                    <TableCell
                      sx={{
                        borderBottom: "1px solid rgba(0,0,0,0.05)",
                        py: 1.5,
                        fontWeight: 700,
                        color: "#6b7280",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      Date
                    </TableCell>
                    <TableCell
                      sx={{
                        borderBottom: "1px solid rgba(0,0,0,0.05)",
                        py: 1.5,
                        fontWeight: 700,
                        color: "#6b7280",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      Customer
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        borderBottom: "1px solid rgba(0,0,0,0.05)",
                        py: 1.5,
                        fontWeight: 700,
                        color: "#6b7280",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      Amount
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recent.map((row) => (
                    <TableRow
                      key={row.id}
                      sx={{ "& td": { borderBottom: "1px solid rgba(0,0,0,0.03)", py: 2.25 } }}
                    >
                      <TableCell>
                        <Link
                          component={RouterLink}
                          to={`${basePath}/sales/${row.id}`}
                          underline="none"
                          sx={{
                            fontWeight: 800,
                            color: "#4f46e5",
                            fontSize: 13,
                            bgcolor: "rgba(79, 70, 229, 0.05)",
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 100,
                            display: "inline-block",
                          }}
                        >
                          {String(row.invoiceNumber || row.id).slice(-8).toUpperCase()}
                        </Link>
                      </TableCell>
                      <TableCell sx={{ color: "#6b7280", fontWeight: 600, fontSize: 13 }}>
                        {formatDate(row.date)}
                      </TableCell>
                      <TableCell sx={{ color: "#374151", fontWeight: 700, fontSize: 13 }}>
                        {row.customerName || "Walk-in"}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 900, color: "#111827", fontSize: 14 }}
                      >
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
