import { Box, Paper, Stack, Typography } from '@mui/material';
import PageHeader from '../../components/erp/PageHeader';

function NotificationsPage() {
  return (
    <Box>
      <PageHeader
        title="Notifications"
        subtitle="System alerts, stock warnings, and activity updates."
        breadcrumbs={[{ label: 'Support & Tools' }, { label: 'Notifications', active: true }]}
      />
      <Paper elevation={0} sx={{ p: 4, border: '1px solid #e2e8f0', borderRadius: 2, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
          No new notifications
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Important alerts from inventory, sales, and approvals will appear here.
        </Typography>
      </Paper>
    </Box>
  );
}

export default NotificationsPage;
