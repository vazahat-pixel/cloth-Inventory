import { Box, Paper, Tab, Tabs, Typography } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import masterNavigation from './config/masterNavigation';
import useRoleBasePath from '../../hooks/useRoleBasePath';

function MastersLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = useRoleBasePath();

  const activeTab = masterNavigation.findIndex((item) => location.pathname.includes(item.path));
  const tabValue = activeTab >= 0 ? activeTab : 0;

  const handleTabChange = (_, newValue) => {
    navigate(`${basePath}${masterNavigation[newValue].path}`);
  };

  return (
    <Box>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, mb: 2 }}>
        <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 }, pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
            Masters Workspace
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Configure core ERP entities used by purchasing, inventory, and sales workflows.
          </Typography>
        </Box>

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ px: { xs: 1, sm: 2 } }}
        >
          {masterNavigation.map((item) => (
            <Tab key={item.path} label={item.label} />
          ))}
        </Tabs>
      </Paper>

      <Outlet />
    </Box>
  );
}

export default MastersLayout;
