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
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import BusinessIcon from '@mui/icons-material/Business';
import StorefrontIcon from '@mui/icons-material/Storefront';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import LockClockIcon from '@mui/icons-material/LockClock';
import WarehouseIcon from '@mui/icons-material/Store';

import { purchaseMatchPaths, purchaseNavItems } from '../modules/purchase/purchaseNavConfig';
import { itemsMatchPaths, itemsNavItems } from '../modules/items/itemsNavConfig';
import { inventoryMatchPaths, inventoryNavItems } from '../modules/inventory/inventoryNavConfig';
import { billingMatchPaths, billingNavItems } from '../modules/sales/billingNavConfig';
import { reportsQueriesMatchPaths, reportsQueriesNavItems } from '../modules/reports/reportsQueriesNavConfig';
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
  store_staff: 'store_staff',
  store_manager: 'store_staff',
  accountant: 'store_staff'
};

export const getRoleBasePath = (role) => {
  const normalizedRole = roleAliasMap[role] || role || 'admin';
  const map = { admin: '/ho', store_staff: '/store' };
  return map[normalizedRole] || '/ho';
};

const adminSidebarItems = [
  { label: 'Search Home', path: '/', icon: HomeIcon },
  { label: 'Goods Control', path: '/inventory/stock-overview', icon: Inventory2Icon, matchPaths: ['/inventory/stock-overview', '/items', '/inventory/grn', '/setup/barcode-print', '/setup/groups', '/setup/hsn-codes', '/setup/sizes', '/masters/brands'], drilldown: true },
  { label: 'Procurement (Purchase)', path: '/ho/purchase/new', icon: ShoppingCartIcon },
  { label: 'Sales & Billing', path: '/sales', icon: PointOfSaleIcon, matchPaths: billingMatchPaths, drilldown: true },
  { label: 'Reports & Analytics', path: '/reports', icon: AssessmentOutlinedIcon, matchPaths: reportsQueriesMatchPaths, drilldown: true },
  { label: 'Suppliers', path: '/masters/suppliers', icon: BusinessIcon, matchPaths: ['/masters/suppliers', '/suppliers/material-ledger'], drilldown: true },
  { label: 'Accounts & Payments', path: '/ho/accounts/vouchers', icon: AccountBalanceWalletIcon },
  { label: 'Customers & Loyalty', path: '/ho/masters/customers', icon: PeopleIcon },
  { label: 'Offer Schemes', path: '/ho/pricing/schemes', icon: LoyaltyIcon },
  { label: 'Offer Configs', path: '/ho/pricing/types', icon: SettingsSuggestIcon },
  { label: 'Manufacturing', path: '/ho/production/outwards', icon: BuildOutlinedIcon, matchPaths: ['/ho/production/outwards', '/ho/production/outwards/new'], drilldown: true },
  { label: 'Stores', path: '/ho/masters/stores', icon: StorefrontIcon },
  { label: 'Warehouse Settings', path: '/ho/settings/company', icon: WarehouseIcon },
  { label: 'Data Hub', path: '/data-import', icon: FileUploadOutlinedIcon, matchPaths: dataImportMatchPaths, drilldown: true },
];

export const adminNavConfig = {
  role: ROLES.admin,
  basePath: '/ho',
  label: 'Warehouse Dashboard',
  mainNav: adminSidebarItems,
  children: {
    '/ho/production/outwards': [
      { label: 'Job Work History', path: '/ho/production/outwards' },
      { label: 'New Fabric Issue', path: '/ho/production/outwards/new' },
    ],
    '/inventory/stock-overview': [
      { label: 'Garment Master', path: '/ho/items' },
      {label: 'Inventory Overview', path: '/ho/inventory/stock-overview'},
      {label: 'Barcode Print', path: '/ho/setup/barcode-print'},
      {label: 'Scan-to-Receipt (GRN)', path: '/ho/inventory/grn'},
      {label: 'Sale Challan / Bill (Dispatch)', path: '/ho/orders/delivery-challan'},
      {label: 'Item Groups (Hierarchy)', path: '/ho/setup/groups'},
      { label: 'HSN Masters', path: '/ho/setup/hsn-codes' },
      { label: 'Size Masters', path: '/ho/setup/sizes' },
      { label: 'Brand Registry', path: '/ho/masters/brands' },
    ],
    '/items': [{ label: 'Back to Registry', path: '/items' }],
    '/sales': billingNavItems,
    '/reports': [
      ...reportsQueriesNavItems.map(i => ({ ...i, drilldown: i.path === '/reports/financial-reports' })),
      { label: 'Consolidated Global Stock', path: '/reports/inventory/consolidated' },
      { label: 'Day-End Audit History', path: '/reports/closure' }
    ],
    '/data-import': dataImportNavItems,
    '/masters/suppliers': [
      { label: 'Supplier List', path: '/ho/masters/suppliers' },
      { label: 'Material Ledger', path: '/ho/suppliers/material-ledger' }
    ]
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
    { label: 'Sale Registry (Bills)', path: '/sales/sale-bill', icon: DescriptionOutlinedIcon },
    { label: 'Sales Returns', path: '/sales/sales-return', icon: ReceiptLongIcon },
    { label: 'Day-End Closure (Z-Report)', path: '/reports/closure', icon: LockClockIcon },
    { label: 'Stock Lookup', path: '/inventory/stock-overview', icon: Inventory2Icon },
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
