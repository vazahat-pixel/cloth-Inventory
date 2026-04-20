const GRN = require('../../models/grn.model');
const BatchBarcode = require('../../models/batchBarcode.model');
const { sendSuccess, sendError } = require('../../utils/response.handler');

/**
 * Generate barcode sticker details from a GRN Document.
 */
exports.getGrnBarcodes = async (req, res) => {
    try {
        const { id } = req.params;
        const grn = await GRN.findById(id).populate('items.itemId', 'itemCode groupIds');
        
        if (!grn) {
            return res.status(404).json({ success: false, message: 'GRN not found' });
        }

        const labels = [];

        for (const item of grn.items) {
            const qty = item.receivedQty || 0;
            const itemCode = item.itemId?.itemCode || item.sku;
            
            const labelData = {
                barcode: item.sku,
                article: itemCode,
                size: item.size || 'N/A',
                color: item.color || 'N/A',
                mrp: item.costPrice || 0,
                category: 'GARMENT'
            };

            for (let i = 0; i < qty; i++) {
                labels.push({ ...labelData });
            }
        }

        return res.status(200).json({
            success: true,
            data: { labels }
        });
    } catch (error) {
        console.error('Error fetching GRN barcodes:', error);
        return res.status(500).json({ success: false, message: 'Server error while generating stickers' });
    }
};

/**
 * List all generated batch barcodes
 */
exports.listBatchBarcodes = async (req, res) => {
    try {
        const barcodes = await BatchBarcode.find()
            .sort({ createdAt: -1 })
            .populate('itemId', 'itemName itemCode')
            .limit(100); // Limit to avoid massive payloads, adjust as needed

        return sendSuccess(res, { barcodes }, 'Batch barcodes retrieved');
    } catch (error) {
        return sendError(res, error.message);
    }
};

/**
 * Delete all batch barcodes
 */
exports.deleteAllBatchBarcodes = async (req, res) => {
    try {
        await BatchBarcode.deleteMany({});
        return sendSuccess(res, null, 'All batch barcode records deleted');
    } catch (error) {
        return sendError(res, error.message);
    }
};

/**
 * Delete a specific batch barcode
 */
exports.deleteBatchBarcode = async (req, res) => {
    try {
        await BatchBarcode.findByIdAndDelete(req.params.id);
        return sendSuccess(res, null, 'Batch barcode record deleted');
    } catch (error) {
        return sendError(res, error.message);
    }
};
