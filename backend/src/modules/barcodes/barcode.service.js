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

const recordPrintBatch = async ({ labels = [], grnId = null, batchNo = null } = {}) => {
  const Item = require('../../models/item.model');
  const resolvedBatchNo = batchNo || `BATCH-${Date.now()}`;
  const created = [];

  for (const label of labels) {
    const barcode = String(label.barcode || label.sku || '').trim();
    if (!barcode) continue;

    let itemId = label.itemId || null;
    let variantId = label.variantId || null;
    let itemCode = label.article || label.itemCode || '';
    let itemName = label.name || label.itemName || '';

    if (!itemId) {
      const item = await Item.findOne({
        $or: [
          { itemCode: new RegExp(`^${barcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          { 'sizes.sku': barcode },
          { 'sizes.barcode': barcode },
        ],
      }).select('itemCode itemName sizes').lean();

      if (item) {
        itemId = item._id;
        itemCode = item.itemCode || itemCode;
        itemName = item.itemName || itemName;
        const variant = (item.sizes || []).find((s) => s.sku === barcode || s.barcode === barcode);
        if (variant?._id) variantId = variant._id;
      }
    }

    try {
      const record = await BatchBarcode.create({
        barcode,
        itemId: itemId || undefined,
        variantId: variantId || undefined,
        batchNo: resolvedBatchNo,
        grnId: grnId || undefined,
        itemCode,
        itemName,
        printCount: 1,
      });
      created.push(record);
    } catch (err) {
      if (err?.code !== 11000) {
        console.error('Failed to record barcode history:', err.message);
      }
    }
  }

  return { batchNo: resolvedBatchNo, count: created.length, records: created };
};

module.exports = { listBatchBarcodes, recordPrintBatch };
