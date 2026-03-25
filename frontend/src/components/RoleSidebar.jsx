import {
  Box,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';

const sidebarWidth = 240;

const pathMap = {
  '/items': 'items',
  '/masters': 'masters',
  '/inventory': 'inventory',
  '/purchase': 'purchase',
  '/orders': 'sales',
  '/sales': 'sales',
  '/reports': 'reports',
  '/setup': 'setup',
  '/settings': 'settings',
};

function RoleSidebar({ navConfig }) {
  const location = useLocation();
  const basePath = navConfig.basePath;

  const toFullPath = (path) => {
    if (!path) return undefined;
    if (path === '/') return basePath;
    return `${basePath}${path}`;
  };

  const stripBasePath = (pathname) => {
    if (pathname.startsWith(basePath)) return pathname.slice(basePath.length) || '/';
    return pathname;
  };

  const localPath = stripBasePath(location.pathname);

  const matchesPath = (item, pathname) => {
    const candidatePaths = item?.matchPaths?.length
      ? item.matchPaths
      : item?.path
        ? [item.path]
        : [];

    return candidatePaths.some((candidate) => (
      candidate === '/'
        ? pathname === '/'
        : pathname === candidate || pathname.startsWith(`${candidate}/`)
    ));
  };

  const getChildKey = (item) => (item?.path ? pathMap[item.path] : null);

  const getChildItems = (item) => {
    const childKey = getChildKey(item);
    return childKey ? navConfig.children?.[childKey] || [] : [];
  };

  const hasActiveChild = (item) => getChildItems(item).some((child) => !child?.exitsDrilldown && matchesPath(child, localPath));

  const activeDrilldownItem = navConfig.mainNav.find((item) => (
    item?.drilldown
    && getChildItems(item).length
    && (matchesPath(item, localPath) || hasActiveChild(item))
  ));

  const linkStyle = {
    borderRadius: 1.5,
    px: 1.5,
    py: 0.75,
    color: '#CBD5E1',
    alignItems: 'center',
    gap: 1,
    '&:hover': { backgroundColor: 'rgba(148, 163, 184, 0.12)' },
    '&.active': {
      backgroundColor: '#2563EB',
      color: '#FFFFFF',
      boxShadow: '0 10px 20px rgba(37, 99, 235, 0.35)',
    },
    '&.Mui-selected': {
      backgroundColor: '#2563EB',
      color: '#FFFFFF',
      boxShadow: '0 10px 20px rgba(37, 99, 235, 0.35)',
    },
    '&.Mui-selected:hover': {
      backgroundColor: '#2563EB',
    },
    '&.Mui-disabled': {
      color: '#64748B',
      opacity: 1,
    },
    '&.Mui-disabled .MuiListItemIcon-root': {
      color: '#475569',
    },
  };

  const childLinkStyle = {
    minHeight: 34,
    borderRadius: 1.5,
    pl: 2,
    color: '#94a3b8',
    '&:hover': { backgroundColor: '#1e293b' },
    '&.active': { backgroundColor: '#172554', color: '#bfdbfe' },
    '&.Mui-selected': { backgroundColor: '#172554', color: '#bfdbfe' },
    '&.Mui-selected:hover': { backgroundColor: '#172554' },
    '&.Mui-disabled': {
      color: '#64748B',
      opacity: 1,
    },
  };

  const renderChildren = (parentPath, childKey) => {
    const children = navConfig.children?.[childKey];
    if (!children?.length) return null;
    const isExpanded = localPath.startsWith(parentPath) || children.some((child) => matchesPath(child, localPath));
    return (
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <List disablePadding sx={{ pl: 1, pr: 0.5, pb: 0.5 }}>
          {children.map((child) => {
            const childFullPath = toFullPath(child.path);
            const isChildDisabled = Boolean(child.disabled || !child.path);
            const isChildSelected = !isChildDisabled && matchesPath(child, localPath);
            const childButtonProps = isChildDisabled
              ? { component: 'div', disabled: true }
              : { component: NavLink, to: childFullPath, end: child.path === parentPath };

            return (
              <ListItem key={child.label} disablePadding sx={{ mb: 0.25 }}>
                <ListItemButton
                  {...childButtonProps}
                  selected={isChildSelected}
                  sx={childLinkStyle}
                >
                  <ListItemText
                    primary={child.label}
                    slotProps={{ primary: { fontSize: 12.5, fontWeight: 600 } }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Collapse>
    );
  };

  const renderStandaloneChildren = (children) => (
    children.map((child) => {
      const childFullPath = toFullPath(child.path);
      const isChildDisabled = Boolean(child.disabled || !child.path);
      const isChildSelected = !isChildDisabled && !child?.exitsDrilldown && matchesPath(child, localPath);
      const childButtonProps = isChildDisabled
        ? { component: 'div', disabled: true }
        : { component: NavLink, to: childFullPath, end: child.path === '/' };

      return (
        <ListItem key={child.label} disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            {...childButtonProps}
            selected={isChildSelected}
            sx={{
              ...childLinkStyle,
              minHeight: 44,
              px: 1.5,
            }}
          >
            <ListItemText
              primary={child.label}
              slotProps={{ primary: { fontSize: 14, fontWeight: 600 } }}
            />
          </ListItemButton>
        </ListItem>
      );
    })
  );

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
        background: 'linear-gradient(180deg, #020617 0%, #0F172A 40%, #020617 100%)',
        color: '#E2E8F0',
        borderRight: '1px solid #1E293B',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: 3, py: 2.5, flexShrink: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
          Cloth ERP
        </Typography>
        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
          {navConfig.label}
        </Typography>
      </Box>
      <Divider sx={{ borderColor: '#1E293B', flexShrink: 0 }} />
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: '#475569 #020617',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#020617',
            borderRadius: 3,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#1F2937',
            borderRadius: 3,
            '&:hover': { backgroundColor: '#4B5563' },
          },
        }}
      >
        <List sx={{ px: 1.5, py: 1.5 }}>
          {activeDrilldownItem ? renderStandaloneChildren(getChildItems(activeDrilldownItem)) : navConfig.mainNav.map((item) => {
            const fullPath = toFullPath(item.path);
            const childKey = getChildKey(item);
            const Icon = item.icon;
            const isDisabled = Boolean(item.disabled || !item.path);
            const isSelected = !isDisabled && (matchesPath(item, localPath) || hasActiveChild(item));
            const buttonProps = isDisabled
              ? { component: 'div', disabled: true }
              : { component: NavLink, to: fullPath, end: item.path === '/' };

            return (
              <Box key={item.label}>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    {...buttonProps}
                    selected={isSelected}
                    sx={linkStyle}
                  >
                    {Icon ? (
                      <ListItemIcon
                        sx={{
                          minWidth: 30,
                          color: 'inherit',
                        }}
                      >
                        <Icon sx={{ fontSize: 18 }} />
                      </ListItemIcon>
                    ) : null}
                    <ListItemText
                      primary={item.label}
                      slotProps={{ primary: { fontSize: 14, fontWeight: 600 } }}
                    />
                  </ListItemButton>
                </ListItem>
                {childKey === 'items' && renderChildren('/items', 'items')}
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
