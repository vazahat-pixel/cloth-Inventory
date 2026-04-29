import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  IconButton,
  Collapse,
  Tooltip,
} from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const DRAWER_WIDTH = 280;
const COLLAPSED_WIDTH = 88;

const RoleSidebar = ({ navConfig, isCollapsed, onToggle }) => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [drilldown, setDrilldown] = useState(null); // The parent item currently drilled into

  const basePath = navConfig.basePath || '/ho';

  // Find current drilldown based on path if not manually set (for persistence)
  useEffect(() => {
    if (!drilldown) {
      // Find which main nav item matches current path and has children
      const activeParent = navConfig.mainNav.find(item => 
        matchesPath(item, location.pathname) && 
        navConfig.children?.[item.path] && 
        navConfig.children[item.path].length > 0
      );
      if (activeParent) setDrilldown(activeParent);
    }
  }, [location.pathname, navConfig]);

  const matchesPath = (item, pathname) => {
    const localPath = pathname.startsWith(basePath) ? (pathname.slice(basePath.length) || '/') : pathname;
    const candidatePaths = item?.matchPaths?.length
      ? item.matchPaths
      : item?.path
        ? [item.path]
        : [];

    return candidatePaths.some((candidate) => (
      candidate === '/'
        ? localPath === '/'
        : localPath === candidate || localPath.startsWith(`${candidate}/`)
    ));
  };

  const toFullPath = (path) => {
    if (!path) return undefined;
    if (path === '/') return basePath;
    if (path.startsWith(basePath)) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${basePath}${cleanPath}`;
  };

  const sidebarStyles = {
    width: isCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: '#0f172a',
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 1200,
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'hidden',
    boxShadow: '4px 0 24px rgba(0, 0, 0, 0.1)',
  };

  const navItemStyle = (isActive, isChild = false) => ({
    mx: 1.5,
    my: 0.25,
    borderRadius: '8px',
    py: isChild ? 0.75 : 1,
    px: isCollapsed ? 1.5 : 2,
    transition: 'all 0.2s ease',
    backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
    color: isActive ? '#fff' : '#94a3b8',
    '&:hover': {
      backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
      color: '#fff',
    },
    justifyContent: isCollapsed ? 'center' : 'flex-start',
    minHeight: isChild ? 36 : 44,
    position: 'relative',
    '&.active::before': {
      content: '""',
      position: 'absolute',
      left: -12,
      top: '20%',
      height: '60%',
      width: 4,
      borderRadius: '0 4px 4px 0',
      backgroundColor: '#3b82f6',
      boxShadow: '0 0 12px #3b82f6',
      display: isActive ? 'block' : 'none'
    }
  });

  const renderNavItems = (items, isChild = false) => {
    return items.map((item) => {
      const Icon = item.icon;
      const isActive = matchesPath(item, location.pathname);
      const hasChildren = !isChild && navConfig.children?.[item.path] && navConfig.children[item.path].length > 0;
      
      const tooltipTitle = isCollapsed ? item.label : "";

      return (
        <ListItem disablePadding sx={{ display: 'block' }} key={`${item.label}-${item.path || ''}`}>
          <Tooltip title={tooltipTitle} placement="right" arrow>
            <ListItemButton
              component={item.path && !hasChildren ? NavLink : 'div'}
              to={item.path && !hasChildren ? toFullPath(item.path) : undefined}
              onClick={hasChildren ? () => setDrilldown(item) : undefined}
              sx={navItemStyle(isActive, isChild)}
              className={isActive ? 'active' : ''}
            >
              {Icon && (
                <ListItemIcon
                  sx={{
                    minWidth: isCollapsed ? 0 : 32,
                    mr: isCollapsed ? 0 : 1.5,
                    color: isActive ? '#3b82f6' : '#64748b',
                    justifyContent: 'center',
                    transition: 'color 0.2s',
                  }}
                >
                  <Icon size={isCollapsed ? 24 : 18} strokeWidth={isActive ? 2.5 : 2} />
                </ListItemIcon>
              )}

              {!isCollapsed && (
                <>
                  <ListItemText
                    primary={item.label}
                    sx={{ pl: isChild ? 1 : 0 }}
                    slotProps={{
                      primary: {
                        fontSize: isChild ? '0.8125rem' : '0.875rem',
                        fontWeight: isActive ? 700 : 500,
                        letterSpacing: '-0.01em',
                      }
                    }}
                  />
                  {hasChildren && <ChevronRightIcon sx={{ fontSize: 16, opacity: 0.5, color: '#64748b' }} />}
                </>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
      );
    });
  };

  return (
    <Box sx={sidebarStyles}>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          minHeight: 64,
        }}
      >
        {!isCollapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 6,
                height: 20,
                borderRadius: 0.5,
                bgcolor: '#3b82f6',
                flexShrink: 0
              }}
            />
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  color: '#fff',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                }}
              >
                CLOTH ERP
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  color: location.pathname.startsWith('/store') ? '#f472b6' : '#60a5fa',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: 1.5,
                  display: 'block'
                }}
              >
                {location.pathname.startsWith('/store') ? 'Store Operations' : 'Management Hub'}
              </Typography>
            </Box>
          </Box>
        )}

        {isCollapsed && (
           <IconButton
            onClick={onToggle}
            sx={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              '&:hover': {
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
              },
              transition: 'all 0.15s ease-in-out'
            }}
          >
             <MenuIcon />
          </IconButton>
        )}

        {!isCollapsed && (
          <IconButton
            onClick={onToggle}
            sx={{
              width: 24,
              height: 24,
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: '#94a3b8',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' },
            }}
          >
            <ChevronLeftIcon fontSize="inherit" sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Box>

      {/* Main Navigation */}
      <Box 
        className="sidebar-scroll"
        sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          px: 1, 
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { background: '#1e293b', borderRadius: 10 },
        }}
      >
        
        {/* Drilldown Header */}
        {!isCollapsed && drilldown && (
          <Box sx={{ px: 1, mb: 0.5, mt: 0.5 }}>
             <ListItemButton 
              onClick={() => setDrilldown(null)}
              sx={{ 
                borderRadius: '6px', 
                color: '#3b82f6', 
                py: 0.5,
                mb: 0.5,
                '&:hover': { background: 'rgba(59, 130, 246, 0.1)' } 
              }}
            >
              <ListItemIcon sx={{ minWidth: 20, color: 'inherit' }}>
                <ChevronLeftIcon fontSize="inherit" sx={{ fontSize: 14 }} />
              </ListItemIcon>
              <ListItemText 
                primary="Back" 
                slotProps={{ primary: { fontSize: '0.75rem', fontWeight: 700 } }} 
              />
            </ListItemButton>
            
            <Typography
              variant="caption"
              sx={{
                px: 1.5,
                py: 0.5,
                display: 'block',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: '#64748b',
                letterSpacing: '0.05em',
                fontSize: '0.6rem',
                mb: 0.5,
              }}
            >
              {drilldown.label}
            </Typography>
          </Box>
        )}

        <List sx={{ pt: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {drilldown 
            ? renderNavItems(navConfig.children[drilldown.path] || [], true)
            : renderNavItems(navConfig.mainNav)
          }
        </List>

        {/* Global Items */}
        {!drilldown && !isCollapsed && (
          <>
            <Typography
              variant="caption"
              sx={{
                px: 3,
                py: 2,
                mt: 3,
                display: 'block',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: '#475569',
                letterSpacing: '0.1em',
                fontSize: '0.65rem',
              }}
            >
              Support & Tools
            </Typography>

            <List disablePadding sx={{ mb: 4, mt: 0.5 }}>
              <ListItem disablePadding sx={{ display: 'block' }}>
                <ListItemButton sx={navItemStyle(false)}>
                  <ListItemIcon sx={{ minWidth: 32, mr: 1.5, color: '#64748b', justifyContent: 'center' }}>
                    <NotificationsNoneOutlinedIcon size={18} />
                  </ListItemIcon>
                  <ListItemText primary="Notifications" slotProps={{ primary: { fontSize: '0.875rem', fontWeight: 500 } }} />
                </ListItemButton>
              </ListItem>
            </List>
          </>
        )}
      </Box>
    </Box>
  );
};

export default RoleSidebar;
