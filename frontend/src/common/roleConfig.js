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
  { label: 'Inventory Master', path: '/items', icon: Inventory2Icon, matchPaths: itemsMatchPaths, drilldown: true },
  { label: 'Stock Registry', path: '/inventory', icon: Inventory2Icon, matchPaths: inventoryMatchPaths, drilldown: true },
  { label: 'Purchase Voucher', path: '/purchase', icon: ShoppingCartIcon, matchPaths: purchaseMatchPaths, drilldown: true },
  { label: 'Material Issue (Outward)', path: '/supplier-outward', icon: BuildOutlinedIcon, drilldown: true },
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
    '/items': [
      { label: 'Garment Master (FG)', path: '/ho/items' },
      { label: 'Stock Registry (RM)', path: '/ho/inventory/raw-materials' },
      { label: 'Barcode Print (Pre-Receipt)', path: '/ho/setup/barcode-print' },
    ],
    '/accounts': accountsNavItems.map(i => ({ ...i, drilldown: ['/accounts/vouchers', '/accounts/printing', '/accounts/utilities'].includes(i.path) })),
    '/purchase': [
      { label: 'Purchase Voucher (RM/ACC)', path: '/ho/purchase/purchase-voucher' },
      { label: 'Purchase Returns', path: '/ho/purchase/purchase-return' },
    ],
    '/inventory': [
      { label: 'Inventory (Garments)', path: '/ho/inventory/stock-overview' },
      { label: 'Inventory (Raw Material)', path: '/ho/inventory/raw-materials' },
      { label: 'Material Issue (Outward)', path: '/ho/inventory/supplier-outward' },
      { label: 'Scan-to-Receipt (GRN)', path: '/ho/grn' },
    ],
    '/supplier-outward': [
      { label: 'Material Issue Registry', path: '/ho/inventory/supplier-outward' },
      { label: 'Issue New Material', path: '/ho/inventory/supplier-outward/new' }
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
