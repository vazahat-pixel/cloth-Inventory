import MergeTypeOutlinedIcon from '@mui/icons-material/MergeTypeOutlined';
import LockClockOutlinedIcon from '@mui/icons-material/LockClockOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ImportExportOutlinedIcon from '@mui/icons-material/ImportExportOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';

export const utilitiesMatchPaths = ['/utilities'];

export const utilitiesNavItems = [
  {
    key: 'merge-accounts',
    label: 'Merge Accounts',
    path: '/utilities/merge-accounts',
    icon: MergeTypeOutlinedIcon,
  },
  {
    key: 'close-books',
    label: 'Close Books',
    path: '/utilities/close-books',
    icon: LockClockOutlinedIcon,
  },
  {
    key: 'transfer-branch-stock-next-year',
    label: 'Transfer Branch Wise Stock to Next Year',
    path: '/utilities/transfer-branch-stock-next-year',
    icon: Inventory2OutlinedIcon,
  },
  {
    key: 'transfer-account-balances-next-year',
    label: 'Transfer Account Balances to Next Year',
    path: '/utilities/transfer-account-balances-next-year',
    icon: AccountBalanceWalletOutlinedIcon,
  },
  {
    key: 'export-import-branch-wise-data',
    label: 'Export/Import Branch Wise Data',
    path: '/utilities/export-import-branch-wise-data',
    icon: ImportExportOutlinedIcon,
  },
  {
    key: 'import-masters-transactions-external',
    label: 'Import Masters/Transactions from External Files',
    path: '/utilities/import-masters-transactions-external',
    icon: UploadFileOutlinedIcon,
  },
  {
    key: 'shop-in-shop',
    label: 'Shop in Shop',
    path: '/utilities/shop-in-shop',
    icon: StorefrontOutlinedIcon,
  },
  {
    key: 'document-manager',
    label: 'Document Manager',
    path: '/utilities/document-manager',
    icon: FolderOpenOutlinedIcon,
  },
  {
    key: 'billing-utilities',
    label: 'Billing Utilities',
    path: '/utilities/billing-utilities',
    icon: PointOfSaleOutlinedIcon,
  },
  {
    key: 'export-utilities-third-parties',
    label: 'Export Utilities for Third Parties',
    path: '/utilities/export-utilities-third-parties',
    icon: ShareOutlinedIcon,
  },
  {
    key: 'b2b-cloud',
    label: 'B2B Cloud',
    path: '/utilities/b2b-cloud',
    icon: CloudOutlinedIcon,
  },
];

export const utilitiesPlaceholderContent = {
  'merge-accounts': {
    title: 'Merge Accounts',
    description: 'This Utilities frontend page is ready for account-merge tools and related cleanup workflows.',
    highlights: [
      'Prepare account merge operations inside the new Utilities side flow.',
      'Keep account cleanup tools separate from daily voucher entry.',
      'Extend later with source/target account selection, validations, and merge previews.',
    ],
    actions: [
      { label: 'Open A/C Vouchers', path: '/accounts/a-c-vouchers', variant: 'contained' },
      { label: 'Open Account Master Setup', path: '/setup/accounts', variant: 'outlined' },
    ],
  },
  'close-books': {
    title: 'Close Books',
    description: 'A dedicated Utilities page is now available on the frontend for book-closing and period-close utility flows.',
    highlights: [
      'Prepare year-end or period-end close actions from one place.',
      'Keep close-book utilities separate from operational transaction screens.',
      'Extend later with close-period checks, confirmations, and audit logs.',
    ],
    actions: [
      { label: 'Open Financial Reports', path: '/reports/financial-reports', variant: 'contained' },
      { label: 'Open Audit Logs', path: '/settings/audit-logs', variant: 'outlined' },
    ],
  },
  'transfer-branch-stock-next-year': {
    title: 'Transfer Branch Wise Stock to Next Year',
    description: 'This frontend section is ready for stock carry-forward utilities tied to next-year branch balances.',
    highlights: [
      'Prepare branch-wise stock transfer or carry-forward utility workflows.',
      'Keep year-end stock rollover actions inside Utilities.',
      'Extend later with branch filters, preview totals, and confirmation steps.',
    ],
    actions: [
      { label: 'Open Stock Reports', path: '/reports/stock-reports', variant: 'contained' },
      { label: 'Open Inventory', path: '/inventory', variant: 'outlined' },
    ],
  },
  'transfer-account-balances-next-year': {
    title: 'Transfer Account Balances to Next Year',
    description: 'This Utilities frontend page is ready for next-year carry-forward of account balances.',
    highlights: [
      'Prepare account-balance rollover tools under the Utilities module.',
      'Keep carry-forward utilities separate from normal accounting reports.',
      'Extend later with account selection, opening-balance generation, and posting logs.',
    ],
    actions: [
      { label: 'Open Financial Reports', path: '/reports/financial-reports', variant: 'contained' },
      { label: 'Open A/C Vouchers', path: '/accounts/a-c-vouchers', variant: 'outlined' },
    ],
  },
  'export-import-branch-wise-data': {
    title: 'Export / Import Branch Wise Data',
    description: 'The Utilities module now includes a frontend page for branch-wise export and import workflows.',
    highlights: [
      'Prepare branch-wise data movement utilities in one place.',
      'Keep import/export actions grouped under Utilities instead of the main sidebar only.',
      'Extend later with branch filters, file templates, and transfer summaries.',
    ],
    actions: [
      { label: 'Open Data Import & Export', path: '/data-import', variant: 'contained' },
      { label: 'Open Stock Reports', path: '/reports/stock-reports', variant: 'outlined' },
    ],
  },
  'import-masters-transactions-external': {
    title: 'Import Masters / Transactions from External Files',
    description: 'A dedicated Utilities page is now available on the frontend for external-file import workflows.',
    highlights: [
      'Prepare external master or transaction import entry points from one place.',
      'Keep import utilities inside the Utilities module while reusing the existing import screen.',
      'Extend later with file-type selection, validations, and import history.',
    ],
    actions: [
      { label: 'Open Data Import & Export', path: '/data-import', variant: 'contained' },
      { label: 'Open Reports Dashboard', path: '/reports/dashboard', variant: 'outlined' },
    ],
  },
  'shop-in-shop': {
    title: 'Shop in Shop',
    description: 'This frontend section is ready for shop-in-shop utility workflows and nested store-management features.',
    highlights: [
      'Prepare shop-in-shop operational tools inside Utilities.',
      'Keep multi-counter or nested retail structure utilities in one place.',
      'Extend later with shop mapping, assignments, and shared inventory rules.',
    ],
    actions: [
      { label: 'Open Stores Setup', path: '/setup/stores', variant: 'contained' },
      { label: 'Open Counters Setup', path: '/setup/counters', variant: 'outlined' },
    ],
  },
  'document-manager': {
    title: 'Document Manager',
    description: 'This Utilities frontend page is ready for document handling, storage, and document-linked maintenance workflows.',
    highlights: [
      'Prepare document utility entry points from one place.',
      'Keep future document attachments and archival tools grouped under Utilities.',
      'Extend later with upload, indexing, tagging, and document search.',
    ],
    actions: [
      { label: 'Open Print Templates', path: '/settings/print-templates', variant: 'contained' },
      { label: 'Open Audit Logs', path: '/settings/audit-logs', variant: 'outlined' },
    ],
  },
  'billing-utilities': {
    title: 'Billing Utilities',
    description: 'A dedicated Utilities page is now available for billing-related helper tools and maintenance workflows.',
    highlights: [
      'Prepare billing-side utilities grouped under the Utilities module.',
      'Keep bill cleanup, helper tools, and posting utilities separate from live billing.',
      'Extend later with renumbering, print queues, and bill-maintenance actions.',
    ],
    actions: [
      { label: 'Open Billing', path: '/sales', variant: 'contained' },
      { label: 'Open Sale Registers', path: '/reports/sale-registers', variant: 'outlined' },
    ],
  },
  'export-utilities-third-parties': {
    title: 'Export Utilities for Third Parties',
    description: 'This frontend page is ready for third-party export utilities and outbound integration helpers.',
    highlights: [
      'Prepare data export tools for external systems and partners.',
      'Keep third-party utility actions grouped inside Utilities.',
      'Extend later with vendor formats, mapping profiles, and export history.',
    ],
    actions: [
      { label: 'Open Data Import & Export', path: '/data-import', variant: 'contained' },
      { label: 'Open Reports Dashboard', path: '/reports/dashboard', variant: 'outlined' },
    ],
  },
  'b2b-cloud': {
    title: 'B2B Cloud',
    description: 'The Utilities menu now includes a frontend page for B2B cloud integration and related utility workflows.',
    highlights: [
      'Prepare B2B cloud tools and integration entry points from one place.',
      'Keep cloud-facing business utilities under the Utilities side panel.',
      'Extend later with sync status, partner mappings, and cloud configuration actions.',
    ],
    actions: [
      { label: 'Open Export Utilities for Third Parties', path: '/utilities/export-utilities-third-parties', variant: 'contained' },
      { label: 'Open Reports Dashboard', path: '/reports/dashboard', variant: 'outlined' },
    ],
  },
};
