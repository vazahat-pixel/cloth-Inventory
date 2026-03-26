import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import NatureOutlinedIcon from '@mui/icons-material/NatureOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import CurrencyExchangeOutlinedIcon from '@mui/icons-material/CurrencyExchangeOutlined';
import HistoryToggleOffOutlinedIcon from '@mui/icons-material/HistoryToggleOffOutlined';

export const otherAccountMatchPaths = ['/setup/other-account-details'];

export const otherAccountNavItems = [
  { key: 'account-budget', label: 'Setup Account Wise Budget/Limit', path: '/setup/other-account-details/account-budget', icon: AccountBalanceOutlinedIcon },
  { key: 'customer-supplier-details', label: 'Enter Customer/Supplier wise Other Details', path: '/setup/other-account-details/customer-supplier-details', icon: InfoOutlinedIcon },
  { key: 'party-payment-terms', label: 'Enter Party Wise Payment Terms', path: '/setup/other-account-details/party-payment-terms', icon: PaymentOutlinedIcon },
  { key: 'party-payment-breakup', label: 'Enter Party Wise Payment Breakup Days', path: '/setup/other-account-details/party-payment-breakup', icon: CalendarMonthOutlinedIcon },
  { key: 'allocate-sale-nature', label: 'Allocate Accounts to Sale Nature', path: '/setup/other-account-details/allocate-sale-nature', icon: NatureOutlinedIcon },
  { key: 'stock-categories', label: 'Setup Stock Categories', path: '/setup/other-account-details/stock-categories', icon: CategoryOutlinedIcon },
  { key: 'customer-banks', label: 'Setup Customer Banks', path: '/setup/other-account-details/customer-banks', icon: AccountBalanceWalletOutlinedIcon },
  { key: 'currency', label: 'Setup Currency', path: '/setup/other-account-details/currency', icon: CurrencyExchangeOutlinedIcon },
  { key: 'currency-exchange', label: 'Setup Date Wise Currency Exchange Rates', path: '/setup/other-account-details/currency-exchange', icon: HistoryToggleOffOutlinedIcon },
];
