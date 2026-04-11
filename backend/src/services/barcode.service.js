const crypto = require('crypto');
const BatchBarcode = require('../models/batchBarcode.model');

const generateUniqueBarcode = async (prefix = '') => {
  let barcode = '';
  let exists = true;
  while (exists) {
    if (prefix) {
      const random = crypto.randomBytes(2).toString('hex').toUpperCase();
      barcode = `${prefix}-${random}`;
    } else {
      barcode = crypto.randomBytes(4).toString('hex').toUpperCase();
    }
    const check = await BatchBarcode.findOne({ barcode });
    if (!check) exists = false;
  }
  return barcode;
};

const generateRollBarcodes = async (count, styleCode) => {
  const codes = [];
  const prefix = styleCode ? styleCode.toUpperCase() : 'ROLL';
  for (let i = 0; i < count; i++) {
    const code = await generateUniqueBarcode(prefix);
    codes.push(code);
  }
  return codes;
};

const createBarcodesForGrn = async (grn, userId, session) => {
  const barcodes = [];
  const products = grn.products || grn.items || [];
  for (const item of products) {
    const code = item.sku || (await generateUniqueBarcode());
    const batchBarcode = new BatchBarcode({
      barcode: code,
      itemId: item.productId || item.itemId,
      variantId: item.variantId || item.productId || item.itemId,
      batchNo: item.batchNo || 'DEFAULT',
      grnId: grn._id,
    });
    await batchBarcode.save({ session });
    barcodes.push(batchBarcode);
  }
  return barcodes;
};

module.exports = {
  generateUniqueBarcode,
  generateRollBarcodes,
  createBarcodesForGrn,
};
