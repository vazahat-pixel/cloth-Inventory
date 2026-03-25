import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';

export const setupMatchPaths = ['/setup', '/items', '/masters/item-groups', '/gst', '/settings/preferences'];

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
    path: '/gst/tax-rates',
    matchPaths: ['/gst'],
    icon: ReceiptLongOutlinedIcon,
  },
  {
    label: 'Party Wise Settings',
    hint: 'Coming soon',
    icon: GroupsOutlinedIcon,
    disabled: true,
  },
  {
    label: 'Set Other Account Details',
    hint: 'Coming soon',
    icon: ManageAccountsOutlinedIcon,
    disabled: true,
  },
  {
    label: 'Configurations',
    hint: 'Preferences',
    path: '/settings/preferences',
    matchPaths: ['/settings/preferences'],
    icon: TuneOutlinedIcon,
  },
];
