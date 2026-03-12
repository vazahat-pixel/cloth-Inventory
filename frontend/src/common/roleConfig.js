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
  mainNav: [
    { label: 'Purchase', path: '/purchase' },
    { label: 'Data Import & Export', path: '/data-import' },
    { label: 'POS - Sales', path: '/sales' },
    { label: 'Reports', path: '/reports' },
  ],
  children: {
    purchase: purchaseNavigationItems.filter(i => i.label !== 'Purchase Orders'), // Exclude HO level PO management
    sales: salesNavigationItems.filter(i => i.label !== 'Delivery Challans'),
    reports: reportsNavigationItems, // Backend will filter data based on user.shopId
    dataImport: settingsNavigationItems.filter(i => i.label === 'Data Import'),
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
