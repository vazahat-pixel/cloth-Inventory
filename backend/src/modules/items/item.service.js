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
  if (mongoose.Types.ObjectId.isValid(value)) {
    return String(value);
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
  // Fast path: if Counter already exists, trust it (it's updated on every allocation)
  const existing = await Counter.findOne({ name: BM_COUNTER_NAME });
  if (existing && existing.seq && existing.seq >= BM_MIN_SEQ) {
    return existing.seq;
  }

  // Slow path (only on first ever run): scan DB to find max existing BM code
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

const isBmCodeTaken = async (code, excludeItemId = null) => {
  const upper = String(code || '').trim().toUpperCase();
  if (!upper) return false;
  const filter = {
    $or: [{ itemCode: upper }, { 'sizes.sku': upper }, { 'sizes.barcode': upper }],
  };
  if (excludeItemId) filter._id = { $ne: excludeItemId };
  const found = await Item.findOne(filter).select('_id itemCode').lean();
  return Boolean(found);
};

const collectNextAvailableBmCodes = async (count = 1, excludeItemId = null) => {
  const safeCount = Math.max(1, Number(count) || 1);
  // Fast path: just read the counter and return the next N sequential codes.
  // NO per-code isBmCodeTaken DB queries — the counter already tracks max seq.
  const currentSeq = await syncBmCounterFromDatabase();
  const codes = [];
  for (let i = 1; i <= safeCount; i++) {
    codes.push(formatBmCode(currentSeq + i));
  }
  return { codes, endSeq: currentSeq + safeCount };
};

const peekBmCodes = async (count = 1) => {
  const { codes } = await collectNextAvailableBmCodes(count);
  return codes;
};

const allocateBmCodes = async (count = 1, excludeItemId = null) => {
  const { codes, endSeq } = await collectNextAvailableBmCodes(count, excludeItemId);
  await Counter.findOneAndUpdate(
    { name: BM_COUNTER_NAME },
    { $set: { seq: endSeq } },
    { upsert: true },
  );
  return codes;
};

const validateUniqueSkusWithinSizes = (sizes = []) => {
  const seen = new Set();
  sizes.forEach((entry) => {
    const sku = String(entry.sku || '').trim().toUpperCase();
    if (!sku) return;
    if (seen.has(sku)) {
      throw new Error(`Is item me do variants ka same SKU "${sku}" hai. Har size/color ka alag SKU hona chahiye.`);
    }
    seen.add(sku);
  });
};

const assertSkuNotUsedElsewhere = async (sku, excludeItemId = null) => {
  const upper = String(sku || '').trim().toUpperCase();
  if (!upper) return;
  const filter = {
    $or: [{ 'sizes.sku': upper }, { 'sizes.barcode': upper }, { itemCode: upper }],
  };
  if (excludeItemId) filter._id = { $ne: excludeItemId };
  const found = await Item.findOne(filter).select('itemCode itemName').lean();
  if (found) {
    throw new Error(
      `SKU/Barcode "${upper}" pehle se item "${found.itemCode}"${found.itemName ? ` (${found.itemName})` : ''} me use ho raha hai. Naya SKU ya auto-generate use karein.`,
    );
  }
};

const validateSizeSkusForSave = async (sizes = [], excludeItemId = null) => {
  validateUniqueSkusWithinSizes(sizes);
  const checks = sizes
    .map((entry) => String(entry.sku || '').trim().toUpperCase())
    .filter(Boolean)
    .map((sku) => assertSkuNotUsedElsewhere(sku, excludeItemId));
  await Promise.all(checks);
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

const ensureSizeSKUs = async (sizes = [], excludeItemId = null) => {
  if (!sizes.length) return;
  validateUniqueSkusWithinSizes(sizes);

  const needsAllocation = [];
  for (const entry of sizes) {
    if (isPlaceholderSku(entry.sku)) {
      needsAllocation.push(entry);
      continue;
    }
    const sku = String(entry.sku || '').trim().toUpperCase();
    if (/^BM\d+$/.test(sku)) {
      // eslint-disable-next-line no-await-in-loop
      const taken = await isBmCodeTaken(sku, excludeItemId);
      if (taken) {
        entry.sku = '';
        needsAllocation.push(entry);
      }
    }
  }

  if (!needsAllocation.length) return;

  const allocated = await allocateBmCodes(needsAllocation.length, excludeItemId);
  let offset = 0;
  sizes.forEach((entry) => {
    if (!needsAllocation.includes(entry)) return;
    const code = allocated[offset];
    offset += 1;
    entry.sku = code;
    if (!entry.barcode || isPlaceholderSku(entry.barcode)) {
      entry.barcode = code;
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

const groupCache = new Map();
const brandCache = new Map();
const hsnCache = new Map();

const resolveOrCreateGroup = async (name, groupType, parentId = null) => {
  if (!name || name === 'null' || name === 'undefined') return null;
  
  const cacheKey = `${groupType}:${String(name).trim().toLowerCase()}:${parentId || ''}`;
  if (groupCache.has(cacheKey)) {
    return groupCache.get(cacheKey);
  }
  
  if (mongoose.Types.ObjectId.isValid(name)) {
    const existing = await Group.findById(name);
    if (existing) {
      groupCache.set(cacheKey, existing._id);
      return existing._id;
    }
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
  
  groupCache.set(cacheKey, group._id);
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
        const idStr = String(data.sectionId);
        let sectionName;
        if (groupCache.has(`id:${idStr}`)) {
          sectionName = groupCache.get(`id:${idStr}`);
        } else {
          const grp = await Group.findById(data.sectionId).select('name');
          if (grp) {
            sectionName = grp.name;
            groupCache.set(`id:${idStr}`, sectionName);
          }
        }
        if (sectionName) data.sectionName = sectionName;
      }
    }

    if (data.categoryId || data.categoryName || data.category) {
      data.categoryId = await resolveOrCreateGroup(data.categoryId || data.categoryName || data.category, 'Category', data.sectionId);
      if (data.categoryId) {
        const idStr = String(data.categoryId);
        let categoryName;
        if (groupCache.has(`id:${idStr}`)) {
          categoryName = groupCache.get(`id:${idStr}`);
        } else {
          const grp = await Group.findById(data.categoryId).select('name');
          if (grp) {
            categoryName = grp.name;
            groupCache.set(`id:${idStr}`, categoryName);
          }
        }
        if (categoryName) data.categoryName = categoryName;
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
      data.sizes = data.sizes.map(s => {
        const cleaned = {
          ...s,
          mrp: Number(s.mrp || 0),
          stock: Number(s.stock || 0),
          reorderLevel: Number(s.reorderLevel || 0)
        };
        if (s.sku && String(s.sku).trim()) {
          cleaned.sku = String(s.sku).trim();
        } else if (s.barcode && String(s.barcode).trim()) {
          cleaned.sku = String(s.barcode).trim();
        } else {
          delete cleaned.sku;
        }
        if (s.barcode && String(s.barcode).trim()) {
          cleaned.barcode = String(s.barcode).trim();
        } else {
          delete cleaned.barcode;
        }
        return cleaned;
      });
    }
    if (data.purchaseRate && !data.purchasePrice) data.purchasePrice = Number(data.purchaseRate);
    if (data.saleRate && !data.mrp) data.mrp = Number(data.saleRate);
    if (data.hsnCodeId && !data.hsCodeId) data.hsCodeId = data.hsnCodeId;

    // Brand lookup cache
    if (data.brand) {
      const brandIdStr = String(data.brand);
      if (brandCache.has(brandIdStr)) {
        data.brandName = brandCache.get(brandIdStr);
      } else {
        const brandDoc = await Brand.findById(data.brand).select('name brandName').lean();
        if (brandDoc) {
          const brandName = brandDoc.brandName || brandDoc.name || '';
          data.brandName = brandName;
          brandCache.set(brandIdStr, brandName);
        }
      }
    }

    // HSN lookup cache
    if (data.hsCodeId) {
      const hsnIdStr = String(data.hsCodeId);
      if (hsnCache.has(hsnIdStr)) {
        const cached = hsnCache.get(hsnIdStr);
        data.hsnCode = cached.hsnCode;
        if (cached.gstPercent !== undefined) data.gstPercent = cached.gstPercent;
      } else {
        const hsnDoc = await HSNCode.findById(data.hsCodeId).select('code gstPercent gstRate').lean();
        if (hsnDoc) {
          const hsnCode = hsnDoc.code || hsnDoc.hsnCode || '';
          let gstPercent = 0;
          if (hsnDoc.gstPercent !== undefined) gstPercent = hsnDoc.gstPercent;
          else if (hsnDoc.gstRate !== undefined) gstPercent = hsnDoc.gstRate;
          
          data.hsnCode = hsnCode;
          data.gstPercent = gstPercent;
          hsnCache.set(hsnIdStr, { hsnCode, gstPercent });
        }
      }
    }
  }

  async syncItemDenormalizedFields(item) {
    if (item.brand) {
      const brandDoc = await Brand.findById(item.brand).select('name brandName').lean();
      item.brandName = brandDoc?.brandName || brandDoc?.name || item.brandName || '';
    }
    if (item.hsCodeId) {
      const hsnDoc = await HSNCode.findById(item.hsCodeId).select('code gstPercent gstRate').lean();
      if (hsnDoc) {
        item.hsnCode = hsnDoc.code || hsnDoc.hsnCode || item.hsnCode || '';
        if (hsnDoc.gstPercent !== undefined) item.gstPercent = hsnDoc.gstPercent;
        else if (hsnDoc.gstRate !== undefined) item.gstPercent = hsnDoc.gstRate;
      }
    }
  }

  async getNextCode(type = 'GARMENT') {
    void type;
    const [nextCode] = await peekBmCodes(1);
    return nextCode;
  }

  async createItem(data = {}, options = { allowUpdate: false }) {
    await this.normalizeItemData(data);
    const type = data.type || 'GARMENT';
    if ((data.type || 'GARMENT').toUpperCase() === 'GARMENT' && (!Array.isArray(data.sizes) || !data.sizes.length)) {
      throw new Error('Finished Garment item must have at least one size variant');
    }
    if (data.vendorId && typeof data.vendorId === 'string' && !mongoose.Types.ObjectId.isValid(data.vendorId)) delete data.vendorId;
    const groupIds = normalizeGroupIds(data.groupIds);
    await ensureGroupsExist(groupIds);
    await ensureSizeSKUs(data.sizes);

    const resolveItemCode = async () => {
      let itemCode = data.itemCode;
      if (!itemCode || /^BM\d+$/i.test(String(itemCode).trim())) {
        if (data.sizes && data.sizes[0] && data.sizes[0].sku) {
          itemCode = data.sizes[0].sku;
        } else {
          [itemCode] = await allocateBmCodes(1);
        }
        return itemCode;
      }
      itemCode = String(itemCode).trim().toUpperCase();
      const existingItem = await Item.findOne({ itemCode }).select('_id itemCode itemName').lean();
      if (existingItem) {
        if (options.allowUpdate) return { existingItem, itemCode: null };
        throw new Error(
          `Item/Style Code "${itemCode}" pehle se item "${existingItem.itemCode}"${existingItem.itemName ? ` (${existingItem.itemName})` : ''} me hai. Item Master me search karein.`,
        );
      }
      return itemCode;
    };

    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const resolved = await resolveItemCode();
      if (resolved?.existingItem) {
        return this.updateItem(resolved.existingItem._id, data, { mergeSizes: true });
      }
      const itemCode = resolved;
      try {
        await validateSizeSkusForSave(data.sizes);
        const item = new Item({ ...data, itemCode, groupIds, sizes: data.sizes || [], type: type.toUpperCase() });
        await item.save();
        return populateItem(item._id);
      } catch (error) {
        const errMsg = String(error.message || '');
        const isDuplicateCode = error?.code === 11000 && /itemCode|sizes\.sku|sizes\.barcode/i.test(errMsg);
        if (isDuplicateCode && attempt < maxAttempts - 1) {
          data.itemCode = undefined;
          if (/sizes\.(sku|barcode)/i.test(errMsg)) {
            (data.sizes || []).forEach((entry) => {
              const sku = String(entry.sku || '').trim().toUpperCase();
              if (!sku || /^BM\d+$/i.test(sku) || isPlaceholderSku(sku)) {
                entry.sku = '';
                entry.barcode = '';
              }
            });
            await ensureSizeSKUs(data.sizes);
          }
          // eslint-disable-next-line no-continue
          continue;
        }
        throw error;
      }
    }
    throw new Error('Could not allocate a unique item code. Please try again.');
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
    if (item.sizes) {
      await ensureSizeSKUs(item.sizes, item._id);
      await validateSizeSkusForSave(item.sizes, item._id);
    }
    await this.syncItemDenormalizedFields(item);
    await item.save();
    return populateItem(item._id);
  }

  async getAllItems(query = {}, user = null) {
    const { getPagination, getSort } = require('../../utils/pagination.helper');
    const { page, limit, skip } = getPagination(query);
    const { search, brand, section } = query;
    const filter = {};
    if (user?.role === 'store_staff') { filter.type = { $in: ['GARMENT', 'ACCESSORY'] }; filter.isActive = true; }
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$or = [
        { itemCode: searchRegex },
        { itemName: searchRegex },
        { hsnCode: searchRegex },
        { brandName: searchRegex },
        { categoryName: searchRegex },
        { color: searchRegex },
        { fabric: searchRegex },
        { pattern: searchRegex },
        { shadeNo: searchRegex },
        { 'sizes.sku': searchRegex },
        { 'sizes.barcode': searchRegex },
        { 'sizes.size': searchRegex },
        { 'sizes.color': searchRegex },
      ];
    }
    if (brand && brand !== 'all') filter.brandName = brand;
    if (section && section !== 'all') filter.sectionName = section;
    const sort = getSort(query, {
      itemCode: 'itemCode',
      itemName: 'itemName',
      brand: 'brandName',
      createdAt: 'createdAt',
    }, { createdAt: -1 });
    const listSelect = 'itemCode itemName brand brandName sectionName categoryName hsnCode gstPercent hsCodeId sizes type isActive createdAt color shadeNo sectionId categoryId';
    const [items, total] = await Promise.all([
      Item.find(filter)
        .select(listSelect)
        .populate('brand', 'name brandName')
        .populate('hsCodeId', 'code hsnCode gstRate gstPercent')
        .populate('sectionId', 'name groupName')
        .populate('categoryId', 'name groupName')
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
    if (!itemsData || itemsData.length === 0) return results;

    console.log(`[BULK] Starting fast bulk import of ${itemsData.length} items...`);
    const t0 = Date.now();

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 1: Single-round-trip batch load of ALL reference data
    // ══════════════════════════════════════════════════════════════════════════
    const t1 = Date.now();
    const [brands, groups, hsnCodes] = await Promise.all([
      Brand.find({}).select('_id name brandName shortName').lean(),
      Group.find({}).select('_id name groupName groupType parentId').lean(),
      HSNCode.find({}).select('_id code hsnCode gstPercent gstRate').lean(),
    ]);
    console.log(`[BULK] Phase1 load refs: ${Date.now() - t1}ms (${brands.length} brands, ${groups.length} groups, ${hsnCodes.length} HSN)`);

    // Build fast lookup maps (all O(1) from here on)
    const brandByName = new Map();
    brands.forEach(b => {
      const n = (b.brandName || b.name || '').trim().toLowerCase();
      if (n) brandByName.set(n, b);
    });

    // groupByKey: 'GROUPTYPE:name' → group doc
    const groupByKey = new Map();
    const groupById = new Map();
    groups.forEach(g => {
      const n = (g.groupName || g.name || '').trim().toLowerCase();
      groupByKey.set(`${g.groupType}:${n}`, g);
      groupById.set(String(g._id), g);
    });

    const hsnByCode = new Map();
    const hsnById = new Map();
    hsnCodes.forEach(h => {
      const code = (h.code || h.hsnCode || '').trim();
      if (code) hsnByCode.set(code.toLowerCase(), h);
      hsnById.set(String(h._id), h);
    });

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 2: Collect all unique group names that need to exist
    //          Create any missing ones in a single batch
    // ══════════════════════════════════════════════════════════════════════════
    const missingGroups = []; // { name, groupType, key }
    const seenMissingKeys = new Set();

    const collectGroup = (name, groupType) => {
      if (!name || name === 'null' || name === 'undefined') return;
      const n = String(name).trim().toLowerCase();
      if (!n) return;
      const key = `${groupType}:${n}`;
      if (!groupByKey.has(key) && !seenMissingKeys.has(key)) {
        seenMissingKeys.add(key);
        missingGroups.push({ name: String(name).trim(), groupType, key });
      }
    };

    for (const data of itemsData) {
      collectGroup(data.sectionName || data.section, 'Section');
      collectGroup(data.categoryName || data.category, 'Category');
      collectGroup(data.subCategoryName || data.subCategory, 'Sub Category');
      collectGroup(data.styleName || data.styleType, 'Style / Type');
    }

    if (missingGroups.length > 0) {
      console.log(`[BULK] Creating ${missingGroups.length} new groups in batch...`);
      const newGroupDocs = missingGroups.map(mg => ({
        name: mg.name,
        groupType: mg.groupType,
        parentId: null,
        code: mg.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) + Math.floor(Math.random() * 100),
      }));
      try {
        const created = await Group.insertMany(newGroupDocs, { ordered: false });
        created.forEach(g => {
          const n = (g.name || '').trim().toLowerCase();
          const key = `${g.groupType}:${n}`;
          groupByKey.set(key, g);
          groupById.set(String(g._id), g);
        });
      } catch (e) {
        // BulkWriteError on duplicates — still capture successfully inserted docs
        const inserted = e?.insertedDocs || e?.result?.insertedDocs || [];
        inserted.forEach(g => {
          const n = (g.name || '').trim().toLowerCase();
          const key = `${g.groupType}:${n}`;
          groupByKey.set(key, g);
          groupById.set(String(g._id), g);
        });
        console.log(`[BULK] Group batch: ${inserted.length} created, some may already exist (ok).`);
      }
    }

    // Helper: resolve group id from name string (pure in-memory)
    const resolveGroupId = (name, groupType) => {
      if (!name || name === 'null' || name === 'undefined') return null;
      const n = String(name).trim().toLowerCase();
      if (!n) return null;
      const key = `${groupType}:${n}`;
      const g = groupByKey.get(key);
      return g ? g._id : null;
    };

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 3: Allocate ALL needed BM codes in one shot
    // ══════════════════════════════════════════════════════════════════════════
    let needsAllocationCount = 0;
    for (const data of itemsData) {
      if (Array.isArray(data.sizes)) {
        for (const s of data.sizes) {
          if (isPlaceholderSku(s.sku || s.barcode || '')) needsAllocationCount++;
        }
      }
    }

    const t3 = Date.now();
    const allocatedCodes = needsAllocationCount > 0 ? await allocateBmCodes(needsAllocationCount) : [];
    console.log(`[BULK] Phase3 BM alloc ${needsAllocationCount} codes: ${Date.now() - t3}ms`);
    let allocIdx = 0;

    for (const data of itemsData) {
      if (Array.isArray(data.sizes)) {
        for (const s of data.sizes) {
          if (isPlaceholderSku(s.sku || s.barcode || '')) {
            const code = allocatedCodes[allocIdx++];
            s.sku = code;
            if (!s.barcode) s.barcode = code;
          }
        }
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 4: Check existing items in one batch query
    // ══════════════════════════════════════════════════════════════════════════
    const t4 = Date.now();
    const itemCodes = itemsData.map(d => String(d.itemCode || '').trim().toUpperCase()).filter(Boolean);
    const existingItems = await Item.find({ itemCode: { $in: itemCodes } }).select('itemCode _id sizes').lean();
    const existingMap = new Map(existingItems.map(i => [i.itemCode, i]));
    console.log(`[BULK] Phase4 existing check ${itemCodes.length} codes: ${Date.now() - t4}ms (${existingItems.length} found)`);

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 5: Pure in-memory normalization — ZERO DB queries in this loop
    // ══════════════════════════════════════════════════════════════════════════
    const bulkOps = [];

    for (const data of itemsData) {
      try {
        const itemCode = String(data.itemCode || '').trim().toUpperCase();
        if (!itemCode) { results.errors.push({ itemCode: data.itemCode, error: 'Missing item code' }); continue; }

        // Resolve section/category/subcategory/style from in-memory maps
        const sectionId = resolveGroupId(data.sectionName || data.section, 'Section');
        const categoryId = resolveGroupId(data.categoryName || data.category, 'Category');
        const subCategoryId = resolveGroupId(data.subCategoryName || data.subCategory, 'Sub Category');
        const styleId = resolveGroupId(data.styleName || data.styleType, 'Style / Type');

        // Resolve group name strings for denormalized fields
        const sectionName = sectionId ? (groupById.get(String(sectionId))?.name || data.sectionName || '') : '';
        const categoryName = categoryId ? (groupById.get(String(categoryId))?.name || data.categoryName || '') : '';

        // Resolve HSN
        let hsnCode = '';
        let gstPercent = 0;
        const hsnInput = data.hsnCode || data.hsn || data.hsn_code || '';
        if (hsnInput) {
          const hsnDoc = hsnByCode.get(String(hsnInput).trim().toLowerCase());
          if (hsnDoc) {
            hsnCode = hsnDoc.code || hsnDoc.hsnCode || '';
            gstPercent = hsnDoc.gstPercent !== undefined ? hsnDoc.gstPercent : (hsnDoc.gstRate || 0);
          } else {
            hsnCode = String(hsnInput).trim(); // store as-is if not in master
          }
        }

        // Resolve brand name
        let brandName = data.brandName || '';
        if (!brandName && data.brand) {
          const bDoc = brandByName.get(String(data.brand).trim().toLowerCase());
          if (bDoc) brandName = bDoc.brandName || bDoc.name || '';
          else brandName = String(data.brand).trim();
        }

        // Normalize sizes — pure in-memory
        const sizes = Array.isArray(data.sizes) ? data.sizes.map(s => {
          const sku = String(s.sku || s.barcode || '').trim();
          const barcode = String(s.barcode || s.sku || '').trim();
          return {
            size: String(s.size || 'Standard').trim(),
            color: String(s.color || data.color || 'N/A').trim(),
            sku: sku || undefined,
            barcode: barcode || undefined,
            mrp: Number(s.mrp || 0),
            stock: Number(s.stock || 0),
            status: 'Active',
          };
        }) : [];

        const groupIds = [sectionId, categoryId, subCategoryId, styleId].filter(Boolean);

        const updateDoc = {
          itemCode,
          itemName: String(data.itemName || itemCode).trim(),
          brandName,
          sectionName,
          categoryName,
          hsnCode,
          gstPercent,
          sectionId: sectionId || undefined,
          categoryId: categoryId || undefined,
          subCategoryId: subCategoryId || undefined,
          styleId: styleId || undefined,
          groupIds,
          sizes,
          color: String(data.color || (sizes[0]?.color) || '').trim(),
          fabric: String(data.fabric || '').trim() || undefined,
          composition: String(data.composition || '').trim() || undefined,
          uom: String(data.uom || 'PCS').trim().toUpperCase(),
          type: 'GARMENT',
          status: 'Active',
          isActive: true,
          packingType: String(data.packingType || '').trim() || undefined,
          description: String(data.description || '').trim() || undefined,
          mrp: sizes.length > 0 ? Math.max(...sizes.map(s => s.mrp || 0)) : 0,
        };

        // Strip undefined keys to avoid overwriting with null
        Object.keys(updateDoc).forEach(k => updateDoc[k] === undefined && delete updateDoc[k]);

        const existing = existingMap.get(itemCode);
        if (existing) {
          // UPDATE existing items using aggregation pipeline update.
          // We use $map to update ONLY the mrp inside each size variant (matched by size name).
          // sku/barcode are NOT modified → unique index NOT re-validated → fast!
          // This correctly propagates the item master MRP to every size in every location.
          const sizesMrpLookup = sizes.map(s => ({ size: s.size, mrp: s.mrp || 0 }));

          const metaFields = {
            itemName: updateDoc.itemName,
            brandName: updateDoc.brandName,
            sectionName: updateDoc.sectionName,
            categoryName: updateDoc.categoryName,
            hsnCode: updateDoc.hsnCode,
            gstPercent: updateDoc.gstPercent,
            color: updateDoc.color,
            uom: updateDoc.uom,
            type: updateDoc.type,
            isActive: true,
            mrp: updateDoc.mrp,  // parent-level MRP (max of all variants)
          };
          if (updateDoc.sectionId) metaFields.sectionId = updateDoc.sectionId;
          if (updateDoc.categoryId) metaFields.categoryId = updateDoc.categoryId;
          if (updateDoc.fabric) metaFields.fabric = updateDoc.fabric;
          if (updateDoc.composition) metaFields.composition = updateDoc.composition;
          if (updateDoc.packingType) metaFields.packingType = updateDoc.packingType;
          Object.keys(metaFields).forEach(k => metaFields[k] === undefined && delete metaFields[k]);

          bulkOps.push({
            updateOne: {
              filter: { itemCode },
              // Aggregation pipeline update: $map over existing sizes, merge only mrp
              update: [{
                $set: {
                  ...metaFields,
                  sizes: {
                    $map: {
                      input: '$sizes',
                      as: 'sv',
                      in: {
                        $let: {
                          vars: {
                            // Find the matching new variant by size name
                            matched: {
                              $first: {
                                $filter: {
                                  input: sizesMrpLookup,
                                  as: 'nl',
                                  cond: { $eq: ['$$nl.size', '$$sv.size'] },
                                },
                              },
                            },
                          },
                          in: {
                            // Merge existing size with ONLY the new mrp (keep sku/barcode/stock untouched)
                            // If size name doesn't match (format diff), fall back to parent MRP from Excel
                            $mergeObjects: [
                              '$$sv',
                              { mrp: { $ifNull: ['$$matched.mrp', updateDoc.mrp] } },
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              }],
            },
          });
        } else {
          // INSERT new items: include full sizes array
          bulkOps.push({ insertOne: { document: updateDoc } });
        }

        results.success.push({ itemCode });
      } catch (error) {
        results.errors.push({ itemCode: data.itemCode, error: error.message });
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 6: Single bulkWrite to DB
    // ══════════════════════════════════════════════════════════════════════════
    const t6 = Date.now();
    try {
      if (bulkOps.length > 0) {
        await Item.bulkWrite(bulkOps, { ordered: false });
      }
    } catch (bulkError) {
      console.error('[BULK] Bulk write error:', bulkError?.message);
      if (bulkError.writeErrors) {
        bulkError.writeErrors.forEach(we => {
          const op = bulkOps[we.index];
          const itemCode = op?.updateOne?.filter?.itemCode || op?.insertOne?.document?.itemCode || 'Unknown';
          results.errors.push({ itemCode, error: we.errmsg || 'DB write error' });
          results.success = results.success.filter(s => s.itemCode !== itemCode);
        });
      } else {
        throw bulkError;
      }
    }

    console.log(`[BULK] Phase6 bulkWrite: ${Date.now() - t6}ms`);
    console.log(`[BULK] Done in ${Date.now() - t0}ms — ${results.success.length} ok, ${results.errors.length} errors`);
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

  async validateBarcodes(rawBarcodes) {
    if (!Array.isArray(rawBarcodes) || rawBarcodes.length === 0) return {};

    // 1. Prepare search tokens and mapping back to original strings
    const barcodeMap = new Map(); // token -> Set of originalBarcodes
    const allTokens = new Set();

    rawBarcodes.forEach(b => {
      const orig = String(b || '').trim();
      if (!orig) return;

      const unpadded = orig.replace(/^0+/, '');
      const candidates = new Set([
        orig,
        orig.toLowerCase(),
        orig.toUpperCase(),
        unpadded,                                  // without leading zeros e.g. "380"
        unpadded ? unpadded.padStart(7, '0') : orig, // zero-padded 7 digits e.g. "0000380"
        unpadded ? unpadded.padStart(6, '0') : orig, // zero-padded 6 digits
        unpadded ? unpadded.padStart(8, '0') : orig  // zero-padded 8 digits
      ]);

      candidates.forEach(token => {
        if (!token) return;
        allTokens.add(token);
        if (!barcodeMap.has(token)) barcodeMap.set(token, new Set());
        barcodeMap.get(token).add(orig);
      });
    });

    const tokenArray = Array.from(allTokens);

    // 2. Query MongoDB for all matching items in one query
    const items = await Item.find({
      $or: [
        { itemCode: { $in: tokenArray } },
        { "sizes.barcode": { $in: tokenArray } },
        { "sizes.sku": { $in: tokenArray } }
      ]
    }).lean();

    // 3. Build resultMap for original input barcodes
    const resultMap = {};

    items.forEach(item => {
      const defaultVariant = item.sizes?.[0] || { _id: item._id, size: 'UNI' };

      const bindMatch = (matchedCode, variantObj) => {
        if (!matchedCode) return;
        const codeStr = String(matchedCode).trim();
        const unpadded = codeStr.replace(/^0+/, '');
        const codeVariants = [
          codeStr,
          codeStr.toLowerCase(),
          codeStr.toUpperCase(),
          unpadded,
          unpadded ? unpadded.padStart(7, '0') : codeStr,
          unpadded ? unpadded.padStart(6, '0') : codeStr
        ];

        codeVariants.forEach(cv => {
          const origSet = barcodeMap.get(cv);
          if (origSet) {
            origSet.forEach(origBarcode => {
              if (!resultMap[origBarcode]) {
                resultMap[origBarcode] = { item, variant: variantObj || defaultVariant };
              }
            });
          }
        });
      };

      if (item.itemCode) bindMatch(item.itemCode, defaultVariant);

      if (item.sizes && Array.isArray(item.sizes)) {
        item.sizes.forEach(sz => {
          if (sz.barcode) bindMatch(sz.barcode, sz);
          if (sz.sku) bindMatch(sz.sku, sz);
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
