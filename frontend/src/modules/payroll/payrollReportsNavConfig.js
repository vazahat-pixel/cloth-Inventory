import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import SummarizeOutlinedIcon from '@mui/icons-material/SummarizeOutlined';
import SensorsOutlinedIcon from '@mui/icons-material/SensorsOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';

export const payrollReportsMatchPaths = ['/payroll-reports'];

export const payrollReportsNavItems = [
  {
    key: 'attendance-status-report',
    label: 'Attendance Status Report',
    path: '/payroll-reports/attendance-status-report',
    icon: FactCheckOutlinedIcon,
  },
  {
    key: 'attendance-summary-report',
    label: 'Attendance Summary Report',
    path: '/payroll-reports/attendance-summary-report',
    icon: SummarizeOutlinedIcon,
  },
  {
    key: 'attendance-gate-status-report',
    label: 'Attendance At Gate Status Report',
    path: '/payroll-reports/attendance-gate-status-report',
    icon: SensorsOutlinedIcon,
  },
  {
    key: 'payroll-summary-report',
    label: 'Payroll Summary Report',
    path: '/payroll-reports/payroll-summary-report',
    icon: ReceiptLongOutlinedIcon,
  },
  {
    key: 'register-of-leaves-with-wages',
    label: 'Register of Leaves with Wages',
    path: '/payroll-reports/register-of-leaves-with-wages',
    icon: EventAvailableOutlinedIcon,
  },
  {
    key: 'employee-register',
    label: 'Employee Register',
    path: '/payroll-reports/employee-register',
    icon: BadgeOutlinedIcon,
  },
  {
    key: 'employee-allow-ded-month-wise-payroll-report',
    label: 'Employee + Allow Ded + Month Wise Payroll Report',
    path: '/payroll-reports/employee-allow-ded-month-wise-payroll-report',
    icon: ViewListOutlinedIcon,
  },
  {
    key: 'employee-month-wise-payroll-report',
    label: 'Employee + Month Wise Payroll Report',
    path: '/payroll-reports/employee-month-wise-payroll-report',
    icon: CalendarMonthOutlinedIcon,
  },
  {
    key: 'employee-loan-report',
    label: 'Employee Loan Report',
    path: '/payroll-reports/employee-loan-report',
    icon: RequestQuoteOutlinedIcon,
  },
  {
    key: 'employee-salary-range-wise-report',
    label: 'Employee + Salary Range Wise Report',
    path: '/payroll-reports/employee-salary-range-wise-report',
    icon: SummarizeOutlinedIcon,
  },
  {
    key: 'payroll-custom-calc-types-report',
    label: 'Payroll Custom Calc Types Report',
    path: '/payroll-reports/payroll-custom-calc-types-report',
    icon: TuneOutlinedIcon,
  },
  {
    key: 'employee-wise-gratuity-report',
    label: 'Employee Wise Gratuity Report',
    path: '/payroll-reports/employee-wise-gratuity-report',
    icon: SavingsOutlinedIcon,
  },
  {
    key: 'employee-leave-ledger',
    label: 'Employee Leave Ledger',
    path: '/payroll-reports/employee-leave-ledger',
    icon: MenuBookOutlinedIcon,
  },
];

export const payrollReportsPlaceholderContent = {
  'attendance-status-report': {
    title: 'Attendance Status Report',
    description: 'This Payroll Reports frontend page is ready for attendance-status reporting and employee attendance review.',
    highlights: [
      'Prepare report screens for day-wise or employee-wise attendance status.',
      'Keep payroll attendance reporting under the dedicated Payroll Reports module.',
      'Extend later with date filters, employee filters, and export actions.',
    ],
    actions: [
      { label: 'Open Attendance Summary Report', path: '/payroll-reports/attendance-summary-report', variant: 'contained' },
      { label: 'Open Attendance Register', path: '/payroll-entry/attendance-register', variant: 'outlined' },
    ],
  },
  'attendance-summary-report': {
    title: 'Attendance Summary Report',
    description: 'The Payroll Reports menu now includes a frontend page for attendance summary views across employees and periods.',
    highlights: [
      'Prepare summarized attendance reporting by period or worker.',
      'Keep summary reporting separate from attendance entry screens.',
      'Extend later with totals, trend charts, and export-ready report layouts.',
    ],
    actions: [
      { label: 'Open Attendance Status Report', path: '/payroll-reports/attendance-status-report', variant: 'contained' },
      { label: 'Open Payroll Summary Report', path: '/payroll-reports/payroll-summary-report', variant: 'outlined' },
    ],
  },
  'attendance-gate-status-report': {
    title: 'Attendance At Gate Status Report',
    description: 'This frontend page is ready for gate-status reporting tied to employee attendance and access records.',
    highlights: [
      'Prepare gate-level attendance visibility from one place.',
      'Keep gate-status reporting connected to payroll attendance review.',
      'Extend later with time-in, time-out, and exception summaries.',
    ],
    actions: [
      { label: 'Open Attendance Status Report', path: '/payroll-reports/attendance-status-report', variant: 'contained' },
    ],
  },
  'payroll-summary-report': {
    title: 'Payroll Summary Report',
    description: 'A dedicated Payroll Reports page is now available for payroll period summary and overall salary visibility.',
    highlights: [
      'Prepare summary reporting for payroll processing by period.',
      'Keep payroll summary views inside the Payroll Reports side flow.',
      'Extend later with total earnings, deductions, and net-pay snapshots.',
    ],
    actions: [
      { label: 'Open Employee + Month Wise Payroll Report', path: '/payroll-reports/employee-month-wise-payroll-report', variant: 'contained' },
      { label: 'Open Payroll Entry', path: '/payroll-entry', variant: 'outlined' },
    ],
  },
  'register-of-leaves-with-wages': {
    title: 'Register of Leaves with Wages',
    description: 'This frontend section is ready for leave-with-wages reporting inside Payroll Reports.',
    highlights: [
      'Prepare leave registers connected with wage impact reporting.',
      'Keep statutory or wage-related leave views in one reporting area.',
      'Extend later with leave type filters, wage amounts, and print-friendly layouts.',
    ],
    actions: [
      { label: 'Open Employee Leave Ledger', path: '/payroll-reports/employee-leave-ledger', variant: 'contained' },
      { label: 'Open Leave Types', path: '/payroll-setups/setup-leave-types', variant: 'outlined' },
    ],
  },
  'employee-register': {
    title: 'Employee Register',
    description: 'The Payroll Reports module now includes a frontend page for employee master reporting and register-style views.',
    highlights: [
      'Prepare employee register reports under Payroll Reports.',
      'Keep employee listing and payroll profile visibility together in one report area.',
      'Extend later with department, grade, and active/inactive filters.',
    ],
    actions: [
      { label: 'Open Employee + Salary Range Wise Report', path: '/payroll-reports/employee-salary-range-wise-report', variant: 'contained' },
      { label: 'Open Employee Wise Gratuity Report', path: '/payroll-reports/employee-wise-gratuity-report', variant: 'outlined' },
    ],
  },
  'employee-allow-ded-month-wise-payroll-report': {
    title: 'Employee + Allow Ded + Month Wise Payroll Report',
    description: 'This frontend page is ready for month-wise payroll reporting with allowance and deduction breakup by employee.',
    highlights: [
      'Prepare detailed payroll reports with earnings and deduction splits.',
      'Keep structured payroll breakups under the Payroll Reports module.',
      'Extend later with employee drill-down, month filters, and export actions.',
    ],
    actions: [
      { label: 'Open Employee + Month Wise Payroll Report', path: '/payroll-reports/employee-month-wise-payroll-report', variant: 'contained' },
      { label: 'Open Payroll Summary Report', path: '/payroll-reports/payroll-summary-report', variant: 'outlined' },
    ],
  },
  'employee-month-wise-payroll-report': {
    title: 'Employee + Month Wise Payroll Report',
    description: 'A dedicated frontend page is now available for month-wise employee payroll reporting.',
    highlights: [
      'Prepare employee payroll reports period by period.',
      'Keep month-wise payroll views separate from payroll entry screens.',
      'Extend later with salary components, comparisons, and drill-down details.',
    ],
    actions: [
      { label: 'Open Payroll Summary Report', path: '/payroll-reports/payroll-summary-report', variant: 'contained' },
      { label: 'Open Employee + Allow Ded + Month Wise Payroll Report', path: '/payroll-reports/employee-allow-ded-month-wise-payroll-report', variant: 'outlined' },
    ],
  },
  'employee-loan-report': {
    title: 'Employee Loan Report',
    description: 'This frontend section is ready for employee loan reporting and payroll-linked loan visibility.',
    highlights: [
      'Prepare loan registers and outstanding summaries by employee.',
      'Keep payroll-linked loan reporting inside Payroll Reports.',
      'Extend later with installment schedules, balances, and recovery status.',
    ],
    actions: [
      { label: 'Open Worker Wise Loan Entry', path: '/payroll-entry/worker-wise-loan-entry', variant: 'contained' },
      { label: 'Open Employee Register', path: '/payroll-reports/employee-register', variant: 'outlined' },
    ],
  },
  'employee-salary-range-wise-report': {
    title: 'Employee + Salary Range Wise Report',
    description: 'The frontend structure is now ready for salary-range based employee reporting under Payroll Reports.',
    highlights: [
      'Prepare salary-band or salary-range reports from one place.',
      'Keep compensation grouping and employee analytics together in the reports flow.',
      'Extend later with slabs, department grouping, and summary charts.',
    ],
    actions: [
      { label: 'Open Employee Register', path: '/payroll-reports/employee-register', variant: 'contained' },
    ],
  },
  'payroll-custom-calc-types-report': {
    title: 'Payroll Custom Calc Types Report',
    description: 'This frontend page is ready for reporting on custom payroll calculation types and their posting impact.',
    highlights: [
      'Prepare visibility into custom payroll calculation outputs.',
      'Keep formula-related report views under Payroll Reports.',
      'Extend later with calc-type filters, employees affected, and posting summaries.',
    ],
    actions: [
      { label: 'Open Custom Calculation Posting', path: '/payroll-entry/custom-calculation-posting-payroll', variant: 'contained' },
      { label: 'Open Payroll Custom Calc Types Setup', path: '/payroll-setups/setup-payroll-custom-calculation-types', variant: 'outlined' },
    ],
  },
  'employee-wise-gratuity-report': {
    title: 'Employee Wise Gratuity Report',
    description: 'A dedicated Payroll Reports page is now available for gratuity reporting by employee.',
    highlights: [
      'Prepare gratuity reporting and employee-wise gratuity views from one place.',
      'Keep long-term payroll liability reporting inside Payroll Reports.',
      'Extend later with service period filters, gratuity basis, and export-ready layouts.',
    ],
    actions: [
      { label: 'Open Employee Register', path: '/payroll-reports/employee-register', variant: 'contained' },
      { label: 'Open Payroll Summary Report', path: '/payroll-reports/payroll-summary-report', variant: 'outlined' },
    ],
  },
  'employee-leave-ledger': {
    title: 'Employee Leave Ledger',
    description: 'This frontend page is ready for employee leave ledger reporting and leave movement visibility.',
    highlights: [
      'Prepare leave ledger reporting by employee and leave type.',
      'Keep leave history and balances inside Payroll Reports.',
      'Extend later with opening balance, debit/credit movement, and closing balance views.',
    ],
    actions: [
      { label: 'Open Register of Leaves with Wages', path: '/payroll-reports/register-of-leaves-with-wages', variant: 'contained' },
      { label: 'Open Enter Opening Balance of Leaves', path: '/payroll-entry/opening-balance-leaves', variant: 'outlined' },
    ],
  },
};
