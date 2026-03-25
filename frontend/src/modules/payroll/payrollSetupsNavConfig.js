import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import FunctionsOutlinedIcon from '@mui/icons-material/FunctionsOutlined';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';

export const payrollSetupsMatchPaths = ['/payroll-setups'];

export const payrollSetupsNavItems = [
  {
    key: 'setup-allowance-deduction',
    label: 'Setup Allowance/Deduction',
    path: '/payroll-setups/setup-allowance-deduction',
    icon: AccountBalanceWalletOutlinedIcon,
  },
  {
    key: 'setup-grades',
    label: 'Setup Grades',
    path: '/payroll-setups/setup-grades',
    icon: WorkspacePremiumOutlinedIcon,
  },
  {
    key: 'setup-leave-types',
    label: 'Setup Leave Types',
    path: '/payroll-setups/setup-leave-types',
    icon: EventAvailableOutlinedIcon,
  },
  {
    key: 'setup-grade-leave-types',
    label: 'Setup Grade + Leave Types',
    path: '/payroll-setups/setup-grade-leave-types',
    icon: HubOutlinedIcon,
  },
  {
    key: 'setup-payroll-custom-calculation-types',
    label: 'Setup Payroll Custom Calculation Types',
    path: '/payroll-setups/setup-payroll-custom-calculation-types',
    icon: FunctionsOutlinedIcon,
  },
  {
    key: 'setup-grade-allowances-deduction',
    label: 'Setup Grade + Allowances/Deduction',
    path: '/payroll-setups/setup-grade-allowances-deduction',
    icon: ViewListOutlinedIcon,
  },
  {
    key: 'setup-holidays',
    label: 'Setup Holidays',
    path: '/payroll-setups/setup-holidays',
    icon: CalendarMonthOutlinedIcon,
  },
  {
    key: 'setup-employee-wise-holidays',
    label: 'Setup Employee Wise Holidays',
    path: '/payroll-setups/setup-employee-wise-holidays',
    icon: PersonOutlineOutlinedIcon,
  },
  {
    key: 'setup-compulsory-attendance-dates',
    label: 'Setup Compulsory Attendance Dates',
    path: '/payroll-setups/setup-compulsory-attendance-dates',
    icon: RuleOutlinedIcon,
  },
  {
    key: 'setup-employee-wise-compulsory-attendance-dates',
    label: 'Setup Employee Wise Compulsory Attendance Dates',
    path: '/payroll-setups/setup-employee-wise-compulsory-attendance-dates',
    icon: PersonOutlineOutlinedIcon,
  },
  {
    key: 'setup-payroll-time-period',
    label: 'Setup Payroll Time Period',
    path: '/payroll-setups/setup-payroll-time-period',
    icon: ScheduleOutlinedIcon,
  },
  {
    key: 'setup-absent-days-slabs-weekly-offs',
    label: 'Setup Absent Days Slabs for Earning Weekly Offs',
    path: '/payroll-setups/setup-absent-days-slabs-weekly-offs',
    icon: AssessmentOutlinedIcon,
  },
  {
    key: 'setup-late-days-rules-salary',
    label: 'Setup Late Days Rules for Salary Calculations',
    path: '/payroll-setups/setup-late-days-rules-salary',
    icon: RuleOutlinedIcon,
  },
  {
    key: 'setup-employee-wise-savings-tax',
    label: 'Setup Employee Wise Savings/Contributions for Tax',
    path: '/payroll-setups/setup-employee-wise-savings-tax',
    icon: SavingsOutlinedIcon,
  },
];

export const payrollSetupsPlaceholderContent = {
  'setup-allowance-deduction': {
    title: 'Setup Allowance / Deduction',
    description: 'This Payroll Setups frontend page is ready for configuring allowance and deduction heads used in salary processing.',
    highlights: [
      'Prepare reusable allowance and deduction definitions under Payroll Setups.',
      'Keep payroll component setup separate from daily payroll entry.',
      'Extend later with formula flags, taxable markers, and effective dates.',
    ],
    actions: [
      { label: 'Open Grades', path: '/payroll-setups/setup-grades', variant: 'contained' },
      { label: 'Open Payroll Custom Calculation Types', path: '/payroll-setups/setup-payroll-custom-calculation-types', variant: 'outlined' },
    ],
  },
  'setup-grades': {
    title: 'Setup Grades',
    description: 'The Payroll Setups menu now includes a frontend page for employee grade structure and grade-level payroll mapping.',
    highlights: [
      'Prepare salary grade definitions before linking payroll rules.',
      'Keep grade setup ready for employee and leave-type mapping later.',
      'Extend this page with salary bands, codes, and grade activation controls.',
    ],
    actions: [
      { label: 'Open Grade + Leave Types', path: '/payroll-setups/setup-grade-leave-types', variant: 'contained' },
      { label: 'Open Grade + Allowances/Deduction', path: '/payroll-setups/setup-grade-allowances-deduction', variant: 'outlined' },
    ],
  },
  'setup-leave-types': {
    title: 'Setup Leave Types',
    description: 'This frontend section is ready for defining leave categories and leave behavior used in payroll calculations.',
    highlights: [
      'Prepare leave types that can later flow into attendance and salary logic.',
      'Keep leave master setup inside the Payroll Setups side flow.',
      'Add accrual rules, carry-forward, and balance policy controls later.',
    ],
    actions: [
      { label: 'Open Grade + Leave Types', path: '/payroll-setups/setup-grade-leave-types', variant: 'contained' },
    ],
  },
  'setup-grade-leave-types': {
    title: 'Setup Grade + Leave Types',
    description: 'A dedicated Payroll Setups page is now available for connecting grades with the correct leave-type policies.',
    highlights: [
      'Prepare grade-wise leave entitlements from one place.',
      'Keep leave mappings and grade setup aligned under Payroll Setups.',
      'Extend later with policy inheritance and override controls.',
    ],
    actions: [
      { label: 'Open Grades', path: '/payroll-setups/setup-grades', variant: 'contained' },
      { label: 'Open Leave Types', path: '/payroll-setups/setup-leave-types', variant: 'outlined' },
    ],
  },
  'setup-payroll-custom-calculation-types': {
    title: 'Setup Payroll Custom Calculation Types',
    description: 'This frontend page is ready for custom payroll calculation types and rule categories used during salary computation.',
    highlights: [
      'Prepare custom formula buckets for payroll processing.',
      'Keep payroll-specific calculation rules in one setup area.',
      'Add expression builders, dependencies, and validation later.',
    ],
    actions: [
      { label: 'Open Allowance/Deduction', path: '/payroll-setups/setup-allowance-deduction', variant: 'contained' },
    ],
  },
  'setup-grade-allowances-deduction': {
    title: 'Setup Grade + Allowances / Deduction',
    description: 'The frontend structure is now ready for grade-wise linking of payroll allowances and deductions.',
    highlights: [
      'Prepare grade-specific payroll component assignments.',
      'Keep grade mapping and payroll heads together inside Payroll Setups.',
      'Extend later with defaults, sequencing, and effective-date logic.',
    ],
    actions: [
      { label: 'Open Grades', path: '/payroll-setups/setup-grades', variant: 'contained' },
      { label: 'Open Allowance/Deduction', path: '/payroll-setups/setup-allowance-deduction', variant: 'outlined' },
    ],
  },
  'setup-holidays': {
    title: 'Setup Holidays',
    description: 'This Payroll Setups page is ready for maintaining holiday calendars used in payroll and attendance calculations.',
    highlights: [
      'Prepare organization-level holiday definitions from one place.',
      'Keep holiday setup ready before employee-wise overrides are introduced.',
      'Extend later with yearly calendars, locations, and holiday categories.',
    ],
    actions: [
      { label: 'Open Employee Wise Holidays', path: '/payroll-setups/setup-employee-wise-holidays', variant: 'contained' },
    ],
  },
  'setup-employee-wise-holidays': {
    title: 'Setup Employee Wise Holidays',
    description: 'A dedicated frontend page is now in place for employee-specific holiday assignments and overrides.',
    highlights: [
      'Prepare employee-wise holiday exceptions beyond the base holiday calendar.',
      'Keep override handling inside Payroll Setups.',
      'Add employee filters, bulk assignment, and effective ranges later.',
    ],
    actions: [
      { label: 'Open Holidays', path: '/payroll-setups/setup-holidays', variant: 'contained' },
    ],
  },
  'setup-compulsory-attendance-dates': {
    title: 'Setup Compulsory Attendance Dates',
    description: 'This frontend section is ready for defining mandatory attendance dates that influence payroll and compliance rules.',
    highlights: [
      'Prepare organization-wide compulsory attendance dates under Payroll Setups.',
      'Keep attendance-sensitive payroll dates separate from holiday setup.',
      'Extend later with attendance conditions, departments, and alerts.',
    ],
    actions: [
      { label: 'Open Employee Wise Compulsory Attendance Dates', path: '/payroll-setups/setup-employee-wise-compulsory-attendance-dates', variant: 'contained' },
    ],
  },
  'setup-employee-wise-compulsory-attendance-dates': {
    title: 'Setup Employee Wise Compulsory Attendance Dates',
    description: 'The Payroll Setups menu now includes a frontend page for employee-specific compulsory attendance date management.',
    highlights: [
      'Prepare targeted attendance-date assignments for selected employees.',
      'Keep special attendance rules ready without changing navigation again later.',
      'Add employee filters, attendance groups, and effective dates later.',
    ],
    actions: [
      { label: 'Open Compulsory Attendance Dates', path: '/payroll-setups/setup-compulsory-attendance-dates', variant: 'contained' },
    ],
  },
  'setup-payroll-time-period': {
    title: 'Setup Payroll Time Period',
    description: 'This frontend page is ready for defining payroll periods used in attendance cutoffs and salary processing windows.',
    highlights: [
      'Prepare payroll time periods before monthly or custom salary runs.',
      'Keep cutoff and process windows inside Payroll Setups.',
      'Extend later with lock periods, processing status, and carry-over rules.',
    ],
    actions: [
      { label: 'Open Late Days Rules', path: '/payroll-setups/setup-late-days-rules-salary', variant: 'contained' },
      { label: 'Open Absent Days Slabs', path: '/payroll-setups/setup-absent-days-slabs-weekly-offs', variant: 'outlined' },
    ],
  },
  'setup-absent-days-slabs-weekly-offs': {
    title: 'Setup Absent Days Slabs for Earning Weekly Offs',
    description: 'A dedicated Payroll Setups page is now in place for absent-day slab rules tied to earning weekly offs.',
    highlights: [
      'Prepare attendance slab rules that affect weekly off eligibility.',
      'Keep absence thresholds and weekly-off policy setup together.',
      'Add slab ranges, effective dates, and employee applicability later.',
    ],
    actions: [
      { label: 'Open Payroll Time Period', path: '/payroll-setups/setup-payroll-time-period', variant: 'contained' },
    ],
  },
  'setup-late-days-rules-salary': {
    title: 'Setup Late Days Rules for Salary Calculations',
    description: 'This frontend section is ready for payroll rules related to late days and salary impact calculations.',
    highlights: [
      'Prepare late-coming rules that feed salary adjustments.',
      'Keep timing-related salary rules inside the Payroll Setups side flow.',
      'Extend later with grace limits, penalties, and escalation logic.',
    ],
    actions: [
      { label: 'Open Payroll Time Period', path: '/payroll-setups/setup-payroll-time-period', variant: 'contained' },
    ],
  },
  'setup-employee-wise-savings-tax': {
    title: 'Setup Employee Wise Savings / Contributions for Tax',
    description: 'The frontend page is ready for employee-specific savings and tax contribution setup under Payroll Setups.',
    highlights: [
      'Prepare employee-level tax-saving and contribution details from one place.',
      'Keep tax-related payroll setup separate from payroll entry screens.',
      'Extend later with proof status, declarations, and effective-year tracking.',
    ],
    actions: [
      { label: 'Open Payroll Custom Calculation Types', path: '/payroll-setups/setup-payroll-custom-calculation-types', variant: 'contained' },
    ],
  },
};
