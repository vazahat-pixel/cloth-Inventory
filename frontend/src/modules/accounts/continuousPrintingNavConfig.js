import LocalPrintshopOutlinedIcon from '@mui/icons-material/LocalPrintshopOutlined';
import ReceiptOutlinedIcon from '@mui/icons-material/ReceiptOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined';
import DesignServicesOutlinedIcon from '@mui/icons-material/DesignServicesOutlined';
import PercentOutlinedIcon from '@mui/icons-material/PercentOutlined';

export const continuousPrintingMatchPaths = ['/accounts/printing'];

export const continuousPrintingNavItems = [
  { key: 'cash-receipts', label: 'Cash Receipts', path: '/accounts/printing/cash-receipts', icon: ReceiptOutlinedIcon },
  { key: 'cash-payments', label: 'Cash Payments', path: '/accounts/printing/cash-payments', icon: PaymentsOutlinedIcon },
  { key: 'bank-receipts', label: 'Bank Receipts', path: '/accounts/printing/bank-receipts', icon: AccountBalanceOutlinedIcon },
  { key: 'bank-payments', label: 'Bank Payments', path: '/accounts/printing/bank-payments', icon: AccountBalanceOutlinedIcon },
  { key: 'pdc-receipts', label: 'Post Dated Cheques(Receipts)', path: '/accounts/printing/pdc-receipts', icon: LocalPrintshopOutlinedIcon },
  { key: 'pdc-payments', label: 'Post Dated Cheques(Payments)', path: '/accounts/printing/pdc-payments', icon: LocalPrintshopOutlinedIcon },
  { key: 'journal', label: 'Journal', path: '/accounts/printing/journal', icon: HistoryEduOutlinedIcon },
  { key: 'cash-receipts-designer', label: 'Cash Receipts - Print Designer and Printing', path: '/accounts/printing/cash-receipts-designer', icon: DesignServicesOutlinedIcon },
  { key: 'cash-payments-designer', label: 'Cash Payments - Print Designer and Printing', path: '/accounts/printing/cash-payments-designer', icon: DesignServicesOutlinedIcon },
  { key: 'bank-receipts-designer', label: 'Bank Receipts - Print Designer and Printing', path: '/accounts/printing/bank-receipts-designer', icon: DesignServicesOutlinedIcon },
  { key: 'bank-payments-designer', label: 'Bank Payments - Print Designer and Printing', path: '/accounts/printing/bank-payments-designer', icon: DesignServicesOutlinedIcon },
  { key: 'pdc-receipts-designer', label: 'Post Dated Cheques(Receipts) - Print Designer and Printing', path: '/accounts/printing/pdc-receipts-designer', icon: DesignServicesOutlinedIcon },
  { key: 'pdc-payments-designer', label: 'Post Dated Cheques(Payments) - Print Designer and Printing', path: '/accounts/printing/pdc-payments-designer', icon: DesignServicesOutlinedIcon },
  { key: 'journal-designer', label: 'Journal - Print Designer and Printing', path: '/accounts/printing/journal-designer', icon: DesignServicesOutlinedIcon },
  { key: 'advance-receipt-gst', label: 'Advance Receipt Voucher GST - Print Designer and Printing', path: '/accounts/printing/advance-receipt-gst', icon: PercentOutlinedIcon },
  { key: 'advance-refund-gst', label: 'Advance Receipt Refund Voucher GST - Print Designer and Printing', path: '/accounts/printing/advance-refund-gst', icon: PercentOutlinedIcon },
];
