import { Box, Button, Grid, Paper, Stack, Typography } from '@mui/material';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import useAppNavigate from '../../hooks/useAppNavigate';

const utilityCards = [
  {
    title: 'Voucher Shortcuts',
    description: 'Keep quick access to payment and receipt voucher actions inside Accounts.',
    actionLabel: 'Open A/C Vouchers',
    actionPath: '/accounts',
    icon: ReceiptLongOutlinedIcon,
  },
  {
    title: 'Ledger Reports',
    description: 'Jump to the ledger report screen from this accounts utility area.',
    actionLabel: 'Open Ledger Report',
    actionPath: '/reports/ledger',
    icon: AssessmentOutlinedIcon,
  },
];

function AccountsUtilitiesPage() {
  const navigate = useAppNavigate();

  return (
    <Box>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
          Accounts Utilities
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 760 }}>
          This utility section is now available inside the Accounts side flow, so the submenu opens beside the
          main sidebar just like Setup.
        </Typography>
      </Stack>

      <Grid container spacing={2.5} sx={{ maxWidth: 920 }}>
        {utilityCards.map((card) => {
          const Icon = card.icon;

          return (
            <Grid item xs={12} md={6} key={card.title}>
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid #dbe4f0',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)',
                  boxShadow: '0 16px 35px rgba(148, 163, 184, 0.1)',
                }}
              >
                <Stack spacing={2} sx={{ height: '100%' }}>
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
                    }}
                  >
                    <Icon />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.75 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7 }}>
                      {card.description}
                    </Typography>
                  </Box>
                  <Box sx={{ pt: 0.5 }}>
                    <Button variant="outlined" onClick={() => navigate(card.actionPath)}>
                      {card.actionLabel}
                    </Button>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Paper
        elevation={0}
        sx={{
          mt: 2.5,
          maxWidth: 920,
          p: 2.5,
          borderRadius: 3,
          border: '1px dashed #cbd5e1',
          bgcolor: '#ffffff',
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <BuildOutlinedIcon sx={{ color: '#2563eb' }} />
          <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.7 }}>
            Frontend structure for Accounts Utilities is in place. We can plug real tools into this page next
            without changing the new submenu flow.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}

export default AccountsUtilitiesPage;
