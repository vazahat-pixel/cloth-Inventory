import ReceiptOutlinedIcon from '@mui/icons-material/ReceiptOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import NumbersOutlinedIcon from '@mui/icons-material/NumbersOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import EventRepeatOutlinedIcon from '@mui/icons-material/EventRepeatOutlined';
import ChangeCircleOutlinedIcon from '@mui/icons-material/ChangeCircleOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

export const acVouchersMatchPaths = ['/accounts/vouchers'];

export const acVouchersNavItems = [
  { key: 'cash-receipts', label: 'Cash Receipts', path: '/accounts/vouchers/cash-receipts', icon: ReceiptOutlinedIcon },
  { key: 'cash-payments', label: 'Cash Payments', path: '/accounts/vouchers/cash-payments', icon: PaymentsOutlinedIcon },
  { key: 'cheque-nums-bank', label: 'Enter Cheque Numbers - Bank Payments', path: '/accounts/vouchers/cheque-nums-bank', icon: NumbersOutlinedIcon },
  { key: 'receipt-nums-cash', label: 'Enter Receipt Numbers - Cash Receipts', path: '/accounts/vouchers/receipt-nums-cash', icon: NumbersOutlinedIcon },
  { key: 'bank-receipts', label: 'Bank Receipts', path: '/accounts/vouchers/bank-receipts', icon: AccountBalanceOutlinedIcon },
  { key: 'bank-payments', label: 'Bank Payments', path: '/accounts/vouchers/bank-payments', icon: AccountBalanceOutlinedIcon },
  { key: 'pdc-receipts', label: 'Post Dated Cheques(Receipts)', path: '/accounts/vouchers/pdc-receipts', icon: EventRepeatOutlinedIcon },
  { key: 'pdc-payments', label: 'Post Dated Cheques(Payments)', path: '/accounts/vouchers/pdc-payments', icon: EventRepeatOutlinedIcon },
  { key: 'convert-pdc', label: 'Convert P.D. Cheques to Cheques for Collection', path: '/accounts/vouchers/convert-pdc', icon: ChangeCircleOutlinedIcon },
  { key: 'realise-pdc-receipts', label: 'Realise Cheques for Collection(Receipts)', path: '/accounts/vouchers/realise-pdc-receipts', icon: FactCheckOutlinedIcon },
  { key: 'realise-pdc-payments', label: 'Realise Cheques for Collection(Payments)', path: '/accounts/vouchers/realise-pdc-payments', icon: FactCheckOutlinedIcon },
  { key: 'cheque-clearing', label: 'Enter Cheque Clearing', path: '/accounts/vouchers/cheque-clearing', icon: FactCheckOutlinedIcon },
  { key: 'journal-sale', label: 'Journal - Sale', path: '/accounts/vouchers/journal-sale', icon: HistoryEduOutlinedIcon },
  { key: 'journal-sale-return', label: 'Journal - Sale Return', path: '/accounts/vouchers/journal-sale-return', icon: HistoryEduOutlinedIcon },
  { key: 'journal-purchase', label: 'Journal - Purchase', path: '/accounts/vouchers/journal-purchase', icon: HistoryEduOutlinedIcon },
  { key: 'journal-purchase-return', label: 'Journal - Purchase Return', path: '/accounts/vouchers/journal-purchase-return', icon: HistoryEduOutlinedIcon },
  { key: 'journal-credit-note', label: 'Journal - Credit Note', path: '/accounts/vouchers/journal-credit-note', icon: DescriptionOutlinedIcon },
  { key: 'journal-debit-note', label: 'Journal - Debit Note', path: '/accounts/vouchers/journal-debit-note', icon: DescriptionOutlinedIcon },
  { key: 'journal-rate-diff', label: 'Journal Debit/Credit Notes - Rate Difference', path: '/accounts/vouchers/journal-rate-diff', icon: CompareArrowsOutlinedIcon },
  { key: 'journal-voucher-entry', label: 'Journal Voucher - Sale/Purchase Entry', path: '/accounts/vouchers/journal-voucher-entry', icon: HistoryEduOutlinedIcon },
  { key: 'cost-centre-breakup', label: 'Cost Centre Wise Transactions Breakup', path: '/accounts/vouchers/cost-centre-breakup', icon: AccountTreeOutlinedIcon },
  { key: 'adjust-bills', label: 'Adjust Bills Receivable/Payable', path: '/accounts/vouchers/adjust-bills', icon: RuleOutlinedIcon },
  { key: 'opening-st-forms', label: 'Enter Opening Pending ST Forms', path: '/accounts/vouchers/opening-st-forms', icon: DescriptionOutlinedIcon },
  { key: 'track-st-forms', label: 'Track Receipt/Issues of ST Forms', path: '/accounts/vouchers/track-st-forms', icon: DescriptionOutlinedIcon },
  { key: 'missing-receipt-nums', label: 'Missing Receipt Numbers', path: '/accounts/vouchers/missing-receipt-nums', icon: SearchOutlinedIcon },
];
