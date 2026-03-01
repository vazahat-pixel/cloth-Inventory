const loyaltyConfigData = {
  earnRate: 1,
  earnPerAmount: 100,
  minRedeemPoints: 100,
  pointValue: 1,
  expiryPeriodDays: 365,
  status: 'Active',
};

const loyaltyTransactionsData = [
  { id: 'lt-1', customerId: 'cus-1', date: '2025-02-15', type: 'earned', points: 45, reference: 'INV-2025-001', balance: 365 },
  { id: 'lt-2', customerId: 'cus-1', date: '2025-02-10', type: 'redeemed', points: -100, reference: 'INV-2025-002', balance: 320 },
  { id: 'lt-3', customerId: 'cus-1', date: '2025-02-01', type: 'earned', points: 120, reference: 'INV-2025-003', balance: 420 },
  { id: 'lt-4', customerId: 'cus-2', date: '2025-02-12', type: 'earned', points: 85, reference: 'INV-2025-004', balance: 265 },
  { id: 'lt-5', customerId: 'cus-2', date: '2025-01-28', type: 'adjusted', points: -10, reference: 'ADJ-001', balance: 180 },
  { id: 'lt-6', customerId: 'cus-3', date: '2025-02-05', type: 'earned', points: 30, reference: 'INV-2025-005', balance: 95 },
];

const vouchersData = [
  {
    id: 'vch-1',
    code: 'GV-ABCD1234',
    amount: 500,
    issueDate: '2025-01-15',
    expiryDate: '2025-07-15',
    status: 'Active',
    customerId: null,
    redeemedDate: null,
    redeemedInvoice: null,
  },
  {
    id: 'vch-2',
    code: 'GV-WXYZ5678',
    amount: 1000,
    issueDate: '2025-02-01',
    expiryDate: '2025-08-01',
    status: 'Redeemed',
    customerId: 'cus-1',
    redeemedDate: '2025-02-10',
    redeemedInvoice: 'INV-2025-002',
  },
  {
    id: 'vch-3',
    code: 'GV-FEST2025',
    amount: 250,
    issueDate: '2024-12-01',
    expiryDate: '2025-03-01',
    status: 'Expired',
    customerId: null,
    redeemedDate: null,
    redeemedInvoice: null,
  },
  {
    id: 'vch-4',
    code: 'GV-PROMO99',
    amount: 750,
    issueDate: '2025-02-20',
    expiryDate: '2025-08-20',
    status: 'Active',
    customerId: 'cus-2',
    redeemedDate: null,
    redeemedInvoice: null,
  },
];

const creditNotesData = [
  {
    id: 'cn-1',
    customerId: 'cus-1',
    amount: 2500,
    issueDate: '2025-02-01',
    reason: 'Return credit - INV-2024-120',
    status: 'Available',
  },
  {
    id: 'cn-2',
    customerId: 'cus-1',
    amount: 1500,
    issueDate: '2025-01-15',
    reason: 'Promotional credit',
    status: 'Used',
    usedDate: '2025-02-05',
    usedInvoice: 'INV-2025-001',
  },
  {
    id: 'cn-3',
    customerId: 'cus-2',
    amount: 800,
    issueDate: '2025-02-10',
    reason: 'Price adjustment',
    status: 'Available',
  },
];

export { loyaltyConfigData, loyaltyTransactionsData, vouchersData, creditNotesData };
export default {
  loyaltyConfigData,
  loyaltyTransactionsData,
  vouchersData,
  creditNotesData,
};
