const Item = require('../../models/item.model');
const Group = require('../../models/group.model');
const Brand = require('../../models/brand.model');
const HSNCode = require('../../models/hsnCode.model');
const Counter = require('../../models/counter.model');
const WarehouseInventory = require('../../models/warehouseInventory.model');
const FormulaEngine = require('../../utils/formula.engine');
const { generateUniqueBarcode: generateBarcode } = require('../../services/barcode.service');

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
    .populate('sectionId', 'name groupName groupType')
    .populate('categoryId', 'name groupName groupType')
    .populate('subCategoryId', 'name groupName groupType')
    .populate('styleId', 'name groupName groupType')
    .populate('brand', 'name brandName')
    .populate('hsCodeId', 'code hsnCode gstRate gstPercent');

class ItemService {
  async normalizeItemData(data) {
    if (data.itemCode) data.itemCode = String(data.itemCode).trim().toUpperCase();
    if (data.type) data.type = data.type.trim().toUpperCase();
    
    // Ensure all descriptors are top-level and normalized
    const descriptors = ['fabric', 'pattern', 'fit', 'gender', 'occasion', 'uom', 'description', 
                       'composition', 'gsm', 'width', 'shrinkage', 'shadeNo', 'accessorySize', 'packingType'];
    descriptors.forEach(field => {
      if (data[field]) {
        data[field] = data[field].toString().trim();
        if (field === 'uom') data[field] = data[field].toUpperCase();
      }
    });

    // Handle Entity IDs (Hierarchy & Defaults)
    const entityIdFields = ['sectionId', 'categoryId', 'subCategoryId', 'styleId', 'brand', 'hsCodeId', 'defaultWarehouse'];
    entityIdFields.forEach(field => {
      data[field] = normalizeId(data[field]);
    });

    // Fallback for older frontend versions that might send specific keys
    if (data.section) data.sectionId = normalizeId(data.sectionId || data.section);
    if (data.category) data.categoryId = normalizeId(data.categoryId || data.category);
    if (data.subCategory) data.subCategoryId = normalizeId(data.subCategoryId || data.subCategory);
    if (data.styleType) data.styleId = normalizeId(data.styleId || data.styleType);

    // Sync groupIds for tag-based searches
    data.groupIds = [data.sectionId, data.categoryId, data.subCategoryId, data.styleId].filter(Boolean);

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
        mrp: Number(s.mrp || 0),
        stock: Number(s.stock || 0)
      }));
    }

    // Robust mapping for incoming fields (Frontend compatibility)
    if (data.hsnCodeId && !data.hsCodeId) data.hsCodeId = data.hsnCodeId;
  }

  async getNextCode(type = 'GARMENT') {
    const normalizedType = (type || 'GARMENT').toUpperCase();
    const counter = await Counter.findOne({ name: `itemCode_${normalizedType}` });
    const seq = (counter?.seq || 0) + 1;
    const prefix = normalizedType === 'GARMENT' ? 'ST' : normalizedType === 'FABRIC' ? 'FB' : 'ACC';
    return `${prefix}-${String(seq).padStart(4, '0')}`;
  }

  async createItem(data = {}) {
    await this.normalizeItemData(data);

    let itemCode = data.itemCode;
    
    // Auto-generate itemCode if not provided
    if (!itemCode) {
      const type = data.type || 'GARMENT';
      const normalizedType = type.toUpperCase();
      const counter = await Counter.findOneAndUpdate(
        { name: `itemCode_${normalizedType}` },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
      );
      const prefix = normalizedType === 'GARMENT' ? 'ST' : normalizedType === 'FABRIC' ? 'FB' : 'ACC';
      itemCode = `${prefix}-${String(counter.seq).padStart(4, '0')}`;
    }

    const existingItem = await Item.findOne({ itemCode });
    if (existingItem) throw new Error(`Item with code ${itemCode} already exists`);

    const groupIds = normalizeGroupIds(data.groupIds);
    await ensureGroupsExist(groupIds);

    if (!Array.isArray(data.sizes) || !data.sizes.length) {
      throw new Error('Item must have at least one size variant');
    }

    await ensureSizeSKUs(data.sizes);

    const item = new Item({
      ...data,
      itemCode,
      itemName: data.itemName || data.itemCode,
      brand: normalizeId(data.brand),
      description: data.description,
      groupIds,
      sectionId: data.sectionId,
      categoryId: data.categoryId,
      subCategoryId: data.subCategoryId,
      styleId: data.styleId,
      hsCodeId: normalizeId(data.hsCodeId),
      type: data.type || 'GARMENT',
      images: data.images || []
    });

    await item.save();

    // Initialize Inventory in the default warehouse if specified
    if (item.defaultWarehouse && item.sizes && item.sizes.length > 0) {
      const inventoryOps = item.sizes
        .filter(variant => variant.stock > 0)
        .map(variant => ({
          updateOne: {
            filter: { 
              warehouseId: item.defaultWarehouse, 
              barcode: variant.sku || variant.barcode 
            },
            update: {
              $set: {
                itemId: item._id,
                variantId: variant._id || variant.id,
                quantity: variant.stock,
                reorderLevel: variant.reorderLevel || 0,
                lastUpdated: new Date()
              }
            },
            upsert: true
          }
        }));

      if (inventoryOps.length > 0) {
        await WarehouseInventory.bulkWrite(inventoryOps);
      }
    }

    return populateItem(item._id);
  }

  async updateItem(id, data = {}) {
    const item = await Item.findById(id);
    if (!item) return null;

    await this.normalizeItemData(data);

    // Update fields dynamically if they are provided in normalized data
    const fieldsToUpdate = [
      'itemName', 'itemCode', 'brand', 'description', 'hsCodeId', 'gstTax',
      'fabric', 'pattern', 'fit', 'gender', 'uom', 'images', 'groupIds', 'sizes',
      'sectionId', 'categoryId', 'subCategoryId', 'styleId', 'type',
      'reorderLevel', 'reorderQty', 'openingStock', 'openingStockRate', 
      'stockTrackingEnabled', 'barcodeEnabled', 'isActive', 'customFields',
      'defaultWarehouse', 'composition', 'gsm', 'width', 'shrinkage', 'shadeNo',
      'accessorySize', 'packingType'
    ];

    fieldsToUpdate.forEach(field => {
      if (data[field] !== undefined) {
        if (['brand', 'hsCodeId', 'sectionId', 'categoryId', 'subCategoryId', 'styleId', 'defaultWarehouse'].includes(field)) {
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
      .populate('sectionId', 'name groupName groupType')
      .populate('categoryId', 'name groupName groupType')
      .populate('subCategoryId', 'name groupName groupType')
      .populate('styleId', 'name groupName groupType')
      .populate('brand', 'name brandName')
      .populate('hsCodeId', 'code hsnCode gstRate gstPercent')
      .sort({ createdAt: -1 });
  }

  async getItemById(id) {
    return Item.findById(id)
      .populate('groupIds', 'name groupType level parentId isActive')
      .populate('sectionId', 'name groupName groupType')
      .populate('categoryId', 'name groupName groupType')
      .populate('subCategoryId', 'name groupName groupType')
      .populate('styleId', 'name groupName groupType')
      .populate('brand', 'name brandName')
      .populate('hsCodeId', 'code hsnCode gstRate gstPercent');
  }

  async scanItemByBarcode(barcode) {
    if (!barcode) throw new Error('Barcode is required');
    const upperBarcode = barcode.toUpperCase();
    
    // Search by itemCode OR variant SKU
    const item = await Item.findOne({
      $or: [
        { itemCode: upperBarcode },
        { 'sizes.sku': barcode }
      ]
    })
    .populate('brand', 'name brandName')
    .populate('hsCodeId', 'code hsnCode gstRate gstPercent');

    if (!item) return null;

    // Find the specific variant if it was a variant scan
    const variant = item.sizes.find(s => s.sku === barcode) || item.sizes[0];
    
    return { item, variant };
  }

  async deleteItem(id) {
    return Item.findByIdAndDelete(id);
  }
}

module.exports = new ItemService();
