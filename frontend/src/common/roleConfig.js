import {
  navigationItems,
  mastersNavigationItems,
  inventoryNavigationItems,
  purchaseNavigationItems,
  salesNavigationItems,
  ordersNavigationItems,
  pricingNavigationItems,
  customersNavigationItems,
  accountsNavigationItems,
  reportsNavigationItems,
  gstNavigationItems,
  settingsNavigationItems,
} from './navigation';

export const ROLES = {
  admin: 'admin',
  store_staff: 'store_staff',
};

// Map legacy roles for compatibility during transition if needed, 
// but backend will return admin or store_staff
const roleAliasMap = {
  Admin: 'admin',
  Manager: 'store_staff',
  Staff: 'store_staff',
  admin: 'admin',
  store_staff: 'store_staff'
};

export const getRoleBasePath = (role) => {
  const normalizedRole = roleAliasMap[role] || 'admin';
  const map = { admin: '/admin', store_staff: '/staff' };
  return map[normalizedRole] || '/admin';
};

export const getRoleFromPath = (pathname) => {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/staff')) return 'store_staff';
  return null;
};

export const adminNavConfig = {
  role: ROLES.admin,
  basePath: '/admin',
  label: 'Admin Panel',
  mainNav: navigationItems,
  children: {
    masters: mastersNavigationItems,
    inventory: inventoryNavigationItems,
    purchase: purchaseNavigationItems,
    orders: ordersNavigationItems,
    sales: salesNavigationItems,
    pricing: pricingNavigationItems,
    customers: customersNavigationItems,
    accounts: accountsNavigationItems,
    reports: reportsNavigationItems,
    gst: gstNavigationItems,
    settings: settingsNavigationItems,
  },
};

export const staffNavConfig = {
  role: ROLES.store_staff,
  basePath: '/staff',
  label: 'Staff Panel',
  mainNav: navigationItems.filter((i) => !['/settings', '/masters'].includes(i.path)),
  children: {
    inventory: inventoryNavigationItems.filter(i => ['Stock Overview', 'Stock Transfer'].includes(i.label)),
    sales: salesNavigationItems,
    customers: customersNavigationItems,
  },
};

export const getNavConfigForRole = (role) => {
  const normalizedRole = roleAliasMap[role] || 'admin';
  const map = {
    [ROLES.admin]: adminNavConfig,
    [ROLES.store_staff]: staffNavConfig,
  };
  return map[normalizedRole] || adminNavConfig;
};
