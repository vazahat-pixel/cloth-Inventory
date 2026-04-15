const Item = require('../../models/item.model');
const Group = require('../../models/group.model');
const Brand = require('../../models/brand.model');
const HSNCode = require('../../models/hsnCode.model');
const Counter = require('../../models/counter.model');
const WarehouseInventory = require('../../models/warehouseInventory.model');
const Size = require('../../models/size.model');
const FormulaEngine = require('../../utils/formula.engine');
const { generateUniqueBarcode: generateBarcode } = require('../../services/barcode.service');

const normalizeString = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
};

const normalizeId = (value) => {
  if (!value || value === 'null' || value === 'undefined') {
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
  if (!groupIds || !groupIds.length) {
    return; 
  }

  const groups = await Group.find({ _id: { $in: groupIds } }).select('_id');
  if (groups.length !== groupIds.length) {
    const found = new Set(groups.map((group) => String(group._id)));
    const missing = groupIds.filter((groupId) => !found.has(String(groupId)));
    throw new Error(`Group(s) not found: ${missing.join(', ')}`);
  }
};

const ensureSizeSKUs = async (sizes = [], brandId = null) => {
  if (!sizes.length) return;

  if (brandId) {
    const brand = await Brand.findById(brandId);
    if (brand) {
      const prefix = (brand.shortName || brand.name.slice(0, 2)).toUpperCase();
      const counterKey = `barcode_seq_${prefix}`;
      
      const counter = await Counter.findOneAndUpdate(
        { name: counterKey },
        { $inc: { seq: sizes.length } },
        { upsert: true, new: true }
      );
      
      const startSeq = counter.seq - sizes.length + 1;
      
      sizes.forEach((entry, index) => {
        if (!entry.sku) {
          const num = String(startSeq + index).padStart(4, '0');
          entry.sku = `${prefix}-${num}`;
        }
      });
      return;
    }
  }

  for (const entry of sizes) {
    if (!entry.sku) {
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
    
    const descriptors = ['fabric', 'color', 'pattern', 'fit', 'gender', 'occasion', 'uom', 'description', 
                       'composition', 'gsm', 'width', 'shrinkage', 'shadeNo', 'accessorySize', 'packingType'];
    descriptors.forEach(field => {
      if (data[field]) {
        data[field] = data[field].toString().trim();
        if (field === 'uom') data[field] = data[field].toUpperCase();
      }
    });

    const entityIdFields = ['sectionId', 'categoryId', 'subCategoryId', 'styleId', 'brand', 'hsCodeId', 'defaultWarehouse'];
    entityIdFields.forEach(field => {
      data[field] = normalizeId(data[field]);
    });

    if (data.section) data.sectionId = normalizeId(data.sectionId || data.section);
    if (data.category) data.categoryId = normalizeId(data.categoryId || data.category);
    if (data.subCategory) data.subCategoryId = normalizeId(data.subCategory || data.subCategory);
    if (data.styleType) data.styleId = normalizeId(data.styleId || data.styleType);

    data.groupIds = [data.sectionId, data.categoryId, data.subCategoryId, data.styleId].filter(Boolean);

    data.images = Array.isArray(data.images) 
      ? data.images.filter(img => typeof img === 'string' && img.length > 0) 
      : [];

    data.reorderLevel = Number(data.reorderLevel || 0);
    data.reorderQty = Number(data.reorderQty || 0);
    data.openingStock = Number(data.openingStock || 0);
    data.openingStockRate = Number(data.openingStockRate || 0);

    if (data.sizes && Array.isArray(data.sizes)) {
      data.sizes = data.sizes.map(s => ({
        ...s,
        sku: s.sku || s.barcode || null,
        mrp: Number(s.mrp || 0),
        stock: Number(s.stock || 0),
        reorderLevel: Number(s.reorderLevel || 0)
      }));
    }

    if (data.purchaseRate && !data.purchasePrice) data.purchasePrice = Number(data.purchaseRate);
    if (data.saleRate && !data.mrp) data.mrp = Number(data.saleRate);
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
    console.log('📦 CREATING_ITEM_PAYLOAD:', JSON.stringify(data, null, 2));
    await this.normalizeItemData(data);

    let itemCode = data.itemCode;
    const type = data.type || 'GARMENT';
    const normalizedType = type.toUpperCase();
    const counterName = `itemCode_${normalizedType}`;
    const prefix = normalizedType === 'GARMENT' ? 'ST' : normalizedType === 'FABRIC' ? 'FB' : 'ACC';
    
    if (!itemCode) {
      const counter = await Counter.findOneAndUpdate(
        { name: counterName },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
      );
      itemCode = `${prefix}-${String(counter.seq).padStart(4, '0')}`;
    } else if (itemCode.startsWith(`${prefix}-`)) {
      const numStr = itemCode.split('-')[1];
      const num = parseInt(numStr, 10);
      if (!isNaN(num)) {
        await Counter.findOneAndUpdate(
          { name: counterName },
          { $max: { seq: num } },
          { upsert: true, new: true }
        );
      }
    }

    const existingItem = await Item.findOne({ itemCode });
    if (existingItem) throw new Error(`Item with code ${itemCode} already exists`);

    const groupIds = normalizeGroupIds(data.groupIds);
    await ensureGroupsExist(groupIds);

    const itemType = (data.type || 'GARMENT').toUpperCase();
    if (itemType === 'GARMENT' && (!Array.isArray(data.sizes) || !data.sizes.length)) {
      throw new Error('Finished Garment item must have at least one size variant');
    }

    await ensureSizeSKUs(data.sizes, data.brand);

    const item = new Item({
      ...data,
      itemCode,
      groupIds,
      sizes: data.sizes || [],
      type: (data.type || 'GARMENT').toUpperCase()
    });

    try {
      await item.save();
    } catch (error) {
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        throw new Error(`Validation Failed: ${messages.join(', ')}`);
      }
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0] || 'field';
        throw new Error(`Duplicate Record: An item with this ${field} already exists.`);
      }
      throw error;
    }

    // Auto-initialize inventory logic REMOVED to enforce GRN process as requested.
    return populateItem(item._id);
  }

  async updateItem(id, data = {}) {
    const item = await Item.findById(id);
    if (!item) return null;

    await this.normalizeItemData(data);

    const fieldsToUpdate = [
      'itemName', 'itemCode', 'brand', 'description', 'hsCodeId', 'gstTax',
      'fabric', 'color', 'pattern', 'fit', 'gender', 'uom', 'images', 'groupIds', 'sizes',
      'sectionId', 'categoryId', 'subCategoryId', 'styleId', 'type',
      'reorderLevel', 'reorderQty', 'openingStock', 'openingStockRate', 
      'stockTrackingEnabled', 'barcodeEnabled', 'isActive', 'customFields',
      'defaultWarehouse', 'composition', 'gsm', 'width', 'shrinkage', 'shadeNo',
      'accessorySize', 'packingType', 'purchasePrice', 'mrp'
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

    if (data.itemCode && data.itemCode !== item.itemCode) {
      const existing = await Item.findOne({ itemCode: data.itemCode, _id: { $ne: id } });
      if (existing) throw new Error(`Style Code ${data.itemCode} is already used.`);
    }

    if (item.groupIds && item.groupIds.length > 0) {
      await ensureGroupsExist(item.groupIds);
    }

    if (item.sizes) {
      await ensureSizeSKUs(item.sizes, item.brand);
    }

    await item.save();

    // Auto-initialize inventory logic REMOVED to enforce GRN process as requested.
    return populateItem(item._id);
  }

  async getAllItems(query = {}, user = null) {
    const filter = { ...query };

    if (user && user.role === 'store_staff') {
      filter.type = { $in: ['GARMENT', 'ACCESSORY'] };
      filter.isActive = true;
    }

    return Item.find(filter)
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
    
    const item = await Item.findOne({
      $or: [
        { itemCode: upperBarcode },
        { 'sizes.sku': barcode }
      ]
    })
    .populate('brand', 'name brandName')
    .populate('hsCodeId', 'code hsnCode gstRate gstPercent');

    if (!item) return null;

    const variant = item.sizes.find(s => s.sku === barcode) || item.sizes[0];
    
    return { item, variant };
  }

  async generateSequentialBarcodes(brandId, count) {
    if (!brandId) throw new Error('Brand ID is required for sequential barcodes');
    const brand = await Brand.findById(brandId);
    if (!brand) throw new Error('Brand not found');

    const prefix = (brand.shortName || brand.name.slice(0, 2)).toUpperCase();
    const counterKey = `barcode_seq_${prefix}`;

    const counter = await Counter.findOneAndUpdate(
      { name: counterKey },
      { $inc: { seq: count } },
      { upsert: true, new: true }
    );

    const startSeq = counter.seq - count + 1;
    const barcodes = [];
    for (let i = 0; i < count; i++) {
      const num = String(startSeq + i).padStart(4, '0');
      barcodes.push(`${prefix}-${num}`);
    }
    return barcodes;
  }

  async deleteItem(id) {
    return Item.findByIdAndDelete(id);
  }
}

module.exports = new ItemService();
