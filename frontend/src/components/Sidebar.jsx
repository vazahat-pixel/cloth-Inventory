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
        alignSelf: 'flex-start',
        height: '100vh',
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
          Inventory System
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
          {mainNavItems.map((item) => (
            <Box key={item.path}>
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  end={item.path === '/'}
                  sx={{
                    borderRadius: 1.5,
                    color: '#cbd5e1',
                    '&:hover': {
                      backgroundColor: '#1e293b',
                    },
                    '&.active': {
                      backgroundColor: '#1d4ed8',
                      color: '#ffffff',
                    },
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    slotProps={{
                      primary: {
                        fontSize: 14,
                        fontWeight: 600,
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>

              {item.path === '/masters' && childrenMap.masters && (
                <Collapse in={showMastersChildren} timeout="auto" unmountOnExit>
                  <List disablePadding sx={{ pl: 1, pr: 0.5, pb: 0.5 }}>
                    {childrenMap.masters.map((child) => (
                      <ListItem key={child.path} disablePadding sx={{ mb: 0.25 }}>
                        <ListItemButton
                          component={NavLink}
                          to={child.path}
                          sx={{
                            minHeight: 34,
                            borderRadius: 1.5,
                            pl: 2,
                            color: '#94a3b8',
                            '&:hover': {
                              backgroundColor: '#1e293b',
                            },
                            '&.active': {
                              backgroundColor: '#172554',
                              color: '#bfdbfe',
                            },
                          }}
                        >
                          <ListItemText
                            primary={child.label}
                            slotProps={{
                              primary: {
                                fontSize: 12.5,
                                fontWeight: 600,
                              },
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}

              {item.path === '/inventory' && childrenMap.inventory && (
                <Collapse in={showInventoryChildren} timeout="auto" unmountOnExit>
                  <List disablePadding sx={{ pl: 1, pr: 0.5, pb: 0.5 }}>
                    {childrenMap.inventory.map((child) => (
                      <ListItem key={child.path} disablePadding sx={{ mb: 0.25 }}>
                        <ListItemButton
                          component={NavLink}
                          to={child.path}
                          sx={{
                            minHeight: 34,
                            borderRadius: 1.5,
                            pl: 2,
                            color: '#94a3b8',
                            '&:hover': {
                              backgroundColor: '#1e293b',
                            },
                            '&.active': {
                              backgroundColor: '#172554',
                              color: '#bfdbfe',
                            },
                          }}
                        >
                          <ListItemText
                            primary={child.label}
                            slotProps={{
                              primary: {
                                fontSize: 12.5,
                                fontWeight: 600,
                              },
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}

              {item.path === '/purchase' && childrenMap.purchase && (
                <Collapse in={showPurchaseChildren} timeout="auto" unmountOnExit>
                  <List disablePadding sx={{ pl: 1, pr: 0.5, pb: 0.5 }}>
                    {childrenMap.purchase.map((child) => (
                      <ListItem key={child.path} disablePadding sx={{ mb: 0.25 }}>
                        <ListItemButton
                          component={NavLink}
                          to={child.path}
                          end={child.path === '/purchase'}
                          sx={{
                            minHeight: 34,
                            borderRadius: 1.5,
                            pl: 2,
                            color: '#94a3b8',
                            '&:hover': {
                              backgroundColor: '#1e293b',
                            },
                            '&.active': {
                              backgroundColor: '#172554',
                              color: '#bfdbfe',
                            },
                          }}
                        >
                          <ListItemText
                            primary={child.label}
                            slotProps={{
                              primary: {
                                fontSize: 12.5,
                                fontWeight: 600,
                              },
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}

              {item.path === '/sales' && childrenMap.sales && (
                <Collapse in={showSalesChildren} timeout="auto" unmountOnExit>
                  <List disablePadding sx={{ pl: 1, pr: 0.5, pb: 0.5 }}>
                    {childrenMap.sales.map((child) => (
                      <ListItem key={child.path} disablePadding sx={{ mb: 0.25 }}>
                        <ListItemButton
                          component={NavLink}
                          to={child.path}
                          end={child.path === '/sales'}
                          sx={{
                            minHeight: 34,
                            borderRadius: 1.5,
                            pl: 2,
                            color: '#94a3b8',
                            '&:hover': {
                              backgroundColor: '#1e293b',
                            },
                            '&.active': {
                              backgroundColor: '#172554',
                              color: '#bfdbfe',
                            },
                          }}
                        >
                          <ListItemText
                            primary={child.label}
                            slotProps={{
                              primary: {
                                fontSize: 12.5,
                                fontWeight: 600,
                              },
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}

              {item.path === '/customers' && childrenMap.customers && (
                <Collapse in={showCustomersChildren} timeout="auto" unmountOnExit>
                  <List disablePadding sx={{ pl: 1, pr: 0.5, pb: 0.5 }}>
                    {childrenMap.customers.map((child) => (
                      <ListItem key={child.path} disablePadding sx={{ mb: 0.25 }}>
                        <ListItemButton
                          component={NavLink}
                          to={child.path}
                          end={
                            child.path === '/customers/rewards' ||
                            child.path === '/customers/vouchers' ||
                            child.path === '/customers/credit-notes' ||
                            child.path === '/customers/loyalty-config'
                          }
                          sx={{
                            minHeight: 34,
                            borderRadius: 1.5,
                            pl: 2,
                            color: '#94a3b8',
                            '&:hover': {
                              backgroundColor: '#1e293b',
                            },
                            '&.active': {
                              backgroundColor: '#172554',
                              color: '#bfdbfe',
                            },
                          }}
                        >
                          <ListItemText
                            primary={child.label}
                            slotProps={{
                              primary: {
                                fontSize: 12.5,
                                fontWeight: 600,
                              },
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}

              {item.path === '/settings' && childrenMap.settings && (
                <Collapse in={showSettingsChildren} timeout="auto" unmountOnExit>
                  <List disablePadding sx={{ pl: 1, pr: 0.5, pb: 0.5 }}>
                    {childrenMap.settings.map((child) => (
                      <ListItem key={child.path} disablePadding sx={{ mb: 0.25 }}>
                        <ListItemButton
                          component={NavLink}
                          to={child.path}
                          end={false}
                          sx={{
                            minHeight: 34,
                            borderRadius: 1.5,
                            pl: 2,
                            color: '#94a3b8',
                            '&:hover': {
                              backgroundColor: '#1e293b',
                            },
                            '&.active': {
                              backgroundColor: '#172554',
                              color: '#bfdbfe',
                            },
                          }}
                        >
                          <ListItemText
                            primary={child.label}
                            slotProps={{
                              primary: {
                                fontSize: 12.5,
                                fontWeight: 600,
                              },
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}

              {item.path === '/gst' && childrenMap.gst && (
                <Collapse in={showGstChildren} timeout="auto" unmountOnExit>
                  <List disablePadding sx={{ pl: 1, pr: 0.5, pb: 0.5 }}>
                    {childrenMap.gst.map((child) => (
                      <ListItem key={child.path} disablePadding sx={{ mb: 0.25 }}>
                        <ListItemButton
                          component={NavLink}
                          to={child.path}
                          end={false}
                          sx={{
                            minHeight: 34,
                            borderRadius: 1.5,
                            pl: 2,
                            color: '#94a3b8',
                            '&:hover': {
                              backgroundColor: '#1e293b',
                            },
                            '&.active': {
                              backgroundColor: '#172554',
                              color: '#bfdbfe',
                            },
                          }}
                        >
                          <ListItemText
                            primary={child.label}
                            slotProps={{
                              primary: {
                                fontSize: 12.5,
                                fontWeight: 600,
                              },
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}

              {item.path === '/reports' && childrenMap.reports && (
                <Collapse in={showReportsChildren} timeout="auto" unmountOnExit>
                  <List disablePadding sx={{ pl: 1, pr: 0.5, pb: 0.5 }}>
                    {childrenMap.reports.map((child) => (
                      <ListItem key={child.path} disablePadding sx={{ mb: 0.25 }}>
                        <ListItemButton
                          component={NavLink}
                          to={child.path}
                          end={child.path === '/reports'}
                          sx={{
                            minHeight: 34,
                            borderRadius: 1.5,
                            pl: 2,
                            color: '#94a3b8',
                            '&:hover': {
                              backgroundColor: '#1e293b',
                            },
                            '&.active': {
                              backgroundColor: '#172554',
                              color: '#bfdbfe',
                            },
                          }}
                        >
                          <ListItemText
                            primary={child.label}
                            slotProps={{
                              primary: {
                                fontSize: 12.5,
                                fontWeight: 600,
                              },
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}

              {item.path === '/pricing' && childrenMap.pricing && (
                <Collapse in={showPricingChildren} timeout="auto" unmountOnExit>
                  <List disablePadding sx={{ pl: 1, pr: 0.5, pb: 0.5 }}>
                    {childrenMap.pricing.map((child) => (
                      <ListItem key={child.path} disablePadding sx={{ mb: 0.25 }}>
                        <ListItemButton
                          component={NavLink}
                          to={child.path}
                          end={child.path === '/pricing/price-lists' || child.path === '/pricing/schemes' || child.path === '/pricing/coupons'}
                          sx={{
                            minHeight: 34,
                            borderRadius: 1.5,
                            pl: 2,
                            color: '#94a3b8',
                            '&:hover': {
                              backgroundColor: '#1e293b',
                            },
                            '&.active': {
                              backgroundColor: '#172554',
                              color: '#bfdbfe',
                            },
                          }}
                        >
                          <ListItemText
                            primary={child.label}
                            slotProps={{
                              primary: {
                                fontSize: 12.5,
                                fontWeight: 600,
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
          ))}
        </List>
      </Box>
    </Box>
  );
}

export default Sidebar;
