const Product = require('../../models/product.model');
const StockMovement = require('../../models/stockMovement.model');
const WarehouseInventory = require('../../models/warehouseInventory.model');
const { StockMovementType } = require('../../core/enums');
const { withTransaction } = require('../../services/transaction.service');

/**
 * Generate unique SKU (SKU-2025-00001)
 */
const generateSKU = async (session = null) => {
    const year = new Date().getFullYear();
    const prefix = `SKU-${year}-`;

    const lastProduct = await Product.findOne(
        { sku: new RegExp(`^${prefix}`) },
        { sku: 1 }
    ).sort({ sku: -1 }).session(session);

    let nextNum = 1;
    if (lastProduct && lastProduct.sku) {
        const parts = lastProduct.sku.split('-');
        const lastNum = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastNum)) {
            nextNum = lastNum + 1;
        }
    }

    return `${prefix}${nextNum.toString().padStart(5, '0')}`;
};

const barcodeService = require('./barcode.service');

const normalizeGroupIds = (category, groupIds = []) => {
    const ids = [category, ...(Array.isArray(groupIds) ? groupIds : [groupIds])]
        .filter(Boolean)
        .map((value) => String(value));
    return [...new Set(ids)];
};

const normalizeAttributes = (attributes) => {
    if (!attributes) {
        return {};
    }

    if (Array.isArray(attributes)) {
        return attributes.reduce((accumulator, entry) => {
            const key = String(entry?.key || entry?.name || '').trim();
            if (!key) {
                return accumulator;
            }

            accumulator[key] = entry?.value ?? '';
            return accumulator;
        }, {});
    }

    if (typeof attributes === 'object') {
        return { ...attributes };
    }

    return {};
};

const generateVariantSku = (styleCode, size, color) => {
    const sanitize = (value, fallback) => {
        const normalized = String(value || '')
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '');

        return normalized || fallback;
    };

    return `${sanitize(styleCode, 'STYLE')}-${sanitize(size, 'SIZE')}-${sanitize(color, 'COLOR')}`;
};

/**
 * Generate unique numeric barcode
 */
const generateBarcode = async (session = null) => {
    return await barcodeService.generateBarcode();
};

/**
 * Create products from a production batch (Transaction)
 */
const createProductsFromBatch = async (batch, metadata, session) => {
    const { name, category, brand, costPrice, salePrice } = metadata;
    const styleCode = String(metadata.styleCode || metadata.sku || metadata.batchNumber || name || '').trim().toUpperCase() || await generateSKU(session);
    const groupIds = normalizeGroupIds(category, metadata.groupIds);
    const attributes = normalizeAttributes(metadata.attributes);
    const createdProducts = [];

    for (const item of batch.sizeBreakdown) {
        const sku = item.sku || generateVariantSku(styleCode, item.size, metadata.color);
        const barcode = await generateBarcode(session);

        const product = new Product({
            name,
            sku,
            styleCode,
            barcode,
            batchId: batch._id,
            size: item.size,
            color: metadata.color || null,
            category,
            groupIds,
            brand,
            costPrice,
            salePrice,
            factoryStock: item.quantity,
            attributes,
            createdBy: batch.createdBy,
            isActive: true
        });

        await product.save({ session });

        // Record stock movement for the finished batch output
        await StockMovement.create([{
            productId: product._id,
            variantId: product._id,
            qty: item.quantity,
            type: StockMovementType.ADJUSTMENT,
            referenceId: batch._id,
            referenceType: 'ProductionBatch',
            notes: `Initial stock from Production Batch ${batch.batchNumber}`,
            performedBy: batch.createdBy
        }], { session });

        createdProducts.push(product);
    }

    return createdProducts;
};

/**
 * Get all products
 */
const getAllProducts = async (query) => {
    const { page = 1, limit = 10, search, category, size, isActive } = query;

    const filter = { isDeleted: false };

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { sku: { $regex: search, $options: 'i' } },
            { barcode: { $regex: search, $options: 'i' } }
        ];
    }

    if (category) filter.category = category;
    if (size) filter.size = size;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
        Product.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('batchId', 'batchNumber'),
        Product.countDocuments(filter)
    ]);

    return { products, total, page: parseInt(page), limit: parseInt(limit) };
};

/**
 * Get product by barcode
 */
const getProductByBarcode = async (barcode) => {
    const product = await Product.findOne({ barcode, isDeleted: false }).populate('batchId', 'batchNumber');
    if (!product) throw new Error('Product not found with this barcode');
    return product;
};

/**
 * Get product by ID
 */
const getProductById = async (id) => {
    const product = await Product.findOne({ _id: id, isDeleted: false }).populate('batchId', 'batchNumber');
    if (!product) throw new Error('Product not found');
    return product;
};

/**
 * Update product
 */
const updateProduct = async (id, updateData) => {
    const normalizedUpdateData = { ...updateData };

    if (normalizedUpdateData.sku) {
        normalizedUpdateData.sku = String(normalizedUpdateData.sku).trim().toUpperCase();
    }
    if (normalizedUpdateData.styleCode || normalizedUpdateData.sku) {
        normalizedUpdateData.styleCode = String(normalizedUpdateData.styleCode || normalizedUpdateData.sku).trim().toUpperCase();
    }
    if (normalizedUpdateData.attributes !== undefined) {
        normalizedUpdateData.attributes = normalizeAttributes(normalizedUpdateData.attributes);
    }
    if (normalizedUpdateData.category || normalizedUpdateData.groupIds) {
        normalizedUpdateData.groupIds = normalizeGroupIds(normalizedUpdateData.category, normalizedUpdateData.groupIds);
    }

    const product = await Product.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: normalizedUpdateData },
        { new: true, runValidators: true }
    );
    if (!product) throw new Error('Product not found');
    return product;
};

/**
 * Toggle product status
 */
const toggleStatus = async (id, isActive) => {
    const product = await Product.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { isActive } },
        { new: true }
    );
    if (!product) throw new Error('Product not found');
    return product;
};

/**
 * Delete product (soft)
 */
const deleteProduct = async (id) => {
    const product = await Product.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { isDeleted: true, isActive: false } },
        { new: true }
    );
    if (!product) throw new Error('Product not found');
    return product;
};

/**
 * Create a product (or multiple variants) manually
 */
const createProduct = async (data, userId) => {
    return await withTransaction(async (session) => {
        const { variants, ...parentData } = data;
        const styleCode = String(parentData.sku || parentData.styleCode || '').trim().toUpperCase() || await generateSKU(session);
        const groupIds = normalizeGroupIds(parentData.category, parentData.groupIds);
        const attributes = normalizeAttributes(parentData.attributes);

        // If no variants array is provided, create a single product document
        if (!variants || !Array.isArray(variants) || variants.length === 0) {
            parentData.sku = styleCode;
            parentData.styleCode = styleCode;
            if (!parentData.barcode) parentData.barcode = await generateBarcode(session);

            const product = new Product({
                ...parentData,
                groupIds,
                attributes,
                createdBy: userId,
                isActive: true
            });

            await product.save({ session });

            if (product.factoryStock > 0) {
                await StockMovement.create([{
                    variantId: product._id,
                    qty: product.factoryStock,
                    type: StockMovementType.ADJUSTMENT,
                    referenceId: product._id,
                    referenceType: 'Adjustment',
                    notes: 'Manual initial stock entry',
                    performedBy: userId
                }], { session });
            }
            return product;
        }

        // Handle variants: create one document per variant
        const createdProducts = [];
        for (const variant of variants) {
            const sku = variant.sku || generateVariantSku(styleCode, variant.size, variant.color);
            const barcode = variant.barcode || await generateBarcode(session);
            const variantGroupIds = normalizeGroupIds(parentData.category, variant.groupIds || groupIds);

            const product = new Product({
                ...parentData,
                ...variant,
                sku,
                styleCode,
                groupIds: variantGroupIds,
                attributes,
                barcode,
                createdBy: userId,
                isActive: parentData.status !== 'Inactive'
            });

            await product.save({ session });

            const initialStock = Number(variant.stock || variant.factoryStock || 0);
            if (initialStock > 0) {
                await StockMovement.create([{
                    variantId: product._id,
                    qty: initialStock,
                    type: StockMovementType.ADJUSTMENT,
                    referenceId: product._id,
                    referenceType: 'Adjustment',
                    notes: `Manual initial stock entry for variant ${variant.size}/${variant.color}`,
                    performedBy: userId
                }], { session });
            }
            createdProducts.push(product);
        }

        return createdProducts;
    });
};

/**
 * Bulk import products & optionally initialize stock
 */
const bulkImportProducts = async (productsData, warehouseId, userId) => {
    return await withTransaction(async (session) => {
        const createdProducts = [];
        let totalStockAdded = 0;

        for (const pd of productsData) {
            // Validate essential fields
            if (!pd.name || !pd.salePrice || !pd.size) {
                throw new Error('Name, salePrice, and size are required for all grouped imported products.');
            }

            const styleCode = String(pd.styleCode || pd.sku || '').trim().toUpperCase() || await generateSKU(session);
            const sku = pd.sku || generateVariantSku(styleCode, pd.size, pd.color);
            const barcode = pd.barcode || await generateBarcode(session);
            const groupIds = normalizeGroupIds(pd.category, pd.groupIds);

            const product = new Product({
                ...pd,
                sku,
                styleCode,
                groupIds,
                attributes: normalizeAttributes(pd.attributes),
                barcode,
                createdBy: userId,
                isActive: true
            });

            await product.save({ session });
            createdProducts.push(product);

            // Handle bulk stock initialization if warehouseId is valid and factoryStock > 0
            if (warehouseId && pd.factoryStock > 0) {
                const stockQty = Number(pd.factoryStock);

                await WarehouseInventory.findOneAndUpdate(
                    { warehouseId, productId: product._id },
                    { $inc: { quantity: stockQty } },
                    { session, upsert: true, new: true }
                );

                await StockMovement.create([{
                    variantId: product._id,
                    qty: stockQty,
                    type: StockMovementType.ADJUSTMENT,
                    referenceId: product._id,
                    referenceType: 'Adjustment',
                    notes: 'Excel Bulk Import initialization',
                    performedBy: userId
                }], { session });

                totalStockAdded += stockQty;
            }
        }

        return {
            importedCount: createdProducts.length,
            totalStockAdded
        };
    });
};

module.exports = {
    generateSKU,
    generateBarcode,
    createProductsFromBatch,
    getAllProducts,
    getProductByBarcode,
    getProductById,
    updateProduct,
    toggleStatus,
    deleteProduct,
    createProduct,
    bulkImportProducts
};
