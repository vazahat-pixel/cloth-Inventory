import {
  Box,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getNavConfigForRole } from '../common/roleConfig';

const sidebarWidth = 240;

function Sidebar() {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const navConfig = getNavConfigForRole(user?.role);
  const mainNavItems = navConfig.mainNav || [];
  const childrenMap = navConfig.children || {};

  const showMastersChildren = location.pathname.startsWith('/masters');
  const showInventoryChildren = location.pathname.startsWith('/inventory');
  const showPurchaseChildren = location.pathname.startsWith('/purchase');
  const showSalesChildren = location.pathname.startsWith('/sales');
  const showPricingChildren = location.pathname.startsWith('/pricing');
  const showCustomersChildren = location.pathname.startsWith('/customers');
  const showReportsChildren = location.pathname.startsWith('/reports');
  const showGstChildren = location.pathname.startsWith('/gst');
  const showSettingsChildren = location.pathname.startsWith('/settings');

  return (
    <Box
      component="aside"
      sx={{
        width: sidebarWidth,
        flexShrink: 0,
        height: '100vh',
        background: '#0f172a',
        color: '#f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 24px 0 rgba(0,0,0,0.05)',
        zIndex: 1100,
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '1px',
          height: '100%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%)',
        }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 800, 
            letterSpacing: -0.5, 
            color: '#fff',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Box sx={{ width: 6, height: 20, borderRadius: 0.5, bgcolor: '#3b82f6' }} />
          CLOTH ERP
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', ml: 2, fontSize: '0.65rem' }}>
          Management System
        </Typography>
      </Box>

      <Box
        className="sidebar-scroll"
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 1.5,
          pb: 2,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { background: '#1e293b', borderRadius: 10 },
        }}
      >
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          {mainNavItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <Box key={item.path}>
                <ListItem disablePadding>
                  <ListItemButton
                    component={NavLink}
                    to={item.path}
                    end={item.path === '/'}
                    sx={{
                      borderRadius: 1,
                      px: 1.5,
                      py: 0.75,
                      minHeight: 36,
                      color: isActive ? '#fff' : '#94a3b8',
                      backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        color: '#fff',
                      },
                      '&.active': {
                        color: '#fff',
                        '& .MuiTypography-root': { fontWeight: 700 },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: -6,
                          top: '25%',
                          height: '50%',
                          width: 3,
                          borderRadius: '0 4px 4px 0',
                          backgroundColor: '#3b82f6',
                          boxShadow: '0 0 8px #3b82f6',
                        }
                      },
                    }}
                  >
                    <ListItemText
                      primary={item.label}
                      slotProps={{
                        primary: {
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>

                {/* Sub-menu handling */}
                {(
                  (item.path === '/masters' && childrenMap.masters) ||
                  (item.path === '/inventory' && childrenMap.inventory) ||
                  (item.path === '/purchase' && childrenMap.purchase) ||
                  (item.path === '/sales' && childrenMap.sales) ||
                  (item.path === '/customers' && childrenMap.customers) ||
                  (item.path === '/settings' && childrenMap.settings) ||
                  (item.path === '/gst' && childrenMap.gst) ||
                  (item.path === '/reports' && childrenMap.reports) ||
                  (item.path === '/pricing' && childrenMap.pricing)
                ) && (
                  <Collapse 
                    in={
                      (item.path === '/masters' && showMastersChildren) ||
                      (item.path === '/inventory' && showInventoryChildren) ||
                      (item.path === '/purchase' && showPurchaseChildren) ||
                      (item.path === '/sales' && showSalesChildren) ||
                      (item.path === '/customers' && showCustomersChildren) ||
                      (item.path === '/settings' && showSettingsChildren) ||
                      (item.path === '/gst' && showGstChildren) ||
                      (item.path === '/reports' && showReportsChildren) ||
                      (item.path === '/pricing' && showPricingChildren)
                    } 
                    timeout="auto"
                  >
                    <List disablePadding sx={{ pl: 1.5, mt: 0.25, mb: 0.5, display: 'flex', flexDirection: 'column', gap: 0.15 }}>
                      {(
                        item.path === '/masters' ? childrenMap.masters :
                        item.path === '/inventory' ? childrenMap.inventory :
                        item.path === '/purchase' ? childrenMap.purchase :
                        item.path === '/sales' ? childrenMap.sales :
                        item.path === '/customers' ? childrenMap.customers :
                        item.path === '/settings' ? childrenMap.settings :
                        item.path === '/gst' ? childrenMap.gst :
                        item.path === '/reports' ? childrenMap.reports :
                        item.path === '/pricing' ? childrenMap.pricing : []
                      ).map((child) => (
                        <ListItem key={child.path} disablePadding>
                          <ListItemButton
                            component={NavLink}
                            to={child.path}
                            sx={{
                              minHeight: 28,
                              borderRadius: 1,
                              pl: 2,
                              color: '#64748b',
                              transition: 'all 0.1s',
                              position: 'relative',
                              '&:hover': {
                                color: '#cbd5e1',
                                backgroundColor: 'transparent',
                              },
                              '&.active': {
                                color: '#3b82f6',
                                backgroundColor: 'transparent',
                                '& .MuiTypography-root': { fontWeight: 700 },
                              },
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                left: 0,
                                top: '50%',
                                width: 3,
                                height: 3,
                                borderRadius: '50%',
                                backgroundColor: 'currentColor',
                                transform: 'translateY(-50%)',
                                opacity: 0.3
                              }
                            }}
                          >
                            <ListItemText
                              primary={child.label}
                              slotProps={{
                                primary: {
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                },
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                )}
              </Box>
            );
          })}
        </List>
      </Box>
    </Box>
  );
}

export default Sidebar;
