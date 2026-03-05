const Scheme = require('../../models/scheme.model');

const createScheme = async (data, userId) => {
    return await Scheme.create({ ...data, createdBy: userId });
};

const getAllSchemes = async (query = {}) => {
    const { isActive, type } = query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (type) filter.type = type;

    return await Scheme.find(filter)
        .populate('applicableCategories', 'name')
        .populate('applicableProducts', 'name sku')
        .sort({ createdAt: -1 });
};

const getSchemeById = async (id) => {
    return await Scheme.findById(id)
        .populate('applicableCategories')
        .populate('applicableProducts');
};

const updateScheme = async (id, data) => {
    return await Scheme.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteScheme = async (id) => {
    return await Scheme.findByIdAndDelete(id);
};

module.exports = {
    createScheme,
    getAllSchemes,
    getSchemeById,
    updateScheme,
    deleteScheme
};
