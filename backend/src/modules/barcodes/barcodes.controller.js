const { getNextSequence } = require('../../services/sequence.service');
const Product = require('../../models/product.model');
const GRN = require('../../models/grn.model');
const { sendSuccess, sendError } = require('../../utils/response.handler');

/**
 * Handle Bulk Barcode Generation with Systematic Sequence
 * This handles the "Recognize where we left off" logic by using a persistent sequence counter.
 */
const importExcelAndGenerateBarcodes = async (req, res, next) => {
    try {
        const count = req.body.count || 10; 
        const labels = [];

        for (let i = 0; i < count; i++) {
            const seq = await getNextSequence('GLOBAL_BARCODE_SEQUENCE');
            const barcode = `BAR-${new Date().getFullYear()}-${seq.toString().padStart(6, '0')}`;
            
            labels.push({
                barcode,
                article: 'NEW-ART',
                size: 'M',
                color: 'BLACK',
                mrp: 999,
                design: 'Season Default'
            });
        }

        return sendSuccess(res, { labels }, `Generated ${count} sequential barcodes starting from last known index.`);
    } catch (err) {
        next(err);
    }
};

/**
 * Fetch Print-Ready Labels from an Approved GRN
 */
const getLabelsByGrn = async (req, res, next) => {
    try {
        const { id } = req.params;
        const grn = await GRN.findById(id).populate('items.productId');
        if (!grn) return sendError(res, 'GRN not found', 404);

        const labels = [];
        for (const item of grn.items) {
            const product = item.productId;
            if (!product) continue;

            // Generate label for each received quantity
            for (let i = 0; i < item.receivedQty; i++) {
                labels.push({
                    barcode: product.barcode || product.sku || product.itemCode || `BAR-${product._id.toString().slice(-6)}`,
                    article: product.sku || product.itemCode || product.itemName,
                    size: item.size || product.size || 'N/A',
                    color: product.shade || product.color || 'N/A',
                    mrp: product.salePrice || product.mrp || 0,
                    design: product.itemName || product.name
                });
            }
        }

        return sendSuccess(res, { labels }, `Extracted ${labels.length} labels from GRN ${grn.grnNumber}.`);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    importExcelAndGenerateBarcodes,
    getLabelsByGrn
};
