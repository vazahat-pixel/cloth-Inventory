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
    description: 'This utility allows you to export all purchase transactions into a legacy text format for external consumption.',
    highlights: [
      'Select date range for purchase records.',
      'Configure field delimiters and text qualifiers.',
      'One-click generation of .txt or .csv files.',
    ],
  },
  'export-stock-transfer-godown': {
    title: 'Export Stock Transfer Godown Wise to Text File',
    description: 'Export stock transfer notes filtered by source and destination godowns for reporting or 3rd party logistics integration.',
    highlights: [
      'Filter by source godown or destination godown.',
      'Includes batch information and serial numbers.',
      'Optimized for large volume data transmission.',
    ],
  },
  'export-item-master': {
    title: 'Export Item Master',
    description: 'Download the complete item master list including categories, brands, HSN codes, and tax rates.',
    highlights: [
      'Export active or all items.',
      'Includes barcode and SKU mapping.',
      'Standardized format for bulk updates.',
    ],
  },
  'import-purchase-challan-text': {
    title: 'Import Purchase Challan from Text File',
    description: 'Bulk import purchase challans from supplier-provided text files to avoid manual data entry.',
    highlights: [
      'Validation of supplier codes and item SKUs.',
      'Automatic creation of pending challan records.',
      'Import log for errors and successes.',
    ],
  },
  'import-purchase-text': {
    title: 'Import Purchase from Text File',
    description: 'Import finalized purchase vouchers from text data. Essential for branch consolidation or supplier data syncing.',
    highlights: [
      'Maps text fields to purchase voucher columns.',
      'Supports inclusive and exclusive tax formats.',
      'Duplicates detection and audit logging.',
    ],
  },
  'import-item-masters-text': {
    title: 'Import Item Masters from Text File',
    description: 'Initialize or update your item master from external text files. Supports bulk creation of products.',
    highlights: [
      'Maps brand and category names automatically.',
      'Creates new records or updates existing barcodes.',
      'Handles complex item attributes from raw text.',
    ],
  },
};
