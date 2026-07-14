const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  allocateInvoiceGstToLineItems,
  getSaleInvoiceTaxable,
  normalizeSaleGstBreakup,
} = require('../utils/saleReportUtils');

describe('allocateInvoiceGstToLineItems', () => {
  it('allocates invoice tax when line taxAmount is missing (legacy bills)', () => {
    const sale = {
      grandTotal: 4138.7,
      totalTax: 197.08095238095257,
      taxBreakup: { cgst: 98.54, sgst: 98.54, igst: 0 },
      items: [
        { total: 944.69, taxAmount: 45, taxPercentage: 5 },
        { total: 1039.19, taxAmount: 49.5, taxPercentage: 5 },
        { total: 1102.19, taxAmount: 52.5, taxPercentage: 5 },
        { total: 1052.63, taxAmount: 0, taxPercentage: 5 },
      ],
    };

    const lines = allocateInvoiceGstToLineItems(sale);
    assert.equal(lines.length, 4);

    const totalTax = lines.reduce((sum, line) => sum + line.tax, 0);
    const totalTaxable = lines.reduce((sum, line) => sum + line.taxable, 0);
    const totalNet = lines.reduce((sum, line) => sum + line.netAmount, 0);

    assert.ok(lines.every((line) => line.tax >= 0), 'tax must never be negative');
    assert.ok(lines.every((line) => line.cgst >= 0 && line.sgst >= 0), 'cgst/sgst must never be negative');
    assert.equal(Number(totalTax.toFixed(2)), 197.08);
    assert.equal(Number(totalTaxable.toFixed(2)), 3941.62);
    assert.equal(Number(totalNet.toFixed(2)), 4138.7);
  });

  it('keeps zero-tax invoices at zero tax per line', () => {
    const sale = {
      grandTotal: 85773,
      totalTax: 0,
      items: [
        { total: 599, taxAmount: 0 },
        { total: 2499, taxAmount: 0 },
      ],
    };

    const lines = allocateInvoiceGstToLineItems(sale);
    assert.equal(lines.reduce((sum, line) => sum + line.tax, 0), 0);
    assert.equal(lines.reduce((sum, line) => sum + line.taxable, 0), 85773);
  });

  it('splits tax evenly across two equal lines', () => {
    const sale = {
      grandTotal: 540,
      totalTax: 114.25714285714275,
      taxBreakup: { cgst: 57.13, sgst: 57.13, igst: 0 },
      items: [
        { total: 270, taxAmount: 0, taxPercentage: 5 },
        { total: 270, taxAmount: 0, taxPercentage: 5 },
      ],
    };

    const lines = allocateInvoiceGstToLineItems(sale);
    assert.equal(Number(lines[0].tax.toFixed(2)), Number(lines[1].tax.toFixed(2)));
    assert.equal(lines.reduce((sum, line) => sum + line.tax, 0).toFixed(2), '114.26');
    assert.equal(lines.reduce((sum, line) => sum + line.netAmount, 0).toFixed(2), '540.00');
  });

  it('uses legacy sale.tax when totalTax is zero', () => {
    const sale = {
      grandTotal: 4138.7,
      totalTax: 0,
      tax: 197.08095238095257,
      subTotal: 3941.619047619048,
      items: [
        { total: 944.69 },
        { total: 1039.19 },
        { total: 1102.19 },
        { total: 1052.63 },
      ],
    };

    const lines = allocateInvoiceGstToLineItems(sale);
    assert.equal(lines.reduce((sum, line) => sum + line.tax, 0).toFixed(2), '197.08');
    assert.ok(lines.every((line) => line.tax >= 0));
  });

  it('uses grandTotal minus tax when subTotal disagrees (exchange bills)', () => {
    const sale = {
      grandTotal: 540,
      totalTax: 114.25714285714275,
      tax: 114.25714285714275,
      subTotal: 2285.142857142858,
      items: [
        { total: 1199.7 },
        { total: 1199.7 },
      ],
    };

    const lines = allocateInvoiceGstToLineItems(sale);
    assert.equal(lines.reduce((sum, line) => sum + line.netAmount, 0).toFixed(2), '540.00');
    assert.equal(lines.reduce((sum, line) => sum + line.taxable, 0).toFixed(2), '425.74');
    assert.equal(lines.reduce((sum, line) => sum + line.tax, 0).toFixed(2), '114.26');
  });
});

describe('normalizeSaleGstBreakup', () => {
  it('rebuilds CGST/SGST when taxBreakup is stale/tiny vs real tax', () => {
    const sale = {
      grandTotal: 2357.6,
      totalTax: 112.27,
      tax: 112.27,
      taxBreakup: { cgst: 2.5, sgst: 2.5, igst: 0 },
    };
    const breakup = normalizeSaleGstBreakup(sale);
    assert.equal(breakup.invoiceTax, 112.27);
    assert.equal(breakup.cgst, 56.14);
    assert.equal(breakup.sgst, 56.13);
    assert.equal(breakup.igst, 0);
    assert.equal(breakup.isInterstate, false);
  });

  it('splits zero breakup as CGST/SGST (not IGST)', () => {
    const sale = {
      grandTotal: 1050,
      totalTax: 50,
      taxBreakup: { cgst: 0, sgst: 0, igst: 0 },
    };
    const breakup = normalizeSaleGstBreakup(sale);
    assert.equal(breakup.cgst, 25);
    assert.equal(breakup.sgst, 25);
    assert.equal(breakup.igst, 0);
  });

  it('keeps interstate IGST when breakup is clearly IGST', () => {
    const sale = {
      grandTotal: 1050,
      totalTax: 50,
      taxBreakup: { cgst: 0, sgst: 0, igst: 50 },
    };
    const breakup = normalizeSaleGstBreakup(sale);
    assert.equal(breakup.igst, 50);
    assert.equal(breakup.cgst, 0);
    assert.equal(breakup.sgst, 0);
    assert.equal(breakup.isInterstate, true);
  });
});

describe('getSaleInvoiceTaxable', () => {
  it('matches sales register net (grandTotal - tax) for exchange bills', () => {
    const sale = {
      grandTotal: 280487,
      totalTax: 13356.52,
      subTotal: 342108.43,
    };
    assert.equal(getSaleInvoiceTaxable(sale), 267130.48);
  });

  it('prefers subTotal when it already matches grandTotal - tax', () => {
    const sale = {
      grandTotal: 1050,
      totalTax: 50,
      subTotal: 1000,
    };
    assert.equal(getSaleInvoiceTaxable(sale), 1000);
  });
});
