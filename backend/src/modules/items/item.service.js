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

/** Global garment barcode / variant SKU series: BM0259 → BM0260, BM0261, ... */
const BM_COUNTER_NAME = 'itemCode_BM';
const BM_PREFIX = 'BM';
const BM_MIN_SEQ = 259;

const parseBmSequence = (value) => {
  const match = String(value || '').trim().toUpperCase().match(/^BM(\d+)$/);
  if (!match) return null;
  const num = Number(match[1]);
  return Number.isFinite(num) ? num : null;
};

const formatBmCode = (seq) => `${BM_PREFIX}${String(seq).padStart(4, '0')}`;

const isPlaceholderSku = (sku) => {
  const normalized = String(sku || '').trim().toUpperCase();
  if (!normalized) return true;
  if (/^BM\d+$/.test(normalized)) return false;
  return /^(ITEM|BR|STYLE|BAR)-\d+$/i.test(normalized);
};

const syncBmCounterFromDatabase = async () => {
  const counter = await Counter.findOne({ name: BM_COUNTER_NAME });
  if (counter?.seq >= BM_MIN_SEQ - 1) {
    return counter.seq;
  }

  const items = await Item.find({
    $or: [{ itemCode: /^BM\d+$/i }, { 'sizes.sku': /^BM\d+$/i }, { 'sizes.barcode': /^BM\d+$/i }],
  })
    .select('itemCode sizes.sku sizes.barcode')
    .lean();

  let maxSeq = BM_MIN_SEQ - 1;
  items.forEach((item) => {
    const candidates = [item.itemCode, ...(item.sizes || []).flatMap((s) => [s.sku, s.barcode])];
    candidates.forEach((code) => {
      const seq = parseBmSequence(code);
      if (seq && seq > maxSeq) maxSeq = seq;
    });
  });

  await Counter.findOneAndUpdate(
    { name: BM_COUNTER_NAME },
    { $max: { seq: maxSeq } },
    { upsert: true },
  );

  return maxSeq;
};

const peekBmCodes = async (count = 1) => {
  const safeCount = Math.max(1, Number(count) || 1);
  const counter = await Counter.findOne({ name: BM_COUNTER_NAME });
  const maxSeq = counter?.seq >= BM_MIN_SEQ - 1 ? counter.seq : await syncBmCounterFromDatabase();
  const startSeq = Math.max(maxSeq, BM_MIN_SEQ - 1) + 1;
  return Array.from({ length: safeCount }, (_, index) => formatBmCode(startSeq + index));
};

const allocateBmCodes = async (count = 1) => {
  const safeCount = Math.max(1, Number(count) || 1);
  await syncBmCounterFromDatabase();
  const counter = await Counter.findOneAndUpdate(
    { name: BM_COUNTER_NAME },
    { $inc: { seq: safeCount } },
    { upsert: true, new: true },
  );
  const endSeq = Math.max(counter.seq, BM_MIN_SEQ);
  const startSeq = endSeq - safeCount + 1;
  return Array.from({ length: safeCount }, (_, index) => formatBmCode(startSeq + index));
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

const ensureSizeSKUs = async (sizes = []) => {
  if (!sizes.length) return;
  const needsAllocation = sizes.filter((entry) => isPlaceholderSku(entry.sku));
  if (!needsAllocation.length) return;

  const allocated = await allocateBmCodes(needsAllocation.length);
  let offset = 0;
  sizes.forEach((entry) => {
    if (isPlaceholderSku(entry.sku)) {
      const code = allocated[offset];
      offset += 1;
      entry.sku = code;
      if (!entry.barcode || isPlaceholderSku(entry.barcode)) {
        entry.barcode = code;
      }
    }
  });
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

const resolveOrCreateGroup = async (name, groupType, parentId = null) => {
  if (!name || name === 'null' || name === 'undefined') return null;
  
  if (mongoose.Types.ObjectId.isValid(name)) {
    const existing = await Group.findById(name);
    if (existing) return existing._id;
  }
  
  const trimmedName = String(name).trim();
  if (!trimmedName) return null;
  
  let group = await Group.findOne({
    name: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    groupType
  });
  
  if (!group) {
    const cleanParentId = (parentId && mongoose.Types.ObjectId.isValid(parentId)) ? parentId : null;
    group = await Group.create({
      name: trimmedName,
      groupType,
      parentId: cleanParentId,
      code: trimmedName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) + Math.floor(Math.random() * 100)
    });
    console.log(`[AUTO-GROUP] Created new group: [${groupType}] ${trimmedName}`);
  }
  
  return group._id;
};

class ItemService {
  async normalizeItemData(data) {
    if (data.itemCode) data.itemCode = String(data.itemCode).trim().toUpperCase();
    if (data.type) data.type = data.type.trim().toUpperCase();

    // Automatically resolve or create dynamic Group documents for Section, Category, Sub Category, and Style/Type
    if (data.sectionId || data.sectionName || data.section) {
      data.sectionId = await resolveOrCreateGroup(data.sectionId || data.sectionName || data.section, 'Section');
      if (data.sectionId) {
        const grp = await Group.findById(data.sectionId).select('name');
        if (grp) data.sectionName = grp.name;
      }
    }

    if (data.categoryId || data.categoryName || data.category) {
      data.categoryId = await resolveOrCreateGroup(data.categoryId || data.categoryName || data.category, 'Category', data.sectionId);
      if (data.categoryId) {
        const grp = await Group.findById(data.categoryId).select('name');
        if (grp) data.categoryName = grp.name;
      }
    }

    if (data.subCategoryId || data.subCategory) {
      data.subCategoryId = await resolveOrCreateGroup(data.subCategoryId || data.subCategory, 'Sub Category', data.categoryId);
    }

    if (data.styleId || data.styleType) {
      data.styleId = await resolveOrCreateGroup(data.styleId || data.styleType, 'Style / Type', data.subCategoryId);
    }

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
    void type;
    const [nextCode] = await peekBmCodes(1);
    return nextCode;
  }

  async createItem(data = {}, options = { allowUpdate: false }) {
    await this.normalizeItemData(data);
    let itemCode = data.itemCode;
    const type = data.type || 'GARMENT';
    const COUNTER_NAME = 'itemCode_BM';
    const PREFIX = 'BM';
    if (!itemCode) {
      [itemCode] = await allocateBmCodes(1);
    } else if (/^BM\d{4,}$/i.test(itemCode)) {
      const num = parseInt(itemCode.replace(/^BM/i, ''), 10);
      if (!isNaN(num)) {
        await Counter.findOneAndUpdate(
          { name: COUNTER_NAME },
          { $max: { seq: num } },
          { upsert: true, new: true }
        );
      }
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
    await ensureSizeSKUs(data.sizes);
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
    if (item.sizes) await ensureSizeSKUs(item.sizes);
    await item.save();
    return populateItem(item._id);
  }

  async getAllItems(query = {}, user = null) {
    const { getPagination, getSort } = require('../../utils/pagination.helper');
    const { page, limit, skip } = getPagination(query);
    const { search, brand, section } = query;
    const filter = {};
    if (user?.role === 'store_staff') { filter.type = { $in: ['GARMENT', 'ACCESSORY'] }; filter.isActive = true; }
    if (search) filter.$or = [{ itemCode: { $regex: search, $options: 'i' } }, { itemName: { $regex: search, $options: 'i' } }, { hsnCode: { $regex: search, $options: 'i' } }];
    if (brand && brand !== 'all') filter.brandName = brand;
    if (section && section !== 'all') filter.sectionName = section;
    const sort = getSort(query, {
      itemCode: 'itemCode',
      itemName: 'itemName',
      brand: 'brandName',
      createdAt: 'createdAt',
    }, { createdAt: -1 });
    const listSelect = 'itemCode itemName brandName sectionName categoryName hsnCode gstPercent sizes type isActive createdAt';
    const [items, total] = await Promise.all([
      Item.find(filter)
        .select(listSelect)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Item.countDocuments(filter)
    ]);
    return { items, total, page, limit };
  }

  async getItemById(id) {
    return Item.findById(id).populate('groupIds', 'name groupType level parentId isActive').populate('sectionId', 'name groupName groupType').populate('categoryId', 'name groupName groupType').populate('subCategoryId', 'name groupName groupType').populate('styleId', 'name groupName groupType').populate('brand', 'name brandName').populate('hsCodeId', 'code hsnCode gstRate gstPercent');
  }

  async scanItemByBarcode(barcode) {
    if (!barcode) throw new Error('Barcode is required');
    const upperBarcode = barcode.toUpperCase().trim();
    
    // 1. Direct Match (Item Code, Item Name, SKU, or Barcode)
    let item = await Item.findOne({ 
      $or: [
        { itemCode: upperBarcode }, 
        { itemName: upperBarcode },
        { 'sizes.sku': upperBarcode }, 
        { 'sizes.barcode': upperBarcode }
      ] 
    }).populate('brand', 'name brandName').populate('hsCodeId', 'code hsnCode gstRate gstPercent');

    // 2. Composite Match (Handle cases like "ITEMCODE SHADE" - preserving hyphens in codes)
    if (!item && upperBarcode.includes(' ')) {
      const parts = upperBarcode.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        const potentialCode = parts[0];
        const potentialShade = parts.slice(1).join(' ');
        
        item = await Item.findOne({ 
          $and: [
            { $or: [{ itemCode: potentialCode }, { itemName: new RegExp(`^${potentialCode}`, 'i') }] },
            { $or: [
              { shadeNo: { $regex: new RegExp(potentialShade, 'i') } },
              { color: { $regex: new RegExp(potentialShade, 'i') } }
            ]}
          ]
        }).populate('brand', 'name brandName').populate('hsCodeId', 'code hsnCode gstRate gstPercent');
      }
    }

    // 3. Fallback: Check if the whole scanned string matches the itemName
    if (!item) {
        item = await Item.findOne({ 
            itemName: { $regex: new RegExp(upperBarcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } 
        }).populate('brand', 'name brandName').populate('hsCodeId', 'code hsnCode gstRate gstPercent');
    }

    if (!item) return null;

    // Determine variant
    const variant = item.sizes.find(s => 
      s.sku?.toUpperCase() === upperBarcode || 
      s.barcode?.toUpperCase() === upperBarcode
    ) || item.sizes[0];

    return { item, variant };
  }

  async generateSequentialBarcodes(_brandId, count) {
    return allocateBmCodes(count);
  }

  async peekSequentialBarcodes(_brandId, count) {
    return peekBmCodes(count);
  }

  async peekBmSkuCodes(count) {
    return peekBmCodes(count);
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
    
    // Create lookup maps for O(1) access
    const itemCodeMap = new Map();
    const barcodeMap = new Map();

    items.forEach(item => {
        if (item.itemCode) itemCodeMap.set(item.itemCode.toUpperCase(), item);
        (item.sizes || []).forEach(v => {
            if (v.barcode) barcodeMap.set(v.barcode.toUpperCase(), item);
            if (v.sku) barcodeMap.set(v.sku.toUpperCase(), item);
        });
    });

    ids.forEach(id => {
        const item = itemCodeMap.get(id) || barcodeMap.get(id);
        if (item) {
            const bName = item.brand?.name || item.brand?.brandName || item.brandName || '--';
            const hsn = item.hsCodeId?.code || item.hsnCode || '--';
            
            if (item.itemCode === id) {
                // If matched by itemCode, add all its variants
                item.sizes.forEach(v => {
                    results.push({
                        matchedId: id,
                        itemId: item._id,
                        itemCode: item.itemCode,
                        itemName: item.itemName,
                        variantId: v._id,
                        size: v.size,
                        color: v.color || item.color || '--',
                        sku: v.sku || v.barcode || item.itemCode,
                        rate: v.mrp || 0,
                        brandName: bName,
                        hsnCode: hsn
                    });
                });
            } else {
                // Matched by specific barcode/SKU
                const v = item.sizes.find(s => s.barcode === id || s.sku === id);
                if (v) {
                    results.push({
                        matchedId: id,
                        itemId: item._id,
                        itemCode: item.itemCode,
                        itemName: item.itemName,
                        variantId: v._id,
                        size: v.size,
                        color: v.color || item.color || '--',
                        sku: v.sku || v.barcode || item.itemCode,
                        rate: v.mrp || 0,
                        brandName: bName,
                        hsnCode: hsn
                    });
                }
            }
        }
    });
    return results;
  }

  async resolveOpeningBalanceItems(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return [];
    
    // Filter out rows that look like 'Total' rows (often have no item code/name or have 'total' in name)
    const filteredRows = rows.filter(r => {
      const name = String(r.itemName || '').toLowerCase();
      const code = String(r.itemCode || '').toLowerCase();
      if (!name && !code) return false;
      if (name.includes('total') || name.includes('grand total')) return false;
      return true;
    });

    const itemCodes = [...new Set(filteredRows.map(r => String(r.itemCode || '').trim().toUpperCase()).filter(Boolean))];
    const itemNames = [...new Set(filteredRows.map(r => String(r.itemName || '').trim()).filter(Boolean))];
    
    // Fetch potential matches
    const items = await Item.find({
      $or: [
        { itemCode: { $in: itemCodes } },
        { itemName: { $in: itemNames } }
      ],
      isActive: true
    }).populate('brand', 'name brandName').populate('hsCodeId', 'code');

    // Optimization: Create maps for O(1) lookup
    const itemMap = new Map();
    const nameShadeMap = new Map();

    items.forEach(it => {
      if (it.itemCode) itemMap.set(it.itemCode.toUpperCase(), it);
      const key = `${it.itemName?.toLowerCase()}|${String(it.shadeNo || it.color || '').toLowerCase()}`;
      if (!nameShadeMap.has(key)) nameShadeMap.set(key, it);
    });

    const results = filteredRows.map(row => {
      const searchCode = String(row.itemCode || '').trim().toUpperCase();
      const searchName = String(row.itemName || '').trim().toLowerCase();
      const searchShade = String(row.shade || row.color || '').trim().toLowerCase();
      const searchSize = String(row.size || '').trim().toUpperCase();

      // Priority 1: Match by Item Code
      let matchedItem = itemMap.get(searchCode);
      
      // Priority 2: Match by Name + Shade
      if (!matchedItem) {
        matchedItem = nameShadeMap.get(`${searchName}|${searchShade}`) || nameShadeMap.get(`${searchName}|`);
      }

      if (matchedItem) {
        // Find variant
        const variant = (matchedItem.sizes || []).find(v => 
          String(v.size || '').toUpperCase() === searchSize || 
          v.sku?.toUpperCase() === searchCode ||
          v.barcode?.toUpperCase() === searchCode
        ) || matchedItem.sizes[0];

        return {
          ...row,
          itemId: matchedItem._id,
          variantId: variant ? (variant._id || variant.id) : matchedItem._id,
          matched: true,
          itemName: matchedItem.itemName,
          itemCode: matchedItem.itemCode,
          size: variant ? variant.size : (row.size || '--'),
          color: matchedItem.color || matchedItem.shadeNo || '--',
          sku: variant ? (variant.sku || variant.barcode) : matchedItem.itemCode,
          costPrice: variant ? (variant.mrp || 0) : (matchedItem.purchasePrice || 0)
        };
      }

      return {
        ...row,
        matched: false,
        error: 'Item not found in master'
      };
    });

    return results;
  }

  async validateBarcodes(barcodes) {
    if (!Array.isArray(barcodes) || barcodes.length === 0) return {};

    const items = await Item.find({
        $or: [
            { itemCode: { $in: barcodes } },
            { "sizes.barcode": { $in: barcodes } },
            { "sizes.sku": { $in: barcodes } }
        ]
    }).lean();

    const resultMap = {};
    items.forEach(item => {
        if (item.itemCode && barcodes.includes(item.itemCode)) {
            const defaultVariant = item.sizes?.[0] || { _id: item._id, size: 'UNI' };
            resultMap[item.itemCode] = { item, variant: defaultVariant };
        }

        if (item.sizes) {
            item.sizes.forEach(sz => {
                if (sz.barcode && barcodes.includes(sz.barcode)) {
                    resultMap[sz.barcode] = { item, variant: sz };
                }
                if (sz.sku && barcodes.includes(sz.sku)) {
                    resultMap[sz.sku] = { item, variant: sz };
                }
            });
        }
    });

    return resultMap;
  }

  async getUniqueAttributes() {
    // Automatically extract flat categories from items and ensure Group records exist
    try {
      const [itemSections, itemCategories, itemSubCategories, itemStyleTypes] = await Promise.all([
        Item.distinct('sectionName', { sectionName: { $ne: null, $ne: '' } }),
        Item.distinct('categoryName', { categoryName: { $ne: null, $ne: '', $ne: '(NIL)' } }),
        Item.distinct('subCategoryName', { subCategoryName: { $ne: null, $ne: '' } }),
        Item.distinct('styleTypeName', { styleTypeName: { $ne: null, $ne: '' } }),
      ]);

      const existingGroups = await Group.find({ isActive: true }).select('name groupType').lean();
      const existingNamesSet = new Set(existingGroups.map(g => `${g.groupType}:${g.name.trim().toLowerCase()}`));

      // Sync sections
      for (const name of itemSections) {
        const key = `Section:${name.trim().toLowerCase()}`;
        if (!existingNamesSet.has(key)) {
          await resolveOrCreateGroup(name, 'Section');
        }
      }

      // Sync categories
      for (const name of itemCategories) {
        const key = `Category:${name.trim().toLowerCase()}`;
        if (!existingNamesSet.has(key)) {
          await resolveOrCreateGroup(name, 'Category');
        }
      }

      // Sync subcategories
      for (const name of itemSubCategories) {
        const key = `Sub Category:${name.trim().toLowerCase()}`;
        if (!existingNamesSet.has(key)) {
          await resolveOrCreateGroup(name, 'Sub Category');
        }
      }

      // Sync style types
      for (const name of itemStyleTypes) {
        const key = `Style / Type:${name.trim().toLowerCase()}`;
        if (!existingNamesSet.has(key)) {
          await resolveOrCreateGroup(name, 'Style / Type');
        }
      }
    } catch (err) {
      console.error('[AUTO-GROUP-SYNC] Error during getUniqueAttributes sync:', err);
    }

    const [fabrics, colors, fits, patterns, genders, compositions, shadeNos, packingTypes] = await Promise.all([
      Item.distinct('fabric', { fabric: { $ne: null, $ne: '' } }),
      Item.distinct('color', { color: { $ne: null, $ne: '' } }),
      Item.distinct('fit', { fit: { $ne: null, $ne: '' } }),
      Item.distinct('pattern', { pattern: { $ne: null, $ne: '' } }),
      Item.distinct('gender', { gender: { $ne: null, $ne: '' } }),
      Item.distinct('composition', { composition: { $ne: null, $ne: '' } }),
      Item.distinct('shadeNo', { shadeNo: { $ne: null, $ne: '' } }),
      Item.distinct('packingType', { packingType: { $ne: null, $ne: '' } }),
    ]);

    const groups = await Group.find({ isActive: true }).lean();

    return {
      fabrics,
      colors,
      fits,
      patterns,
      genders,
      compositions,
      shadeNos,
      packingTypes,
      groups: groups.map(g => ({
        id: g._id,
        groupName: g.name,
        code: g.code,
        groupType: g.groupType,
        parentId: g.parentId,
        level: g.level
      }))
    };
  }
}

module.exports = new ItemService();
