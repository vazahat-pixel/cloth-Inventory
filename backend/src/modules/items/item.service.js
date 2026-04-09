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
  // Only enforce groups for GARMENT items. 
  // Fabric/Accessories can be created as loose items if needed.
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
        stock: Number(s.stock || 0),
        reorderLevel: Number(s.reorderLevel || 0)
      }));
    }

    // Robust mapping for incoming fields (Frontend compatibility)
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
    
    // Auto-generate or Sync Counter if frontend provides an itemCode
    if (!itemCode) {
      const counter = await Counter.findOneAndUpdate(
        { name: counterName },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
      );
      itemCode = `${prefix}-${String(counter.seq).padStart(4, '0')}`;
    } else if (itemCode.startsWith(`${prefix}-`)) {
      // Sync the counter if frontend provides a code like FB-0003
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

    // Only GARMENT (Finished Good) items require size/color variants.
    // FABRIC and ACCESSORY items are tracked by quantity only (MTR, PCS, DOZ etc.)
    const itemType = (data.type || 'GARMENT').toUpperCase();
    if (itemType === 'GARMENT' && (!Array.isArray(data.sizes) || !data.sizes.length)) {
      throw new Error('Finished Garment item must have at least one size variant');
    }

    await ensureSizeSKUs(data.sizes);

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

    // Auto-initialize Inventory in warehouse (use defaultWarehouse or auto-detect first active one)
    const Warehouse = require('../../models/warehouse.model');
    let warehouseId = item.defaultWarehouse;
    if (!warehouseId) {
      const primaryWarehouse = await Warehouse.findOne({ isActive: true, isDeleted: { $ne: true } }).sort({ createdAt: 1 });
      if (primaryWarehouse) warehouseId = primaryWarehouse._id;
    }

    if (warehouseId && item.sizes && item.sizes.length > 0) {
      const inventoryOps = item.sizes
        .filter(variant => variant.stock > 0 && (variant.sku || variant.barcode))
        .map(variant => ({
          updateOne: {
            filter: { warehouseId, barcode: variant.sku || variant.barcode },
            update: {
              $set: {
                itemId: item._id,
                variantId: variant._id,
                quantity: variant.stock,
                reorderLevel: Number(variant.reorderLevel || 0),
                lastUpdated: new Date()
              }
            },
            upsert: true
          }
        }));

      if (inventoryOps.length > 0) {
        await WarehouseInventory.bulkWrite(inventoryOps);
      }

      // Save the resolved warehouse back on item if it was auto-detected
      if (!item.defaultWarehouse) {
        await Item.findByIdAndUpdate(item._id, { defaultWarehouse: warehouseId });
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

    // Auto-initialize/Update Inventory (use defaultWarehouse or auto-detect first active one)
    const Warehouse = require('../../models/warehouse.model');
    let warehouseId = item.defaultWarehouse;
    if (!warehouseId) {
      const primaryWarehouse = await Warehouse.findOne({ isActive: true, isDeleted: { $ne: true } }).sort({ createdAt: 1 });
      if (primaryWarehouse) warehouseId = primaryWarehouse._id;
    }

    if (warehouseId && item.sizes && item.sizes.length > 0) {
      const inventoryOps = item.sizes
        .filter(variant => variant.stock > 0 && (variant.sku || variant.barcode))
        .map(variant => ({
          updateOne: {
            filter: { warehouseId, barcode: variant.sku || variant.barcode },
            update: {
              $set: {
                itemId: item._id,
                variantId: variant._id,
                quantity: variant.stock,
                reorderLevel: Number(variant.reorderLevel || 0),
                lastUpdated: new Date()
              }
            },
            upsert: true
          }
        }));

      if (inventoryOps.length > 0) {
        const WarehouseInventory = require('../../models/warehouseInventory.model');
        await WarehouseInventory.bulkWrite(inventoryOps);
      }

      if (!item.defaultWarehouse) {
        item.defaultWarehouse = warehouseId;
        await item.save();
      }
    }

    return populateItem(item._id);
  }

  async getAllItems(query = {}, user = null) {
    const filter = { ...query };

    // Apply role-based scoping for production safety
    if (user && user.role === 'store_staff') {
      // Stores should only see finished goods (Garments & Accessories) that are active
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
