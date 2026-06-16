const mongoose = require('mongoose');
const WarehouseInventory = require('../../models/warehouseInventory.model');
const Warehouse = require('../../models/warehouse.model');
const { adjustWarehouseStock } = require('../../services/stock.service');
const { StockMovementType } = require('../../core/enums');
const { withTransaction } = require('../../services/transaction.service');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

const lookupAndProjectStages = [
    {
        $lookup: {
            from: 'items',
            let: { itemId: '$itemId', variantId: '$variantId', barcode: '$barcode' },
            pipeline: [
                { $match: { $expr: { $eq: ['$_id', '$$itemId'] } } },
                {
                    $project: {
                        itemName: 1,
                        itemCode: 1,
                        brandName: 1,
                        categoryName: 1,
                        shade: 1,
                        accessorySize: 1,
                        width: 1,
                        sizes: 1,
                    },
                },
            ],
            as: 'itemDoc',
        },
    },
    { $unwind: { path: '$itemDoc', preserveNullAndEmptyArrays: true } },
    {
        $addFields: {
            sizeRow: {
                $arrayElemAt: [
                    {
                        $filter: {
                            input: { $ifNull: ['$itemDoc.sizes', []] },
                            as: 'sz',
                            cond: {
                                $or: [
                                    { $eq: [{ $toString: '$$sz._id' }, { $toString: '$variantId' }] },
                                    { $eq: ['$$sz.barcode', '$barcode'] },
                                    { $eq: ['$$sz.sku', '$barcode'] },
                                ],
                            },
                        },
                    },
                    0,
                ],
            },
        },
    },
    {
        $project: {
            inventoryId: '$_id',
            warehouseId: 1,
            itemId: 1,
            variantId: 1,
            barcode: 1,
            itemName: { $ifNull: ['$itemDoc.itemName', 'Unknown'] },
            itemCode: { $ifNull: ['$itemDoc.itemCode', ''] },
            brand: { $ifNull: ['$itemDoc.brandName', ''] },
            category: { $ifNull: ['$itemDoc.categoryName', ''] },
            size: {
                $ifNull: [
                    '$sizeRow.size',
                    { $ifNull: ['$itemDoc.accessorySize', { $ifNull: ['$itemDoc.width', '-'] }] },
                ],
            },
            color: {
                $ifNull: ['$sizeRow.color', { $ifNull: ['$itemDoc.shade', '-'] }],
            },
            sku: { $ifNull: ['$sizeRow.sku', '$barcode'] },
            systemQty: { $ifNull: ['$quantity', 0] },
            inTransitQty: { $ifNull: ['$quantityInTransit', 0] },
            reservedQty: { $ifNull: ['$reservedQuantity', 0] },
        },
    },
];

const buildRowsPipeline = (warehouseObjectId, search, { skip = 0, limit = DEFAULT_LIMIT } = {}) => {
    const term = String(search || '').trim();
    const pipeline = [{ $match: { warehouseId: warehouseObjectId } }];

    if (!term) {
        return [
            ...pipeline,
            { $sort: { barcode: 1 } },
            { $skip: skip },
            { $limit: limit },
            ...lookupAndProjectStages,
        ];
    }

    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return [
        ...pipeline,
        ...lookupAndProjectStages,
        {
            $match: {
                $or: [
                    { barcode: regex },
                    { sku: regex },
                    { itemName: regex },
                    { itemCode: regex },
                    { brand: regex },
                    { category: regex },
                ],
            },
        },
        { $sort: { itemName: 1, barcode: 1 } },
        { $skip: skip },
        { $limit: limit },
    ];
};

const buildCountPipeline = (warehouseObjectId, search) => {
    const term = String(search || '').trim();
    if (!term) return null;

    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return [
        { $match: { warehouseId: warehouseObjectId } },
        {
            $lookup: {
                from: 'items',
                localField: 'itemId',
                foreignField: '_id',
                as: 'itemDoc',
            },
        },
        { $unwind: { path: '$itemDoc', preserveNullAndEmptyArrays: true } },
        {
            $match: {
                $or: [
                    { barcode: regex },
                    { 'itemDoc.itemName': regex },
                    { 'itemDoc.itemCode': regex },
                    { 'itemDoc.brandName': regex },
                    { 'itemDoc.categoryName': regex },
                ],
            },
        },
        { $count: 'total' },
    ];
};

const getWarehousePhysicalReport = async (warehouseId, options = {}) => {
    const {
        search = '',
        page = DEFAULT_PAGE,
        limit = DEFAULT_LIMIT,
    } = options;

    const warehouseObjectId = new mongoose.Types.ObjectId(warehouseId);
    const safePage = Math.max(1, Number(page) || DEFAULT_PAGE);
    const safeLimit = Math.min(MAX_LIMIT, Math.max(1, Number(limit) || DEFAULT_LIMIT));
    const skip = (safePage - 1) * safeLimit;

    const hasSearch = Boolean(String(search || '').trim());
    const countPipeline = buildCountPipeline(warehouseObjectId, search);

    const queries = [
        Warehouse.findById(warehouseId).select('name').lean(),
        WarehouseInventory.aggregate([
            { $match: { warehouseId: warehouseObjectId } },
            {
                $group: {
                    _id: null,
                    lineCount: { $sum: 1 },
                    totalSystemQty: { $sum: { $ifNull: ['$quantity', 0] } },
                },
            },
        ]),
        WarehouseInventory.aggregate(
            buildRowsPipeline(warehouseObjectId, search, { skip, limit: safeLimit }),
        ),
    ];

    if (countPipeline) {
        queries.splice(2, 0, WarehouseInventory.aggregate(countPipeline));
    }

    const results = await Promise.all(queries);

    const warehouse = results[0];
    const summaryAgg = results[1];
    const countAgg = countPipeline ? results[2] : null;
    const rows = countPipeline ? results[3] : results[2];

    if (!warehouse) throw new Error('Warehouse not found');

    const baseSummary = summaryAgg[0] || { lineCount: 0, totalSystemQty: 0 };
    const filteredTotal = hasSearch ? (countAgg?.[0]?.total ?? 0) : baseSummary.lineCount;

    const mappedRows = rows.map((row) => ({
        ...row,
        warehouseName: warehouse.name,
        physicalQty: row.systemQty,
        differenceQty: 0,
    }));

    return {
        summary: {
            warehouseId,
            warehouseName: warehouse.name,
            lineCount: baseSummary.lineCount,
            totalSystemQty: baseSummary.totalSystemQty,
            totalPhysicalQty: baseSummary.totalSystemQty,
            filteredCount: filteredTotal,
        },
        pagination: {
            page: safePage,
            limit: safeLimit,
            total: filteredTotal,
            totalPages: Math.max(1, Math.ceil(filteredTotal / safeLimit)),
        },
        rows: mappedRows,
    };
};

const applyWarehousePhysicalStock = async (warehouseId, items, userId) => {
    if (!warehouseId) throw new Error('warehouseId is required');
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error('items array is required');
    }

    return withTransaction(async (session) => {
        const results = [];
        const auditReferenceId = new mongoose.Types.ObjectId();

        for (const item of items) {
            const physicalQty = Number(item.physicalQty);
            if (!Number.isFinite(physicalQty) || physicalQty < 0) {
                throw new Error(`Invalid physical quantity for barcode ${item.barcode || item.variantId}`);
            }

            const variantId = item.variantId || item.productId;
            const barcode = item.barcode;
            const lookupOr = [];
            if (variantId) lookupOr.push({ variantId: String(variantId) });
            if (barcode) lookupOr.push({ barcode: String(barcode) });
            if (!lookupOr.length) {
                throw new Error('Each item must include variantId or barcode');
            }

            const inventory = await WarehouseInventory.findOne({
                warehouseId,
                $or: lookupOr,
            }).session(session);

            const currentQty = inventory?.quantity || 0;
            const difference = physicalQty - currentQty;

            if (difference === 0) continue;

            await adjustWarehouseStock({
                productId: inventory?.variantId || variantId,
                variantId: inventory?.variantId || variantId,
                warehouseId,
                quantityChange: difference,
                type: StockMovementType.ADJUSTMENT,
                referenceId: auditReferenceId,
                referenceModel: 'PhysicalStockAudit',
                performedBy: userId,
                notes: `Physical vs actual reconciliation (Physical: ${physicalQty}, System: ${currentQty})`,
                session,
            });

            results.push({
                barcode: inventory?.barcode || barcode,
                variantId: inventory?.variantId || variantId,
                previousQty: currentQty,
                newQty: physicalQty,
                adjustment: difference,
            });
        }

        return {
            warehouseId,
            adjustedLines: results.length,
            adjustments: results,
            appliedAt: new Date().toISOString(),
        };
    });
};

module.exports = {
    getWarehousePhysicalReport,
    applyWarehousePhysicalStock,
};
