import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';

export const accountsMatchPaths = ['/accounts'];

export const accountsNavItems = [
  {
    label: 'A/C Vouchers',
    hint: 'Bank payment and receipt vouchers',
    path: '/accounts/vouchers',
    matchPaths: ['/accounts/vouchers'],
    icon: ReceiptLongOutlinedIcon,
  },
];
