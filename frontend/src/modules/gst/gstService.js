/**
 * GST JSON export service for GSTR-1, GSTR-2A reconcile, and GSTR-3B.
 * Generates GSTN-compatible JSON for Returns Offline Tool upload.
 */

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/**
 * Generate GSTR-1 JSON (outward supplies) for the given date range.
 * Structure aligned with GST Returns Offline Tool format.
 */
export function generateGSTR1JSON(sales, salesReturns, dateFrom, dateTo) {
  const filteredSales = (sales || []).filter((s) => {
    const d = s.date || '';
    return (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
  });
  const filteredReturns = (salesReturns || []).filter((r) => {
    const d = r.date || r.returnDate || '';
    return (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
  });

  const b2b = [];
  const b2cs = [];
  const hsnSum = {};

  filteredSales.forEach((sale) => {
    const gross = toNum(sale.totals?.grossAmount);
    const discount = toNum(sale.totals?.lineDiscount) + toNum(sale.totals?.billDiscount);
    const taxableValue = gross - discount;
    const taxAmount = toNum(sale.totals?.taxAmount);
    const cgst = taxAmount / 2;
    const sgst = taxAmount / 2;
    const rt = (sale.items?.[0]?.tax ?? 12);

    (sale.items || []).forEach((line) => {
      const hsnCode = line.hsnCode || '6109';
      if (!hsnSum[hsnCode]) hsnSum[hsnCode] = { qty: 0, taxable_value: 0, cgst: 0, sgst: 0, igst: 0 };
      const lineGross = toNum(line.rate) * toNum(line.quantity);
      const lineDisc = (lineGross * toNum(line.discount)) / 100;
      const lineTaxable = lineGross - lineDisc;
      const lineTax = (lineTaxable * toNum(line.tax)) / 100;
      hsnSum[hsnCode].qty += toNum(line.quantity);
      hsnSum[hsnCode].taxable_value += lineTaxable;
      hsnSum[hsnCode].cgst += lineTax / 2;
      hsnSum[hsnCode].sgst += lineTax / 2;
      hsnSum[hsnCode].igst += 0;
    });

    const inv = {
      ctin: sale.customerGstin || 'URP',
      inv: {
        num: sale.invoiceNumber || sale.id,
        dt: (sale.date || '').replace(/-/g, '/'),
        val: Math.round(taxableValue * 100) / 100,
        inv_typ: 'R',
        pos: '01',
        itms: (sale.items || []).map((line, idx) => {
          const lineGross = toNum(line.rate) * toNum(line.quantity);
          const lineDisc = (lineGross * toNum(line.discount)) / 100;
          const lineTaxable = lineGross - lineDisc;
          const lineTax = (lineTaxable * toNum(line.tax)) / 100;
          return {
            num: idx + 1,
            itm_det: {
              rt: toNum(line.tax),
              ad_amt: 0,
              iamt: lineTax / 2,
              camt: lineTax / 2,
              samt: lineTax / 2,
              csamt: 0,
            },
            itc: { elg: 'Y', tx_i: 0, tx_c: 0, tx_s: 0, tx_cs: 0 },
          };
        }),
      },
    };
    if (sale.customerId && sale.customerGstin) {
      b2b.push(inv);
    } else {
      b2cs.push({
        sply_ty: 'INTRA',
        ty: 'OE',
        hsn_sc: '6109',
        bch: '1',
        desc: 'Outward supply',
        uqc: 'PCS',
        qty: toNum(sale.totals?.totalQuantity),
        cst: 0,
        taxableval: Math.round(taxableValue * 100) / 100,
        rt,
        txval: Math.round(taxableValue * 100) / 100,
        iamt: Math.round(cgst * 100) / 100,
        camt: Math.round(sgst * 100) / 100,
        samt: 0,
        csamt: 0,
      });
    }
  });

  const hsn = Object.entries(hsnSum).map(([hsnCode, v]) => ({
    hsn_sc: hsnCode,
    desc: 'Textile / Apparel',
    uqc: 'PCS',
    qty: Math.round(v.qty * 1000) / 1000,
    cst: 0,
    taxableval: Math.round(v.taxable_value * 100) / 100,
    rt: 12,
    txval: Math.round(v.taxable_value * 100) / 100,
    iamt: Math.round(v.igst * 100) / 100,
    camt: Math.round(v.cgst * 100) / 100,
    samt: Math.round(v.sgst * 100) / 100,
    csamt: 0,
  }));

  return {
    gstin: '',
    fp: dateFrom ? `${dateFrom.slice(0, 4)}${dateFrom.slice(5, 7)}` : '',
    gt: Math.round(
      filteredSales.reduce((s, x) => s + toNum(x.totals?.netPayable), 0) * 100,
    ) / 100,
    cur_gt: Math.round(
      filteredSales.reduce((s, x) => s + toNum(x.totals?.netPayable), 0) * 100,
    ) / 100,
    b2b: b2b.length ? b2b : undefined,
    b2cs: b2cs.length ? b2cs : undefined,
    hsn: hsn.length ? hsn : undefined,
    generatedAt: new Date().toISOString(),
    version: '1.0',
  };
}

/**
 * Generate GSTR-3B JSON for the given date range.
 */
export function generateGSTR3BJSON(sales, purchases, salesReturns, purchaseReturns, dateFrom, dateTo) {
  const filteredSales = (sales || []).filter((s) => {
    const d = s.date || '';
    return (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
  });
  const filteredPurchases = (purchases || []).filter((p) => {
    const d = p.billDate || p.date || '';
    return (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
  });

  let outwardTaxable = 0;
  let outwardCgst = 0;
  let outwardSgst = 0;
  let outwardIgst = 0;
  filteredSales.forEach((s) => {
    const gross = toNum(s.totals?.grossAmount);
    const discount = toNum(s.totals?.lineDiscount) + toNum(s.totals?.billDiscount);
    outwardTaxable += gross - discount;
    const tax = toNum(s.totals?.taxAmount);
    outwardCgst += tax / 2;
    outwardSgst += tax / 2;
  });

  let inwardTaxable = 0;
  let inwardCgst = 0;
  let inwardSgst = 0;
  let inwardIgst = 0;
  filteredPurchases.forEach((p) => {
    const gross = toNum(p.totals?.grossAmount) - toNum(p.totals?.totalDiscount);
    inwardTaxable += gross;
    const tax = toNum(p.totals?.totalTax);
    inwardCgst += tax / 2;
    inwardSgst += tax / 2;
  });

  const taxLiability = outwardCgst + outwardSgst + outwardIgst;
  const inputTaxCredit = inwardCgst + inwardSgst + inwardIgst;
  const netPayable = Math.round((taxLiability - inputTaxCredit) * 100) / 100;

  return {
    gstin: '',
    fp: dateFrom ? `${dateFrom.slice(0, 4)}${dateFrom.slice(5, 7)}` : '',
    gt: Math.round(
      filteredSales.reduce((s, x) => s + toNum(x.totals?.netPayable), 0) * 100,
    ) / 100,
    cur_gt: Math.round(
      filteredSales.reduce((s, x) => s + toNum(x.totals?.netPayable), 0) * 100,
    ) / 100,
    sup_detail: {
      osup_det: {
        txval: Math.round(outwardTaxable * 100) / 100,
        iamt: Math.round(outwardIgst * 100) / 100,
        camt: Math.round(outwardCgst * 100) / 100,
        samt: Math.round(outwardSgst * 100) / 100,
        csamt: 0,
      },
    },
    inter_sup: {
      unreg_details: [],
      comp_details: [],
      uitin_details: [],
    },
    itc_elg: {
      itc_net: {
        tx_cs: 0,
        tx_i: Math.round(inwardIgst * 100) / 100,
        tx_c: Math.round(inwardCgst * 100) / 100,
        tx_s: Math.round(inwardSgst * 100) / 100,
      },
    },
    tax_pmt: {
      cgst: Math.round(Math.min(outwardCgst, inwardCgst + outwardCgst) * 100) / 100,
      sgst: Math.round(Math.min(outwardSgst, inwardSgst + outwardSgst) * 100) / 100,
      igst: 0,
    },
    net_pay: netPayable,
    generatedAt: new Date().toISOString(),
    version: '1.0',
  };
}

/**
 * Parse GSTR-2A JSON file (purchase data from GST portal).
 * Returns array of inward supply records for reconciliation.
 */
export function parseGSTR2AJSON(jsonContent) {
  try {
    const data = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
    const invoices = [];
    const nt = data?.nt || data?.inv || data?.b2b || [];
    const list = Array.isArray(nt) ? nt : (nt && Array.isArray(nt.inv)) ? nt.inv : [];
    list.forEach((inv) => {
      const invData = inv.inv || inv;
      invoices.push({
        ctin: inv.ctin || invData.ctin || '',
        invNum: invData.num || invData.inum || '',
        invDate: (invData.dt || invData.idt || '').replace(/\//g, '-'),
        val: toNum(invData.val || invData.vl),
        tax: toNum(invData.txval || invData.ttl),
        irt: toNum(invData.rt),
        camt: toNum(invData.camt),
        samt: toNum(invData.samt),
        iamt: toNum(invData.iamt),
      });
    });
    if (invoices.length === 0 && data?.b2b) {
      (data.b2b || []).forEach((b) => {
        (b.inv || []).forEach((inv) => {
          invoices.push({
            ctin: b.ctin || '',
            invNum: inv.num || inv.inum || '',
            invDate: (inv.dt || inv.idt || '').replace(/\//g, '-'),
            val: toNum(inv.val || inv.vl),
            tax: toNum(inv.txval || inv.ttl),
            irt: toNum(inv.rt),
            camt: toNum(inv.camt),
            samt: toNum(inv.samt),
            iamt: toNum(inv.iamt),
          });
        });
      });
    }
    return invoices;
  } catch (e) {
    return [];
  }
}

/**
 * Reconcile GSTR-2A (portal data) with our purchase records.
 * Returns { matched, mismatched, notInPortal, notInBooks }.
 */
export function reconcileGSTR2A(gstr2aInvoices, purchases, dateFrom, dateTo) {
  const filteredPurchases = (purchases || []).filter((p) => {
    const d = p.billDate || p.date || '';
    return (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
  });

  const matched = [];
  const mismatched = [];
  const notInPortal = [];
  const notInBooks = [];

  const portalMap = {};
  (gstr2aInvoices || []).forEach((inv) => {
    const key = `${(inv.invNum || '').toLowerCase()}-${(inv.invDate || '').slice(0, 10)}`;
    portalMap[key] = inv;
  });

  filteredPurchases.forEach((p) => {
    const billNum = (p.billNumber || '').toString().trim();
    const billDate = (p.billDate || p.date || '').slice(0, 10);
    const key = `${billNum.toLowerCase()}-${billDate}`;
    const portalInv = portalMap[key];
    const ourVal = toNum(p.totals?.grossAmount) - toNum(p.totals?.totalDiscount);
    const ourTax = toNum(p.totals?.totalTax);

    if (!portalInv) {
      notInPortal.push({
        billNumber: billNum,
        billDate,
        supplierId: p.supplierId,
        ourValue: ourVal,
        ourTax,
        reason: 'Not found in GSTR-2A',
      });
    } else {
      const valDiff = Math.abs(ourVal - toNum(portalInv.val));
      const taxDiff = Math.abs(ourTax - (toNum(portalInv.camt) + toNum(portalInv.samt) + toNum(portalInv.iamt)));
      if (valDiff < 0.02 && taxDiff < 0.02) {
        matched.push({
          billNumber: billNum,
          billDate,
          value: ourVal,
          tax: ourTax,
        });
      } else {
        mismatched.push({
          billNumber: billNum,
          billDate,
          ourValue: ourVal,
          portalValue: toNum(portalInv.val),
          ourTax,
          portalTax: toNum(portalInv.camt) + toNum(portalInv.samt) + toNum(portalInv.iamt),
          ctin: portalInv.ctin,
        });
      }
      delete portalMap[key];
    }
  });

  Object.values(portalMap).forEach((inv) => {
    notInBooks.push({
      invNum: inv.invNum,
      invDate: inv.invDate,
      value: inv.val,
      tax: toNum(inv.camt) + toNum(inv.samt) + toNum(inv.iamt),
      ctin: inv.ctin,
      reason: 'Not in books',
    });
  });

  return { matched, mismatched, notInPortal, notInBooks };
}
