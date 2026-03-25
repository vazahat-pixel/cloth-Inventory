import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';

export const accountsMatchPaths = ['/accounts'];

export const accountsNavItems = [
  {
    label: 'A/C Vouchers',
    hint: 'Bank payment and receipt vouchers',
    path: '/accounts/a-c-vouchers',
    matchPaths: ['/accounts/a-c-vouchers', '/accounts/bank-payment', '/accounts/bank-receipt'],
    icon: ReceiptLongOutlinedIcon,
  },
  {
    label: 'Continuous Printing',
    hint: 'Voucher print queue',
    path: '/accounts/continuous-printing',
    icon: PrintOutlinedIcon,
  },
  {
    label: 'Utilities',
    hint: 'Accounts tools and shortcuts',
    path: '/accounts/utilities',
    icon: BuildOutlinedIcon,
  },
];
