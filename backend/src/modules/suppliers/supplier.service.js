const Supplier = require('../../models/supplier.model');

/**
 * Create a new supplier
 */
const createSupplier = async (supplierData, userId) => {
    const existing = await Supplier.findOne({ name: supplierData.name, isDeleted: false });
    if (existing) {
        throw new Error('A supplier with this name already exists');
    }

    const supplier = new Supplier({
        ...supplierData,
        createdBy: userId
    });

    return await supplier.save();
};

/**
 * Get all suppliers with pagination and search
 */
const getAllSuppliers = async (query) => {
    const { page = 1, limit = 10, search, isActive } = query;

    const filter = { isDeleted: false };

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { contactPerson: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (page - 1) * limit;

    const [suppliers, total] = await Promise.all([
        Supplier.find(filter)
            .sort({ name: 1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('createdBy', 'name email'),
        Supplier.countDocuments(filter)
    ]);

    return { suppliers, total, page: parseInt(page), limit: parseInt(limit) };
};

/**
 * Get single supplier by ID
 */
const getSupplierById = async (id) => {
    const supplier = await Supplier.findOne({ _id: id, isDeleted: false }).populate('createdBy', 'name email');
    if (!supplier) {
        throw new Error('Supplier not found');
    }
    return supplier;
};

/**
 * Update supplier details
 */
const updateSupplier = async (id, updateData) => {
    const supplier = await Supplier.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: updateData },
        { new: true, runValidators: true }
    );

    if (!supplier) {
        throw new Error('Supplier not found');
    }

    return supplier;
};

/**
 * Soft delete supplier
 */
const deleteSupplier = async (id) => {
    const supplier = await Supplier.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { isDeleted: true, isActive: false } },
        { new: true }
    );

    if (!supplier) {
        throw new Error('Supplier not found or already deleted');
    }

    return supplier;
};

module.exports = {
    createSupplier,
    getAllSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier
};
