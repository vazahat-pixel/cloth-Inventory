import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import useAppNavigate from '../hooks/useAppNavigate';

const sidebarWidth = 240;

function RoleSidebar({ navConfig }) {
  const location = useLocation();
  const navigate = useAppNavigate();
  const basePath = navConfig.basePath || '/ho';

  const getLocalPath = (pathname) => {
    if (pathname.startsWith(basePath)) return pathname.slice(basePath.length) || '/';
    return pathname;
  };

  const localPath = getLocalPath(location.pathname);

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

  const toFullPath = (path) => {
    if (!path) return undefined;
    if (path === '/') return basePath;
    if (path.startsWith(basePath)) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${basePath}${cleanPath}`;
  };

  // Improved recursive drilldown logic using paths as keys
  const getNavContent = () => {
    const mainNav = navConfig.mainNav;
    const activeTopItem = mainNav.find(item => item.drilldown && matchesPath(item, localPath));
    
    if (activeTopItem) {
      const level1Items = navConfig.children?.[activeTopItem.path] || [];
      const activeMidItem = level1Items.find(item => item.drilldown && matchesPath(item, localPath));
      
      if (activeMidItem) {
        const level2Items = navConfig.children?.[activeMidItem.path] || [];
        return { 
          items: level2Items, 
          title: activeMidItem.label, 
          parentTitle: activeTopItem.label,
          backPath: toFullPath(activeTopItem.path)
        };
      }

      return { 
        items: level1Items, 
        title: activeTopItem.label, 
        parentTitle: 'Main Menu',
        backPath: toFullPath('/')
      };
    }

    return { items: mainNav, title: 'Cloth ERP', parentTitle: null, backPath: null };
  };

  const { items, title, parentTitle, backPath } = getNavContent();
  const isDrilled = !!backPath;

  const linkStyle = {
    borderRadius: 1.5,
    px: 1.5,
    py: 1,
    color: '#94a3b8',
    alignItems: 'center',
    gap: 1.5,
    transition: 'all 0.2s',
    mb: 0.5,
    '&:hover': { 
      backgroundColor: 'rgba(51, 65, 85, 0.4)',
      color: '#f8fafc' 
    },
    '&.active': {
      backgroundColor: '#2563EB',
      color: '#FFFFFF',
      fontWeight: 800,
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
    },
    '&.Mui-selected': {
      backgroundColor: '#2563EB',
      color: '#FFFFFF',
    },
    '&.Mui-selected:hover': {
      backgroundColor: '#2563EB',
    },
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
        background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
        color: '#f1f5f9',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
      }}
    >
      <Box sx={{ p: 2.5, flexShrink: 0 }}>
        {!isDrilled ? (
          <>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#f8fafc', letterSpacing: -0.5 }}>
              Cloth ERP
            </Typography>
            <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {navConfig.label}
            </Typography>
          </>
        ) : (
          <Box>
            <ListItemButton
              onClick={() => navigate(backPath)}
              sx={{
                p: 0,
                mb: 1,
                borderRadius: 1,
                '&:hover': { bgcolor: 'transparent', color: '#3b82f6' }
              }}
            >
              <ArrowBackRoundedIcon sx={{ fontSize: 18, mr: 1, color: '#3b82f6' }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#3b82f6', letterSpacing: 1 }}>
                GO BACK
              </Typography>
            </ListItemButton>
            <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              {parentTitle}
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#f8fafc', mt: 0.25 }}>
              {title}
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ borderColor: '#1e293b', flexShrink: 0 }} />

      <Box sx={{ flex: 1, overflowY: 'auto', p: 1, scrollbarWidth: 'thin' }}>
        <List disablePadding>
          {items.map((item) => {
            const fullPath = toFullPath(item.path);
            const Icon = item.icon;
            const isSelected = matchesPath(item, localPath);
            const buttonProps = !item.path 
              ? { component: 'div', disabled: true } 
              : { component: NavLink, to: fullPath, end: item.path === '/' };

            return (
              <ListItem key={item.label} disablePadding>
                <ListItemButton
                  {...buttonProps}
                  selected={isSelected}
                  sx={linkStyle}
                >
                  {Icon && (
                    <ListItemIcon sx={{ minWidth: 24, color: 'inherit' }}>
                      <Icon sx={{ fontSize: 20 }} />
                    </ListItemIcon>
                  )}
                  <ListItemText
                    primary={item.label}
                    slotProps={{ 
                      primary: { 
                        fontSize: 13, 
                        fontWeight: isSelected ? 800 : 700,
                        color: 'inherit' 
                      } 
                    }}
                  />
                  {item.drilldown && (
                    <Typography variant="caption" sx={{ fontStyle: 'italic', opacity: 0.5 }}>></Typography>
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Box>
  );
}

export default RoleSidebar;
