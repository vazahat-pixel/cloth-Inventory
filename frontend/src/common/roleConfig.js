import {
  inventoryNavigationItems,
  purchaseNavigationItems,
  salesNavigationItems,
  reportsNavigationItems,
  settingsNavigationItems,
  itemsNavigationItems,
} from './navigation';
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
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { setupMatchPaths } from '../modules/setup/setupNavConfig';
import { accountsMatchPaths } from '../modules/accounts/accountsNavConfig';
import { purchaseMatchPaths } from '../modules/purchase/purchaseNavConfig';
import { orderProcessingMatchPaths } from '../modules/orders/orderProcessingNavConfig';
import { inventoryMatchPaths } from '../modules/inventory/inventoryNavConfig';
import { billingMatchPaths } from '../modules/sales/billingNavConfig';
import { payrollSetupsMatchPaths } from '../modules/payroll/payrollSetupsNavConfig';
import { productionMatchPaths } from '../modules/production/productionNavConfig';
import { payrollEntryMatchPaths } from '../modules/payroll/payrollEntryNavConfig';
import { payrollReportsMatchPaths } from '../modules/payroll/payrollReportsNavConfig';
import { reportsQueriesMatchPaths } from '../modules/reports/reportsQueriesNavConfig';
import { utilitiesMatchPaths } from '../modules/utilities/utilitiesNavConfig';
import { userAccessMatchPaths } from '../modules/userAccess/userAccessNavConfig';

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
  {
    label: 'Setup',
    path: '/setup',
    icon: SettingsOutlinedIcon,
    matchPaths: setupMatchPaths,
  },
  { label: 'Accounts', path: '/accounts', icon: AccountBalanceWalletIcon, matchPaths: accountsMatchPaths },
  { label: 'Purchase', path: '/purchase', icon: ShoppingCartIcon, matchPaths: purchaseMatchPaths },
  { label: 'Order Processing', path: '/orders', icon: ReceiptLongIcon, matchPaths: orderProcessingMatchPaths },
  { label: 'Inventory', path: '/inventory', icon: Inventory2Icon, matchPaths: inventoryMatchPaths },
  { label: 'Billing', path: '/sales', icon: PointOfSaleIcon, matchPaths: billingMatchPaths },
  { label: 'Production', path: '/production', icon: InventoryIcon, matchPaths: productionMatchPaths },
  { label: 'Payroll Setups', path: '/payroll-setups', icon: RequestQuoteIcon, matchPaths: payrollSetupsMatchPaths },
  { label: 'Payroll Entry', path: '/payroll-entry', icon: ReceiptIcon, matchPaths: payrollEntryMatchPaths },
  { label: 'Payroll Reports', path: '/payroll-reports', icon: AssessmentOutlinedIcon, matchPaths: payrollReportsMatchPaths },
  { label: 'Reports/Queries', path: '/reports', icon: AssessmentOutlinedIcon, matchPaths: reportsQueriesMatchPaths },
  { label: 'Business Insights', path: '/reports/profit', icon: TrendingUpIcon },
  { label: 'Utilities', path: '/utilities', icon: BuildOutlinedIcon, matchPaths: utilitiesMatchPaths },
  { label: 'User Access', path: '/user-access', icon: PeopleIcon, matchPaths: userAccessMatchPaths },
  { label: 'Export/Import Masters/Txns from Excel', path: '/data-import', icon: FileUploadOutlinedIcon },
  { label: 'Export/Import Masters/Txns', icon: FileDownloadOutlinedIcon, disabled: true },
];

export const adminNavConfig = {
  role: ROLES.admin,
  basePath: '/ho',
  label: 'HO Panel',
  mainNav: adminSidebarItems,
  children: {},
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
