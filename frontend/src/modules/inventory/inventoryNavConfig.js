import PrecisionManufacturingOutlinedIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ChecklistRtlOutlinedIcon from '@mui/icons-material/ChecklistRtlOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import SyncAltOutlinedIcon from '@mui/icons-material/SyncAltOutlined';
import DifferenceOutlinedIcon from '@mui/icons-material/DifferenceOutlined';
import QrCodeScannerOutlinedIcon from '@mui/icons-material/QrCodeScannerOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';

export const inventoryMatchPaths = ['/inventory'];

export const inventoryNavItems = [
  {
    key: 'stock-overview',
    label: 'Stock Overview',
    path: '/ho/inventory/stock-overview',
    icon: Inventory2OutlinedIcon,
  },
  {
    key: 'stock-audit-view',
    label: 'Stock Audit View',
    path: '/ho/inventory/audit-view',
    icon: SearchOutlinedIcon,
  },
  {
    key: 'stock-dispatch',
    label: 'Stock Dispatch (Warehouse to Store)',
    path: '/ho/orders/delivery-challan',
    icon: LocalShippingOutlinedIcon,
  },
  {
    key: 'physical-stock-verification',
    label: 'Physical Stock Verification',
    path: '/ho/inventory/physical-stock-verification',
    matchPaths: ['/ho/inventory/physical-stock-verification', '/ho/inventory/audit'],
    icon: ChecklistRtlOutlinedIcon,
  },
  {
    key: 'physical-vs-actual-doc',
    label: 'Physical Vs Actual Doc Entry',
    path: '/ho/inventory/physical-vs-actual-doc',
    icon: FactCheckOutlinedIcon,
  },
  {
    key: 'enter-opening-stock',
    label: 'Enter Opening Stock',
    path: '/ho/inventory/enter-opening-stock',
    icon: Inventory2OutlinedIcon,
  },
  {
    key: 'overwrite-lot-rates',
    label: "Lot / Rate Correction",
    path: '/ho/inventory/overwrite-lot-rates',
    icon: DifferenceOutlinedIcon,
  },
  {
    key: 'bulk-import-store-stock',
    label: 'Bulk Import Store Stock (Excel)',
    path: '/ho/inventory/bulk-import-store-stock',
    icon: CloudUploadOutlinedIcon,
  },
];

export const inventoryPlaceholderContent = {
  'create-cartons': {
    title: 'Create Cartons',
    description: 'This Inventory subfield is now ready on the frontend for carton creation and packing structure workflows.',
    highlights: [
      'Prepare carton creation against received stock.',
      'Keep carton labels, counts, and box grouping inside the Inventory flow.',
      'Extend this page later with carton numbering, size selection, and print actions.',
    ],
    actions: [
      { label: 'Open Stock Overview', path: '/inventory/stock-overview', variant: 'contained' },
    ],
  },
  'delete-cartons': {
    title: 'Delete Cartons',
    description: 'The frontend page is in place for carton cleanup and reversal tasks under Inventory.',
    highlights: [
      'Review carton records before deleting or reopening them.',
      'Keep carton cleanup separate from receipt entry screens.',
      'Add filters, approval checks, and audit notes here later.',
    ],
    actions: [
      { label: 'Open Create Cartons', path: '/inventory/create-cartons', variant: 'contained' },
    ],
  },
  'generate-box-wise-receiving': {
    title: 'Generate Box Wise Stock Receiving Document Against STI',
    description: 'This page is ready for box-wise receiving workflows linked to stock transfer in documents.',
    highlights: [
      'Prepare receiving documents box by box against incoming transfer references.',
      'Keep STI-based inward documentation inside the Inventory side flow.',
      'Extend later with scan-to-receive, carton counts, and received variance checks.',
    ],
    actions: [
      { label: 'Open Stock Overview', path: '/inventory/stock-overview', variant: 'outlined' },
    ],
  },
  'physical-vs-actual-consignment': {
    title: 'Physical Vs Actual Consignment Stock Doc Wise Entry',
    description: 'The Inventory submenu now includes a dedicated frontend page for consignment-specific stock verification entry.',
    highlights: [
      'Separate consignment verification from standard physical stock reviews.',
      'Prepare doc-wise entry flows for consignment inward and reconciliation.',
      'Add discrepancy handling later without changing navigation again.',
    ],
    actions: [
      { label: 'Open Physical Vs Actual Entry', path: '/inventory/physical-vs-actual-doc', variant: 'contained' },
    ],
  },
  'generate-stock-receipt-purchase-physical': {
    title: 'Generate Stock Receipt from Purchase Physical Stock',
    description: 'This frontend section is ready for converting purchase-side physical verification into stock receipt documents.',
    highlights: [
      'Create receipt-ready inventory entries from verified purchase stock.',
      'Keep purchase physical stock follow-up inside the Inventory module.',
      'Extend later with supplier references, inward checks, and receipt generation actions.',
    ],
    actions: [
      { label: 'Open Purchase Voucher', path: '/purchase/purchase-voucher', variant: 'contained' },
      { label: 'Open Stock Overview', path: '/inventory/stock-overview', variant: 'outlined' },
    ],
  },
  'convert-goods-transit-received': {
    title: 'Convert Goods in Transit Docs as Received',
    description: 'The frontend page is ready for marking in-transit inventory documents as received under the new Inventory submenu.',
    highlights: [
      'Review incoming transit documents before final receipt conversion.',
      'Keep transit-to-received status changes inside the Inventory side panel.',
      'Add batch receive, discrepancy checks, and confirmation steps later.',
    ],
    actions: [
      { label: 'Open Stock Overview', path: '/inventory/stock-overview', variant: 'outlined' },
    ],
  },
  'overwrite-lot-rates': {
    title: "Overwrite Lot No.'s/Rates",
    description: 'This Inventory page is now available on the frontend for lot-number and rate override workflows.',
    highlights: [
      'Prepare controlled edits for lot identification and rate corrections.',
      'Keep lot-wise corrections separated from stock receipt entry screens.',
      'Add barcode lookup, approval, and change-history handling here later.',
    ],
    actions: [
      { label: 'Open Stock Adjustment', path: '/inventory/adjustment', variant: 'outlined' },
    ],
  },
  'edit-item-lot-rates-barcodes': {
    title: 'Edit Item / Lot Rates from Barcodes',
    description: 'A barcode-driven Inventory page is now in place on the frontend for item and lot rate edits.',
    highlights: [
      'Prepare barcode-first correction flows for lot and rate updates.',
      'Keep barcode-assisted edits inside the Inventory module.',
      'Extend later with scanned variant lookup, lot history, and save validation.',
    ],
    actions: [
      { label: 'Open Overwrite Lot No./Rates', path: '/inventory/overwrite-lot-rates', variant: 'contained' },
      { label: 'Open Items', path: '/items', variant: 'outlined' },
    ],
  },
};
