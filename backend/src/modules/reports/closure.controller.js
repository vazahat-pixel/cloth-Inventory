const mongoose = require('mongoose');
const DailyClosure = require('../../models/dailyClosure.model');
const Sale = require('../../models/sale.model');
const { sendSuccess, sendError } = require('../../utils/response.handler');

/**
 * Get potential closure data for today (Before actual finalization)
 */
const getClosurePreview = async (req, res, next) => {
    try {
        const { storeId, date } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // 1. Get previous day's closing cash as opening cash
        const prevClosure = await DailyClosure.findOne({ 
            storeId, 
            closureDate: { $lt: targetDate } 
        }).sort({ closureDate: -1 });
        
        const openingCash = prevClosure ? prevClosure.physicalCash : 0;

        // 2. Aggregate Sales by Payment Mode
        const salesStats = await Sale.aggregate([
            {
                $match: {
                    storeId: new mongoose.Types.ObjectId(storeId),
                    saleDate: { $gte: targetDate, $lt: nextDay },
                    status: 'COMPLETED'
                }
            },
            {
                $group: {
                    _id: '$paymentMode',
                    total: { $sum: '$amountPaid' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const stats = {
            CASH: 0,
            CARD: 0,
            UPI: 0,
            OTHER: 0
        };
        salesStats.forEach(s => {
            if (stats.hasOwnProperty(s._id)) stats[s._id] = s.total;
            else stats.OTHER += s.total;
        });

        // 3. TODO: Subtract Expenses (If expense mode exists)
        const totalExpenses = 0;

        const expectedClosingCash = openingCash + stats.CASH - totalExpenses;

        return sendSuccess(res, {
            preview: {
                openingCash,
                salesCash: stats.CASH,
                salesCard: stats.CARD,
                salesUPI: stats.UPI,
                expectedClosingCash,
                totalExpenses,
                date: targetDate
            }
        }, 'Closure preview retrieved');
    } catch (e) { next(e); }
};

/**
 * Save and Finalize the Day-End Closure
 */
const finalizeClosure = async (req, res, next) => {
    try {
        const { storeId, physicalCash, remarks, denominations, previewData } = req.body;
        const closureDate = new Date(previewData.date);
        closureDate.setHours(0,0,0,0);

        // Check if already closed
        const existing = await DailyClosure.findOne({ storeId, closureDate });
        if (existing) return sendError(res, 'Day already closed for this store', 400);

        const cashDiff = physicalCash - previewData.expectedClosingCash;

        const closure = new DailyClosure({
            storeId,
            closureDate,
            systemOpeningCash: previewData.openingCash,
            systemSalesCash: previewData.salesCash,
            systemSalesCard: previewData.salesCard,
            systemSalesUPI: previewData.salesUPI,
            expectedClosingCash: previewData.expectedClosingCash,
            physicalCash,
            cashDifference: cashDiff,
            remarks,
            denominations,
            closedBy: req.user._id
        });

        await closure.save();
        return sendSuccess(res, { closure }, 'Store closed successfully for the day');
    } catch (e) { next(e); }
};

const getClosureHistory = async (req, res, next) => {
    try {
        const { storeId, startDate, endDate } = req.query;
        const filter = {};
        if (storeId) filter.storeId = storeId;
        if (startDate || endDate) {
            filter.closureDate = {};
            if (startDate) filter.closureDate.$gte = new Date(startDate);
            if (endDate) filter.closureDate.$lte = new Date(endDate);
        }

        const history = await DailyClosure.find(filter)
            .sort({ closureDate: -1 })
            .populate('storeId', 'name storeCode')
            .populate('closedBy', 'name');

        return sendSuccess(res, { history }, 'Closure history retrieved');
    } catch (e) { next(e); }
};

module.exports = { getClosurePreview, finalizeClosure, getClosureHistory };
