const companyProfileData = {
  id: 'comp-1',
  businessName: 'Cloth Retail Co',
  legalName: 'Cloth Retail Pvt Ltd',
  gstin: '24AAACC1234A1Z5',
  pan: 'AAACC1234A',
  address: {
    line1: '123 Commercial Complex, Ring Road',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380015',
  },
  phone: '079-26541234',
  email: 'accounts@clothretail.com',
  financialYearStart: '04-01',
  status: 'Active',
};

const usersData = [
  { id: 'usr-1', userName: 'Admin', email: 'admin@clothretail.com', roleId: 'rl-1', mobile: '9876543210', status: 'Active' },
  { id: 'usr-2', userName: 'Vikram Mehta', email: 'vikram@clothretail.com', roleId: 'rl-2', mobile: '9899557788', status: 'Active' },
  { id: 'usr-3', userName: 'Accounts User', email: 'accounts@clothretail.com', roleId: 'rl-3', mobile: '9822011122', status: 'Active' },
];

const rolesData = [
  {
    id: 'rl-1',
    roleName: 'Admin',
    description: 'Full access to all modules',
    permissions: { masters: ['view', 'create', 'edit', 'delete'], items: ['view', 'create', 'edit', 'delete'], inventory: ['view', 'create', 'edit', 'delete'], purchase: ['view', 'create', 'edit', 'delete'], sales: ['view', 'create', 'edit', 'delete'], pricing: ['view', 'create', 'edit', 'delete'], customers: ['view', 'create', 'edit', 'delete'], reports: ['view'], gst: ['view', 'create', 'edit', 'delete'], settings: ['view', 'edit'] },
    status: 'Active',
  },
  {
    id: 'rl-2',
    roleName: 'Sales Manager',
    description: 'Sales and billing access',
    permissions: { masters: ['view'], items: ['view'], inventory: ['view'], purchase: ['view'], sales: ['view', 'create', 'edit'], pricing: ['view'], customers: ['view', 'create', 'edit'], reports: ['view'], gst: ['view'], settings: [] },
    status: 'Active',
  },
  {
    id: 'rl-3',
    roleName: 'Accountant',
    description: 'Purchase, sales, and reports',
    permissions: { masters: ['view'], items: ['view'], inventory: ['view'], purchase: ['view', 'create', 'edit'], sales: ['view', 'create', 'edit'], pricing: ['view'], customers: ['view'], reports: ['view'], gst: ['view'], settings: [] },
    status: 'Active',
  },
];

const numberSeriesData = [
  { id: 'ns-1', documentType: 'Sales Invoice', prefix: 'INV-', nextNumber: 24001, padding: 6, resetPeriod: 'Yearly', status: 'Active' },
  { id: 'ns-2', documentType: 'Purchase Bill', prefix: 'BILL-', nextNumber: 1001, padding: 6, resetPeriod: 'Yearly', status: 'Active' },
  { id: 'ns-3', documentType: 'Credit Note', prefix: 'CN-', nextNumber: 101, padding: 6, resetPeriod: 'Yearly', status: 'Active' },
  { id: 'ns-4', documentType: 'Sales Return', prefix: 'SRET-', nextNumber: 8001, padding: 6, resetPeriod: 'Yearly', status: 'Active' },
  { id: 'ns-5', documentType: 'Purchase Return', prefix: 'RET-', nextNumber: 9001, padding: 6, resetPeriod: 'Yearly', status: 'Active' },
];

const preferencesData = {
  currency: 'INR',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12h',
  defaultWarehouseId: 'wh-1',
  defaultTaxRateId: 'tr-2',
  lowStockThreshold: 10,
  qtyDecimals: 2,
  amountDecimals: 2,
  showGstOnInvoice: true,
  autoApplyLoyalty: false,
};

const purchaseVoucherConfigData = {
  carryForwardPackSize: true,
  defaultTaxPercent: 12,
  gstSlabEnabled: true,
  gstSlabThreshold: 1000,
  belowThresholdTax: 5,
  aboveThresholdTax: 12,
};

const printTemplatesData = [
  { id: 'pt-1', name: 'Standard Invoice', documentType: 'Invoice', layout: 'Detailed', headerText: 'Thank you for your business', footerText: 'Terms & Conditions apply', status: 'Active' },
  { id: 'pt-2', name: 'Compact Invoice', documentType: 'Invoice', layout: 'Compact', headerText: '', footerText: '', status: 'Active' },
  { id: 'pt-3', name: 'Delivery Note', documentType: 'Delivery Note', layout: 'Standard', headerText: 'Delivery Note', footerText: '', status: 'Active' },
];

const auditLogData = [
  { id: 'al-1', timestamp: '2026-02-28T10:15:00', userId: 'usr-1', userName: 'Admin', action: 'Created', module: 'Sales', entityId: 'sal-2', reference: 'INV-24002', details: 'New sale invoice' },
  { id: 'al-2', timestamp: '2026-02-28T09:45:00', userId: 'usr-2', userName: 'Vikram Mehta', action: 'Updated', module: 'Items', entityId: 'itm-1', reference: 'STY-DNM-JKT', details: 'Updated variant price' },
  { id: 'al-3', timestamp: '2026-02-27T16:30:00', userId: 'usr-1', userName: 'Admin', action: 'Created', module: 'Purchase', entityId: 'pur-2', reference: 'BILL-1002', details: 'New purchase bill' },
  { id: 'al-4', timestamp: '2026-02-27T14:00:00', userId: 'usr-3', userName: 'Accounts User', action: 'Created', module: 'Masters', entityId: 'cus-3', reference: 'Trendset Garments', details: 'New customer' },
  { id: 'al-5', timestamp: '2026-02-26T11:20:00', userId: 'usr-2', userName: 'Vikram Mehta', action: 'Updated', module: 'Inventory', entityId: 'stk-5', reference: 'Stock adjustment', details: 'Adjusted quantity' },
];

export {
  companyProfileData,
  usersData,
  rolesData,
  numberSeriesData,
  preferencesData,
  purchaseVoucherConfigData,
  printTemplatesData,
  auditLogData,
};
