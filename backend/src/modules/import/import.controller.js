const xlsx = require('xlsx');
const itemService = require('../items/item.service');
const Group = require('../../models/group.model');
const Item = require('../../models/item.model');
const { sendSuccess, sendError } = require('../../utils/response.handler');

const normalizeString = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
};

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  return ['true', '1', 'yes', 'y', 'on'].includes(String(value).trim().toLowerCase());
};

const normalizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class ImportController {
  importItems = async (req, res) => {
    try {
      if (!req.file) {
        return sendError(res, 'No file uploaded', 400);
      }

      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      const mapping = JSON.parse(req.body.mapping || '{}');
      const autoBarcode = parseBoolean(req.body.autoBarcode, true);
      const overwrite = parseBoolean(req.body.overwrite, false);

      const results = {
        success: [],
        errors: []
      };

      for (const row of data) {
        try {
          const itemData = await this.mapRowToItem(row, mapping, autoBarcode);
          const existingItem = await Item.findOne({ itemCode: itemData.itemCode });

          let item;
          if (existingItem && overwrite) {
            item = await itemService.updateItem(existingItem._id, itemData);
            results.success.push({ itemCode: item.itemCode, id: item._id, mode: 'updated' });
          } else {
            if (existingItem) {
              throw new Error(`Item '${itemData.itemCode}' already exists`);
            }

            item = await itemService.createItem(itemData);
            results.success.push({ itemCode: item.itemCode, id: item._id, mode: 'created' });
          }
        } catch (error) {
          results.errors.push({ row, error: error.message });
        }
      }

      return sendSuccess(res, { results }, 'Import process completed');
    } catch (error) {
      return sendError(res, error.message);
    }
  };

  findMappedHeader = (mapping, field) =>
    Object.keys(mapping || {}).find((header) => mapping[header] === field);

  readMappedValue = (row, mapping, field, fallbacks = []) => {
    const mappedHeader = this.findMappedHeader(mapping, field);
    const headers = [mappedHeader, ...fallbacks];

    for (const header of headers) {
      if (!header) {
        continue;
      }

      const value = row[header];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return value;
      }
    }

    return undefined;
  };

  mapRowToItem = async (row, mapping, autoBarcode = true) => {
    const item = {
      itemCode: normalizeString(this.readMappedValue(row, mapping, 'itemCode', ['Item Code', 'SKU'])).toUpperCase(),
      itemName: normalizeString(this.readMappedValue(row, mapping, 'itemName', ['Item Name', 'Name', 'Product Name'])),
      brand: normalizeString(this.readMappedValue(row, mapping, 'brand', ['Brand', 'Brand Name'])),
      shade: normalizeString(this.readMappedValue(row, mapping, 'shade', ['Shade'])),
      description: normalizeString(this.readMappedValue(row, mapping, 'description', ['Description'])),
      hsCodeId: normalizeString(this.readMappedValue(row, mapping, 'hsCodeId', ['HS Code', 'HSN Code'])),
      gstTax: normalizeNumber(this.readMappedValue(row, mapping, 'gstTax', ['GST']), 0),
      vendorId: normalizeString(this.readMappedValue(row, mapping, 'vendorId', ['Vendor'])),
      session: normalizeString(this.readMappedValue(row, mapping, 'session', ['Session'])),
      attributes: {},
      sizes: [],
      autoGenerateName: false,
      formulaName: normalizeString(this.readMappedValue(row, mapping, 'formulaName', ['Formula'])) || 'primary',
      isActive: true,
    };

    item.autoGenerateName = !item.itemName;

    const sizeLabel = normalizeString(this.readMappedValue(row, mapping, 'size', ['Size'])) || 'FREE';
    const costPrice = normalizeNumber(this.readMappedValue(row, mapping, 'costPrice', ['Cost Rate', 'Basic Rate']), 0);
    const salePrice = normalizeNumber(this.readMappedValue(row, mapping, 'salePrice', ['Sale Rate', 'Selling Rate']), 0);
    const mrp = normalizeNumber(this.readMappedValue(row, mapping, 'mrp', ['MRP']), 0);
    const barcode = normalizeString(this.readMappedValue(row, mapping, 'barcode', ['Barcode']));

    if (sizeLabel || costPrice || salePrice || mrp || barcode) {
      item.sizes.push({
        size: sizeLabel,
        barcode: barcode || undefined,
        costPrice,
        salePrice,
        mrp
      });
    }

    for (const [rowKey, itemKey] of Object.entries(mapping || {})) {
      if (typeof itemKey === 'string' && itemKey.startsWith('attributes.')) {
        const attrKey = itemKey.split('.').slice(1).join('.');
        if (attrKey) {
          item.attributes[attrKey] = row[rowKey];
        }
      }
    }

    const groupName = normalizeString(this.readMappedValue(row, mapping, 'groupName', ['Group', 'Target Group']));
    if (groupName) {
      const group = await Group.findOne({
        name: new RegExp(`^${escapeRegex(groupName)}$`, 'i'),
      }).select('_id');

      if (!group) {
        throw new Error(`Group '${groupName}' not found`);
      }

      item.groupIds = [group._id];
    }

    if (!item.groupIds || !item.groupIds.length) {
      throw new Error('Target group is required for item import');
    }

    if (!item.sizes.length) {
      throw new Error('At least one size row is required');
    }

    if (!item.itemCode) {
      throw new Error('Item Code is required');
    }

    if (!item.brand) {
      throw new Error('Brand is required');
    }

    if (autoBarcode) {
      item.sizes = item.sizes.map((sizeRow) => ({
        ...sizeRow,
        barcode: sizeRow.barcode || undefined,
      }));
    }

    return item;
  };
}

module.exports = new ImportController();
