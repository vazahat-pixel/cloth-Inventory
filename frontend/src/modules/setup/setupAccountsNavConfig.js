import DynamicFeedOutlinedIcon from '@mui/icons-material/DynamicFeedOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import PriceChangeOutlinedIcon from '@mui/icons-material/PriceChangeOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';

export const setupAccountsMatchPaths = ['/setup/accounts'];

const createPlaceholder = (title, description, actions = []) => ({
  title,
  description,
  highlights: [
    `${title} is now available inside the Setup Accounts side flow on the frontend.`,
    'This section is ready for the detailed form, table, or allocation workflow later.',
    'The submenu is wired so each account-setup field opens on the right side immediately.',
  ],
  actions,
});

export const setupAccountsNavItems = [
  {
    key: 'custom-fields',
    label: 'Setup Custom Fields for Accounts Master',
    path: '/setup/accounts/custom-fields',
    icon: DynamicFeedOutlinedIcon,
  },
  {
    key: 'country',
    label: 'Setup Country',
    path: '/setup/accounts/country',
    icon: PublicOutlinedIcon,
  },
  {
    key: 'states',
    label: 'Setup States',
    path: '/setup/accounts/states',
    icon: PlaceOutlinedIcon,
  },
  {
    key: 'city',
    label: 'Setup City',
    path: '/setup/accounts/city',
    icon: PlaceOutlinedIcon,
  },
  {
    key: 'new-account',
    label: 'Setup New Account',
    path: '/setup/accounts/new-account',
    icon: AccountBalanceWalletOutlinedIcon,
  },
  {
    key: 'opening-trial',
    label: 'Enter Opening Trial',
    path: '/setup/accounts/opening-trial',
    icon: ListAltOutlinedIcon,
  },
  {
    key: 'predefined-narrations',
    label: 'Setup Pre-Defined Narrations',
    path: '/setup/accounts/predefined-narrations',
    icon: NotesOutlinedIcon,
  },
  {
    key: 'profit-centers',
    label: 'Setup Profit Centers',
    path: '/setup/accounts/profit-centers',
    icon: AccountTreeOutlinedIcon,
  },
  {
    key: 'cost-centers',
    label: 'Setup Cost Centers',
    path: '/setup/accounts/cost-centers',
    icon: AccountTreeOutlinedIcon,
  },
  {
    key: 'cost-center-groups',
    label: 'Setup Cost Center Groups',
    path: '/setup/accounts/cost-center-groups',
    icon: AccountTreeOutlinedIcon,
  },
  {
    key: 'allocate-cost-centers',
    label: 'Allocate Accounts to Cost Centers',
    path: '/setup/accounts/allocate-cost-centers',
    icon: PriceChangeOutlinedIcon,
  },
  {
    key: 'cost-element-budgets',
    label: 'Setup Cost Element Wise Budgets',
    path: '/setup/accounts/cost-element-budgets',
    icon: PriceChangeOutlinedIcon,
  },
  {
    key: 'transporters',
    label: 'Setup Transporters',
    path: '/setup/accounts/transporters',
    icon: LocalShippingOutlinedIcon,
  },
  {
    key: 'transport-destinations',
    label: 'Setup Transport Destinations',
    path: '/setup/accounts/transport-destinations',
    icon: LocalShippingOutlinedIcon,
  },
  {
    key: 'tax-forms',
    label: 'Setup Tax Forms',
    path: '/setup/accounts/tax-forms',
    icon: DescriptionOutlinedIcon,
  },
  {
    key: 'allocate-tax-forms',
    label: 'Allocate Accounts to Tax Forms',
    path: '/setup/accounts/allocate-tax-forms',
    icon: DescriptionOutlinedIcon,
  },
  {
    key: 'tds-types',
    label: 'Setup TDS Types',
    path: '/setup/accounts/tds-types',
    icon: PaymentsOutlinedIcon,
  },
  {
    key: 'allocate-tds-types',
    label: 'Allocate Accounts to TDS Types',
    path: '/setup/accounts/allocate-tds-types',
    icon: PaymentsOutlinedIcon,
  },
  {
    key: 'fbt-types',
    label: 'Setup FBT Types',
    path: '/setup/accounts/fbt-types',
    icon: PaymentsOutlinedIcon,
  },
  {
    key: 'allocate-fbt-types',
    label: 'Allocate Accounts to FBT Types',
    path: '/setup/accounts/allocate-fbt-types',
    icon: PaymentsOutlinedIcon,
  },
  {
    key: 'customer-database',
    label: 'Setup Customer Database',
    path: '/setup/accounts/customer-database',
    icon: GroupsOutlinedIcon,
  },
  {
    key: 'account-groups',
    label: 'Setup Account Groups',
    path: '/setup/accounts/account-groups',
    icon: AccountTreeOutlinedIcon,
  },
  {
    key: 'balance-sheet-groups',
    label: 'Setup Balance Sheet Groups',
    path: '/setup/accounts/balance-sheet-groups',
    icon: AccountTreeOutlinedIcon,
  },
  {
    key: 'allocate-balance-sheet-groups',
    label: 'Allocate Accounts to Balance Sheet Groups',
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
    label: 'Setup Agents',
    path: '/setup/accounts/agents',
    icon: SupportAgentOutlinedIcon,
  },
];

export const setupAccountsPlaceholderContent = {
  'custom-fields': createPlaceholder(
    'Setup Custom Fields for Accounts Master',
    'This frontend section is ready for custom account master fields, extra attributes, and account-level metadata configuration.',
    [
      { label: 'Open Setup New Account', path: '/setup/accounts/new-account', variant: 'contained' },
      { label: 'Open Setup Account Groups', path: '/setup/accounts/account-groups', variant: 'outlined' },
    ],
  ),
  country: createPlaceholder(
    'Setup Country',
    'This frontend page is ready for country master setup tied to account and branch address information.',
    [
      { label: 'Open Branch Setup', path: '/setup/accounts/branch-setup', variant: 'contained' },
      { label: 'Open Setup City', path: '/setup/accounts/city', variant: 'outlined' },
    ],
  ),
  states: createPlaceholder(
    'Setup States',
    'This frontend page is ready for state master setup used by accounts, branches, and related address workflows.',
    [
      { label: 'Open Setup Country', path: '/setup/accounts/country', variant: 'contained' },
      { label: 'Open Setup City', path: '/setup/accounts/city', variant: 'outlined' },
    ],
  ),
  city: createPlaceholder(
    'Setup City',
    'This frontend page is ready for city master setup inside the Setup Accounts flow.',
    [
      { label: 'Open Setup States', path: '/setup/accounts/states', variant: 'contained' },
      { label: 'Open Branch Setup', path: '/setup/accounts/branch-setup', variant: 'outlined' },
    ],
  ),
  'opening-trial': createPlaceholder(
    'Enter Opening Trial',
    'This frontend page is ready for opening-trial style entry, opening balance review, and account initialization workflows.',
    [
      { label: 'Open Setup New Account', path: '/setup/accounts/new-account', variant: 'contained' },
      { label: 'Open Setup Account Groups', path: '/setup/accounts/account-groups', variant: 'outlined' },
    ],
  ),
  'predefined-narrations': createPlaceholder(
    'Setup Pre-Defined Narrations',
    'This frontend page is ready for reusable account narrations, posting remarks, and voucher text templates.',
    [
      { label: 'Open Setup New Account', path: '/setup/accounts/new-account', variant: 'contained' },
      { label: 'Open A/C Vouchers', path: '/accounts/a-c-vouchers', variant: 'outlined' },
    ],
  ),
  'profit-centers': createPlaceholder(
    'Setup Profit Centers',
    'This frontend page is ready for profit-center masters and account-linked reporting structures.',
    [
      { label: 'Open Cost Centers', path: '/setup/accounts/cost-centers', variant: 'contained' },
      { label: 'Open Financial Reports', path: '/reports/financial-reports', variant: 'outlined' },
    ],
  ),
  'cost-centers': createPlaceholder(
    'Setup Cost Centers',
    'This frontend page is ready for cost center masters and account-wise distribution structures.',
    [
      { label: 'Open Cost Center Groups', path: '/setup/accounts/cost-center-groups', variant: 'contained' },
      { label: 'Open Allocate Accounts to Cost Centers', path: '/setup/accounts/allocate-cost-centers', variant: 'outlined' },
    ],
  ),
  'cost-center-groups': createPlaceholder(
    'Setup Cost Center Groups',
    'This frontend page is ready for grouping cost centers inside the Setup Accounts flow.',
    [
      { label: 'Open Cost Centers', path: '/setup/accounts/cost-centers', variant: 'contained' },
      { label: 'Open Cost Element Wise Budgets', path: '/setup/accounts/cost-element-budgets', variant: 'outlined' },
    ],
  ),
  'allocate-cost-centers': createPlaceholder(
    'Allocate Accounts to Cost Centers',
    'This frontend page is ready for account-to-cost-center mapping and allocation rules.',
    [
      { label: 'Open Cost Centers', path: '/setup/accounts/cost-centers', variant: 'contained' },
      { label: 'Open Setup New Account', path: '/setup/accounts/new-account', variant: 'outlined' },
    ],
  ),
  'cost-element-budgets': createPlaceholder(
    'Setup Cost Element Wise Budgets',
    'This frontend page is ready for budget definitions tied to cost elements and internal account planning.',
    [
      { label: 'Open Profit Centers', path: '/setup/accounts/profit-centers', variant: 'contained' },
      { label: 'Open Cost Centers', path: '/setup/accounts/cost-centers', variant: 'outlined' },
    ],
  ),
  transporters: createPlaceholder(
    'Setup Transporters',
    'This frontend page is ready for transporter masters used across billing, purchase, and branch movement flows.',
    [
      { label: 'Open Transport Destinations', path: '/setup/accounts/transport-destinations', variant: 'contained' },
      { label: 'Open Branch Setup', path: '/setup/accounts/branch-setup', variant: 'outlined' },
    ],
  ),
  'transport-destinations': createPlaceholder(
    'Setup Transport Destinations',
    'This frontend page is ready for destination masters tied to transporter and movement workflows.',
    [
      { label: 'Open Setup Transporters', path: '/setup/accounts/transporters', variant: 'contained' },
      { label: 'Open Branch Setup', path: '/setup/accounts/branch-setup', variant: 'outlined' },
    ],
  ),
  'tax-forms': createPlaceholder(
    'Setup Tax Forms',
    'This frontend page is ready for tax form definitions and tax-linked account handling rules.',
    [
      { label: 'Open Setup Taxes', path: '/gst/tax-rates', variant: 'contained' },
      { label: 'Open Allocate Accounts to Tax Forms', path: '/setup/accounts/allocate-tax-forms', variant: 'outlined' },
    ],
  ),
  'allocate-tax-forms': createPlaceholder(
    'Allocate Accounts to Tax Forms',
    'This frontend page is ready for tax-form-to-account allocation and mapping rules.',
    [
      { label: 'Open Setup Tax Forms', path: '/setup/accounts/tax-forms', variant: 'contained' },
      { label: 'Open Setup New Account', path: '/setup/accounts/new-account', variant: 'outlined' },
    ],
  ),
  'tds-types': createPlaceholder(
    'Setup TDS Types',
    'This frontend page is ready for TDS type setup, withholding tax grouping, and related account controls.',
    [
      { label: 'Open Allocate Accounts to TDS Types', path: '/setup/accounts/allocate-tds-types', variant: 'contained' },
      { label: 'Open Setup Taxes', path: '/gst/tax-rates', variant: 'outlined' },
    ],
  ),
  'allocate-tds-types': createPlaceholder(
    'Allocate Accounts to TDS Types',
    'This frontend page is ready for linking accounts to TDS types and posting rules.',
    [
      { label: 'Open Setup TDS Types', path: '/setup/accounts/tds-types', variant: 'contained' },
      { label: 'Open Setup New Account', path: '/setup/accounts/new-account', variant: 'outlined' },
    ],
  ),
  'fbt-types': createPlaceholder(
    'Setup FBT Types',
    'This frontend page is ready for FBT type definitions and account-side tax handling setup.',
    [
      { label: 'Open Allocate Accounts to FBT Types', path: '/setup/accounts/allocate-fbt-types', variant: 'contained' },
      { label: 'Open Setup Taxes', path: '/gst/tax-rates', variant: 'outlined' },
    ],
  ),
  'allocate-fbt-types': createPlaceholder(
    'Allocate Accounts to FBT Types',
    'This frontend page is ready for linking accounts to FBT type setup on the frontend.',
    [
      { label: 'Open Setup FBT Types', path: '/setup/accounts/fbt-types', variant: 'contained' },
      { label: 'Open Setup New Account', path: '/setup/accounts/new-account', variant: 'outlined' },
    ],
  ),
  'balance-sheet-groups': createPlaceholder(
    'Setup Balance Sheet Groups',
    'This frontend page is ready for balance-sheet grouping and account classification structures.',
    [
      { label: 'Open Setup Account Groups', path: '/setup/accounts/account-groups', variant: 'contained' },
      { label: 'Open Balance Sheet', path: '/reports/balance-sheet', variant: 'outlined' },
    ],
  ),
  'allocate-balance-sheet-groups': createPlaceholder(
    'Allocate Accounts to Balance Sheet Groups',
    'This frontend page is ready for mapping accounts into balance-sheet reporting groups.',
    [
      { label: 'Open Setup Balance Sheet Groups', path: '/setup/accounts/balance-sheet-groups', variant: 'contained' },
      { label: 'Open Setup New Account', path: '/setup/accounts/new-account', variant: 'outlined' },
    ],
  ),
};
