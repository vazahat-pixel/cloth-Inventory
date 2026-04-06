import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import MoveToInboxOutlinedIcon from '@mui/icons-material/MoveToInboxOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';

export const dataImportMatchPaths = ['/data-import'];

export const dataImportNavItems = [
  {
    key: 'export-purchase-text',
    label: 'Export Purchase to Text File',
    path: '/data-import/export-purchase-text',
    icon: FileDownloadOutlinedIcon,
  },
  {
    key: 'export-stock-transfer-godown',
    label: 'Export Stock Transfer Godown Wise to Text File',
    path: '/data-import/export-stock-transfer-godown',
    icon: MoveToInboxOutlinedIcon,
  },
  {
    key: 'export-item-master',
    label: 'Export Item Master',
    path: '/data-import/export-item-master',
    icon: StorageOutlinedIcon,
  },
  {
    key: 'import-purchase-challan-text',
    label: 'Import Purchase Challan from Text File',
    path: '/data-import/import-purchase-challan-text',
    icon: FileUploadOutlinedIcon,
  },
  {
    key: 'import-purchase-text',
    label: 'Import Purchase from Text File',
    path: '/data-import/import-purchase-text',
    icon: ReceiptLongOutlinedIcon,
  },
  {
    key: 'import-item-masters-text',
    label: 'Import Item Masters from Text File',
    path: '/data-import/import-item-masters-text',
    icon: Inventory2OutlinedIcon,
  },
];

export const dataImportPlaceholderContent = {
  'export-purchase-text': {
    title: 'Export Purchase to Text File',
    description: 'Export purchase bills as formatted pipe-separated text files for Tally, billing, or ledger integration.',
    highlights: [
      'Filter records by date or vendor selection.',
      'Includes header and row-level details in pipe-separated format.',
      'Optimized for financial data migration.',
    ],
    actions: [
      { label: 'Generate Text File', handler: 'exportPurchases', variant: 'contained' },
    ],
  },
  'export-stock-transfer-godown': {
    title: 'Export Stock Transfer Godown Wise to Text File',
    description: 'Export stock transfer notes filtered by source and destination godowns for reporting or 3rd party logistics integration.',
    highlights: [
      'Detailed movement log for every item transfer.',
      'Includes batch information and serial numbers.',
      'Filter by source warehouse or destination store.',
    ],
    actions: [
      { label: 'Download Transfer Log (.TXT)', handler: 'exportTransfers', variant: 'contained' },
    ],
  },
  'export-item-master': {
    title: 'Export Item Master',
    description: 'Download the complete item catalog including variants, pricing, and barcodes for global backup.',
    highlights: [
      'Comprehensive CSV format compatible with any spreadsheet tool.',
      'Includes Group names and Brand details.',
      'Detailed size-wise variant listings.',
    ],
    actions: [
      { label: 'Download CSV', handler: 'exportItems', variant: 'contained' },
    ],
  },
  'import-purchase-challan-text': {
    title: 'Import Purchase Challan from Text File',
    description: 'Quickly load purchase challans from external billing systems or hand-held devices.',
    highlights: [
      'Direct stock update upon import confirmation.',
      'Automated vendor matching based on code or name.',
      'Error log generation for skipped or malformed rows.',
    ],
    actions: [
      { label: 'Choose TXT File', handler: 'importPurchaseText', variant: 'contained' },
    ],
  },
  'import-purchase-text': {
    title: 'Import Purchase from Text File',
    description: 'Bulk upload purchase vouchers from legacy systems or offline excel-to-text exports.',
    highlights: [
      'Support for multiple invoice formats in a single upload.',
      'Cross-checks with existing Item codes and Barcodes.',
      'Automatic tax calculation based on master settings.',
    ],
    actions: [
      { label: 'Choose File', handler: 'importPurchaseText', variant: 'contained' },
    ],
  },
  'import-item-masters-text': {
    title: 'Import Item Masters from Text File',
    description: 'Fast bulk import of item master records from formatted text files (.TXT).',
    highlights: [
      'Highly performant for large catalogs (10,000+ items).',
      'Supports auto-generation of new Item Groups during import.',
      'Instant barcode registry update.',
    ],
    actions: [
      { label: 'Start Import (.TXT)', handler: 'importItemsText', variant: 'contained' },
    ],
  },
};
