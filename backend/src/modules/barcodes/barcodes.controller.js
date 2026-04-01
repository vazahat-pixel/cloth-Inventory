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
        // Explicitly populate items.itemId to ensure we get sizes array
        const grn = await GRN.findById(id).populate({
            path: 'items.itemId',
            model: 'Item'
        });
        
        if (!grn) return sendError(res, 'GRN not found', 404);

        if (!grn.items || !Array.isArray(grn.items) || grn.items.length === 0) {
            return sendSuccess(res, { labels: [] }, 'GRN has no items recorded.');
        }

        const labels = [];
        for (const item of grn.items) {
            const product = item.itemId; 
            
            // Generate labels ONLY if product data exists and we have received qty
            if (product && item.receivedQty > 0) {
                // Find the specific variant in the Item model's sizes array
                const variantIdStr = item.variantId?.toString();
                const variant = (product.sizes || []).find(s => 
                    s._id?.toString() === variantIdStr || 
                    s.id?.toString() === variantIdStr ||
                    s.sku === item.sku
                );
                
                const receivedQty = Number(item.receivedQty || 0);
                for (let i = 0; i < receivedQty; i++) {
                    labels.push({
                        barcode: variant?.sku || item.sku || product.itemCode || `BAR-${product._id}-${i}`,
                        article: product.itemCode || product.itemName || 'N/A',
                        size: variant?.size || item.size || 'N/A',
                        color: product.shade || 'N/A',
                        mrp: variant?.mrp || variant?.salePrice || product.salePrice || 0,
                        design: product.itemName || 'N/A'
                    });
                }
            }
        }

        const message = labels.length > 0 
            ? `Extracted ${labels.length} labels from GRN ${grn.grnNumber || 'N/A'}.`
            : `GRN found but no valid labels could be extracted (Check if items have received quantities).`;

        return sendSuccess(res, { labels }, message);
    } catch (error) {
        console.error('getLabelsByGrn Full Error:', error);
        next(error);
    }
};

module.exports = {
    importExcelAndGenerateBarcodes,
    getLabelsByGrn
};
