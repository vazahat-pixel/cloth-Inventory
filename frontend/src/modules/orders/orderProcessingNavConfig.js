import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import DoNotDisturbAltOutlinedIcon from '@mui/icons-material/DoNotDisturbAltOutlined';
import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined';
import MoveToInboxOutlinedIcon from '@mui/icons-material/MoveToInboxOutlined';
import PlaylistAddCheckOutlinedIcon from '@mui/icons-material/PlaylistAddCheckOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import ShoppingCartCheckoutOutlinedIcon from '@mui/icons-material/ShoppingCartCheckoutOutlined';
import SignalCellularAltOutlinedIcon from '@mui/icons-material/SignalCellularAltOutlined';
import PlaylistAddOutlinedIcon from '@mui/icons-material/PlaylistAddOutlined';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import RuleFolderOutlinedIcon from '@mui/icons-material/RuleFolderOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';

export const orderProcessingMatchPaths = ['/orders'];

export const orderProcessingNavItems = [
  {
    key: 'sale-order',
    label: 'Sale Order',
    path: '/orders/sale-order',
    matchPaths: ['/orders/sale-order'],
    icon: ShoppingBagOutlinedIcon,
  },
  {
    key: 'cancel-sale-order-items',
    label: 'Cancel/Un-Cancel Sale Order Items',
    path: '/orders/cancel-sale-order-items',
    icon: DoNotDisturbAltOutlinedIcon,
  },
  {
    key: 'adjust-sale-orders-against-sale',
    label: 'Adjust Sale Orders Against Sale',
    path: '/orders/adjust-sale-orders-against-sale',
    icon: CompareArrowsOutlinedIcon,
  },
  {
    key: 'stock-requisition',
    label: 'Stock Requisition - Warehouse to Branches',
    path: '/orders/stock-requisition',
    icon: MoveToInboxOutlinedIcon,
  },
  {
    key: 'generate-sale-orders',
    label: 'Generate Sale Orders from Stock Requisition',
    path: '/orders/generate-sale-orders',
    icon: PlaylistAddCheckOutlinedIcon,
  },
  {
    key: 'preset-items-retrieval',
    label: 'Pre-Set Items for Retrieval in Sale Bill',
    path: '/orders/preset-items-retrieval',
    icon: FactCheckOutlinedIcon,
  },
  {
    key: 'purchase-order',
    label: 'Purchase Order',
    path: '/orders/purchase-order',
    matchPaths: ['/orders/purchase-order'],
    icon: ShoppingCartCheckoutOutlinedIcon,
  },
  {
    key: 'purchase-order-stock-levels',
    label: 'Purchase Order - Stock Levels Basis',
    path: '/orders/purchase-order-stock-levels',
    icon: SignalCellularAltOutlinedIcon,
  },
  {
    key: 'short-items-purchase-order',
    label: 'Enter Short Items for Purchase Order',
    path: '/orders/short-items-purchase-order',
    icon: PlaylistAddOutlinedIcon,
  },
  {
    key: 'delete-pending-po-so',
    label: 'Delete Pending PO/SO',
    path: '/orders/delete-pending-po-so',
    icon: DeleteSweepOutlinedIcon,
  },
  {
    key: 'adjust-purchase-orders',
    label: 'Adjust Purchase Orders against Purchase',
    path: '/orders/adjust-purchase-orders',
    icon: CompareArrowsOutlinedIcon,
  },
  {
    key: 'cancel-purchase-order-items',
    label: 'Cancel/Un-Cancel Purchase Order Items',
    path: '/orders/cancel-purchase-order-items',
    icon: RuleFolderOutlinedIcon,
  },
  {
    key: 'continuous-printing-orders',
    label: 'Continuous Printing - Orders',
    path: '/orders/continuous-printing-orders',
    icon: PrintOutlinedIcon,
  },
];

export const orderProcessingPlaceholderContent = {
  'cancel-sale-order-items': {
    title: 'Cancel / Un-Cancel Sale Order Items',
    description: 'This Order Processing section is now ready on the frontend for item-level cancellation and reversal handling inside sale orders.',
    highlights: [
      'Cancel selected sale-order lines without leaving Order Processing.',
      'Keep reverse actions and audit-friendly status changes in one place later.',
      'Extend this page with item-level reason codes and reopen actions when needed.',
    ],
    actions: [
      { label: 'Open Sale Order', path: '/orders/sale-order', variant: 'contained' },
    ],
  },
  'adjust-sale-orders-against-sale': {
    title: 'Adjust Sale Orders Against Sale',
    description: 'The frontend structure for reconciling sale orders against final sales is now available under Order Processing.',
    highlights: [
      'Track how billed quantities should update pending sale orders.',
      'Keep order-to-sale adjustment workflows inside one module.',
      'Add variance review and auto-close logic later without reworking navigation.',
    ],
    actions: [
      { label: 'Open Sale Order', path: '/orders/sale-order', variant: 'contained' },
      { label: 'Open Billing', path: '/sales/new', variant: 'outlined' },
    ],
  },
  'stock-requisition': {
    title: 'Stock Requisition - Warehouse to Branches',
    description: 'This subfield is now available for warehouse-to-branch requisition workflows in Order Processing.',
    highlights: [
      'Prepare internal stock requests before converting them to sale or transfer activity.',
      'Keep warehouse demand planning visible inside the Order Processing side flow.',
      'Add requisition approval and allocation details here later.',
    ],
    actions: [
      { label: 'Open Inventory Transfer', path: '/inventory/transfer', variant: 'contained' },
      { label: 'Open Sale Order', path: '/orders/sale-order', variant: 'outlined' },
    ],
  },
  'generate-sale-orders': {
    title: 'Generate Sale Orders from Stock Requisition',
    description: 'This frontend page is ready for creating sale orders directly from approved stock requisitions.',
    highlights: [
      'Convert requisitions into sale-order drafts from one place.',
      'Keep branch demand and order generation connected.',
      'Expand later with single-click conversion and status mapping.',
    ],
    actions: [
      { label: 'Open Stock Requisition', path: '/orders/stock-requisition', variant: 'contained' },
      { label: 'Open Sale Order', path: '/orders/sale-order', variant: 'outlined' },
    ],
  },
  'preset-items-retrieval': {
    title: 'Pre-Set Items for Retrieval in Sale Bill',
    description: 'This Order Processing section is ready for frontend-only retrieval presets before final billing.',
    highlights: [
      'Prepare item-picking or retrieval instructions before sale billing.',
      'Keep retrieval planning tied to confirmed order flows.',
      'Add picker assignment or staging details here later.',
    ],
    actions: [
      { label: 'Open Billing', path: '/sales/new', variant: 'contained' },
      { label: 'Open Sale Order', path: '/orders/sale-order', variant: 'outlined' },
    ],
  },
  'purchase-order-stock-levels': {
    title: 'Purchase Order - Stock Levels Basis',
    description: 'This frontend page is ready for stock-level driven purchase-order generation within Order Processing.',
    highlights: [
      'Use stock thresholds as a basis for supplier ordering.',
      'Keep replenishment planning close to order operations.',
      'Extend later with low-stock suggestions and quantity recommendations.',
    ],
    actions: [
      { label: 'Open Purchase Order', path: '/orders/purchase-order', variant: 'contained' },
      { label: 'Open Stock Overview', path: '/inventory/stock-overview', variant: 'outlined' },
    ],
  },
  'short-items-purchase-order': {
    title: 'Enter Short Items for Purchase Order',
    description: 'The Order Processing menu now includes a dedicated section for shortage-driven purchase-order planning.',
    highlights: [
      'Capture short items before creating a supplier order.',
      'Keep shortage review and replenishment entry inside the same order flow.',
      'Add item suggestion and grouped supplier drafting later.',
    ],
    actions: [
      { label: 'Open Purchase Order', path: '/orders/purchase-order', variant: 'contained' },
    ],
  },
  'delete-pending-po-so': {
    title: 'Delete Pending PO / SO',
    description: 'This page gives pending purchase-order and sale-order cleanup a dedicated place inside Order Processing.',
    highlights: [
      'Review pending PO and SO records before deletion workflows are connected.',
      'Keep order cleanup separate from day-to-day entry screens.',
      'Add confirmation, filters, and protected delete actions here later.',
    ],
    actions: [
      { label: 'Open Sale Order', path: '/orders/sale-order', variant: 'contained' },
      { label: 'Open Purchase Order', path: '/orders/purchase-order', variant: 'outlined' },
    ],
  },
  'adjust-purchase-orders': {
    title: 'Adjust Purchase Orders against Purchase',
    description: 'This frontend section is ready for reconciling purchase orders against actual purchase vouchers.',
    highlights: [
      'Match supplier purchase orders with received purchase activity.',
      'Track partial fulfillment and balance quantities from one place.',
      'Extend later with auto-adjust and supplier variance details.',
    ],
    actions: [
      { label: 'Open Purchase Order', path: '/orders/purchase-order', variant: 'contained' },
      { label: 'Open Purchase Voucher', path: '/purchase/purchase-voucher', variant: 'outlined' },
    ],
  },
  'cancel-purchase-order-items': {
    title: 'Cancel / Un-Cancel Purchase Order Items',
    description: 'This Order Processing page is now available for purchase-order line cancellation and reversal workflows.',
    highlights: [
      'Cancel or restore supplier-order lines from a dedicated screen.',
      'Keep item-level order changes out of the main entry form later.',
      'Add approval steps and reason capture when needed.',
    ],
    actions: [
      { label: 'Open Purchase Order', path: '/orders/purchase-order', variant: 'contained' },
    ],
  },
};
