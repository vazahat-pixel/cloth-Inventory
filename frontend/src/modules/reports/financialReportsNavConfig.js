import SummarizeOutlinedIcon from '@mui/icons-material/SummarizeOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import GstIcon from '@mui/icons-material/DescriptionOutlined'; 
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import PercentOutlinedIcon from '@mui/icons-material/PercentOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import ContactPageOutlinedIcon from '@mui/icons-material/ContactPageOutlined';

export const financialReportsMatchPaths = ['/reports/financial-reports'];

export const financialReportsNavItems = [
  { key: 'trial-vertical', label: 'Trial Balance with Vertical View of Fin Years', path: '/reports/financial-reports/trial-vertical', icon: SummarizeOutlinedIcon },
  { key: 'trial-horizontal', label: 'Trial Balance with Horizontal View of Fin Years', path: '/reports/financial-reports/trial-horizontal', icon: SummarizeOutlinedIcon },
  { key: 'trial-groups', label: 'Trial Balance - Balance Sheet Groups', path: '/reports/financial-reports/trial-groups', icon: AccountTreeOutlinedIcon },
  { key: 'ledger', label: 'Ledger', path: '/reports/financial-reports/ledger', icon: MenuBookOutlinedIcon },
  { key: 'ledger-branch', label: 'Ledger - Branch Wise', path: '/reports/financial-reports/ledger-branch', icon: MenuBookOutlinedIcon },
  { key: 'ledger-double', label: 'Ledger - Double Column', path: '/reports/financial-reports/ledger-double', icon: MenuBookOutlinedIcon },
  { key: 'ledger-trial', label: 'Ledger/Trial Balance', path: '/reports/financial-reports/ledger-trial', icon: ReceiptLongOutlinedIcon },
  { key: 'account-tree-query', label: 'Transactions Query through Treeview of Account Groups', path: '/reports/financial-reports/account-tree-query', icon: AccountTreeOutlinedIcon },
  { key: 'day-book', label: 'Day Book(New)', path: '/reports/financial-reports/day-book', icon: TodayOutlinedIcon },
  { key: 'cash-bank-book', label: 'Cash/Bank Book', path: '/reports/financial-reports/cash-bank-book', icon: AccountBalanceWalletOutlinedIcon },
  { key: 'journal', label: 'Journal', path: '/reports/financial-reports/journal', icon: ReceiptLongOutlinedIcon },
  { key: 'bank-clearing', label: 'Bank Wise Clearing Report', path: '/reports/financial-reports/bank-clearing', icon: AccountBalanceOutlinedIcon },
  { key: 'bank-reconciliation', label: 'Bank Reconciliation Statement', path: '/reports/financial-reports/bank-reconciliation', icon: AccountBalanceOutlinedIcon },
  { key: 'cheques-cleared-date', label: 'Cheques Cleared - Date Wise Report', path: '/reports/financial-reports/cheques-cleared-date', icon: HistoryOutlinedIcon },
  { key: 'advance-receipt-gst', label: 'Advance Receipt Voucher(GST) Analysis Report', path: '/reports/financial-reports/advance-receipt-gst', icon: GstIcon },
  { key: 'ageing-analysis', label: 'Dues/Ageing Analysis', path: '/reports/financial-reports/ageing-analysis', icon: TimerOutlinedIcon },
  { key: 'ageing-analysis-new', label: 'Dues/Ageing Analysis - New', path: '/reports/financial-reports/ageing-analysis-new', icon: TimerOutlinedIcon },
  { key: 'collection-report', label: 'Collection Report', path: '/reports/financial-reports/collection-report', icon: PaymentsOutlinedIcon },
  { key: 'unadjusted-details', label: 'Un-Adjusted Payments/SR/PR Details', path: '/reports/financial-reports/unadjusted-details', icon: PendingActionsOutlinedIcon },
  { key: 'interest-calc', label: 'Interest Calculation', path: '/reports/financial-reports/interest-calc', icon: PercentOutlinedIcon },
  { key: 'pending-st-forms', label: 'Pending ST Forms', path: '/reports/financial-reports/pending-st-forms', icon: PendingActionsOutlinedIcon },
  { key: 'pending-st-forms-item', label: 'Pending ST Forms - Item Wise', path: '/reports/financial-reports/pending-st-forms-item', icon: PendingActionsOutlinedIcon },
  { key: 'pdc-report', label: 'Post Dated Cheques Report', path: '/reports/financial-reports/pdc-report', icon: HistoryOutlinedIcon },
  { key: 'directory', label: 'Supplier/Customer Directory', path: '/reports/financial-reports/directory', icon: ContactPageOutlinedIcon },
];
