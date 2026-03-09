const Product = require('../../models/product.model');
const StockHistory = require('../../models/stockHistory.model');
const WarehouseInventory = require('../../models/warehouseInventory.model');
const { StockHistoryType } = require('../../core/enums');
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
    const createdProducts = [];

    for (const item of batch.sizeBreakdown) {
        const sku = await generateSKU(session);
        const barcode = await generateBarcode(session);

        const product = new Product({
            name,
            sku,
            barcode,
            batchId: batch._id,
            size: item.size,
            color: metadata.color || null,
            category,
            brand,
            costPrice,
            salePrice,
            factoryStock: item.quantity,
            createdBy: batch.createdBy,
            isActive: true
        });

        await product.save({ session });

        // Record stock history
        await StockHistory.create([{
            productId: product._id,
            type: StockHistoryType.IN,
            quantityBefore: 0,
            quantityChange: item.quantity,
            quantityAfter: item.quantity,
            referenceId: batch._id,
            referenceModel: 'ProductionBatch',
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
    const product = await Product.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: updateData },
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
 * Create a product manually
 */
const createProduct = async (productData, userId) => {
    return await withTransaction(async (session) => {
        if (!productData.sku) productData.sku = await generateSKU(session);
        if (!productData.barcode) productData.barcode = await generateBarcode(session);

        const product = new Product({
            ...productData,
            createdBy: userId,
            isActive: true
        });

        await product.save({ session });

        // Record stock history
        if (product.factoryStock > 0) {
            await StockHistory.create([{
                productId: product._id,
                type: StockHistoryType.IN,
                quantityBefore: 0,
                quantityChange: product.factoryStock,
                quantityAfter: product.factoryStock,
                notes: 'Manual initial stock entry',
                performedBy: userId
            }], { session });
        }

        return product;
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

            const sku = pd.sku || await generateSKU(session);
            const barcode = pd.barcode || await generateBarcode(session);

            const product = new Product({
                ...pd,
                sku,
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

                await StockHistory.create([{
                    productId: product._id,
                    type: StockHistoryType.IN,
                    quantityBefore: 0,
                    quantityChange: stockQty,
                    quantityAfter: stockQty,
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
