import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import EventRepeatOutlinedIcon from '@mui/icons-material/EventRepeatOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import KeyboardReturnOutlinedIcon from '@mui/icons-material/KeyboardReturnOutlined';
import AssignmentReturnOutlinedIcon from '@mui/icons-material/AssignmentReturnOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import TouchAppOutlinedIcon from '@mui/icons-material/TouchAppOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import CreditScoreOutlinedIcon from '@mui/icons-material/CreditScoreOutlined';
import CardGiftcardOutlinedIcon from '@mui/icons-material/CardGiftcardOutlined';
import CurrencyExchangeOutlinedIcon from '@mui/icons-material/CurrencyExchangeOutlined';

export const billingMatchPaths = ['/sales'];

export const billingNavItems = [
  {
    key: 'sale-bill',
    label: 'Sale Bill (POS)',
    path: '/sales/sale-bill',
    matchPaths: ['/sales/sale-bill', '/sales/new'],
    icon: ReceiptLongOutlinedIcon,
  },
  {
    key: 'sales-return',
    label: 'Sales Return',
    path: '/sales/sales-return',
    matchPaths: ['/sales/sales-return', '/sales/returns'],
    icon: KeyboardReturnOutlinedIcon,
  },
  {
    key: 'sale-challan',
    label: 'Sale Challan History',
    path: '/sales/sale-challan',
    icon: LocalShippingOutlinedIcon,
  },
  {
    key: 'new-sale-challan',
    label: 'New Sale Challan',
    path: '/sales/sale-challan/new',
    icon: LocalShippingOutlinedIcon,
  },
  {
    key: 'stock-transfer-out',
    label: 'Stock Transfer - Out',
    path: '/sales/stock-transfer-out',
    icon: SwapHorizOutlinedIcon,
  },
  {
    key: 'packing-slip-delivery-order',
    label: 'Packing Slip / Delivery',
    path: '/sales/packing-slip-delivery-order',
    icon: Inventory2OutlinedIcon,
  },
  {
    key: 'cancel-sale-bills',
    label: 'Cancel Sale Bills',
    path: '/sales/cancel-sale-bills',
    icon: BlockOutlinedIcon,
  },
  {
    key: 'promotional-schemes',
    label: 'Promotional Schemes',
    path: '/pricing/schemes',
    icon: CardGiftcardOutlinedIcon,
  },
];

export const billingPlaceholderContent = {
  'sale-period-sale': {
    title: 'Sale Period Sale',
    description: 'This Billing subfield is now ready on the frontend for period-based sale entry and scheduled billing campaigns.',
    highlights: [
      'Prepare sale-entry flows that stay active for a defined billing period.',
      'Keep time-bound retail activity inside the Billing side flow.',
      'Extend this page later with date windows, targets, and promotion controls.',
    ],
    actions: [
      { label: 'Open Sale Bill', path: '/sales/sale-bill', variant: 'contained' },
      { label: 'Open Schemes', path: '/pricing/schemes', variant: 'outlined' },
    ],
  },
  'sale-on-sale-period-sale': {
    title: 'Sale on Sale Period Sale',
    description: 'The frontend page is ready for layered promotional billing during an active sale period.',
    highlights: [
      'Prepare promo-on-promo sale entry without changing the new Billing navigation.',
      'Keep period sales and offer-driven billing inside one section.',
      'Add validation, overlap rules, and scheme previews here later.',
    ],
    actions: [
      { label: 'Open Sale Period Sale', path: '/sales/sale-period-sale', variant: 'contained' },
      { label: 'Open Schemes', path: '/pricing/schemes', variant: 'outlined' },
    ],
  },
  'sale-challan-return': {
    title: 'Sale Challan Return',
    description: 'This frontend section is now available for return workflows against sale challans under Billing.',
    highlights: [
      'Prepare challan-wise return entry before bringing items back into stock.',
      'Keep challan return processing close to the dispatch flow.',
      'Add reason capture, inward confirmation, and document references later.',
    ],
    actions: [
      { label: 'Open Sale Challan', path: '/sales/sale-challan', variant: 'contained' },
      { label: 'Open Sales Return', path: '/sales/sales-return', variant: 'outlined' },
    ],
  },
  'sales-return-f-b': {
    title: 'Sales Return - F & B',
    description: 'A dedicated frontend page is now in place for food and beverage return handling under Billing.',
    highlights: [
      'Separate faster-turnover F&B return processing from standard sales returns.',
      'Keep item condition and expiry-sensitive flows ready inside Billing.',
      'Extend later with return reasons, wastage flags, and approval rules.',
    ],
    actions: [
      { label: 'Open Sales Return', path: '/sales/sales-return', variant: 'contained' },
    ],
  },
  'sale-challan-touch-screen': {
    title: 'Sale Challan - Touch Screen',
    description: 'This Billing subfield is ready on the frontend for touch-first challan creation and dispatch entry.',
    highlights: [
      'Prepare a faster touch workflow for challan entry at dispatch counters.',
      'Keep touch-screen challan behavior under the same Billing submenu.',
      'Add larger controls, quick item selection, and swipe actions later.',
    ],
    actions: [
      { label: 'Open Sale Challan', path: '/sales/sale-challan', variant: 'contained' },
    ],
  },
  'packing-slip-delivery-order': {
    title: 'Packing Slip - Delivery Order',
    description: 'The Billing side flow now includes a frontend page for packing slip and delivery-order handoff planning.',
    highlights: [
      'Prepare dispatch-ready packing and delivery workflows from one Billing entry point.',
      'Keep delivery documents aligned with billed and challan-based sales.',
      'Extend later with packing allocation, route planning, and document generation.',
    ],
    actions: [
      { label: 'Open Sale Challan', path: '/sales/sale-challan', variant: 'contained' },
      { label: 'Open Sale Bill', path: '/sales/sale-bill', variant: 'outlined' },
    ],
  },
  'cancel-sale-bills': {
    title: 'Cancel Sale Bills',
    description: 'This frontend page is ready for sale-bill cancellation and recovery workflows inside Billing.',
    highlights: [
      'Review completed bills before canceling or reversing them.',
      'Keep cancellation handling separate from normal billing entry.',
      'Add protected cancel rules, notes, and audit history here later.',
    ],
    actions: [
      { label: 'Open Sale Bill', path: '/sales/sale-bill', variant: 'contained' },
    ],
  },
  'generate-credit-note-schemes': {
    title: 'Generate Credit Note for Schemes against Sales',
    description: 'The frontend structure is now ready for credit-note generation tied to scheme-based sales adjustments.',
    highlights: [
      'Prepare scheme-related credit note workflows inside Billing.',
      'Keep promotional sale reversals and customer adjustments together.',
      'Extend later with scheme lookup, eligible invoices, and credit note creation.',
    ],
    actions: [
      { label: 'Open Credit Notes', path: '/customers/credit-notes', variant: 'contained' },
      { label: 'Open Schemes', path: '/pricing/schemes', variant: 'outlined' },
    ],
  },
  'issue-gift-vouchers': {
    title: 'Issue Gift Vouchers Against Sale Bill',
    description: 'This Billing page is now available on the frontend for issuing gift vouchers from completed sale bills.',
    highlights: [
      'Prepare post-sale gift voucher issuance from one place.',
      'Keep voucher creation close to billing and customer follow-up.',
      'Add invoice lookup, voucher values, and instant issue actions later.',
    ],
    actions: [
      { label: 'Open Customer Vouchers', path: '/customers/vouchers', variant: 'contained' },
      { label: 'Open Sale Bill', path: '/sales/sale-bill', variant: 'outlined' },
    ],
  },
  'convert-credit-bills-cash': {
    title: 'Convert Credit Bills to Cash',
    description: 'A dedicated frontend page is now in place for credit-to-cash billing follow-up under Billing.',
    highlights: [
      'Prepare conversion of outstanding credit bills into cash settlements.',
      'Keep settlement follow-up connected to original billing activity.',
      'Extend later with invoice search, settlement posting, and confirmation steps.',
    ],
    actions: [
      { label: 'Open Sale Bill', path: '/sales/sale-bill', variant: 'contained' },
      { label: 'Open Bank Receipt', path: '/accounts/bank-receipt', variant: 'outlined' },
    ],
  },
};
