const GRN = require('../../models/grn.model');
const Supplier = require('../../models/supplier.model');
const { sendSuccess } = require('../../utils/response.handler');

/**
 * PRODUCTION YIELD ANALYSIS
 * Aggregates GRN consumption to show how much material was used vs finished goods produced
 */
const getYieldAnalysis = async (req, res, next) => {
    try {
        const { startDate, endDate, supplierId } = req.query;

        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
        }

        const match = { 
            status: 'APPROVED', 
            consumptionDetails: { $exists: true, $not: { $size: 0 } },
            ...dateFilter 
        };
        if (supplierId) match.supplierId = supplierId;

        const report = await GRN.aggregate([
            { $match: match },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$supplierId',
                    totalGarmentsProduced: { $sum: '$items.receivedQty' },
                    totalBatches: { $addToSet: '$_id' },
                    consumption: { $first: '$consumptionDetails' }
                }
            },
            {
                $lookup: {
                    from: 'suppliers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'supplierInfo'
                }
            },
            { $unwind: '$supplierInfo' },
            {
                $project: {
                    supplierId: '$_id',
                    supplierName: '$supplierInfo.name',
                    garmentsProduced: '$totalGarmentsProduced',
                    batchCount: { $size: '$totalBatches' },
                    // In a real production system, we'd sum all consumption across all GRNs
                    // For this V1, we'll sum the consumption arrays
                }
            }
        ]);

        // Second pass for more granular consumption summing (Aggregation $unwind has limits on nested arrays)
        // Let's do a cleaner aggregation for consumption
        const consumptionSummary = await GRN.aggregate([
            { $match: match },
            { $unwind: '$consumptionDetails' },
            {
                $group: {
                    _id: '$supplierId',
                    totalUsed: { $sum: '$consumptionDetails.quantity' },
                    totalWasted: { $sum: '$consumptionDetails.wasteQuantity' }
                }
            }
        ]);

        // Merge the two
        const finalResults = report.map(r => {
            const cons = consumptionSummary.find(cs => cs._id.toString() === r.supplierId.toString());
            const used = cons ? cons.totalUsed : 0;
            const wasted = cons ? cons.totalWasted : 0;
            const total = used + wasted;
            const wastePercent = total > 0 ? (wasted / total) * 100 : 0;

            return {
                ...r,
                totalMaterialUsed: total,
                wasteQuantity: wasted,
                wastagePercentage: wastePercent.toFixed(2),
                yieldRatio: r.garmentsProduced > 0 ? (total / r.garmentsProduced).toFixed(2) : 0 // Meters/Kg per garment
            };
        });

        return sendSuccess(res, { report: finalResults }, 'Yield analysis retrieved');
    } catch (e) { next(e); }
};

module.exports = { getYieldAnalysis };
