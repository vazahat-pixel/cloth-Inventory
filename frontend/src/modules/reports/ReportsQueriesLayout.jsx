import { Box, Stack } from '@mui/material';
import { Outlet } from 'react-router-dom';

function ReportsQueriesLayout() {
  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 64px)', bgcolor: 'transparent' }}>
      {/* 
          REMOVED ReportsQueriesSubnav to avoid double sidebar.
          The primary RoleSidebar already handles the report-level drilldown 
          based on the routes defined in roleConfig.js.
      */}
      
      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 0, md: 1 }, // Reduced padding as RoleDashboardLayout already has padding
          width: '100%',
          overflowX: 'hidden'
        }}
      >
        <Stack spacing={3}>
          <Outlet />
        </Stack>
      </Box>
    </Box>
  );
}

export default ReportsQueriesLayout;
