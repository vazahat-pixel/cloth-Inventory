const BatchBarcode = require('../../models/batchBarcode.model');
const { getPagination, buildPaginationMeta, getSort } = require('../../utils/pagination.helper');

const listBatchBarcodes = async (query = {}) => {
    const { page, limit, skip } = getPagination(query);
    const { search, batchNo, grnId } = query;
    const filter = {};

    if (search) {
        filter.$or = [
            { barcode: { $regex: search, $options: 'i' } },
            { batchNo: { $regex: search, $options: 'i' } },
        ];
    }
    if (batchNo) filter.batchNo = batchNo;
    if (grnId) filter.grnId = grnId;

    const sort = getSort(query, {
        barcode: 'barcode',
        batchNo: 'batchNo',
        createdAt: 'createdAt',
    }, { createdAt: -1 });

    const [barcodes, total] = await Promise.all([
        BatchBarcode.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('itemId', 'itemName itemCode')
            .lean(),
        BatchBarcode.countDocuments(filter),
    ]);

    return { barcodes, meta: buildPaginationMeta(total, page, limit) };
};

module.exports = { listBatchBarcodes };
