const Item = require('../../models/item.model');
const Group = require('../../models/group.model');
const FormulaEngine = require('../../utils/formula.engine');
const { generateBarcode } = require('../products/barcode.service');

const normalizeString = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
};

const normalizeId = (value) => {
  if (!value) {
    return null;
  }
  if (typeof value === 'object') {
    return value._id ? String(value._id) : value.id ? String(value.id) : null;
  }
  return String(value);
};

const normalizeGroupIds = (groupIds = []) =>
  [...new Set((Array.isArray(groupIds) ? groupIds : [groupIds])
    .map((groupId) => normalizeId(groupId))
    .filter(Boolean))];

const ensureGroupsExist = async (groupIds) => {
  if (!groupIds.length) {
    throw new Error('Item must belong to at least one Section/Group');
  }

  const groups = await Group.find({ _id: { $in: groupIds } }).select('_id');
  if (groups.length !== groupIds.length) {
    const found = new Set(groups.map((group) => String(group._id)));
    const missing = groupIds.filter((groupId) => !found.has(String(groupId)));
    throw new Error(`Group(s) not found: ${missing.join(', ')}`);
  }
};

const ensureSizeSKUs = async (sizes = []) => {
  for (const entry of sizes) {
    if (!entry.sku) {
      // Generate an SKU per size variant only when the user did not provide one.
      // We use the same service for now as it generates a unique code.
      // eslint-disable-next-line no-await-in-loop
      entry.sku = await generateBarcode();
    }
  }
};

const populateItem = async (itemId) =>
  Item.findById(itemId)
    .populate('groupIds', 'name groupType level parentId isActive')
    .populate('brand', 'brandName name')
    .populate('session', 'seasonName name')
    .populate('hsCodeId', 'code hsnCode gstRate gstPercent');

class ItemService {
  async normalizeItemData(data) {
    if (data.itemCode) data.itemCode = data.itemCode.trim().toUpperCase();
    
    // Ensure all descriptors are top-level
    const descriptors = ['fabric', 'pattern', 'fit', 'gender', 'occasion', 'uom', 'shade', 'description'];
    descriptors.forEach(field => {
      if (data[field]) data[field] = data[field].toString().trim();
    });

    // Handle Hierarchy
    if (data.section || data.category || data.subCategory || data.styleType) {
      data.groupIds = [data.section, data.category, data.subCategory, data.styleType].filter(Boolean);
    }

    // Handle Images Array
    data.images = Array.isArray(data.images) 
      ? data.images.filter(img => typeof img === 'string' && img.length > 0) 
      : [];

    // Ensure Inventory Metrics are Numbers
    data.reorderLevel = Number(data.reorderLevel || 0);
    data.reorderQty = Number(data.reorderQty || 0);
    data.openingStock = Number(data.openingStock || 0);
    data.openingStockRate = Number(data.openingStockRate || 0);

    // Normalize Sizes (Variants)
    if (data.sizes && Array.isArray(data.sizes)) {
      data.sizes = data.sizes.map(s => ({
        ...s,
        sku: s.sku || s.barcode || null,
        costPrice: Number(s.costPrice || 0),
        salePrice: Number(s.salePrice || 0),
        mrp: Number(s.mrp || 0),
        stock: Number(s.stock || 0)
      }));
    }

    // Robust mapping for incoming fields (Frontend compatibility)
    if (data.hsnCodeId && !data.hsCodeId) data.hsCodeId = data.hsnCodeId;
    if (data.gstSlabId && !data.gstTax) data.gstTax = data.gstSlabId;
    if (data.season && !data.session) data.session = data.season;
  }

  async createItem(data = {}) {
    await this.normalizeItemData(data);

    const itemCode = data.itemCode;
    if (!itemCode) throw new Error('itemCode is required');

    const existingItem = await Item.findOne({ itemCode });
    if (existingItem) throw new Error(`Item with code ${itemCode} already exists`);

    const groupIds = normalizeGroupIds(data.groupIds);
    await ensureGroupsExist(groupIds);

    if (!Array.isArray(data.sizes) || !data.sizes.length) {
      throw new Error('Garment Item must have at least one size pricing');
    }

    await ensureSizeSKUs(data.sizes);

    const item = new Item({
      ...data,
      itemCode,
      itemName: data.itemName || data.itemCode,
      brand: normalizeId(data.brand),
      shade: data.shade,
      description: data.description,
      groupIds,
      session: normalizeId(data.session),
      hsCodeId: normalizeId(data.hsCodeId),
      images: data.images || []
    });

    await item.save();
    return populateItem(item._id);
  }

  async updateItem(id, data = {}) {
    const item = await Item.findById(id);
    if (!item) return null;

    await this.normalizeItemData(data);

    // Update fields dynamically if they are provided in normalized data
    const fieldsToUpdate = [
      'itemName', 'itemCode', 'brand', 'shade', 'description', 'session', 'hsCodeId', 'gstTax',
      'fabric', 'pattern', 'fit', 'gender', 'uom', 'images', 'groupIds', 'sizes',
      'reorderLevel', 'reorderQty', 'openingStock', 'openingStockRate', 
      'stockTrackingEnabled', 'barcodeEnabled', 'isActive', 'customFields'
    ];

    fieldsToUpdate.forEach(field => {
      if (data[field] !== undefined) {
        if (field === 'brand' || field === 'session' || field === 'hsCodeId') {
          item[field] = normalizeId(data[field]);
        } else if (field === 'groupIds') {
          item.groupIds = normalizeGroupIds(data[field]);
        } else {
          item[field] = data[field];
        }
      }
    });

    // Special check for duplicate itemCode
    if (data.itemCode && data.itemCode !== item.itemCode) {
      const existing = await Item.findOne({ itemCode: data.itemCode, _id: { $ne: id } });
      if (existing) throw new Error(`Style Code ${data.itemCode} is already used.`);
    }

    if (item.groupIds && item.groupIds.length > 0) {
      await ensureGroupsExist(item.groupIds);
    }

    if (item.sizes) {
      await ensureSizeSKUs(item.sizes);
    }

    await item.save();
    return populateItem(item._id);
  }

  async getAllItems(query = {}) {
    return Item.find(query)
      .populate('groupIds', 'name groupType level parentId isActive')
      .populate('brand', 'brandName name')
      .populate('session', 'seasonName name')
      .populate('hsCodeId', 'code hsnCode gstRate gstPercent')
      .sort({ createdAt: -1 });
  }

  async getItemById(id) {
    return Item.findById(id)
      .populate('groupIds', 'name groupType level parentId isActive')
      .populate('brand', 'brandName name')
      .populate('session', 'seasonName name')
      .populate('hsCodeId', 'code hsnCode gstRate gstPercent');
  }

  async deleteItem(id) {
    return Item.findByIdAndDelete(id);
  }
}

module.exports = new ItemService();
