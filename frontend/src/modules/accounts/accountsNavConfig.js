import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';

export const accountsMatchPaths = ['/accounts'];

export const accountsNavItems = [
  {
    label: 'A/C Vouchers',
    hint: 'Bank payment and receipt vouchers',
    path: '/accounts/vouchers',
    matchPaths: ['/accounts/vouchers'],
    icon: ReceiptLongOutlinedIcon,
  },
  {
    label: 'Continuous Printing',
    hint: 'Voucher print queue',
    path: '/accounts/printing',
    matchPaths: ['/accounts/printing'],
    icon: PrintOutlinedIcon,
  },
  {
    label: 'Utilities',
    hint: 'Accounts tools and shortcuts',
    path: '/accounts/utilities',
    matchPaths: ['/accounts/utilities'],
    icon: BuildOutlinedIcon,
  },
];
