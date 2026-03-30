const crypto = require('crypto');
const BatchBarcode = require('../models/batchBarcode.model');

const generateUniqueBarcode = async () => {
    let barcode = '';
    let exists = true;
    while (exists) {
        barcode = crypto.randomBytes(4).toString('hex').toUpperCase(); // Example: A1B2C3D4
        const check = await BatchBarcode.findOne({ barcode });
        if (!check) exists = false;
    }
    return barcode;
};

const createBarcodesForGrn = async (grn, userId, session) => {
    const barcodes = [];
    for (const item of grn.products) {
        // Generate a barcode for each line item (SKU + Batch)
        const code = await generateUniqueBarcode();
        const batchBarcode = new BatchBarcode({
            barcode: code,
            itemId: item.productId,
            variantId: item.productId, // assuming productId is the variant for now
            batchNo: item.batchNo,
            grnId: grn._id
        });
        await batchBarcode.save({ session });
        barcodes.push(batchBarcode);
    }
    return barcodes;
};

module.exports = {
    generateUniqueBarcode,
    createBarcodesForGrn
};
