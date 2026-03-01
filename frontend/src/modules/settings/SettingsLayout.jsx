import { Box, Paper, Tab, Tabs, Typography } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import useRoleBasePath from '../../hooks/useRoleBasePath';

const settingsTabs = [
  { label: 'Company Profile', path: '/settings/company' },
  { label: 'Users', path: '/settings/users' },
  { label: 'Roles', path: '/settings/roles' },
  { label: 'Number Series', path: '/settings/number-series' },
  { label: 'Preferences', path: '/settings/preferences' },
  { label: 'Purchase Config', path: '/settings/purchase-config' },
  { label: 'Print Templates', path: '/settings/print-templates' },
  { label: 'Audit Log', path: '/settings/audit-log' },
];

function SettingsLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = useRoleBasePath();
  const activeTab = settingsTabs.findIndex((t) => location.pathname.includes(t.path));
  const tabValue = activeTab >= 0 ? activeTab : 0;

  const handleTabChange = (_, newValue) => {
    navigate(`${basePath}${settingsTabs[newValue].path}`);
  };

  return (
    <Box>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, mb: 2 }}>
        <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 }, pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
            Settings
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Configure company, users, roles, and system preferences.
          </Typography>
        </Box>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ px: { xs: 1, sm: 2 }, borderTop: '1px solid #e2e8f0' }}
        >
          {settingsTabs.map((t) => (
            <Tab key={t.path} label={t.label} />
          ))}
        </Tabs>
      </Paper>
      <Outlet />
    </Box>
  );
}

export default SettingsLayout;
