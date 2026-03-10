const HsnCode = require('../../models/hsnCode.model');

const createHsnCode = async (data) => {
    return await HsnCode.create(data);
};

const getAllHsnCodes = async (query = {}) => {
    const filter = {};
    if (query.code) filter.code = new RegExp(query.code, 'i');
    return await HsnCode.find(filter).populate('gstSlabId');
};

const getHsnCodeById = async (id) => {
    return await HsnCode.findById(id).populate('gstSlabId');
};

const updateHsnCode = async (id, data) => {
    return await HsnCode.findByIdAndUpdate(id, data, { new: true });
};

const deleteHsnCode = async (id) => {
    return await HsnCode.findByIdAndDelete(id);
};

module.exports = {
    createHsnCode,
    getAllHsnCodes,
    getHsnCodeById,
    updateHsnCode,
    deleteHsnCode
};
