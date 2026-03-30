import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import AssignmentReturnOutlinedIcon from '@mui/icons-material/AssignmentReturnOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import KeyboardReturnOutlinedIcon from '@mui/icons-material/KeyboardReturnOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PriceChangeOutlinedIcon from '@mui/icons-material/PriceChangeOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import SimCardOutlinedIcon from '@mui/icons-material/SimCardOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';

export const purchaseMatchPaths = ['/purchase'];

export const purchaseNavItems = [
  {
    key: 'purchase-voucher',
    label: 'Purchase Voucher',
    path: '/purchase/purchase-voucher',
    matchPaths: ['/purchase/purchase-voucher'],
    icon: ReceiptLongOutlinedIcon,
  },
  {
    key: 'purchase-challan',
    label: 'Purchase Challan',
    path: '/purchase/purchase-challan',
    icon: LocalShippingOutlinedIcon,
  },
  {
    key: 'grn',
    label: 'Goods Receipt Note (GRN)',
    path: '/ho/grn',
    icon: FactCheckOutlinedIcon,
  },
  {
    key: 'rejection-replacements',
    label: 'Enter Rejection/Replacements Items against Purchase',
    path: '/purchase/rejection-replacements',
    icon: AssignmentReturnOutlinedIcon,
  },
  {
    key: 'qc-document',
    label: 'QC Document against Purchase/Purchase Challan',
    path: '/purchase/qc-document',
    icon: FactCheckOutlinedIcon,
  },
  {
    key: 'purchase-return',
    label: 'Purchase Return',
    path: '/purchase/purchase-return',
    matchPaths: ['/purchase/purchase-return'],
    icon: KeyboardReturnOutlinedIcon,
  },
  {
    key: 'purchase-return-challan',
    label: 'Purchase Return - Challan',
    path: '/purchase/purchase-return-challan',
    icon: LocalShippingOutlinedIcon,
  },
  {
    key: 'purchase-return-replacements',
    label: 'Purchase Return (Replacements)',
    path: '/purchase/purchase-return-replacements',
    icon: AssignmentReturnOutlinedIcon,
  },
  {
    key: 'purchase-return-rate-difference',
    label: 'Purchase Return - Rate Difference',
    path: '/purchase/purchase-return-rate-difference',
    icon: PriceChangeOutlinedIcon,
  },
  {
    key: 'stock-receipt-consignment',
    label: 'Stock Receipt Consignment',
    path: '/purchase/stock-receipt-consignment',
    icon: Inventory2OutlinedIcon,
  },
  {
    key: 'purchase-return-consignment',
    label: 'Purchase Return - Consignment',
    path: '/purchase/purchase-return-consignment',
    icon: Inventory2OutlinedIcon,
  },
  {
    key: 'stock-transfer-in',
    label: 'Stock Transfer - In',
    path: '/purchase/stock-transfer-in',
    icon: SwapHorizOutlinedIcon,
  },
  {
    key: 'assign-sim-mobile',
    label: 'Assign SIM/Mobile Numbers Against Purchase',
    path: '/purchase/assign-sim-mobile',
    icon: SimCardOutlinedIcon,
  },
  {
    key: 'stock-adjustment',
    label: 'Stock Adjustment',
    path: '/purchase/stock-adjustment',
    icon: TuneOutlinedIcon,
  },
  {
    key: 'generate-debit-notes',
    label: 'Generate Rate Diff/phy Stock Debit Notes',
    path: '/purchase/generate-debit-notes',
    icon: DescriptionOutlinedIcon,
  },
];

export const purchasePlaceholderContent = {
  'purchase-challan': {
    title: 'Purchase Challan',
    description: 'This subfield is now available in the Purchase side flow. The frontend page is ready for challan-based inward entries and conversion into final vouchers.',
    highlights: [
      'Track supplier challan receipts before invoice posting.',
      'Keep challan-to-voucher follow-up inside the Purchase module.',
      'Add transporter, batch, and inward verification details later without changing the new submenu flow.',
    ],
    actions: [
      { label: 'Open Purchase Voucher', path: '/purchase/purchase-voucher', variant: 'contained' },
      { label: 'Open Purchase Orders', path: '/purchase/orders', variant: 'outlined' },
    ],
  },
  'rejection-replacements': {
    title: 'Rejection / Replacements Against Purchase',
    description: 'This section is ready on the frontend for handling rejected items and replacement follow-up against received purchases.',
    highlights: [
      'Capture rejected quantities against supplier inward.',
      'Track replacement commitments without leaving Purchase.',
      'Keep the new submenu structure ready for detailed workflows later.',
    ],
    actions: [
      { label: 'Open Purchase Voucher', path: '/purchase/purchase-voucher', variant: 'contained' },
    ],
  },
  'qc-document': {
    title: 'QC Document against Purchase / Purchase Challan',
    description: 'The Purchase side panel now includes a dedicated QC section for inspection and acceptance workflows.',
    highlights: [
      'Prepare inspection checkpoints against purchase voucher or challan.',
      'Keep quality decisions attached to inward transactions.',
      'Extend this page later with pass, hold, and reject actions.',
    ],
    actions: [
      { label: 'Open Purchase Challan', path: '/purchase/purchase-challan', variant: 'contained' },
      { label: 'Open Purchase Voucher', path: '/purchase/purchase-voucher', variant: 'outlined' },
    ],
  },
  'purchase-return': {
    title: 'Purchase Return',
    description: 'Purchase Return now has its own submenu entry. Use the purchase voucher list to choose a bill, then open the return action for item-level processing.',
    highlights: [
      'The detailed return screen stays connected under this Purchase Return section.',
      'Voucher-level return actions remain the fastest way to start a supplier return.',
      'This landing page gives you a stable entry point for future return registers and summaries.',
    ],
    actions: [
      { label: 'Open Purchase Voucher', path: '/purchase/purchase-voucher', variant: 'contained' },
    ],
  },
  'purchase-return-challan': {
    title: 'Purchase Return - Challan',
    description: 'This frontend page is ready for challan-based purchase return documents under the new Purchase submenu.',
    highlights: [
      'Prepare outward challan documents for returned goods.',
      'Keep return logistics tied to the purchase workflow.',
      'Add print and dispatch details later without changing navigation again.',
    ],
    actions: [
      { label: 'Open Purchase Return', path: '/purchase/purchase-return', variant: 'contained' },
    ],
  },
  'purchase-return-replacements': {
    title: 'Purchase Return (Replacements)',
    description: 'This section gives replacements its own Purchase subfield so the UI structure is ready before the detailed workflow is wired.',
    highlights: [
      'Track replacement commitments after returns.',
      'Separate replacement follow-up from standard purchase return entries.',
      'Keep vendor communication and pending items in one place later.',
    ],
    actions: [
      { label: 'Open Purchase Return', path: '/purchase/purchase-return', variant: 'contained' },
    ],
  },
  'purchase-return-rate-difference': {
    title: 'Purchase Return - Rate Difference',
    description: 'This page is ready for rate-difference adjustments tied to purchase returns and supplier settlement follow-up.',
    highlights: [
      'Handle value corrections without duplicating full return entries.',
      'Prepare debit or credit impact review before posting.',
      'Keep rate variance workflows inside the Purchase menu.',
    ],
    actions: [
      { label: 'Open Purchase Report', path: '/reports/purchase', variant: 'contained' },
      { label: 'Open Purchase Voucher', path: '/purchase/purchase-voucher', variant: 'outlined' },
    ],
  },
  'stock-receipt-consignment': {
    title: 'Stock Receipt Consignment',
    description: 'The consignment receipt entry now has a dedicated place in the Purchase side flow, ready for frontend expansion.',
    highlights: [
      'Track stock received on consignment separately from standard purchases.',
      'Keep supplier inward visibility without immediate purchase booking.',
      'Extend later with settlement and ownership tracking.',
    ],
    actions: [
      { label: 'Open Purchase Voucher', path: '/purchase/purchase-voucher', variant: 'contained' },
    ],
  },
  'purchase-return-consignment': {
    title: 'Purchase Return - Consignment',
    description: 'This page prepares the Purchase module for consignment return workflows while keeping the new submenu structure stable.',
    highlights: [
      'Return unsold consignment stock with a dedicated process.',
      'Separate consignment return handling from supplier purchase returns.',
      'Keep future reconciliation tools under the same Purchase side panel.',
    ],
    actions: [
      { label: 'Open Stock Receipt Consignment', path: '/purchase/stock-receipt-consignment', variant: 'contained' },
    ],
  },
  'stock-transfer-in': {
    title: 'Stock Transfer - In',
    description: 'This Purchase subfield is now available on the frontend and can jump into the existing transfer-in workflow when needed.',
    highlights: [
      'Use it for inward transfer receiving scenarios tied to purchase movement.',
      'Keep transfer receive shortcuts visible inside the Purchase module.',
      'Expand later with vendor-linked transfer references if needed.',
    ],
    actions: [
      { label: 'Open Inventory Transfer IN', path: '/inventory/transfer-receive', variant: 'contained' },
      { label: 'Open Stock Overview', path: '/inventory/stock-overview', variant: 'outlined' },
    ],
  },
  'assign-sim-mobile': {
    title: 'Assign SIM/Mobile Numbers Against Purchase',
    description: 'This frontend section is ready under Purchase for serial-number or mobile/SIM assignment workflows after inward.',
    highlights: [
      'Prepare post-purchase serial assignment screens.',
      'Keep purchase-linked device onboarding inside one flow.',
      'Add line-level assignment and verification steps later.',
    ],
    actions: [
      { label: 'Open Purchase Voucher', path: '/purchase/purchase-voucher', variant: 'contained' },
    ],
  },
  'stock-adjustment': {
    title: 'Stock Adjustment',
    description: 'This Purchase submenu page is ready and includes a shortcut to the existing inventory stock adjustment screen.',
    highlights: [
      'Use it when inward discrepancies need adjustment follow-up.',
      'Keep purchase-related stock correction entry one click away.',
      'Leave room here for purchase-specific adjustment summaries later.',
    ],
    actions: [
      { label: 'Open Inventory Adjustment', path: '/inventory/adjustment', variant: 'contained' },
      { label: 'Open Purchase Voucher', path: '/purchase/purchase-voucher', variant: 'outlined' },
    ],
  },
  'generate-debit-notes': {
    title: 'Generate Rate Diff / Physical Stock Debit Notes',
    description: 'A dedicated Purchase submenu page is now in place for debit note generation and stock-difference follow-up.',
    highlights: [
      'Prepare debit notes for physical stock or rate variance cases.',
      'Keep issue identification close to the purchase workflow.',
      'Extend later with printable note generation and approval actions.',
    ],
    actions: [
      { label: 'Open Purchase Report', path: '/reports/purchase', variant: 'contained' },
      { label: 'Open Stock Adjustment', path: '/purchase/stock-adjustment', variant: 'outlined' },
    ],
  },
};
