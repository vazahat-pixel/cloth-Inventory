import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import useAppNavigate from '../../hooks/useAppNavigate';

function OrdersContinuousPrintingPage() {
  const navigate = useAppNavigate();

  return (
    <Box>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
          Continuous Printing - Orders
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 760 }}>
          This Order Processing subfield now opens from the side navigation and is ready on the frontend for
          order print-queue workflows.
        </Typography>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          maxWidth: 760,
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 3,
          border: '1px solid #dbe4f0',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)',
          boxShadow: '0 20px 45px rgba(148, 163, 184, 0.12)',
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: '#dbeafe',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <PrintOutlinedIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                Order Print Queue
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7 }}>
                Use this section for batch printing of order documents when the detailed printing flow is connected.
              </Typography>
            </Box>
          </Stack>

          <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.7 }}>
            The Order Processing submenu is now in place beside the main sidebar, matching the same frontend flow
            used for Setup, Accounts, and Purchase.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<ShoppingBagOutlinedIcon />}
              onClick={() => navigate('/orders/sale-order')}
            >
              Open Sale Order
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintOutlinedIcon />}
              onClick={() => window.print()}
            >
              Test Browser Print
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}

export default OrdersContinuousPrintingPage;
