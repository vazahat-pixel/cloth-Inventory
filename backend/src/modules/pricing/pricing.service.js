const StorePricing = require('../../models/storePricing.model');

const createPricingRule = async (data, userId) => {
    return await StorePricing.create({ ...data, createdBy: userId });
};

const getPricingRules = async (query = {}) => {
    const { storeId, productId, isActive } = query;
    const filter = {};
    if (storeId) filter.storeId = storeId;
    if (productId) filter.productId = productId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    return await StorePricing.find(filter)
        .populate('storeId', 'name storeCode')
        .populate('productId', 'name sku barcode salePrice')
        .populate('createdBy', 'name')
        .sort({ updatedAt: -1 });
};

const updatePricingRule = async (id, data) => {
    return await StorePricing.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deletePricingRule = async (id) => {
    return await StorePricing.findByIdAndDelete(id);
};

module.exports = {
    createPricingRule,
    getPricingRules,
    updatePricingRule,
    deletePricingRule
};
