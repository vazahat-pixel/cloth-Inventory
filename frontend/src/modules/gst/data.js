const taxRatesData = [
  {
    id: 'tr-1',
    name: 'GST 5%',
    cgst: 2.5,
    sgst: 2.5,
    igst: 5,
    effectiveFrom: '2025-01-01',
    status: 'Active',
  },
  {
    id: 'tr-2',
    name: 'GST 12%',
    cgst: 6,
    sgst: 6,
    igst: 12,
    effectiveFrom: '2025-01-01',
    status: 'Active',
  },
  {
    id: 'tr-3',
    name: 'GST 18%',
    cgst: 9,
    sgst: 9,
    igst: 18,
    effectiveFrom: '2025-01-01',
    status: 'Active',
  },
  {
    id: 'tr-4',
    name: 'GST 0%',
    cgst: 0,
    sgst: 0,
    igst: 0,
    effectiveFrom: '2025-01-01',
    status: 'Active',
  },
];

const taxGroupsData = [
  {
    id: 'tg-1',
    name: 'Apparel Standard',
    rateId: 'tr-2',
    category: 'Menswear',
    description: 'Standard 12% GST for apparel',
    status: 'Active',
  },
  {
    id: 'tg-2',
    name: 'Cotton Essentials',
    rateId: 'tr-1',
    category: 'Menswear',
    description: '5% GST for cotton products',
    status: 'Active',
  },
  {
    id: 'tg-3',
    name: 'Premium Denim',
    rateId: 'tr-3',
    category: 'Denim Jackets',
    description: '18% GST for premium denim',
    status: 'Active',
  },
  {
    id: 'tg-4',
    name: 'Exempt Items',
    rateId: 'tr-4',
    category: '',
    description: 'Zero-rated items',
    status: 'Inactive',
  },
];

const invoiceTaxRowsData = [
  {
    id: 'itx-1',
    invoiceNumber: 'INV-24001',
    date: '2026-02-26',
    customer: 'Neel Fashion Point',
    taxableValue: 3321.15,
    cgst: 148.96,
    sgst: 148.96,
    igst: 0,
    totalTax: 297.92,
    netAmount: 3619.11,
  },
  {
    id: 'itx-2',
    invoiceNumber: 'INV-24002',
    date: '2026-02-27',
    customer: 'Walk-in Customer',
    taxableValue: 1078,
    cgst: 26.95,
    sgst: 26.95,
    igst: 0,
    totalTax: 53.9,
    netAmount: 1131.9,
  },
];

const gstrSummaryData = {
  outwardSupplies: {
    taxableValue: 4399.15,
    cgst: 175.91,
    sgst: 175.91,
    igst: 0,
    totalTax: 351.82,
  },
  inwardSupplies: {
    taxableValue: 35000,
    cgst: 2100,
    sgst: 2100,
    igst: 0,
    totalTax: 4200,
  },
  taxLiability: 351.82,
  inputTaxCredit: 4200,
  netPayable: -3848.18,
};

export { taxRatesData, taxGroupsData, invoiceTaxRowsData, gstrSummaryData };
export default {
  taxRatesData,
  taxGroupsData,
  invoiceTaxRowsData,
  gstrSummaryData,
};
