import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import KeyboardReturnOutlinedIcon from '@mui/icons-material/KeyboardReturnOutlined';
import PriceChangeOutlinedIcon from '@mui/icons-material/PriceChangeOutlined';

export const purchaseMatchPaths = ['/purchase', '/inventory/grn', '/purchase/purchase-order'];

export const purchaseNavItems = [
  {
    key: 'purchase-order',
    label: 'Purchase Order (Booking)',
    path: '/purchase/purchase-order',
    matchPaths: ['/purchase/purchase-order'],
    icon: ShoppingCartOutlinedIcon,
  },
  {
    key: 'raw-material-purchase',
    label: 'Purchase Voucher (Billing)',
    path: '/purchase/purchase-voucher',
    matchPaths: ['/purchase/purchase-voucher', '/purchase/new'],
    icon: ReceiptLongOutlinedIcon,
  },
  {
    key: 'grn',
    label: 'Material Inward (GRN)',
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
