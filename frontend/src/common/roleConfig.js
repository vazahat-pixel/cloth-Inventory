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
  { label: 'Goods Control', path: '/inventory/stock-overview', icon: Inventory2Icon, matchPaths: ['/inventory/stock-overview', '/items', '/grn', '/setup/barcode-print', '/setup/groups', '/setup/hsn-codes', '/setup/sizes', '/masters/brands'], drilldown: true },
  { label: 'Material Production Logs', path: '/inventory/supplier-outward', icon: BuildOutlinedIcon, matchPaths: ['/inventory/supplier-outward', '/inventory/consumption'], drilldown: true },
  { label: 'Sales & Billing', path: '/sales', icon: PointOfSaleIcon, matchPaths: billingMatchPaths, drilldown: true },
  { label: 'Reports & Analytics', path: '/reports', icon: AssessmentOutlinedIcon, matchPaths: reportsQueriesMatchPaths, drilldown: true },
  { label: 'Accounts', path: '/accounts', icon: AccountBalanceWalletIcon, matchPaths: accountsMatchPaths, drilldown: true },
  { label: 'Master Registry', path: '/masters', icon: PeopleIcon, matchPaths: ['/masters'], drilldown: true },
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
    '/accounts': accountsNavItems.map(i => ({ ...i, drilldown: ['/accounts/vouchers', '/accounts/printing', '/accounts/utilities'].includes(i.path) })),
    '/inventory/stock-overview': [
      { label: 'Garment Master', path: '/ho/items' },
      { label: 'Inventory Overview', path: '/ho/inventory/stock-overview' },
      { label: 'Barcode Print', path: '/ho/setup/barcode-print' },
      { label: 'Scan-to-Receipt (GRN)', path: '/ho/grn' },
      { label: 'Item Groups (Hierarchy)', path: '/ho/setup/groups' },
      { label: 'HSN Masters', path: '/ho/setup/hsn-codes' },
      { label: 'Size Masters', path: '/ho/setup/sizes' },
      { label: 'Brand Registry', path: '/ho/masters/brands' },
    ],
    '/items': [{ label: 'Back to Registry', path: '/ho/inventory' }],
    '/inventory/supplier-outward': [
      { label: 'Raw Material Registry', path: '/ho/inventory/raw-materials' },
      { label: 'Add New Factory Supply', path: '/ho/inventory/raw-materials/new' },
      { label: 'Material Issuance (Out)', path: '/ho/inventory/supplier-outward' },
      { label: 'Issue New Material', path: '/ho/inventory/supplier-outward/new' },
      { label: 'Material Consumption Log', path: '/ho/inventory/consumption' },
      { label: 'Record Production Waste', path: '/ho/inventory/consumption/new' }
    ],
    '/sales': billingNavItems,
    '/reports': [
      ...reportsQueriesNavItems.map(i => ({ ...i, drilldown: i.path === '/reports/financial-reports' })),
      { label: 'Production Yield Analysis', path: '/reports/production/yield' },
      { label: 'Consolidated Global Stock', path: '/reports/inventory/consolidated' },
      { label: 'Day-End Audit History', path: '/reports/closure' }
    ],
    '/masters': [
      { label: 'Suppliers', path: '/ho/masters/suppliers' },
      { label: 'Customers', path: '/ho/masters/customers' },
      { label: 'Stores', path: '/ho/masters/stores' },
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
