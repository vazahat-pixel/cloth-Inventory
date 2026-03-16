const Store = require('../../models/store.model');
const User = require('../../models/user.model');

/**
 * Generate next Store Code (STR-001 format)
 */
const generateStoreCode = async () => {
    const lastStore = await Store.findOne({}, { storeCode: 1 }).sort({ storeCode: -1 });

    let nextNum = 1;
    if (lastStore && lastStore.storeCode) {
        const currentNum = parseInt(lastStore.storeCode.split('-')[1]);
        if (!isNaN(currentNum)) {
            nextNum = currentNum + 1;
        }
    }

    return `STR-${nextNum.toString().padStart(3, '0')}`;
};

/**
 * Create a new store
 */
const createStore = async (storeData, userId) => {
    // Check for duplicate name (active or inactive, but not deleted)
    const existing = await Store.findOne({ name: storeData.name, isDeleted: false });
    if (existing) {
        throw new Error('A store with this name already exists');
    }

    const storeCode = await generateStoreCode();

    const store = new Store({
        ...storeData,
        storeCode,
        createdBy: userId
    });

    const savedStore = await store.save();

    // Automatically create a manager user for this store if email is provided
    if (storeData.email) {
        const userExists = await User.findOne({ email: storeData.email.toLowerCase() });
        if (!userExists) {
            await User.create({
                name: storeData.managerName || storeData.name,
                email: storeData.email.toLowerCase(),
                passwordHash: storeData.password || 'Store@123',
                role: 'store_staff',
                shopId: savedStore._id,
                shopName: savedStore.name,
                mobile: storeData.managerPhone
            });
        }
    }

    return savedStore;
};

/**
 * Get all stores with pagination and search
 */
const getAllStores = async (query, user) => {
    const { page = 1, limit = 100, search, city, state, isActive } = query;

    const filter = { isDeleted: false };

    // Enforce store scoping for store staff
    if (user && user.role === 'store_staff') {
        if (!user.shopId) {
            throw new Error('User is not linked to any store. Please contact administrator.');
        }
        filter._id = user.shopId;
    }

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { storeCode: { $regex: search, $options: 'i' } },
            { managerName: { $regex: search, $options: 'i' } }
        ];
    }

    if (city) filter['location.city'] = city;
    if (state) filter['location.state'] = state;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (page - 1) * limit;

    const [stores, total] = await Promise.all([
        Store.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('createdBy', 'name email'),
        Store.countDocuments(filter)
    ]);

    return { stores, total, page: parseInt(page), limit: parseInt(limit) };
};

/**
 * Get single store by ID
 */
const getStoreById = async (id) => {
    const store = await Store.findOne({ _id: id, isDeleted: false }).populate('createdBy', 'name email');
    if (!store) {
        throw new Error('Store not found');
    }
    return store;
};

/**
 * Update store details
 */
const updateStore = async (id, updateData) => {
    const store = await Store.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: updateData },
        { new: true, runValidators: true }
    );

    if (!store) {
        throw new Error('Store not found or updated failed');
    }

    return store;
};

/**
 * Toggle store status (active/deactivate)
 */
const toggleStoreStatus = async (id, status) => {
    const store = await Store.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { isActive: status } },
        { new: true }
    );

    if (!store) {
        throw new Error('Store not found');
    }

    return store;
};

/**
 * Soft delete store
 */
const deleteStore = async (id) => {
    const store = await Store.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { isDeleted: true, isActive: false } },
        { new: true }
    );

    if (!store) {
        throw new Error('Store not found or already deleted');
    }

    return store;
};

module.exports = {
    createStore,
    getAllStores,
    getStoreById,
    updateStore,
    toggleStoreStatus,
    deleteStore
};
