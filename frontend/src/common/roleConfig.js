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
  Admin: 'Admin',
  Manager: 'Manager',
  Staff: 'Staff',
};

export const getRoleBasePath = (role) => {
  const map = { Admin: '/admin', Manager: '/manager', Staff: '/staff' };
  return map[role] || '/admin';
};

export const getRoleFromPath = (pathname) => {
  if (pathname.startsWith('/admin')) return 'Admin';
  if (pathname.startsWith('/manager')) return 'Manager';
  if (pathname.startsWith('/staff')) return 'Staff';
  return null;
};

export const adminNavConfig = {
  role: ROLES.Admin,
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

export const managerNavConfig = {
  role: ROLES.Manager,
  basePath: '/manager',
  label: 'Manager Panel',
  mainNav: navigationItems.filter((i) => i.path !== '/settings'),
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
  },
};

export const staffNavConfig = {
  role: ROLES.Staff,
  basePath: '/staff',
  label: 'Staff Panel',
  mainNav: [
    { label: 'Dashboard', path: '/' },
    { label: 'Items', path: '/items' },
    { label: 'Inventory', path: '/inventory' },
    { label: 'Sales', path: '/sales' },
  ],
  children: {
    inventory: [{ label: 'Stock Overview', path: '/inventory/stock-overview' }],
    sales: [
      { label: 'Sales Invoices', path: '/sales' },
      { label: 'New Sale', path: '/sales/new' },
    ],
  },
};

export const getNavConfigForRole = (role) => {
  const map = {
    [ROLES.Admin]: adminNavConfig,
    [ROLES.Manager]: managerNavConfig,
    [ROLES.Staff]: staffNavConfig,
  };
  return map[role] || adminNavConfig;
};
