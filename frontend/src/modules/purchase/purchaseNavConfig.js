import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import KeyboardReturnOutlinedIcon from '@mui/icons-material/KeyboardReturnOutlined';
import PriceChangeOutlinedIcon from '@mui/icons-material/PriceChangeOutlined';

export const purchaseMatchPaths = ['/purchase', '/inventory/grn'];

export const purchaseNavItems = [
  {
    key: 'raw-material-purchase',
    label: 'Raw Material Purchase',
    path: '/purchase/purchase-voucher',
    matchPaths: ['/purchase/purchase-voucher'],
    icon: ReceiptLongOutlinedIcon,
  },
  {
    key: 'accessory-purchase',
    label: 'Accessory Purchase',
    path: '/purchase/purchase-voucher', // Re-using same form, type logic will handle diff in Phase 2
    matchPaths: [], 
    icon: ReceiptLongOutlinedIcon,
  },
  {
    key: 'grn',
    label: 'Finished Goods GRN',
    path: '/inventory/grn',
    matchPaths: ['/inventory/grn'],
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
    key: 'purchase-payment',
    label: 'Purchase Payment (Bank)',
    path: '/ho/accounts/bank-payment-list',
    icon: PriceChangeOutlinedIcon,
  },
];

export const purchasePlaceholderContent = {
  'stock-adjustment': {
    title: 'Stock Adjustment',
    description: 'This Purchase submenu page is ready and includes a shortcut to the existing inventory stock adjustment screen.',
    highlights: [
      'Use it when inward discrepancies need adjustment follow-up.',
      'Keep purchase-related stock correction entry one click away.',
    ],
    actions: [
      { label: 'Open Inventory Adjustment', path: '/inventory/adjustment', variant: 'contained' },
      { label: 'Open Purchase Voucher', path: '/purchase/purchase-voucher', variant: 'outlined' },
    ],
  },
};
