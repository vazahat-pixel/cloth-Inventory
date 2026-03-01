const mongoose = require('mongoose');
const ProductionBatch = require('../../models/productionBatch.model');
const Fabric = require('../../models/fabric.model');
const Product = require('../../models/product.model');
const productService = require('../products/product.service');
const { ProductionStatus, ProductionStage } = require('../../core/enums');
const { withTransaction } = require('../../services/transaction.service');

/**
 * Generate Next Batch Number (PB-2025-0001 format)
 */
const generateBatchNumber = async () => {
    const year = new Date().getFullYear();
    const prefix = `PB-${year}-`;

    const lastBatch = await ProductionBatch.findOne(
        { batchNumber: new RegExp(`^${prefix}`) },
        { batchNumber: 1 }
    ).sort({ batchNumber: -1 });

    let nextNum = 1;
    if (lastBatch && lastBatch.batchNumber) {
        const parts = lastBatch.batchNumber.split('-');
        const lastNum = parseInt(parts[2]);
        if (!isNaN(lastNum)) {
            nextNum = lastNum + 1;
        }
    }

    return `${prefix}${nextNum.toString().padStart(4, '0')}`;
};

/**
 * Create a new production batch
 */
const createBatch = async (batchData, userId) => {
    return await withTransaction(async (session) => {
        const { fabricId, productId, meterUsed, sizeBreakdown } = batchData;

        // 1. Validate Fabric
        const fabric = await Fabric.findOne({ _id: fabricId, isDeleted: false }).session(session);
        if (!fabric) throw new Error('Fabric not found');
        if (!fabric.isActive) throw new Error('Fabric is inactive');
        if (fabric.status === 'CONSUMED') throw new Error('Fabric is already fully consumed');

        if (fabric.meterAvailable < meterUsed) {
            throw new Error(`Insufficient fabric. Available: ${fabric.meterAvailable}m, Requested: ${meterUsed}m`);
        }

        // 2. Reduce Fabric Stock
        fabric.meterAvailable -= meterUsed;
        if (fabric.meterAvailable <= 0) {
            fabric.status = 'CONSUMED';
        }
        await fabric.save({ session });

        // 3. Generate Batch Number
        const batchNumber = await generateBatchNumber();

        // 4. Create Batch
        const batch = new ProductionBatch({
            ...batchData,
            batchNumber,
            createdBy: userId
        });

        // totalPieces is calculated in pre-save hook
        return await batch.save({ session });
    });
};

/**
 * Update Production Stage
 */
const updateStage = async (id, stage, productMetadata = {}) => {
    return await withTransaction(async (session) => {
        const batch = await ProductionBatch.findOne({ _id: id, isDeleted: false }).session(session);
        if (!batch) throw new Error('Production batch not found');
        if (batch.status === ProductionStatus.COMPLETED) throw new Error('Cannot update stage of a completed batch');

        const oldStage = batch.stage;
        batch.stage = stage;

        // Logic when stage becomes READY
        if (stage === ProductionStage.READY && oldStage !== ProductionStage.READY) {
            // Create finished products using Product Service
            await productService.createProductsFromBatch(batch, productMetadata, session);
            batch.status = ProductionStatus.COMPLETED;
        }

        return await batch.save({ session });
    });
};

/**
 * Get all batches with pagination
 */
const getAllBatches = async (query) => {
    const { page = 1, limit = 10, stage, status } = query;
    const filter = { isDeleted: false };

    if (stage) filter.stage = stage;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [batches, total] = await Promise.all([
        ProductionBatch.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('fabricId', 'fabricType color invoiceNumber')
            .populate('createdBy', 'name'),
        ProductionBatch.countDocuments(filter)
    ]);

    return { batches, total, page: parseInt(page), limit: parseInt(limit) };
};

const getBatchById = async (id) => {
    const batch = await ProductionBatch.findOne({ _id: id, isDeleted: false })
        .populate('fabricId')
        .populate('createdBy', 'name');
    if (!batch) throw new Error('Batch not found');
    return batch;
};

const deleteBatch = async (id) => {
    const batch = await ProductionBatch.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { isDeleted: true } },
        { new: true }
    );
    if (!batch) throw new Error('Batch not found');
    return batch;
};

module.exports = {
    createBatch,
    updateStage,
    getAllBatches,
    getBatchById,
    deleteBatch
};
