import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import BalanceOutlinedIcon from '@mui/icons-material/BalanceOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';

export const reportsQueriesMatchPaths = ['/reports'];

export const reportsQueriesNavItems = [
  {
    key: 'reports-dashboard',
    label: 'Reports Dashboard',
    path: '/reports/dashboard',
    icon: DashboardOutlinedIcon,
  },
  {
    key: 'financial-reports',
    label: 'Financial Reports',
    path: '/reports/financial-reports',
    matchPaths: ['/reports/financial-reports'],
    icon: AccountBalanceOutlinedIcon,
  },
  {
    key: 'balance-sheet',
    label: 'Balance Sheet',
    path: '/reports/balance-sheet',
    icon: BalanceOutlinedIcon,
  },
  {
    key: 'financial-analysis',
    label: 'Financial Analysis',
    path: '/reports/financial-analysis',
    icon: TrendingUpOutlinedIcon,
  },
  {
    key: 'sale-registers',
    label: 'Sale Registers',
    path: '/reports/sale-registers',
    icon: ReceiptLongOutlinedIcon,
  },
  {
    key: 'sale-challan-reports',
    label: 'Sale Challan Reports',
    path: '/reports/sale-challan-reports',
    icon: LocalShippingOutlinedIcon,
  },
  {
    key: 'scheme-reports',
    label: 'Scheme Reports',
    path: '/reports/scheme-reports',
    icon: SellOutlinedIcon,
  },
  {
    key: 'customer-item-sale-analysis',
    label: 'Customer + Item Sale Analysis',
    path: '/reports/customer-item-sale-analysis',
    icon: PeopleAltOutlinedIcon,
  },
  {
    key: 'order-reports',
    label: 'Order Reports',
    path: '/reports/order-reports',
    icon: AssignmentOutlinedIcon,
  },
  {
    key: 'agent-wise-reports',
    label: 'Agent Wise Reports',
    path: '/reports/agent-wise-reports',
    icon: SupportAgentOutlinedIcon,
  },
  {
    key: 'purchase-reports',
    label: 'Purchase Reports',
    path: '/reports/purchase-reports',
    icon: ShoppingCartOutlinedIcon,
  },
  {
    key: 'item-reports',
    label: 'Item Reports',
    path: '/reports/item-reports',
    icon: Inventory2OutlinedIcon,
  },
  {
    key: 'stock-reports',
    label: 'Stock Reports',
    path: '/reports/stock-reports',
    icon: WarehouseOutlinedIcon,
  },
  {
    key: 'excise-reports',
    label: 'Excise Reports',
    path: '/reports/excise-reports',
    icon: GavelOutlinedIcon,
  },
];

export const reportsQueriesPlaceholderContent = {
  'financial-reports': {
    title: 'Financial Reports',
    description: 'This Reports/Queries frontend page is ready for financial report categories and shortcuts across accounting and cash-flow views.',
    highlights: [
      'Prepare financial reporting entry points inside the Reports/Queries side flow.',
      'Keep ledger, bank book, and collection analysis grouped in one report category.',
      'Extend later with filters, report parameters, and export actions without changing navigation again.',
    ],
    actions: [
      { label: 'Open Reports Dashboard', path: '/reports/dashboard', variant: 'contained' },
      { label: 'Open Ledger Report', path: '/reports/ledger', variant: 'outlined' },
      { label: 'Open Bank Book', path: '/reports/bank-book', variant: 'outlined' },
    ],
  },
  'balance-sheet': {
    title: 'Balance Sheet',
    description: 'A dedicated Reports/Queries page is now available on the frontend for balance-sheet reporting and related financial snapshots.',
    highlights: [
      'Prepare balance-sheet views from the new Reports/Queries structure.',
      'Keep high-level financial position reporting separate from operational reports.',
      'Extend later with as-on-date filters, grouping, and printable statements.',
    ],
    actions: [
      { label: 'Open Financial Reports', path: '/reports/financial-reports', variant: 'contained' },
      { label: 'Open Ledger Report', path: '/reports/ledger', variant: 'outlined' },
    ],
  },
  'financial-analysis': {
    title: 'Financial Analysis',
    description: 'This frontend section is ready for financial analysis views tied to revenue, margin, and collection reporting.',
    highlights: [
      'Prepare analytical report entry points for profitability and financial performance.',
      'Keep financial analysis close to the rest of the Reports/Queries module.',
      'Extend later with comparisons, trends, and summary charts.',
    ],
    actions: [
      { label: 'Open Profit Analysis', path: '/reports/profit', variant: 'contained' },
      { label: 'Open Collection Report', path: '/reports/collection', variant: 'outlined' },
    ],
  },
  'sale-registers': {
    title: 'Sale Registers',
    description: 'The Reports/Queries menu now includes a frontend page for sale register categories and billing-related report shortcuts.',
    highlights: [
      'Prepare sale register views grouped under one category.',
      'Keep billing and revenue reports easy to access from the Reports/Queries side panel.',
      'Extend later with invoice-wise, date-wise, and customer-wise sale register formats.',
    ],
    actions: [
      { label: 'Open Sales Report', path: '/reports/sales', variant: 'contained' },
      { label: 'Open Collection Report', path: '/reports/collection', variant: 'outlined' },
    ],
  },
  'sale-challan-reports': {
    title: 'Sale Challan Reports',
    description: 'This frontend page is ready for sale challan reporting and dispatch-oriented report categories.',
    highlights: [
      'Prepare sale challan summaries and challan-status reporting from one place.',
      'Keep challan reporting grouped inside the Reports/Queries module.',
      'Extend later with pending challans, status summaries, and delivery tracking filters.',
    ],
    actions: [
      { label: 'Open Sale Challan Status', path: '/sales/sale-challan-status', variant: 'contained' },
      { label: 'Open Sale Challan', path: '/sales/sale-challan', variant: 'outlined' },
    ],
  },
  'scheme-reports': {
    title: 'Scheme Reports',
    description: 'A dedicated Reports/Queries frontend page is now available for scheme and offer-related reporting categories.',
    highlights: [
      'Prepare reporting around offers, schemes, and promotional outcomes.',
      'Keep scheme analysis separate from raw sale reports.',
      'Extend later with scheme performance, redemptions, and period-wise filters.',
    ],
    actions: [
      { label: 'Open Schemes', path: '/pricing/schemes', variant: 'contained' },
      { label: 'Open Generate Credit Note for Schemes', path: '/sales/generate-credit-note-schemes', variant: 'outlined' },
    ],
  },
  'customer-item-sale-analysis': {
    title: 'Customer + Item Sale Analysis',
    description: 'This frontend section is ready for customer and item-focused sale analysis under Reports/Queries.',
    highlights: [
      'Prepare analysis views that combine customer behavior and item performance.',
      'Keep sales analysis grouped away from transaction entry screens.',
      'Extend later with customer segments, item trends, and comparative summaries.',
    ],
    actions: [
      { label: 'Open Customer Reports', path: '/reports/customers', variant: 'contained' },
      { label: 'Open Sales Report', path: '/reports/sales', variant: 'outlined' },
    ],
  },
  'order-reports': {
    title: 'Order Reports',
    description: 'The Reports/Queries module now includes a frontend page for order-related reports and order flow visibility.',
    highlights: [
      'Prepare reporting categories for sale orders, purchase orders, and fulfillment progress.',
      'Keep order reporting tied to the Reports/Queries side flow.',
      'Extend later with pending, completed, and exception order reports.',
    ],
    actions: [
      { label: 'Open Order Processing', path: '/orders', variant: 'contained' },
      { label: 'Open Sale Order', path: '/orders/sale-order', variant: 'outlined' },
    ],
  },
  'agent-wise-reports': {
    title: 'Agent Wise Reports',
    description: 'This frontend page is ready for agent-wise and salesman-wise reporting categories inside Reports/Queries.',
    highlights: [
      'Prepare agent performance and salesman-linked reports from one place.',
      'Keep agent-wise reporting grouped with the rest of the business reports.',
      'Extend later with salesperson filters, targets, and incentive-linked summaries.',
    ],
    actions: [
      { label: 'Open Salesmen Master', path: '/masters/salesmen', variant: 'contained' },
      { label: 'Open Sales Report', path: '/reports/sales', variant: 'outlined' },
    ],
  },
  'purchase-reports': {
    title: 'Purchase Reports',
    description: 'A dedicated Reports/Queries page is now available for purchase report categories and supplier transaction visibility.',
    highlights: [
      'Prepare purchase report entry points under the Reports/Queries flow.',
      'Keep supplier and purchase analysis grouped together.',
      'Extend later with bill registers, supplier-wise summaries, and outstanding views.',
    ],
    actions: [
      { label: 'Open Purchase Report', path: '/reports/purchase', variant: 'contained' },
      { label: 'Open Vendor Reports', path: '/reports/vendors', variant: 'outlined' },
    ],
  },
  'item-reports': {
    title: 'Item Reports',
    description: 'This frontend section is ready for item-based reporting categories across stock, movement, and item performance.',
    highlights: [
      'Prepare item-centric report entry points from one place.',
      'Keep item report categories inside Reports/Queries instead of mixing them with masters.',
      'Extend later with brand-wise, group-wise, and item movement reports.',
    ],
    actions: [
      { label: 'Open Movement Report', path: '/reports/movement', variant: 'contained' },
      { label: 'Open Age Analysis', path: '/reports/age-analysis', variant: 'outlined' },
    ],
  },
  'stock-reports': {
    title: 'Stock Reports',
    description: 'The Reports/Queries menu now includes a frontend page for stock report categories and inventory visibility.',
    highlights: [
      'Prepare stock reporting and inventory analysis inside the Reports/Queries flow.',
      'Keep stock value, movement, and age-based reports grouped together.',
      'Extend later with warehouse filters, valuation options, and export tools.',
    ],
    actions: [
      { label: 'Open Stock Report', path: '/reports/stock', variant: 'contained' },
      { label: 'Open Movement Report', path: '/reports/movement', variant: 'outlined' },
    ],
  },
  'excise-reports': {
    title: 'Excise Reports',
    description: 'This frontend page is ready for excise and tax-oriented reporting categories under Reports/Queries.',
    highlights: [
      'Prepare tax or excise-related report entry points from one place.',
      'Keep statutory report categories within the Reports/Queries module.',
      'Extend later with duty summaries, invoice tax views, and filing-friendly exports.',
    ],
    actions: [
      { label: 'Open Invoice Tax Report', path: '/gst/invoice-report', variant: 'contained' },
      { label: 'Open GSTR Summary', path: '/gst/gstr-summary', variant: 'outlined' },
    ],
  },
};
