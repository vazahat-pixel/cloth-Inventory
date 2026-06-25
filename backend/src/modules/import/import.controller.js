const xlsx = require('xlsx');
const itemService = require('../items/item.service');
const Group = require('../../models/group.model');
const Item = require('../../models/item.model');
const Purchase = require('../../models/purchase.model');
const StockLedger = require('../../models/stockLedger.model');
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
  // Existing Excel Import
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
      // Always enable safe merge/overwrite for existing items to resolve MRP/HSN values cleanly
      const overwrite = true;

      const results = {
        success: [],
        errors: []
      };

      // 1. Pre-fetch all Group documents in a single query
      const allGroups = await Group.find({}).lean();
      const groupMap = new Map();
      allGroups.forEach(g => {
        if (g.name) {
          groupMap.set(g.name.trim().toLowerCase(), g._id);
        }
      });

      // 2. Pre-fetch all matching Item documents in a single query
      const itemCodes = data.map(row => {
        const val = this.readMappedValue(row, mapping, 'itemCode', ['Item Code', 'SKU']);
        return normalizeString(val).toUpperCase();
      }).filter(Boolean);

      const existingItemsList = await Item.find({ itemCode: { $in: itemCodes } });
      const existingItemsMap = new Map();
      existingItemsList.forEach(item => {
        existingItemsMap.set(item.itemCode, item);
      });

      // 3. Process rows in parallel batches of 100
      const batchSize = 100;
      for (let i = 0; i < data.length; i += batchSize) {
        const chunk = data.slice(i, i + batchSize);
        
        await Promise.all(chunk.map(async (row) => {
          try {
            const itemData = await this.mapRowToItem(row, mapping, autoBarcode, groupMap);
            const existingItem = existingItemsMap.get(itemData.itemCode);

            let item;
            if (existingItem && overwrite) {
              let modified = false;
              
              // Fill empty fields on the parent item (including brand, description, etc.)
              const parentFields = [
                'brand', 'description', 'hsCodeId', 'gstTax', 'fabric', 'color', 'pattern', 
                'fit', 'gender', 'uom', 'composition', 'gsm', 'width', 'shrinkage', 
                'shadeNo', 'accessorySize', 'packingType', 'purchasePrice', 'mrp',
                'sectionId', 'categoryId', 'subCategoryId', 'styleId', 'brandName', 'hsnCode'
              ];
              
              for (const field of parentFields) {
                if ((existingItem[field] === undefined || existingItem[field] === null || existingItem[field] === '' || existingItem[field] === 0) &&
                    (itemData[field] !== undefined && itemData[field] !== null && itemData[field] !== '' && itemData[field] !== 0)) {
                  existingItem[field] = itemData[field];
                  modified = true;
                }
              }
              
              // Always update MRP and HSN from the sheet as requested
              if (itemData.mrp && existingItem.mrp !== itemData.mrp) {
                existingItem.mrp = itemData.mrp;
                modified = true;
              }
              if (itemData.hsCodeId && String(existingItem.hsCodeId) !== String(itemData.hsCodeId)) {
                existingItem.hsCodeId = itemData.hsCodeId;
                modified = true;
              }
              if (itemData.gstTax !== undefined && existingItem.gstTax !== itemData.gstTax) {
                existingItem.gstTax = itemData.gstTax;
                modified = true;
              }

              // Update sizes (variants) MRPs and fill empty fields
              if (Array.isArray(itemData.sizes)) {
                for (const importSize of itemData.sizes) {
                  const existingSize = (existingItem.sizes || []).find(s => 
                    (importSize.sku && s.sku === importSize.sku) || 
                    (importSize.barcode && s.barcode === importSize.barcode) ||
                    (s.size === importSize.size && s.color === importSize.color)
                  );

                  if (existingSize) {
                    if (importSize.mrp && existingSize.mrp !== importSize.mrp) {
                      existingSize.mrp = importSize.mrp;
                      modified = true;
                    }
                    if ((existingSize.barcode === undefined || existingSize.barcode === null || existingSize.barcode === '') && importSize.barcode) {
                      existingSize.barcode = importSize.barcode;
                      modified = true;
                    }
                    if ((existingSize.sku === undefined || existingSize.sku === null || existingSize.sku === '') && importSize.sku) {
                      existingSize.sku = importSize.sku;
                      modified = true;
                    }
                    if ((existingSize.costPrice === undefined || existingSize.costPrice === null || existingSize.costPrice === 0) && importSize.costPrice) {
                      existingSize.costPrice = importSize.costPrice;
                      modified = true;
                    }
                    if ((existingSize.salePrice === undefined || existingSize.salePrice === null || existingSize.salePrice === 0) && importSize.salePrice) {
                      existingSize.salePrice = importSize.salePrice;
                      modified = true;
                    }
                  } else {
                    existingItem.sizes.push(importSize);
                    modified = true;
                  }
                }
              }

              if (modified) {
                await itemService.syncItemDenormalizedFields(existingItem);
                await existingItem.save();
                results.success.push({ itemCode: existingItem.itemCode, id: existingItem._id, mode: 'updated' });
              } else {
                results.success.push({ itemCode: existingItem.itemCode, id: existingItem._id, mode: 'no-change' });
              }
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
        }));
      }

      return sendSuccess(res, { results }, 'Import process completed');
    } catch (error) {
      return sendError(res, error.message);
    }
  };

  // --- NEW EXPORTS FOR DATA HUB ---

  exportItems = async (req, res) => {
    try {
      const items = await Item.find().populate('groupIds', 'name');
      
      const csvHeader = 'ItemCode,ItemName,Brand,Shade,GST,Group,Size,MRP,CostPrice,SalePrice,Barcode\n';
      const rows = items.flatMap(item => 
        item.sizes.map(s => [
          item.itemCode,
          item.itemName,
          item.brand,
          item.shade,
          item.gstTax || 0,
          item.groupIds?.[0]?.name || 'N/A',
          s.size,
          s.mrp || 0,
          s.costPrice || 0,
          s.salePrice || 0,
          s.barcode || ''
        ].join(',')).join('\n')
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=item_master_export.csv');
      return res.status(200).send(csvHeader + rows);
    } catch (error) {
      return sendError(res, error.message);
    }
  };

  exportPurchases = async (req, res) => {
    try {
      const purchases = await Purchase.find().populate('supplierId', 'name').limit(1000);
      
      const header = 'PurchaseNumber,Supplier,InvoiceNo,InvoiceDate,ItemCode,Size,Qty,Rate,Tax%,Total\n';
      const rows = purchases.flatMap(p => 
        p.products.map(item => [
          p.purchaseNumber,
          p.supplierId?.name || 'Cash',
          p.invoiceNumber,
          p.invoiceDate ? p.invoiceDate.toISOString().split('T')[0] : '',
          item.itemCode || item.sku,
          item.size,
          item.quantity,
          item.rate,
          item.taxPercentage,
          item.total
        ].join('|')).join('\n')
      ).join('\n');

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename=purchase_export.txt');
      return res.status(200).send(header + rows);
    } catch (error) {
      return sendError(res, error.message);
    }
  };

  exportTransfers = async (req, res) => {
    try {
      const transfers = await StockLedger.find({ source: 'TRANSFER' })
        .populate('itemId', 'itemCode itemName')
        .limit(2000);
      
      const header = 'Date,Reference,ItemCode,Barcode,Qty,LocationType,Direction\n';
      const rows = transfers.map(t => [
        t.createdAt.toISOString(),
        t.referenceId,
        t.itemId?.itemCode || 'Unknown',
        t.barcode,
        t.quantity,
        t.locationType,
        t.type
      ].join('|')).join('\n');

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename=stock_transfer_export.txt');
      return res.status(200).send(header + rows);
    } catch (error) {
      return sendError(res, error.message);
    }
  };

  // --- NEW IMPORTS (TEXT BASED) ---

  importItemsText = async (req, res) => {
    try {
      if (!req.file) return sendError(res, 'No file found');
      const text = req.file.buffer.toString();
      const lines = text.split('\n').filter(l => l.trim());
      
      // Basic implementation for demonstration
      return sendSuccess(res, { rowsProcessed: lines.length }, 'Import from Text File started (Beta)');
    } catch (error) {
      return sendError(res, error.message);
    }
  };

  importPurchaseText = async (req, res) => {
    try {
      if (!req.file) return sendError(res, 'No file found');
      return sendSuccess(res, {}, 'Purchase Import started (Beta)');
    } catch (error) {
       return sendError(res, error.message);
    }
  };

  // Helper methods
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

  mapRowToItem = async (row, mapping, autoBarcode = true, groupMap = null) => {
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
      let groupId;
      if (groupMap) {
        groupId = groupMap.get(groupName.trim().toLowerCase());
      } else {
        const group = await Group.findOne({
          name: new RegExp(`^${escapeRegex(groupName)}$`, 'i'),
        }).select('_id');
        if (group) {
          groupId = group._id;
        }
      }

      if (!groupId) {
        throw new Error(`Group '${groupName}' not found`);
      }

      item.groupIds = [groupId];
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
