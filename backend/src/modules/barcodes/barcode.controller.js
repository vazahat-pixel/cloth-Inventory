const GRN = require('../../models/grn.model');

/**
 * Generate barcode sticker details from a GRN Document.
 * Expected to extract quantity and return one object per sticker to be printed (or group by sku).
 * The frontend currently accepts grouped or flattened responses depending on implementation, 
 * but `BarcodePrintingPage.jsx` sets `importResults` directly, so it expects an array of label objects or items.
 * 
 * Wait, in `BarcodePrintingPage.jsx`, if activeTab===1, it sets `importResults` to `labels` and `activeTab=1` doesn't use `importResults` directly for print until user clicks "Print Import". Ah actually, `activeTab: 1` sets `importResults`. "Print Import" prints `importResults` directly. 
 * So `importResults` should be an array of `label` objects flat or each having `printQty`. Wait, the standard in BarcodePrintingPage.jsx `printBatch(labels)` assumes `labels` is a flat array where EACH ITEM is ONE STICKER.
 * So if receivedQty is 5, we generate 5 copies of the label object.
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
                // Defaulting to GARMENT if nothing else is attached.
                category: 'GARMENT'
            };

            // Explode by quantity so the frontend can just loop and print
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
