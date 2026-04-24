const mongoose = require('mongoose');
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

const sanitizePrefix = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const getBrandPrefix = (brand) => {
  const shortName = sanitizePrefix(brand?.shortName);
  if (shortName) return shortName;

  const name = String(brand?.name || '').trim();
  if (!name) return 'BR';

  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const acronym = sanitizePrefix(`${words[0][0] || ''}${words[1][0] || ''}`);
    return acronym || sanitizePrefix(name).slice(0, 2) || 'BR';
  }

  const two = sanitizePrefix(name).slice(0, 2);
  return two || 'BR';
};

const normalizeSizeCode = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');

const STANDARD_SIZE_ORDER = [
  'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '4XL', '5XL', '6XL', '7XL', '8XL', '9XL', '10XL',
  'XXXS', 'XXS', 'XS',
];

const getSizeRank = (size) => {
  const normalized = normalizeSizeCode(size).replace(/\s/g, '');
  if (['FREE', 'FS', 'UNI', 'OS', 'ONE', 'UNSIZED'].includes(normalized)) return 9000;
  if (/^\d+$/.test(normalized)) return 10000 + Number(normalized);
  const waistMatch = normalized.match(/^(?:W)?(\d+)(?:W)?$/);
  if ( waistMatch ) return 11000 + Number(waistMatch[1]);
  const standardIndex = STANDARD_SIZE_ORDER.indexOf(normalized);
  if (standardIndex !== -1) return standardIndex;
  if (['MTR', 'METER', 'METRE', 'CM', 'CMS', 'INCH', 'INCHES', 'MM'].includes(normalized)) return 20000;
  return 30000;
};

const compareSizeValues = (a, b) => {
  const rankA = getSizeRank(a);
  const rankB = getSizeRank(b);
  if (rankA !== rankB) return rankA - rankB;
  return normalizeSizeCode(a).localeCompare(normalizeSizeCode(b));
};

const normalizeGroupIds = (groupIds = []) =>
  [...new Set((Array.isArray(groupIds) ? groupIds : [groupIds])
    .map((groupId) => normalizeId(groupId))
    .filter(Boolean))];

const ensureGroupsExist = async (groupIds) => {
  if (!groupIds || !groupIds.length) return;
  const groups = await Group.find({ _id: { $in: groupIds } }).select('_id');
  if (groups.length !== groupIds.length) {
    const found = new Set(groups.map((group) => String(group._id)));
    const missing = groupIds.filter((groupId) => !found.has(String(groupId)));
    throw new Error(`Group(s) not found: ${missing.join(', ')}`);
  }
};

const ensureSizeSKUs = async (sizes = [], brandId = null) => {
  if (!sizes.length) return;
  const sortedSizes = [...sizes].sort((left, right) => compareSizeValues(left.size, right.size));
  if (brandId) {
    const brand = await Brand.findById(brandId);
    if (brand) {
      const prefix = getBrandPrefix(brand);
      const missingCount = sortedSizes.filter((entry) => !entry.sku).length;
      if (!missingCount) return;
      const counterKey = `barcode_seq_${prefix}`;
      const counter = await Counter.findOneAndUpdate(
        { name: counterKey },
        { $inc: { seq: missingCount } },
        { upsert: true, new: true }
      );
      const startSeq = counter.seq - missingCount + 1;
      let sequenceOffset = 0;
      sortedSizes.forEach((entry) => {
        if (!entry.sku) {
          const num = String(startSeq + sequenceOffset).padStart(4, '0');
          entry.sku = `${prefix}-${num}`;
          sequenceOffset += 1;
        }
      });
      return;
    }
  }
  for (const entry of sortedSizes) {
    if (!entry.sku) entry.sku = await generateBarcode();
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
    entityIdFields.forEach(field => { data[field] = normalizeId(data[field]); });
    if (data.section) data.sectionId = normalizeId(data.sectionId || data.section);
    if (data.category) data.categoryId = normalizeId(data.categoryId || data.category);
    if (data.subCategory) data.subCategoryId = normalizeId(data.subCategory || data.subCategory);
    if (data.styleType) data.styleId = normalizeId(data.styleId || data.styleType);
    data.groupIds = [data.sectionId, data.categoryId, data.subCategoryId, data.styleId].filter(Boolean);
    data.images = Array.isArray(data.images) ? data.images.filter(img => typeof img === 'string' && img.length > 0) : [];
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

  async createItem(data = {}, options = { allowUpdate: false }) {
    await this.normalizeItemData(data);
    let itemCode = data.itemCode;
    const type = data.type || 'GARMENT';
    const normalizedType = type.toUpperCase();
    const counterName = `itemCode_${normalizedType}`;
    const prefix = normalizedType === 'GARMENT' ? 'ST' : normalizedType === 'FABRIC' ? 'FB' : 'ACC';
    if (!itemCode) {
      const counter = await Counter.findOneAndUpdate({ name: counterName }, { $inc: { seq: 1 } }, { upsert: true, new: true });
      itemCode = `${prefix}-${String(counter.seq).padStart(4, '0')}`;
    } else if (itemCode.startsWith(`${prefix}-`)) {
      const num = parseInt(itemCode.split('-')[1], 10);
      if (!isNaN(num)) await Counter.findOneAndUpdate({ name: counterName }, { $max: { seq: num } }, { upsert: true, new: true });
    }
    const existingItem = await Item.findOne({ itemCode });
    if (existingItem) {
      if (options.allowUpdate) return this.updateItem(existingItem._id, data, { mergeSizes: true });
      throw new Error(`Item with code ${itemCode} already exists`);
    }
    if (data.vendorId && typeof data.vendorId === 'string' && !mongoose.Types.ObjectId.isValid(data.vendorId)) delete data.vendorId;
    const groupIds = normalizeGroupIds(data.groupIds);
    await ensureGroupsExist(groupIds);
    if ((data.type || 'GARMENT').toUpperCase() === 'GARMENT' && (!Array.isArray(data.sizes) || !data.sizes.length)) throw new Error('Finished Garment item must have at least one size variant');
    await ensureSizeSKUs(data.sizes, data.brand);
    const item = new Item({ ...data, itemCode, groupIds, sizes: data.sizes || [], type: (data.type || 'GARMENT').toUpperCase() });
    await item.save();
    return populateItem(item._id);
  }

  async updateItem(id, data = {}, options = { mergeSizes: false }) {
    const item = await Item.findById(id);
    if (!item) return null;
    await this.normalizeItemData(data);
    const fieldsToUpdate = ['itemName', 'itemCode', 'brand', 'description', 'hsCodeId', 'gstTax', 'fabric', 'color', 'pattern', 'fit', 'gender', 'uom', 'images', 'groupIds', 'sizes', 'sectionId', 'categoryId', 'subCategoryId', 'styleId', 'type', 'reorderLevel', 'reorderQty', 'openingStock', 'openingStockRate', 'stockTrackingEnabled', 'barcodeEnabled', 'isActive', 'customFields', 'defaultWarehouse', 'composition', 'gsm', 'width', 'shrinkage', 'shadeNo', 'accessorySize', 'packingType', 'purchasePrice', 'mrp'];
    fieldsToUpdate.forEach(field => {
      if (data[field] !== undefined) {
        if (['brand', 'hsCodeId', 'sectionId', 'categoryId', 'subCategoryId', 'styleId', 'defaultWarehouse'].includes(field)) item[field] = normalizeId(data[field]);
        else if (field === 'groupIds') item.groupIds = normalizeGroupIds(data[field]);
        else if (field === 'sizes' && options.mergeSizes) {
          const newSizes = data.sizes || [];
          newSizes.forEach(newS => {
            const existingV = item.sizes.find(s => (newS.sku && s.sku === newS.sku) || (s.size === newS.size && s.color === newS.color));
            if (existingV) {
              if (newS.mrp) existingV.mrp = newS.mrp;
              if (newS.stock !== undefined) existingV.stock = newS.stock;
              if (newS.sku) existingV.sku = newS.sku;
            } else item.sizes.push(newS);
          });
        } else item[field] = data[field];
      }
    });
    if (data.itemCode && data.itemCode !== item.itemCode) {
      const existing = await Item.findOne({ itemCode: data.itemCode, _id: { $ne: id } });
      if (existing) throw new Error(`Style Code ${data.itemCode} is already used.`);
    }
    if (item.groupIds?.length > 0) await ensureGroupsExist(item.groupIds);
    if (item.sizes) await ensureSizeSKUs(item.sizes, item.brand);
    await item.save();
    return populateItem(item._id);
  }

  async getAllItems(query = {}, user = null) {
    const { page = 1, limit = 50, search, brand, section } = query;
    const filter = {};
    if (user?.role === 'store_staff') { filter.type = { $in: ['GARMENT', 'ACCESSORY'] }; filter.isActive = true; }
    if (search) filter.$or = [{ itemCode: { $regex: search, $options: 'i' } }, { itemName: { $regex: search, $options: 'i' } }, { hsnCode: { $regex: search, $options: 'i' } }];
    if (brand && brand !== 'all') filter.brandName = brand;
    if (section && section !== 'all') filter.sectionName = section;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      Item.find(filter).populate('brand', 'name brandName').populate('hsCodeId', 'code hsnCode gstRate gstPercent').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Item.countDocuments(filter)
    ]);
    return { items, total, page: parseInt(page), limit: parseInt(limit) };
  }

  async getItemById(id) {
    return Item.findById(id).populate('groupIds', 'name groupType level parentId isActive').populate('sectionId', 'name groupName groupType').populate('categoryId', 'name groupName groupType').populate('subCategoryId', 'name groupName groupType').populate('styleId', 'name groupName groupType').populate('brand', 'name brandName').populate('hsCodeId', 'code hsnCode gstRate gstPercent');
  }

  async scanItemByBarcode(barcode) {
    if (!barcode) throw new Error('Barcode is required');
    const upperBarcode = barcode.toUpperCase();
    const item = await Item.findOne({ $or: [{ itemCode: upperBarcode }, { 'sizes.sku': barcode }, { 'sizes.barcode': barcode }] }).populate('brand', 'name brandName').populate('hsCodeId', 'code hsnCode gstRate gstPercent');
    if (!item) return null;
    const variant = item.sizes.find(s => s.sku === barcode || s.barcode === barcode) || item.sizes[0];
    return { item, variant };
  }

  async generateSequentialBarcodes(brandId, count) {
    const brand = await Brand.findById(brandId);
    if (!brand) throw new Error('Brand not found');
    const prefix = getBrandPrefix(brand);
    const counterKey = `barcode_seq_${prefix}`;
    const counter = await Counter.findOneAndUpdate({ name: counterKey }, { $inc: { seq: count } }, { upsert: true, new: true });
    const startSeq = counter.seq - count + 1;
    const barcodes = [];
    for (let i = 0; i < count; i++) barcodes.push(`${prefix}-${String(startSeq + i).padStart(4, '0')}`);
    return barcodes;
  }

  async peekSequentialBarcodes(brandId, count) {
    const brand = await Brand.findById(brandId);
    if (!brand) throw new Error('Brand not found');
    const prefix = getBrandPrefix(brand);
    const counterKey = `barcode_seq_${prefix}`;
    const counter = await Counter.findOne({ name: counterKey });
    const startSeq = (counter?.seq || 0) + 1;
    const barcodes = [];
    for (let i = 0; i < count; i++) barcodes.push(`${prefix}-${String(startSeq + i).padStart(4, '0')}`);
    return barcodes;
  }

  async deleteItem(id) { return Item.findByIdAndDelete(id); }

  async bulkCreateItems(itemsData, options = {}) {
    const results = { success: [], errors: [] };
    const brands = await Brand.find({}).select('_id name brandName').lean();
    const groups = await Group.find({}).select('_id name groupName groupType').lean();
    const hsnCodes = await HSNCode.find({}).select('_id code hsnCode').lean();
    const bulkOps = [];
    const itemCodes = itemsData.map(d => String(d.itemCode).trim().toUpperCase());
    const existingItems = await Item.find({ itemCode: { $in: itemCodes } }).select('itemCode _id').lean();
    const existingMap = new Map(existingItems.map(i => [i.itemCode, i._id]));

    for (const data of itemsData) {
      try {
        const itemCode = String(data.itemCode).trim().toUpperCase();
        if (data.brandName && !data.brand) {
          const b = brands.find(x => x.name?.toLowerCase() === data.brandName.toLowerCase() || x.brandName?.toLowerCase() === data.brandName.toLowerCase());
          if (b) data.brand = b._id;
        }
        if (data.hsnCode && !data.hsCodeId) {
          const h = hsnCodes.find(x => x.code?.toLowerCase() === String(data.hsnCode).toLowerCase() || x.hsnCode?.toLowerCase() === String(data.hsnCode).toLowerCase());
          if (h) data.hsCodeId = h._id;
        }
        const updateDoc = { ...data, itemCode, brandName: data.brandName || data.brand?.brandName || data.brand?.name, hsnCode: data.hsnCode || data.hsCodeId?.code || data.hsCodeId?.hsnCode, type: data.type || 'GARMENT', status: 'Active', isActive: true };
        if (existingMap.has(itemCode)) bulkOps.push({ updateOne: { filter: { itemCode }, update: { $set: updateDoc } } });
        else bulkOps.push({ insertOne: { document: updateDoc } });
        results.success.push({ itemCode });
      } catch (error) {
        results.errors.push({ itemCode: data.itemCode, error: error.message });
      }
    }
    if (bulkOps.length > 0) await Item.bulkWrite(bulkOps, { ordered: false });
    return results;
  }

  async resolveBulkItems(identifiers) {
    if (!Array.isArray(identifiers) || identifiers.length === 0) return [];
    const ids = [...new Set(identifiers.map(id => String(id).trim().toUpperCase()))];
    const items = await Item.find({
        $or: [{ itemCode: { $in: ids } }, { "sizes.barcode": { $in: ids } }, { "sizes.sku": { $in: ids } }],
        isActive: true
    }).populate('brand', 'name brandName').populate('hsCodeId', 'code');

    const results = [];
    ids.forEach(id => {
        const item = items.find(it => it.itemCode === id || it.sizes.some(s => s.barcode === id || s.sku === id));
        if (item) {
            const bName = item.brand?.name || item.brand?.brandName || item.brandName || '--';
            const hsn = item.hsCodeId?.code || item.hsnCode || '--';
            if (item.itemCode === id) {
                item.sizes.forEach(v => {
                    results.push({ matchedId: id, itemId: item._id, itemCode: item.itemCode, itemName: item.itemName, variantId: v._id, size: v.size, color: v.color || item.color || '--', sku: v.sku || v.barcode || item.itemCode, rate: v.mrp || 0, brandName: bName, hsnCode: hsn });
                });
            } else {
                const v = item.sizes.find(s => s.barcode === id || s.sku === id);
                if (v) results.push({ matchedId: id, itemId: item._id, itemCode: item.itemCode, itemName: item.itemName, variantId: v._id, size: v.size, color: v.color || item.color || '--', sku: v.sku || v.barcode || item.itemCode, rate: v.mrp || 0, brandName: bName, hsnCode: hsn });
            }
        }
    });
    return results;
  }
}

module.exports = new ItemService();
