import {
  navigationItems,
  mastersNavigationItems,
  inventoryNavigationItems,
  purchaseNavigationItems,
  salesNavigationItems,
  reportsNavigationItems,
  setupNavigationItems,
  settingsNavigationItems,
} from './navigation';

export const ROLES = {
  admin: 'admin',
  store_staff: 'store_staff',
};

const roleAliasMap = {
  Admin: 'admin',
  Manager: 'store_staff',
  Staff: 'store_staff',
  admin: 'admin',
  store_staff: 'store_staff'
};

export const getRoleBasePath = (role) => {
  const normalizedRole = roleAliasMap[role] || 'admin';
  const map = { admin: '/ho', store_staff: '/store' };
  return map[normalizedRole] || '/ho';
};

export const adminNavConfig = {
  role: ROLES.admin,
  basePath: '/ho',
  label: 'HO Panel',
  mainNav: navigationItems.filter(i => !['/pricing', '/customers', '/gst'].includes(i.path)),
  children: {
    masters: mastersNavigationItems,
    inventory: inventoryNavigationItems,
    purchase: purchaseNavigationItems,
    sales: salesNavigationItems.filter(i => i.label !== 'New Sale (POS)'),
    reports: reportsNavigationItems,
    setup: setupNavigationItems,
    settings: settingsNavigationItems,
  },
};

export const staffNavConfig = {
  role: ROLES.store_staff,
  basePath: '/store',
  label: 'Store Panel',
  mainNav: navigationItems.filter((i) => ['/', '/inventory', '/purchase', '/sales', '/data-import', '/reports'].includes(i.path)),
  children: {
    inventory: inventoryNavigationItems.filter(i => ['Stock Overview', 'Transfer'].includes(i.label)),
    sales: salesNavigationItems,
    purchase: purchaseNavigationItems.filter(i => i.label === 'Purchase Return'),
    reports: reportsNavigationItems.filter(i => ['Daily Sales', 'Stock Report'].includes(i.label)),
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

export const getRoleFromPath = (pathname) => {
  if (pathname.startsWith('/ho')) return 'admin';
  if (pathname.startsWith('/store')) return 'store_staff';
  return null;
};
