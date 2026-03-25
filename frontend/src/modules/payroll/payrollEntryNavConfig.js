import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import SyncAltOutlinedIcon from '@mui/icons-material/SyncAltOutlined';
import CurrencyRupeeOutlinedIcon from '@mui/icons-material/CurrencyRupeeOutlined';
import FunctionsOutlinedIcon from '@mui/icons-material/FunctionsOutlined';
import PublishOutlinedIcon from '@mui/icons-material/PublishOutlined';
import UpdateOutlinedIcon from '@mui/icons-material/UpdateOutlined';

export const payrollEntryMatchPaths = ['/payroll-entry'];

export const payrollEntryNavItems = [
  {
    key: 'opening-balance-leaves',
    label: 'Enter Opening Balance of Leaves',
    path: '/payroll-entry/opening-balance-leaves',
    icon: EventAvailableOutlinedIcon,
  },
  {
    key: 'attendance-register',
    label: 'Attendance Register',
    path: '/payroll-entry/attendance-register',
    icon: FactCheckOutlinedIcon,
  },
  {
    key: 'attendance-register-month-wise',
    label: 'Attendance Register Month Wise',
    path: '/payroll-entry/attendance-register-month-wise',
    icon: CalendarMonthOutlinedIcon,
  },
  {
    key: 'worker-wise-loan-entry',
    label: 'Worker Wise Loan Entry',
    path: '/payroll-entry/worker-wise-loan-entry',
    icon: RequestQuoteOutlinedIcon,
  },
  {
    key: 'worker-wise-payment-advance-entry',
    label: 'Worker Wise Payment/Advance Entry',
    path: '/payroll-entry/worker-wise-payment-advance-entry',
    icon: PaymentsOutlinedIcon,
  },
  {
    key: 'worker-wise-loan-installment-receipt',
    label: 'Worker Wise Loan Installment Receipt through Cash/bank',
    path: '/payroll-entry/worker-wise-loan-installment-receipt',
    icon: AccountBalanceOutlinedIcon,
  },
  {
    key: 'multiple-payment-entry-worker-wise',
    label: 'Multiple Payment Entry - Worker Wise',
    path: '/payroll-entry/multiple-payment-entry-worker-wise',
    icon: PaymentsOutlinedIcon,
  },
  {
    key: 'multiple-advance-entry-worker-wise',
    label: 'Multiple Advance Entry - Worker Wise',
    path: '/payroll-entry/multiple-advance-entry-worker-wise',
    icon: SyncAltOutlinedIcon,
  },
  {
    key: 'multiple-salary-due-entry-worker-wise',
    label: 'Multiple Salary Due Entry - Worker Wise',
    path: '/payroll-entry/multiple-salary-due-entry-worker-wise',
    icon: CurrencyRupeeOutlinedIcon,
  },
  {
    key: 'custom-calculation-recalculation',
    label: 'Custom Calculation Types - Re-Calculation',
    path: '/payroll-entry/custom-calculation-recalculation',
    icon: FunctionsOutlinedIcon,
  },
  {
    key: 'custom-calculation-posting-payroll',
    label: 'Custom Calculation Types Posting in Payroll',
    path: '/payroll-entry/custom-calculation-posting-payroll',
    icon: PublishOutlinedIcon,
  },
  {
    key: 'update-employee-holidays-weekly-offs',
    label: 'Update Employee Wise Holidays/Weekly Offs',
    path: '/payroll-entry/update-employee-holidays-weekly-offs',
    icon: UpdateOutlinedIcon,
  },
];

export const payrollEntryPlaceholderContent = {
  'opening-balance-leaves': {
    title: 'Enter Opening Balance of Leaves',
    description: 'This Payroll Entry frontend page is ready for recording employee opening leave balances before regular attendance and payroll processing begins.',
    highlights: [
      'Prepare leave opening balance entry from the new Payroll Entry side flow.',
      'Keep one-time opening balances separate from monthly payroll processing.',
      'Extend later with employee filters, leave-type grids, and bulk import support.',
    ],
    actions: [
      { label: 'Open Attendance Register', path: '/payroll-entry/attendance-register', variant: 'contained' },
      { label: 'Open Leave Types', path: '/payroll-setups/setup-leave-types', variant: 'outlined' },
    ],
  },
  'attendance-register': {
    title: 'Attendance Register',
    description: 'The Payroll Entry menu now includes a frontend page for day-wise attendance capture and payroll attendance review.',
    highlights: [
      'Prepare daily attendance entry and review under Payroll Entry.',
      'Keep payroll attendance work separate from setup screens.',
      'Extend later with shift flags, present/absent states, and bulk entry helpers.',
    ],
    actions: [
      { label: 'Open Attendance Register Month Wise', path: '/payroll-entry/attendance-register-month-wise', variant: 'contained' },
      { label: 'Open Compulsory Attendance Dates', path: '/payroll-setups/setup-compulsory-attendance-dates', variant: 'outlined' },
    ],
  },
  'attendance-register-month-wise': {
    title: 'Attendance Register Month Wise',
    description: 'This frontend section is ready for month-wise attendance entry and review from the Payroll Entry flow.',
    highlights: [
      'Prepare monthly attendance views and edits in one place.',
      'Keep day-wise and month-wise attendance flows connected inside Payroll Entry.',
      'Extend later with totals, approval status, and lock-month actions.',
    ],
    actions: [
      { label: 'Open Attendance Register', path: '/payroll-entry/attendance-register', variant: 'contained' },
      { label: 'Open Payroll Time Period', path: '/payroll-setups/setup-payroll-time-period', variant: 'outlined' },
    ],
  },
  'worker-wise-loan-entry': {
    title: 'Worker Wise Loan Entry',
    description: 'A dedicated Payroll Entry page is now available for worker-level loan recording and payroll-linked loan tracking.',
    highlights: [
      'Prepare individual worker loan entry before installment recovery.',
      'Keep payroll-linked loans inside the Payroll Entry flow.',
      'Extend later with worker lookup, sanction amount, and installment schedule setup.',
    ],
    actions: [
      { label: 'Open Loan Installment Receipt', path: '/payroll-entry/worker-wise-loan-installment-receipt', variant: 'contained' },
      { label: 'Open Multiple Salary Due Entry', path: '/payroll-entry/multiple-salary-due-entry-worker-wise', variant: 'outlined' },
    ],
  },
  'worker-wise-payment-advance-entry': {
    title: 'Worker Wise Payment / Advance Entry',
    description: 'This frontend page is ready for worker-level payment and advance entry under Payroll Entry.',
    highlights: [
      'Prepare employee-wise payment and advance posting from one place.',
      'Keep payroll advances separate from final salary settlement screens.',
      'Extend later with voucher references, recovery linkage, and mode-of-payment handling.',
    ],
    actions: [
      { label: 'Open Multiple Advance Entry', path: '/payroll-entry/multiple-advance-entry-worker-wise', variant: 'contained' },
      { label: 'Open Multiple Payment Entry', path: '/payroll-entry/multiple-payment-entry-worker-wise', variant: 'outlined' },
    ],
  },
  'worker-wise-loan-installment-receipt': {
    title: 'Worker Wise Loan Installment Receipt through Cash/bank',
    description: 'This Payroll Entry frontend page is ready for capturing worker loan installment receipts through cash or bank.',
    highlights: [
      'Prepare installment recovery entry linked to employee loans.',
      'Keep repayment entry inside Payroll Entry rather than mixing it with setup pages.',
      'Extend later with worker loan selection, receipt mode, and posting confirmation.',
    ],
    actions: [
      { label: 'Open Worker Wise Loan Entry', path: '/payroll-entry/worker-wise-loan-entry', variant: 'contained' },
      { label: 'Open Bank Receipt', path: '/accounts/bank-receipt', variant: 'outlined' },
    ],
  },
  'multiple-payment-entry-worker-wise': {
    title: 'Multiple Payment Entry - Worker Wise',
    description: 'The frontend structure is now ready for entering payroll payments for multiple workers in one screen.',
    highlights: [
      'Prepare batch payment entry by worker under Payroll Entry.',
      'Keep bulk payment processing separate from single-worker posting.',
      'Extend later with worker grids, filters, and bulk save actions.',
    ],
    actions: [
      { label: 'Open Worker Wise Payment/Advance Entry', path: '/payroll-entry/worker-wise-payment-advance-entry', variant: 'contained' },
      { label: 'Open Multiple Salary Due Entry', path: '/payroll-entry/multiple-salary-due-entry-worker-wise', variant: 'outlined' },
    ],
  },
  'multiple-advance-entry-worker-wise': {
    title: 'Multiple Advance Entry - Worker Wise',
    description: 'This frontend section is ready for batch advance entry across multiple workers inside Payroll Entry.',
    highlights: [
      'Prepare bulk advance posting from one place.',
      'Keep multi-worker advance handling aligned with payroll entry flow.',
      'Extend later with worker selection, amount validation, and posting summaries.',
    ],
    actions: [
      { label: 'Open Worker Wise Payment/Advance Entry', path: '/payroll-entry/worker-wise-payment-advance-entry', variant: 'contained' },
      { label: 'Open Multiple Payment Entry', path: '/payroll-entry/multiple-payment-entry-worker-wise', variant: 'outlined' },
    ],
  },
  'multiple-salary-due-entry-worker-wise': {
    title: 'Multiple Salary Due Entry - Worker Wise',
    description: 'A dedicated Payroll Entry page is now available for batch salary-due recording by worker.',
    highlights: [
      'Prepare worker-wise salary due entry in bulk from the Payroll Entry sidebar.',
      'Keep due recording separate from final payment posting.',
      'Extend later with due periods, outstanding carry-forward, and bulk confirmation.',
    ],
    actions: [
      { label: 'Open Multiple Payment Entry', path: '/payroll-entry/multiple-payment-entry-worker-wise', variant: 'contained' },
      { label: 'Open Payroll Time Period', path: '/payroll-setups/setup-payroll-time-period', variant: 'outlined' },
    ],
  },
  'custom-calculation-recalculation': {
    title: 'Custom Calculation Types - Re-Calculation',
    description: 'This frontend page is ready for recalculation workflows tied to custom payroll calculation types.',
    highlights: [
      'Prepare recalculation actions for payroll formulas and custom computed values.',
      'Keep formula-driven reprocessing inside Payroll Entry.',
      'Extend later with employee scope, date ranges, and recalculation previews.',
    ],
    actions: [
      { label: 'Open Custom Calculation Posting', path: '/payroll-entry/custom-calculation-posting-payroll', variant: 'contained' },
      { label: 'Open Payroll Custom Calculation Types', path: '/payroll-setups/setup-payroll-custom-calculation-types', variant: 'outlined' },
    ],
  },
  'custom-calculation-posting-payroll': {
    title: 'Custom Calculation Types Posting in Payroll',
    description: 'This frontend section is ready for posting custom calculation outputs into payroll processing.',
    highlights: [
      'Prepare posting of custom payroll calculation results under Payroll Entry.',
      'Keep formula output and payroll posting within the same flow.',
      'Extend later with posting logs, employee selection, and posting status.',
    ],
    actions: [
      { label: 'Open Re-Calculation', path: '/payroll-entry/custom-calculation-recalculation', variant: 'contained' },
      { label: 'Open Payroll Custom Calculation Types', path: '/payroll-setups/setup-payroll-custom-calculation-types', variant: 'outlined' },
    ],
  },
  'update-employee-holidays-weekly-offs': {
    title: 'Update Employee Wise Holidays / Weekly Offs',
    description: 'The Payroll Entry menu now includes a frontend page for employee-specific holiday and weekly-off updates.',
    highlights: [
      'Prepare employee-wise holiday and weekly-off updates from one place.',
      'Keep update actions separate from the underlying setup masters.',
      'Extend later with employee filters, bulk update, and effective-date controls.',
    ],
    actions: [
      { label: 'Open Employee Wise Holidays', path: '/payroll-setups/setup-employee-wise-holidays', variant: 'contained' },
      { label: 'Open Attendance Register', path: '/payroll-entry/attendance-register', variant: 'outlined' },
    ],
  },
};
