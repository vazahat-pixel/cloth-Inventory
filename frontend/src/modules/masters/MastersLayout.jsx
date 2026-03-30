import { Box, Paper, Tab, Tabs, Typography } from '@mui/material';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import masterNavigation from './config/masterNavigation';
import useRoleBasePath from '../../hooks/useRoleBasePath';

function MastersLayout() {
  const location = useLocation();
  const basePath = useRoleBasePath();

  const getLocalPath = (pathname) => {
    if (pathname.startsWith(basePath)) {
      return pathname.slice(basePath.length) || '/';
    }
    return pathname;
  };

  const localPath = getLocalPath(location.pathname);
  const activeTab = masterNavigation.find(
    (item) => localPath === item.path || localPath.startsWith(`${item.path}/`),
  );
  const tabValue = activeTab?.path || false;

  const toFullPath = (path) => `${basePath}${path}`;

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
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            px: { xs: 1, sm: 2 },
            '& .MuiTabs-scrollButtons.Mui-disabled': {
              opacity: 0.3,
            },
          }}
        >
          {masterNavigation.map((item) => (
            <Tab
              key={item.path}
              value={item.path}
              label={item.label}
              component={NavLink}
              to={toFullPath(item.path)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                minHeight: 52,
              }}
            />
          ))}
        </Tabs>
      </Paper>

      <Outlet />
    </Box>
  );
}

export default MastersLayout;
