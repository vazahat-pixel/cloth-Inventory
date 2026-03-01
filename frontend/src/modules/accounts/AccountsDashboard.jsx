import { useAppNavigate } from '../../hooks/useAppNavigate';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import PaymentsIcon from '@mui/icons-material/Payments';
import CreditScoreIcon from '@mui/icons-material/CreditScore';

const accountCards = [
  {
    title: 'Bank Payment',
    description: 'Record supplier cheque payment and allocate against pending purchase bills.',
    path: '/accounts/bank-payment',
    icon: PaymentsIcon,
  },
  {
    title: 'Bank Receipt',
    description: 'Record customer cheque receipt and allocate against pending sale bills.',
    path: '/accounts/bank-receipt',
    icon: CreditScoreIcon,
  },
];

function AccountsDashboard() {
  const navigate = useAppNavigate();

  return (
    <Box>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Accounts
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Bank payment and receipt vouchers for supplier and customer transactions.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={2}>
        {accountCards.map((card) => {
          const Icon = card.icon;
          return (
            <Grid item xs={12} sm={6} md={4} key={card.path}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                  },
                }}
              >
                <CardActionArea onClick={() => navigate(card.path)} sx={{ p: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: '#eff6ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon sx={{ color: '#2563eb', fontSize: 28 }} />
                    </Box>
                    <CardContent sx={{ p: 0, flex: 1, '&:last-child': { pb: 0 } }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        {card.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                        {card.description}
                      </Typography>
                    </CardContent>
                  </Stack>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

export default AccountsDashboard;
