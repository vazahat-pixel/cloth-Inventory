const productService = require('../products/product.service');
const Item = require('../../models/item.model');
const BatchBarcode = require('../../models/batchBarcode.model');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/response.handler');
const xlsx = require('xlsx');

/**
 * Import Excel for high-volume barcode printing
 * Logic: Recognizes previous sequences and continues numbering
 */
const importBarcodeExcel = async (req, res, next) => {
    try {
        if (!req.file) return sendError(res, 'Excel file is required', 400);

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        const printerLabels = [];

        for (const row of data) {
            const itemCode = String(row['Item Code'] || row['SKU'] || '').trim().toUpperCase();
            const sizeLabel = String(row['Size'] || '').trim();
            const qty = parseInt(row['Qty'] || row['Quantity'] || 1);
            const color = String(row['Color'] || row['Shade'] || '').trim();

            if (!itemCode || !sizeLabel) continue;

            const item = await Item.findOne({ itemCode });
            if (!item) continue;

            // Find variant index for suffix (e.g. S is 01, M is 02)
            const variantIdx = item.sizes.findIndex(s => s.size.toLowerCase() === sizeLabel.toLowerCase());
            if (variantIdx === -1) continue;
            
            const variant = item.sizes[variantIdx];
            const sizeSuffix = (variantIdx + 1).toString().padStart(2, '0');

            // --- RECOGNITION STEP ---
            // Find the highest serial number already generated for this Style + Size
            const lastBatch = await BatchBarcode.findOne({ 
                itemId: item._id, 
                variantId: variant._id 
            }).sort({ createdAt: -1 });

            let startSerial = 1;
            if (lastBatch) {
                // Extract serial from last barcode (last 4 digits)
                const lastSerial = parseInt(lastBatch.barcode.slice(-4));
                if (!isNaN(lastSerial)) startSerial = lastSerial + 1;
            }

            // Generate next labels for this row
            const batchToCreate = [];
            for (let i = 0; i < qty; i++) {
                const serial = (startSerial + i).toString().padStart(4, '0');
                const uniqueBarcode = `${itemCode.replace(/[^A-Z0-9]/gi, '')}${sizeSuffix}${serial}`;

                const labelData = {
                    barcode: uniqueBarcode,
                    itemId: item._id,
                    variantId: variant._id,
                    batchNo: 'EXCEL_PRINT',
                    grnId: item._id,
                    article: itemCode,
                    size: sizeLabel,
                    color: color || item.shade || 'N/A',
                    mrp: variant.mrp || variant.salePrice || 0,
                    design: item.itemName || 'Garment'
                };

                batchToCreate.push(labelData);
            }

            if (batchToCreate.length) {
                await BatchBarcode.insertMany(batchToCreate);
                printerLabels.push(...batchToCreate);
            }
        }

        return sendSuccess(res, { labels: printerLabels, count: printerLabels.length }, 'Barcode labels generated successfully');
    } catch (err) {
        return sendError(res, err.message, 500);
    }
};

const getProductByBarcode = async (req, res, next) => {
    try {
        const product = await productService.getProductByBarcode(req.params.barcode);
        return sendSuccess(res, { product }, 'Product found');
    } catch (err) {
        return sendNotFound(res, err.message);
    }
};

const regenerateBarcode = async (req, res, next) => {
    try {
        const barcode = await productService.generateBarcode();
        const product = await productService.updateProduct(req.params.productId, { barcode });
        return sendSuccess(res, { product }, 'Barcode regenerated successfully');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    importBarcodeExcel,
    getProductByBarcode,
    regenerateBarcode
};
