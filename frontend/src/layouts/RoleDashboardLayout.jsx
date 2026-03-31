import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import RoleSidebar from '../components/RoleSidebar';
import Topbar from '../components/Topbar';
import { getNavConfigForRole, getRoleFromPath } from '../common/roleConfig';

function RoleDashboardLayout() {
  const role = useSelector((state) => state.auth.role);
  const location = useLocation();
  
  // Choose sidebar based on current path first (e.g. if admin is in /store, show store sidebar)
  const pathRole = getRoleFromPath(location.pathname);
  const navConfig = getNavConfigForRole(pathRole || role);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 40%, #F8FAFC 100%)',
      }}
    >
      <RoleSidebar navConfig={navConfig} />
      <Box sx={{ width: 240, flexShrink: 0 }} aria-hidden />
      
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <Box
          component="main"
          sx={{
            flex: 1,
            width: '100%',
            minWidth: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            p: { xs: 2.5, sm: 3.5 },
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default RoleDashboardLayout;
