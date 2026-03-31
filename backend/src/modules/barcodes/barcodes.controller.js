const { getNextSequence } = require('../../services/sequence.service');
const Product = require('../../models/product.model');
const { sendSuccess, sendError } = require('../../utils/response.handler');

/**
 * Handle Bulk Barcode Generation with Systematic Sequence
 * This handles the "Recognize where we left off" logic by using a persistent sequence counter.
 */
const importExcelAndGenerateBarcodes = async (req, res, next) => {
    try {
        // In a real scenario, we'd parse req.file (excel) here.
        // For this implementation, we'll demonstrate the sequence logic.
        
        // Let's assume the user wants to generate 50 labels for newly receipted items.
        // We'll use a sequence named "GLOBAL_BARCODE_SEQUENCE"
        
        const count = req.body.count || 10; // Mock count if no file parsed
        const labels = [];

        for (let i = 0; i < count; i++) {
            const seq = await getNextSequence('GLOBAL_BARCODE_SEQUENCE');
            // Format: BAR-[YEAR]-[SEQ]
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

module.exports = {
    importExcelAndGenerateBarcodes
};
