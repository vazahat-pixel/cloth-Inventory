const Scheme = require('../../models/scheme.model');

const createScheme = async (data, userId) => {
    // Map frontend camelCase/nested fields to backend Schema
    const schemaData = {
        name: data.name,
        type: data.type === 'percentage_discount' ? 'PERCENTAGE' :
              data.type === 'flat_discount' ? 'FLAT' :
              data.type === 'free_gift' ? 'FREE_GIFT' :
              data.type === 'buy_x_get_y' ? 'BUY_X_GET_Y' : 'PERCENTAGE',
        value: data.benefit?.discountPercent || data.benefit?.flatAmount || 0,
        buyQuantity: data.benefit?.buyQty || 0,
        getQuantity: data.benefit?.getQty || 0,
        startDate: data.validity?.from || new Date(),
        endDate: data.validity?.to || new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        isActive: data.status === 'Active',
        minPurchaseAmount: data.conditions?.minValue || 0,
        minPurchaseQuantity: data.conditions?.minQuantity || 0,
        giftItemId: data.giftItemId,
        giftQuantity: data.giftQuantity,
        createdBy: userId
    };

    if (data.applicability?.type === 'item') {
        schemaData.applicableProducts = data.applicability.ids;
    } else if (data.applicability?.type === 'itemGroup') {
        schemaData.applicableCategories = data.applicability.ids;
    } else if (data.applicability?.type === 'brand') {
        schemaData.applicableBrands = data.applicability.ids;
    }

    return await Scheme.create(schemaData);
};

const getAllSchemes = async (query = {}) => {
    const { isActive, type } = query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (type) filter.type = type;

    return await Scheme.find(filter)
        .populate('applicableCategories', 'name')
        .populate('applicableProducts', 'name sku')
        .populate('applicableBrands', 'name')
        .sort({ createdAt: -1 });
};

const getSchemeById = async (id) => {
    return await Scheme.findById(id)
        .populate('applicableCategories')
        .populate('applicableProducts')
        .populate('applicableBrands');
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
