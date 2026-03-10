import {
  Box,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';

const sidebarWidth = 240;

const pathMap = {
  '/masters': 'masters',
  '/inventory': 'inventory',
  '/purchase': 'purchase',
  '/sales': 'sales',
  '/reports': 'reports',
  '/setup': 'setup',
  '/settings': 'settings',
};

function RoleSidebar({ navConfig }) {
  const location = useLocation();
  const basePath = navConfig.basePath;

  const toFullPath = (path) => {
    if (path === '/') return basePath;
    return `${basePath}${path}`;
  };

  const stripBasePath = (pathname) => {
    if (pathname.startsWith(basePath)) return pathname.slice(basePath.length) || '/';
    return pathname;
  };

  const localPath = stripBasePath(location.pathname);
  const showMasters = localPath.startsWith('/masters');
  const showInventory = localPath.startsWith('/inventory');
  const showPurchase = localPath.startsWith('/purchase');
  const showSales = localPath.startsWith('/sales');
  const showPricing = localPath.startsWith('/pricing');
  const showCustomers = localPath.startsWith('/customers');
  const showReports = localPath.startsWith('/reports');
  const showGst = localPath.startsWith('/gst');
  const showSettings = localPath.startsWith('/settings');

  const linkStyle = {
    borderRadius: 1.5,
    color: '#cbd5e1',
    '&:hover': { backgroundColor: '#1e293b' },
    '&.active': { backgroundColor: '#1d4ed8', color: '#ffffff' },
  };

  const childLinkStyle = {
    minHeight: 34,
    borderRadius: 1.5,
    pl: 2,
    color: '#94a3b8',
    '&:hover': { backgroundColor: '#1e293b' },
    '&.active': { backgroundColor: '#172554', color: '#bfdbfe' },
  };

  const renderChildren = (parentPath, childKey) => {
    const children = navConfig.children?.[childKey];
    if (!children?.length) return null;
    const isExpanded = localPath.startsWith(parentPath);
    return (
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <List disablePadding sx={{ pl: 1, pr: 0.5, pb: 0.5 }}>
          {children.map((child) => (
            <ListItem key={child.path} disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                component={NavLink}
                to={toFullPath(child.path)}
                end={child.path === parentPath}
                sx={childLinkStyle}
              >
                <ListItemText
                  primary={child.label}
                  slotProps={{ primary: { fontSize: 12.5, fontWeight: 600 } }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse>
    );
  };

  return (
    <Box
      component="aside"
      sx={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: sidebarWidth,
        height: '100vh',
        zIndex: 1100,
        backgroundColor: '#0f172a',
        color: '#e2e8f0',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: 3, py: 2.5, flexShrink: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
          Cloth ERP
        </Typography>
        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
          {navConfig.label}
        </Typography>
      </Box>
      <Divider sx={{ borderColor: '#1e293b', flexShrink: 0 }} />
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: '#475569 #1e293b',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#1e293b',
            borderRadius: 3,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#475569',
            borderRadius: 3,
            '&:hover': { backgroundColor: '#64748b' },
          },
        }}
      >
        <List sx={{ px: 1.5, py: 1.5 }}>
          {navConfig.mainNav.map((item) => {
            const fullPath = toFullPath(item.path);
            const childKey = pathMap[item.path];
            return (
              <Box key={fullPath}>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    component={NavLink}
                    to={fullPath}
                    end={item.path === '/'}
                    sx={linkStyle}
                  >
                    <ListItemText
                      primary={item.label}
                      slotProps={{ primary: { fontSize: 14, fontWeight: 600 } }}
                    />
                  </ListItemButton>
                </ListItem>
                {childKey === 'masters' && renderChildren('/masters', 'masters')}
                {childKey === 'inventory' && renderChildren('/inventory', 'inventory')}
                {childKey === 'purchase' && renderChildren('/purchase', 'purchase')}
                {childKey === 'sales' && renderChildren('/sales', 'sales')}
                {childKey === 'reports' && renderChildren('/reports', 'reports')}
                {childKey === 'setup' && renderChildren('/setup', 'setup')}
                {childKey === 'settings' && renderChildren('/settings', 'settings')}
              </Box>
            );
          })}
        </List>
      </Box>
    </Box>
  );
}

export default RoleSidebar;
