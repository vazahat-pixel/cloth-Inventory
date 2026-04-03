const Warehouse = require('../../models/warehouse.model');

const generateWarehouseCode = async () => {
    const lastWarehouse = await Warehouse.findOne({}, { code: 1 }).sort({ code: -1 });

    let nextNum = 1;
    if (lastWarehouse && lastWarehouse.code) {
        const currentNum = parseInt(lastWarehouse.code.split('-')[1]);
        if (!isNaN(currentNum)) {
            nextNum = currentNum + 1;
        }
    }

    return `WH-${nextNum.toString().padStart(3, '0')}`;
};

const createWarehouse = async (warehouseData, userId) => {
    const existing = await Warehouse.findOne({ name: warehouseData.name, isDeleted: false });
    if (existing) {
        throw new Error('A warehouse with this name already exists');
    }

    const count = await Warehouse.countDocuments({ isDeleted: false });
    if (count > 0) {
        throw new Error('System restricts to only ONE active warehouse (Head Office) at the moment!');
    }

    const code = await generateWarehouseCode();

    const warehouse = new Warehouse({
        ...warehouseData,
        code,
        createdBy: userId
    });

    return await warehouse.save();
};

const getAllWarehouses = async (query, user) => {
    const { page = 1, limit = 10, search, city, state, isActive } = query;

    const filter = { isDeleted: false };

    // Enforce store scoping for store staff
    if (user && user.role === 'store_staff') {
        // Warehouse masters are normally only for admin.
        // If a store staff asks, they get NOTHING or only their linked store (if it was a warehouse, which it isn't here).
        // Since the user wants to HIDE other locations, we just return empty for warehouses.
        return { warehouses: [], total: 0, page: parseInt(page), limit: parseInt(limit) };
    }

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { code: { $regex: search, $options: 'i' } }
        ];
    }

    if (city) filter['location.city'] = city;
    if (state) filter['location.state'] = state;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (page - 1) * limit;

    const [warehouses, total] = await Promise.all([
        Warehouse.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('createdBy', 'name email'),
        Warehouse.countDocuments(filter)
    ]);

    return { warehouses, total, page: parseInt(page), limit: parseInt(limit) };
};

const getWarehouseById = async (id) => {
    const warehouse = await Warehouse.findOne({ _id: id, isDeleted: false }).populate('createdBy', 'name email');
    if (!warehouse) throw new Error('Warehouse not found');
    return warehouse;
};

const updateWarehouse = async (id, updateData) => {
    const warehouse = await Warehouse.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: updateData },
        { new: true, runValidators: true }
    );
    if (!warehouse) throw new Error('Warehouse not found or update failed');
    return warehouse;
};

const toggleWarehouseStatus = async (id, status) => {
    const warehouse = await Warehouse.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { isActive: status } },
        { new: true }
    );
    if (!warehouse) throw new Error('Warehouse not found');
    return warehouse;
};

const deleteWarehouse = async (id) => {
    const warehouse = await Warehouse.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { isDeleted: true, isActive: false } },
        { new: true }
    );
    if (!warehouse) throw new Error('Warehouse not found or already deleted');
    return warehouse;
};

const getPrimaryWarehouse = async () => {
    const warehouse = await Warehouse.findOne({ isDeleted: false });
    if (!warehouse) throw new Error('No active warehouse found');
    return warehouse;
};

module.exports = {
    createWarehouse,
    getAllWarehouses,
    getWarehouseById,
    getPrimaryWarehouse,
    updateWarehouse,
    toggleWarehouseStatus,
    deleteWarehouse
};
