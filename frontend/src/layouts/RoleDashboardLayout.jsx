import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useState } from 'react';
import RoleSidebar from '../components/RoleSidebar';
import Topbar from '../components/Topbar';
import { getNavConfigForRole, getRoleFromPath } from '../common/roleConfig';

const DRAWER_WIDTH = 280;
const COLLAPSED_WIDTH = 84; // Consistent with sidebar implementation

function RoleDashboardLayout() {
  const role = useSelector((state) => state.auth.role);
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Choose sidebar based on current path first (e.g. if admin is in /store, show store sidebar)
  const pathRole = getRoleFromPath(location.pathname);
  const navConfig = getNavConfigForRole(pathRole || role);

  const sidebarWidth = isCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #f5f3ff 50%, #f0fdf4 100%)',
      }}
    >
      <RoleSidebar 
        navConfig={navConfig} 
        isCollapsed={isCollapsed} 
        onToggle={() => setIsCollapsed(!isCollapsed)} 
      />
      
      {/* Dynamic spacer for the fixed sidebar */}
      <Box 
        sx={{ 
          width: sidebarWidth, 
          flexShrink: 0, 
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
        }} 
        aria-hidden 
      />
      
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
