import HomeIcon from '@mui/icons-material/Home';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import InventoryIcon from '@mui/icons-material/Inventory';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import PeopleIcon from '@mui/icons-material/People';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import LockClockIcon from '@mui/icons-material/LockClock';

import { setupMatchPaths, setupNavItems } from '../modules/setup/setupNavConfig';
import { setupAccountsNavItems } from '../modules/setup/setupAccountsNavConfig';
import { setupTaxesNavItems } from '../modules/setup/setupTaxesNavConfig';
import { partyWiseNavItems } from '../modules/setup/partyWiseNavConfig';
import { otherAccountNavItems } from '../modules/setup/otherAccountNavConfig';
import { configurationsNavItems } from '../modules/setup/configurationsNavConfig';

import { accountsMatchPaths, accountsNavItems } from '../modules/accounts/accountsNavConfig';
import { acVouchersNavItems } from '../modules/accounts/acVouchersNavConfig';
import { continuousPrintingNavItems } from '../modules/accounts/continuousPrintingNavConfig';
import { accountsUtilitiesNavItems } from '../modules/accounts/accountsUtilitiesNavConfig';

import { purchaseMatchPaths, purchaseNavItems } from '../modules/purchase/purchaseNavConfig';
import { itemsMatchPaths, itemsNavItems } from '../modules/items/itemsNavConfig';
import { inventoryMatchPaths, inventoryNavItems } from '../modules/inventory/inventoryNavConfig';
import { billingMatchPaths, billingNavItems } from '../modules/sales/billingNavConfig';
import { reportsQueriesMatchPaths, reportsQueriesNavItems } from '../modules/reports/reportsQueriesNavConfig';
import { financialReportsNavItems } from '../modules/reports/financialReportsNavConfig';
import { dataImportMatchPaths, dataImportNavItems } from '../modules/data/dataImportNavConfig';

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

const adminSidebarItems = [
  { label: 'Search Home', path: '/', icon: HomeIcon },
  { label: 'Items', path: '/items', icon: Inventory2Icon, matchPaths: itemsMatchPaths, drilldown: true },
  { label: 'Inventory (Stock)', path: '/inventory', icon: Inventory2Icon, matchPaths: inventoryMatchPaths, drilldown: true },
  { label: 'Purchase', path: '/purchase', icon: ShoppingCartIcon, matchPaths: purchaseMatchPaths, drilldown: true },
  { label: 'Job Work Production', path: '/supplier-outward', icon: BuildOutlinedIcon, drilldown: true },
  { label: 'Sales & Billing', path: '/sales', icon: PointOfSaleIcon, matchPaths: billingMatchPaths, drilldown: true },
  { label: 'Reports & Analytics', path: '/reports', icon: AssessmentOutlinedIcon, matchPaths: reportsQueriesMatchPaths, drilldown: true },
  { label: 'Accounts', path: '/accounts', icon: AccountBalanceWalletIcon, matchPaths: accountsMatchPaths, drilldown: true },
  { label: 'Setup', path: '/setup', icon: SettingsOutlinedIcon, matchPaths: setupMatchPaths, drilldown: true },
  { label: 'Data Hub', path: '/data-import', icon: FileUploadOutlinedIcon, matchPaths: dataImportNavItems, drilldown: true },
];

export const adminNavConfig = {
  role: ROLES.admin,
  basePath: '/ho',
  label: 'Warehouse Dashboard',
  mainNav: adminSidebarItems,
  children: {
    '/setup': setupNavItems.map(i => ({ ...i, drilldown: ['/setup/accounts', '/setup/taxes', '/setup/party-wise', '/setup/other-account-details', '/setup/configurations'].includes(i.path) })),
    '/items': itemsNavItems,
    '/accounts': accountsNavItems.map(i => ({ ...i, drilldown: ['/accounts/vouchers', '/accounts/printing', '/accounts/utilities'].includes(i.path) })),
    '/purchase': purchaseNavItems,
    '/inventory': [
      { label: 'Warehouse Stock Registry', path: '/inventory/stock-overview' },
      { label: 'Accessory Direct Inward', path: '/ho/inventory/accessory-entry' },
      { label: 'GRN Automation (FG)', path: '/inventory/grn/new' },
      { label: 'Stock Movement Audit', path: '/inventory/movement' }
    ],
    '/supplier-outward': [
      { label: 'Outward Dispatch', path: '/supplier-outward/new' },
      { label: 'Outward History', path: '/supplier-outward/list' },
      { label: 'Supplier Stock Audit', path: '/supplier-outward/audit' },
      { label: 'Finished Goods Receipt (GRN)', path: '/inventory/grn/new' }
    ],
    '/sales': billingNavItems,
    '/reports': [
      ...reportsQueriesNavItems.map(i => ({ ...i, drilldown: i.path === '/reports/financial-reports' })),
      { label: 'Production Yield Analysis', path: '/reports/production/yield' },
      { label: 'Consolidated Global Stock', path: '/reports/inventory/consolidated' },
      { label: 'Day-End Audit History', path: '/reports/closure' }
    ],
    '/data-import': dataImportNavItems,
    
    // Level 2
    '/setup/accounts': setupAccountsNavItems,
    '/setup/taxes': setupTaxesNavItems,
    '/setup/party-wise': partyWiseNavItems,
    '/setup/other-account-details': otherAccountNavItems,
    '/setup/configurations': configurationsNavItems,
    '/accounts/vouchers': acVouchersNavItems,
    '/accounts/printing': continuousPrintingNavItems,
    '/accounts/utilities': accountsUtilitiesNavItems,
    '/reports/financial-reports': financialReportsNavItems,
  },
};

export const staffNavConfig = {
  role: ROLES.store_staff,
  basePath: '/store',
  label: 'Branch Portal',
  mainNav: [
    { label: 'Search Home', path: '/', icon: HomeIcon },
    { label: 'Store Receipt (Inward)', path: '/inventory/receipt', icon: ReceiptIcon },
    { label: 'Billing POS', path: '/sales/sale-bill/new', icon: PointOfSaleIcon },
    { label: 'Day-End Closure (Z-Report)', path: '/reports/closure', icon: LockClockIcon },
    { label: 'Stock Lookup', path: '/inventory/stock-overview', icon: Inventory2Icon },
    { label: 'Sales Returns', path: '/sales/sales-return', icon: ReceiptLongIcon },
    { label: 'Analytics', path: '/reports', icon: AssessmentOutlinedIcon, matchPaths: ['/reports'], drilldown: true },
  ],
  children: {
    '/inventory': [
      { label: 'Stock Overview', path: '/inventory/stock-overview' },
      { label: 'Store Receipt', path: '/inventory/receipt' },
      { label: 'Barcode Info', path: '/inventory/audit-view' }
    ],
    '/reports': [
      { label: 'Sales Report', path: '/reports/sales' },
      { label: 'Purchase Report', path: '/reports/purchase' },
      { label: 'Stock Report', path: '/reports/stock' },
      { label: 'Collection Report', path: '/reports/collection' },
      { label: 'Day-End Closure', path: '/reports/closure' },
    ],
    '/sales': billingNavItems.filter(i => ['/sales/sale-bill', '/sales/sales-return'].includes(i.path)),
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
