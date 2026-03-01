import * as XLSX from 'xlsx';

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Parse Excel file for purchase import.
 * Expected columns (case-insensitive): SKU, Quantity, Rate, Discount (optional), Tax (optional), Lot (optional)
 * Returns { rows: [{ sku, quantity, rate, discount, tax, lotNumber, ... }], errors: string[] }
 */
export function parsePurchaseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

        if (!json.length || json.length < 2) {
          resolve({ rows: [], errors: ['No data found in sheet.'] });
          return;
        }

        const headerRow = json[0].map((h) => String(h || '').trim().toLowerCase());
        const skuIdx = headerRow.findIndex((h) => h === 'sku' || h === 'item code');
        const qtyIdx = headerRow.findIndex((h) => h === 'quantity' || h === 'qty');
        const rateIdx = headerRow.findIndex((h) => h === 'rate' || h === 'price');
        const discountIdx = headerRow.findIndex((h) => h === 'discount' || h === 'discount %');
        const taxIdx = headerRow.findIndex((h) => h === 'tax' || h === 'gst' || h === 'tax %');
        const lotIdx = headerRow.findIndex((h) => h === 'lot' || h === 'lot number');

        const errors = [];
        if (skuIdx < 0) errors.push('SKU column not found.');
        if (qtyIdx < 0) errors.push('Quantity column not found.');
        if (rateIdx < 0) errors.push('Rate column not found.');

        if (errors.length) {
          resolve({ rows: [], errors });
          return;
        }

        const rows = [];
        for (let i = 1; i < json.length; i++) {
          const row = json[i] || [];
          const sku = String(row[skuIdx] ?? '').trim();
          const quantity = toNumber(row[qtyIdx], 0);
          const rate = toNumber(row[rateIdx], 0);

          if (!sku || quantity <= 0) continue;

          rows.push({
            sku,
            quantity,
            rate,
            discount: discountIdx >= 0 ? toNumber(row[discountIdx], 0) : 0,
            tax: taxIdx >= 0 ? toNumber(row[taxIdx], 0) : 0,
            lotNumber: lotIdx >= 0 ? String(row[lotIdx] ?? '').trim() : '',
          });
        }

        resolve({ rows, errors });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
}
