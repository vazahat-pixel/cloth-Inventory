import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';

export const setupMatchPaths = [
  '/setup',
  '/items',
  '/masters/item-groups',
  '/gst',
  '/settings/preferences',
  '/setup/party-wise',
  '/setup/other-account-details',
  '/setup/configurations'
];

export const setupNavItems = [
  {
    label: 'Setup Accounts',
    hint: 'Account masters',
    path: '/setup/accounts',
    icon: AccountBalanceWalletOutlinedIcon,
  },
  {
    label: 'Setup Items',
    hint: 'Item masters',
    path: '/items',
    matchPaths: ['/items'],
    icon: Inventory2OutlinedIcon,
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
];
