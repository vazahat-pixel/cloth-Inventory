import {
  navigationItems,
  mastersNavigationItems,
  inventoryNavigationItems,
  purchaseNavigationItems,
  salesNavigationItems,
  reportsNavigationItems,
  setupNavigationItems,
  settingsNavigationItems,
  itemsNavigationItems,
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
  mainNav: [
    ...navigationItems.filter(i => !['/pricing', '/customers', '/gst', '/sales'].includes(i.path)),
    { label: "Sales (Orders)", path: "/orders" }
  ],
  children: {
    items: itemsNavigationItems,
    masters: mastersNavigationItems,
    inventory: inventoryNavigationItems,
    purchase: purchaseNavigationItems.filter(i => i.label !== 'Purchase Return'),
    sales: [
      { label: "Sale Orders", path: "/orders" },
      { label: "Delivery Challans", path: "/orders/delivery-challan" },
    ],
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
    { label: 'Inventory', path: '/inventory' },
    { label: 'Data Import & Export', path: '/data-import' },
    { label: 'POS - Sales', path: '/sales' },
    { label: 'Reports', path: '/reports' },
  ],
  children: {
    items: itemsNavigationItems.filter(i => i.label === 'Item List'),
    purchase: purchaseNavigationItems.filter(i => i.label !== 'Purchase Orders'),
    inventory: inventoryNavigationItems.filter(i => i.label === 'Stock Overview'),
    sales: salesNavigationItems.filter(i => i.label !== 'Delivery Challans'),
    reports: reportsNavigationItems,
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
