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

const ensureSizeBarcodes = async (sizes = []) => {
  for (const entry of sizes) {
    if (!entry.barcode) {
      // Generate a barcode per size variant only when the user did not provide one.
      // This keeps the current master flow stable without forcing a separate barcode UI.
      // eslint-disable-next-line no-await-in-loop
      entry.barcode = await generateBarcode();
    }
  }
};

const populateItem = async (itemId) =>
  Item.findById(itemId).populate('groupIds', 'name groupType level parentId isActive');

class ItemService {
  async createItem(data = {}) {
    const itemCode = normalizeString(data.itemCode).toUpperCase();
    if (!itemCode) {
      throw new Error('itemCode is required');
    }

    const existingItem = await Item.findOne({ itemCode });
    if (existingItem) {
      throw new Error(`Item with code ${itemCode} already exists`);
    }

    const groupIds = normalizeGroupIds(data.groupIds);
    await ensureGroupsExist(groupIds);

    if (data.autoGenerateName || !normalizeString(data.itemName)) {
      data.itemName = await FormulaEngine.generateName({ ...data, itemCode }, data.formulaName || 'primary');
    }

    if (!Array.isArray(data.sizes) || !data.sizes.length) {
      throw new Error('Garment Item must have at least one size pricing');
    }

    await ensureSizeBarcodes(data.sizes);

    const item = new Item({
      ...data,
      itemCode,
      itemName: normalizeString(data.itemName),
      brand: normalizeString(data.brand),
      shade: normalizeString(data.shade),
      description: normalizeString(data.description),
      groupIds,
      session: normalizeString(data.session),
    });

    const savedItem = await item.save();
    return populateItem(savedItem._id);
  }

  async allocateGroup(itemId, groupIds) {
    const item = await Item.findById(itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    const incomingGroupIds = normalizeGroupIds(groupIds);
    await ensureGroupsExist(incomingGroupIds);

    const currentGroupIds = normalizeGroupIds(item.groupIds);
    item.groupIds = [...new Set([...currentGroupIds, ...incomingGroupIds])];
    const savedItem = await item.save();
    return populateItem(savedItem._id);
  }

  async deallocateGroup(itemId, groupIds) {
    const item = await Item.findById(itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    const removeIds = normalizeGroupIds(groupIds);
    const remaining = normalizeGroupIds(item.groupIds).filter((groupId) => !removeIds.includes(groupId));

    if (!remaining.length) {
      throw new Error('Item must belong to at least one Section/Group');
    }

    item.groupIds = remaining;
    const savedItem = await item.save();
    return populateItem(savedItem._id);
  }

  async getAllItems(query = {}) {
    return Item.find(query)
      .populate('groupIds', 'name groupType level parentId isActive')
      .sort({ createdAt: -1 });
  }

  async getItemById(id) {
    return Item.findById(id).populate('groupIds', 'name groupType level parentId isActive');
  }

  async updateItem(id, data = {}) {
    const item = await Item.findById(id);
    if (!item) {
      return null;
    }

    if (data.itemCode !== undefined) {
      const itemCode = normalizeString(data.itemCode).toUpperCase();
      if (!itemCode) {
        throw new Error('itemCode is required');
      }

      const existingItem = await Item.findOne({ itemCode, _id: { $ne: id } });
      if (existingItem) {
        throw new Error(`Item with code ${itemCode} already exists`);
      }

      item.itemCode = itemCode;
    }

    if (data.autoGenerateName) {
      item.itemName = await FormulaEngine.generateName(
        { ...item.toObject(), ...data },
        data.formulaName || item.formulaName || 'primary',
      );
    } else if (data.itemName !== undefined) {
      const nextName = normalizeString(data.itemName);
      if (nextName) {
        item.itemName = nextName;
      }
    }

    if (data.brand !== undefined) item.brand = normalizeString(data.brand);
    if (data.shade !== undefined) item.shade = normalizeString(data.shade);
    if (data.description !== undefined) item.description = normalizeString(data.description);
    if (data.session !== undefined) item.session = normalizeString(data.session);
    if (data.hsCodeId !== undefined) item.hsCodeId = data.hsCodeId || null;
    if (data.gstTax !== undefined) item.gstTax = data.gstTax === '' || data.gstTax === null ? undefined : Number(data.gstTax);
    if (data.vendorId !== undefined) item.vendorId = normalizeString(data.vendorId);
    if (data.customFields !== undefined) item.customFields = data.customFields || {};
    if (data.isActive !== undefined) item.isActive = Boolean(data.isActive);

    if (data.groupIds !== undefined) {
      const groupIds = normalizeGroupIds(data.groupIds);
      await ensureGroupsExist(groupIds);
      item.groupIds = groupIds;
    }

    if (data.attributes !== undefined) {
      item.attributes = data.attributes || {};
    }

    if (data.sizes !== undefined) {
      if (!Array.isArray(data.sizes) || !data.sizes.length) {
        throw new Error('Garment Item must have at least one size pricing');
      }

      await ensureSizeBarcodes(data.sizes);
      item.sizes = data.sizes;
    }

    const savedItem = await item.save();
    return populateItem(savedItem._id);
  }

  async deleteItem(id) {
    return Item.findByIdAndDelete(id);
  }
}

module.exports = new ItemService();
