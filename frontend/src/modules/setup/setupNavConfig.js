import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

export const setupMatchPaths = [
  '/setup',
  '/clothing-erp',
  '/masters/item-groups',
  '/masters/suppliers',
  '/gst',
  '/setup/groups',
  '/setup/hsn-codes',
  '/setup/sizes',
  '/setup/barcode-print',
  '/settings/preferences',
  '/setup/party-wise',
  '/setup/other-account-details',
  '/setup/configurations'
];

export const setupNavItems = [
  {
    label: 'Setup Overview',
    hint: 'ERP setup workspace',
    path: '/setup',
    matchPaths: ['/setup'],
    icon: TuneOutlinedIcon,
  },
  {
    label: 'Groups',
    hint: 'Hierarchy master',
    path: '/setup/groups',
    matchPaths: ['/setup/groups', '/masters/item-groups', '/clothing-erp'],
    icon: CategoryOutlinedIcon,
  },
  {
    label: 'HSN Codes',
    hint: 'HSN and GST slabs',
    path: '/setup/hsn-codes',
    matchPaths: ['/setup/hsn-codes'],
    icon: ReceiptLongOutlinedIcon,
  },
  {
    label: 'Sizes',
    hint: 'Size master',
    path: '/setup/sizes',
    matchPaths: ['/setup/sizes'],
    icon: Inventory2OutlinedIcon,
  },
  {
    label: 'Suppliers',
    hint: 'Vendor master',
    path: '/masters/suppliers',
    matchPaths: ['/masters/suppliers'],
    icon: GroupsOutlinedIcon,
  },
  {
    label: 'Barcode Print',
    hint: 'Label generation',
    path: '/setup/barcode-print',
    matchPaths: ['/setup/barcode-print'],
    icon: ReceiptLongOutlinedIcon,
  },
  {
    label: 'Setup Accounts',
    hint: 'Account masters',
    path: '/setup/accounts',
    icon: AccountBalanceWalletOutlinedIcon,
  },
  {
    label: 'Set Other Item Details',
    hint: 'Item groups',
    path: '/masters/item-groups',
    matchPaths: ['/masters/item-groups'],
    icon: CategoryOutlinedIcon,
  },
  {
    label: 'Setup Taxes',
    hint: 'GST setup',
    path: '/setup/taxes',
    matchPaths: ['/setup/taxes', '/gst'],
    icon: ReceiptLongOutlinedIcon,
  },
  {
    label: 'Party Wise Settings',
    hint: 'Party masters',
    path: '/setup/party-wise',
    matchPaths: ['/setup/party-wise'],
    icon: GroupsOutlinedIcon,
  },
  {
    label: 'Set Other Account Details',
    hint: 'Advanced account settings',
    path: '/setup/other-account-details',
    matchPaths: ['/setup/other-account-details'],
    icon: ManageAccountsOutlinedIcon,
  },
  {
    label: 'Configurations',
    hint: 'System behavior',
    path: '/setup/configurations',
    matchPaths: ['/setup/configurations'],
    icon: TuneOutlinedIcon,
  },
  {
    label: 'Warehouse Settings',
    hint: 'Address, GST, Profile',
    path: '/masters/warehouses/settings',
    icon: SettingsOutlinedIcon,
  },
];
