const GRN = require('../../models/grn.model');
const QC = require('../../models/qc.model');
const { DocumentType, QcStatus } = require('../../core/enums');

/**
 * Middleware to enforce workflow dependencies
 */
const validateWorkflowStep = async (req, res, next) => {
    try {
        const path = req.originalUrl;
        const method = req.method;

        // 1. RULE: Cannot create GRN without PURCHASE
        if (path.includes('/grn') && method === 'POST') {
            const { purchaseId } = req.body;
            if (!purchaseId) {
                return res.status(400).json({ success: false, message: 'Purchase ID is required to create a GRN' });
            }
            const Purchase = require('../../models/purchase.model');
            const purchase = await Purchase.findById(purchaseId);
            if (!purchase) {
                return res.status(400).json({ success: false, message: 'Invalid Purchase ID' });
            }
        }

        // 2. RULE: Cannot create QC without GRN
        if (path.includes('/qc') && method === 'POST') {
            const { grnId } = req.body;
            if (!grnId) {
                return res.status(400).json({ success: false, message: 'GRN ID is required to create a QC request' });
            }
            const grn = await GRN.findById(grnId);
            if (!grn) {
                return res.status(400).json({ success: false, message: 'Invalid GRN ID' });
            }
        }

        next();
    } catch (err) {
        next(err);
    }
};

module.exports = {
    validateWorkflowStep
};
