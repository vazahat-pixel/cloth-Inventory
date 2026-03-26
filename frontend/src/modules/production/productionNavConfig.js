import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import PrecisionManufacturingOutlinedIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';

export const productionMatchPaths = ['/production'];

export const productionNavItems = [
  {
    key: 'production-setups',
    label: 'Production Setups',
    path: '/production/setups',
    matchPaths: ['/production/setups'],
    icon: SettingsOutlinedIcon,
  },
  {
    key: 'production-vouchers',
    label: 'Production Vouchers',
    path: '/production/vouchers',
    icon: ReceiptLongOutlinedIcon,
  },
  {
    key: 'raw-material-processing',
    label: 'Raw Material Processing',
    path: '/production/raw-material-processing',
    icon: PrecisionManufacturingOutlinedIcon,
  },
  {
    key: 'production-reports-queries',
    label: 'Production Reports/Queries',
    path: '/production/reports-queries',
    icon: AssessmentOutlinedIcon,
  },
  {
    key: 'production-utilities',
    label: 'Production Utilities',
    path: '/production/utilities',
    icon: BuildOutlinedIcon,
  },
];

export const productionPlaceholderContent = {
  'production-setups': {
    title: 'Production Setups',
    description: 'This Production frontend page is ready for maintaining production masters, process configuration, and setup controls.',
    highlights: [
      'Prepare production-specific setup screens inside the new Production side flow.',
      'Keep process masters, stage definitions, and defaults separate from daily production entry.',
      'Extend later with work centers, stages, BOM defaults, and process rules.',
    ],
    actions: [
      { label: 'Open Production Vouchers', path: '/production/production-vouchers', variant: 'contained' },
      { label: 'Open Raw Material Processing', path: '/production/raw-material-processing', variant: 'outlined' },
    ],
  },
  'production-vouchers': {
    title: 'Production Vouchers',
    description: 'The Production menu now includes a frontend page for production voucher entry and processing document workflows.',
    highlights: [
      'Prepare voucher-style entry for production transactions in one place.',
      'Keep production posting flow separate from setup and reporting pages.',
      'Add issue, receipt, stage completion, and approval actions later.',
    ],
    actions: [
      { label: 'Open Production Setups', path: '/production/production-setups', variant: 'contained' },
      { label: 'Open Production Reports/Queries', path: '/production/production-reports-queries', variant: 'outlined' },
    ],
  },
  'raw-material-processing': {
    title: 'Raw Material Processing',
    description: 'This frontend section is ready for raw-material handling, processing stages, and inward-to-production preparation workflows.',
    highlights: [
      'Prepare raw-material conversion and processing steps under the Production module.',
      'Keep material handling and production preparation inside one side-panel flow.',
      'Extend later with batch tracking, process yield, and stage movement actions.',
    ],
    actions: [
      { label: 'Open Production Vouchers', path: '/production/production-vouchers', variant: 'contained' },
      { label: 'Open Inventory Stock Receipt', path: '/inventory/stock-receipt-production', variant: 'outlined' },
    ],
  },
  'production-reports-queries': {
    title: 'Production Reports / Queries',
    description: 'A dedicated Production page is now available on the frontend for production reporting and query-driven visibility.',
    highlights: [
      'Prepare production summary, status, and exception reporting from one place.',
      'Keep production insights inside the Production flow instead of mixing them with general reports.',
      'Extend later with work-in-progress, yield, and stage-wise report filters.',
    ],
    actions: [
      { label: 'Open Reports Dashboard', path: '/reports', variant: 'contained' },
      { label: 'Open Production Utilities', path: '/production/production-utilities', variant: 'outlined' },
    ],
  },
  'production-utilities': {
    title: 'Production Utilities',
    description: 'This frontend page is ready for production tools, helper actions, and maintenance utilities inside the Production module.',
    highlights: [
      'Prepare utility actions that support production correction and maintenance tasks.',
      'Keep operational shortcuts inside the Production side flow.',
      'Add recalculation, reprocess, import, and cleanup tools later.',
    ],
    actions: [
      { label: 'Open Production Reports/Queries', path: '/production/production-reports-queries', variant: 'contained' },
      { label: 'Open Data Import', path: '/data-import', variant: 'outlined' },
    ],
  },
};
