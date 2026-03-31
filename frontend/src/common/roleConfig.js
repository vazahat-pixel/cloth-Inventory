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
import { orderProcessingMatchPaths, orderProcessingNavItems } from '../modules/orders/orderProcessingNavConfig';
import { inventoryMatchPaths, inventoryNavItems } from '../modules/inventory/inventoryNavConfig';
import { billingMatchPaths, billingNavItems } from '../modules/sales/billingNavConfig';
import { payrollSetupsMatchPaths, payrollSetupsNavItems } from '../modules/payroll/payrollSetupsNavConfig';
import { payrollEntryMatchPaths, payrollEntryNavItems } from '../modules/payroll/payrollEntryNavConfig';
import { payrollReportsMatchPaths, payrollReportsNavItems } from '../modules/payroll/payrollReportsNavConfig';
import { reportsQueriesMatchPaths, reportsQueriesNavItems } from '../modules/reports/reportsQueriesNavConfig';
import { financialReportsNavItems } from '../modules/reports/financialReportsNavConfig';
import { utilitiesMatchPaths, utilitiesNavItems } from '../modules/utilities/utilitiesNavConfig';
import { userAccessMatchPaths, userAccessNavItems, userAccessReportNavItems } from '../modules/userAccess/userAccessNavConfig';
import { productionMatchPaths, productionNavItems } from '../modules/production/productionNavConfig';
import { productionSetupsNavItems } from '../modules/production/productionSetupsNavConfig';
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
  { label: 'My Messages', icon: DescriptionOutlinedIcon, disabled: true },
  { label: 'Setup', path: '/setup', icon: SettingsOutlinedIcon, matchPaths: setupMatchPaths, drilldown: true },
  { label: 'Items', path: '/items', icon: Inventory2Icon, matchPaths: itemsMatchPaths, drilldown: true },
  { label: 'Accounts', path: '/accounts', icon: AccountBalanceWalletIcon, matchPaths: accountsMatchPaths, drilldown: true },
  { label: 'Purchase', path: '/purchase', icon: ShoppingCartIcon, matchPaths: purchaseMatchPaths, drilldown: true },
  { label: 'Order Processing', path: '/orders', icon: ReceiptLongIcon, matchPaths: orderProcessingMatchPaths, drilldown: true },
  { label: 'Inventory', path: '/inventory', icon: Inventory2Icon, matchPaths: inventoryMatchPaths, drilldown: true },
  { label: 'Billing', path: '/sales', icon: PointOfSaleIcon, matchPaths: billingMatchPaths, drilldown: true },
  { label: 'Production', path: '/production', icon: InventoryIcon, matchPaths: productionMatchPaths, drilldown: true },
  { label: 'Payroll Setups', path: '/payroll-setups', icon: RequestQuoteIcon, matchPaths: payrollSetupsMatchPaths, drilldown: true },
  { label: 'Payroll Entry', path: '/payroll-entry', icon: ReceiptIcon, matchPaths: payrollEntryMatchPaths, drilldown: true },
  { label: 'Payroll Reports', path: '/payroll-reports', icon: AssessmentOutlinedIcon, matchPaths: payrollReportsMatchPaths, drilldown: true },
  { label: 'Reports/Queries', path: '/reports', icon: AssessmentOutlinedIcon, matchPaths: reportsQueriesMatchPaths, drilldown: true },
  { label: 'Business Insights', path: '/reports/profit', icon: TrendingUpIcon },
  { label: 'Utilities', path: '/utilities', icon: BuildOutlinedIcon, matchPaths: utilitiesMatchPaths, drilldown: true },
  { label: 'User Access', path: '/user-access', icon: PeopleIcon, matchPaths: userAccessMatchPaths, drilldown: true },
  { label: 'Export/Import Masters/Txns', path: '/data-import', icon: FileUploadOutlinedIcon, matchPaths: dataImportMatchPaths, drilldown: true },
];

export const adminNavConfig = {
  role: ROLES.admin,
  basePath: '/ho',
  label: 'Head Office',
  mainNav: adminSidebarItems,
  children: {
    '/setup': setupNavItems.map(i => ({ ...i, drilldown: ['/setup/accounts', '/setup/taxes', '/setup/party-wise', '/setup/other-account-details', '/setup/configurations'].includes(i.path) })),
    '/items': itemsNavItems,
    '/accounts': accountsNavItems.map(i => ({ ...i, drilldown: ['/accounts/vouchers', '/accounts/printing', '/accounts/utilities'].includes(i.path) })),
    '/purchase': purchaseNavItems,
    '/orders': orderProcessingNavItems,
    '/inventory': inventoryNavItems,
    '/sales': billingNavItems,
    '/production': productionNavItems.map(i => ({ ...i, drilldown: i.path === '/production/setups' })),
    '/payroll-setups': payrollSetupsNavItems,
    '/payroll-entry': payrollEntryNavItems,
    '/payroll-reports': payrollReportsNavItems,
    '/reports': reportsQueriesNavItems.map(i => ({ ...i, drilldown: i.path === '/reports/financial-reports' })),
    '/utilities': utilitiesNavItems,
    '/user-access': userAccessNavItems,
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
    '/production/setups': productionSetupsNavItems,
    '/user-access/reports': userAccessReportNavItems,
  },
};

export const staffNavConfig = {
  role: ROLES.store_staff,
  basePath: '/store',
  label: 'Store Portal',
  mainNav: [
    { label: 'Search Home', path: '/', icon: HomeIcon },
    { label: 'Stock Overview', path: '/inventory/stock-overview', icon: Inventory2Icon },
    { label: 'POS - Billing', path: '/sales/sale-bill/new', icon: PointOfSaleIcon },
    { label: 'Sales Returns', path: '/sales/sales-return', icon: ReceiptLongIcon },
    { label: 'Barcode Info', path: '/inventory/audit-view', icon: PointOfSaleIcon }, // For scanning/checking
  ],
  children: {
    '/inventory': inventoryNavItems.filter(i => ['/inventory/stock-overview', '/inventory/audit-view'].includes(i.path)),
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
