import DynamicFeedOutlinedIcon from '@mui/icons-material/DynamicFeedOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import PriceChangeOutlinedIcon from '@mui/icons-material/PriceChangeOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';

export const setupAccountsMatchPaths = ['/setup/accounts'];

export const setupAccountsNavItems = [
  {
    key: 'custom-fields',
    label: 'Custom Fields',
    path: '/setup/accounts/custom-fields',
    icon: DynamicFeedOutlinedIcon,
  },
  {
    key: 'country',
    label: 'Country',
    path: '/setup/accounts/country',
    icon: PublicOutlinedIcon,
  },
  {
    key: 'states',
    label: 'States',
    path: '/setup/accounts/states',
    icon: PlaceOutlinedIcon,
  },
  {
    key: 'city',
    label: 'City',
    path: '/setup/accounts/city',
    icon: PlaceOutlinedIcon,
  },
  {
    key: 'new-account',
    label: 'Account Master',
    path: '/setup/accounts/new-account',
    icon: AccountBalanceWalletOutlinedIcon,
  },
  {
    key: 'customer-database',
    label: 'Customer Database',
    path: '/setup/accounts/customer-database',
    icon: GroupsOutlinedIcon,
  },
  {
    key: 'account-groups',
    label: 'Account Groups',
    path: '/setup/accounts/account-groups',
    icon: AccountTreeOutlinedIcon,
  },
  {
    key: 'balance-sheet-groups',
    label: 'Balance Sheet Groups',
    path: '/setup/accounts/balance-sheet-groups',
    icon: AccountTreeOutlinedIcon,
  },
  {
    key: 'allocate-balance-sheet-groups',
    label: 'Allocate B/S Groups',
    path: '/setup/accounts/allocate-balance-sheet-groups',
    icon: PriceChangeOutlinedIcon,
  },
  {
    key: 'branch-setup',
    label: 'Branch Setup',
    path: '/setup/accounts/branch-setup',
    icon: ApartmentOutlinedIcon,
  },
  {
    key: 'agents',
    label: 'Agents',
    path: '/setup/accounts/agents',
    icon: SupportAgentOutlinedIcon,
  },
];

export const setupAccountsPlaceholderContent = {};
