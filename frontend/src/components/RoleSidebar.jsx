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
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid #f1f5f9',
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 1200,
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'hidden',
    boxShadow: '4px 0 24px rgba(0, 0, 0, 0.02)',
  };

  const navItemStyle = (isActive, isChild = false) => ({
    mx: 1.5,
    my: 0.4,
    borderRadius: '12px',
    py: isChild ? 0.8 : 1.2,
    px: isCollapsed ? 1.5 : 2,
    transition: 'all 0.2s ease',
    backgroundColor: isActive ? (basePath === '/store' ? '#fff1f2' : '#f3f4ff') : 'transparent',
    color: isActive ? (basePath === '/store' ? '#be185d' : '#6366f1') : '#64748b',
    '&:hover': {
      backgroundColor: isActive ? (basePath === '/store' ? '#fff1f2' : '#f3f4ff') : '#f8fafc',
      color: isActive ? (basePath === '/store' ? '#be185d' : '#6366f1') : '#334155',
    },
    justifyContent: isCollapsed ? 'center' : 'flex-start',
    minHeight: isChild ? 40 : 48,
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
            >
              {Icon && (
                <ListItemIcon
                  sx={{
                    minWidth: isCollapsed ? 0 : 32,
                    mr: isCollapsed ? 0 : 1.5,
                    color: isActive ? (basePath === '/store' ? '#ec4899' : '#6366f1') : '#94a3b8',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={isCollapsed ? 24 : 20} strokeWidth={2} />
                </ListItemIcon>
              )}

              {!isCollapsed && (
                <>
                  <ListItemText
                    primary={item.label}
                    sx={{ pl: isChild ? 1 : 0 }}
                    slotProps={{
                      primary: {
                        fontSize: isChild ? '0.875rem' : '0.925rem',
                        fontWeight: isActive ? 600 : 500,
                        letterSpacing: '-0.01em',
                      }
                    }}
                  />
                  {hasChildren && <ChevronRightIcon sx={{ fontSize: 18, opacity: 0.5, color: '#94a3b8' }} />}
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
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          minHeight: 88,
        }}
      >
        {!isCollapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: drilldown ? 32 : 38,
                height: drilldown ? 32 : 38,
                borderRadius: '11px',
                background: basePath === '/store' 
                  ? 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)' 
                  : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: basePath === '/store'
                  ? '0 4px 10px rgba(236, 72, 153, 0.3)'
                  : '0 4px 10px rgba(99, 102, 241, 0.3)',
                flexShrink: 0
              }}
            >
              <Typography sx={{ fontWeight: 900, fontSize: drilldown ? '1.1rem' : '1.3rem', lineHeight: 1 }}>
                {basePath === '/store' ? 'S' : 'H'}
              </Typography>
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: '1.4rem',
                background: 'linear-gradient(to bottom, #1e293b, #475569)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}
            >
              {basePath === '/store' ? 'Store Panel' : (navConfig.label || 'Head Office')}
            </Typography>
          </Box>
        )}

        {isCollapsed && (
           <IconButton
            onClick={onToggle}
            sx={{
              width: 44,
              height: 44,
              borderRadius: '14px',
              background: basePath === '/store'
                ? 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)'
                : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: basePath === '/store'
                ? '0 4px 12px rgba(236, 72, 153, 0.4)'
                : '0 4px 12px rgba(99, 102, 241, 0.4)',
              m: 'auto',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)',
                transform: 'scale(1.05)',
                boxShadow: '0 6px 16px rgba(99, 102, 241, 0.5)',
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
             <MenuIcon />
          </IconButton>
        )}

        {!isCollapsed && (
          <IconButton
            onClick={onToggle}
            sx={{
              width: 32,
              height: 32,
              border: '1px solid #f1f5f9',
              backgroundColor: '#ffffff',
              '&:hover': { backgroundColor: '#f8fafc' },
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              position: 'relative',
              zIndex: 10,
            }}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Main Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
        
        {/* Drilldown Header */}
        {!isCollapsed && drilldown && (
          <Box sx={{ px: 1, mb: 1, mt: 1 }}>
             <ListItemButton 
              onClick={() => setDrilldown(null)}
              sx={{ 
                borderRadius: '12px', 
                color: '#6366f1', 
                py: 1,
                mb: 0.5,
                '&:hover': { background: '#f3f4ff' } 
              }}
            >
              <ListItemIcon sx={{ minWidth: 28, color: 'inherit' }}>
                <ChevronLeftIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Back" 
                slotProps={{ primary: { fontSize: '0.875rem', fontWeight: 800 } }} 
              />
            </ListItemButton>
            
            <Typography
              variant="caption"
              sx={{
                px: 2,
                py: 1.5,
                display: 'block',
                textTransform: 'uppercase',
                fontWeight: 800,
                color: '#1e293b',
                letterSpacing: '0.12em',
                fontSize: '0.7rem',
                borderBottom: '1.5px solid #f8fafc',
                mb: 1.5,
                opacity: 0.8
              }}
            >
              {drilldown.label}
            </Typography>
          </Box>
        )}

        <List sx={{ pt: 0 }}>
          {drilldown 
            ? renderNavItems(navConfig.children[drilldown.path] || [], true)
            : renderNavItems(navConfig.mainNav)
          }
        </List>

        {/* Global Items (optional when drilled down) */}
        {!drilldown && (
          <>
            <Typography
              variant="caption"
              sx={{
                px: 3,
                py: 2,
                mt: 2,
                display: 'block',
                textTransform: 'uppercase',
                fontWeight: 800,
                color: '#94a3b8',
                letterSpacing: '0.1em',
                fontSize: '0.65rem',
                opacity: isCollapsed ? 0 : 1,
              }}
            >
              Support
            </Typography>

            <List disablePadding sx={{ mb: 4 }}>
              <ListItem disablePadding sx={{ display: 'block' }}>
                <ListItemButton sx={navItemStyle(false)}>
                  <ListItemIcon sx={{ minWidth: isCollapsed ? 0 : 32, mr: isCollapsed ? 0 : 1.5, color: '#94a3b8', justifyContent: 'center' }}>
                    <NotificationsNoneOutlinedIcon size={20} />
                  </ListItemIcon>
                  {!isCollapsed && <ListItemText primary="Notifications" slotProps={{ primary: { fontSize: '0.925rem', fontWeight: 500 } }} />}
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
