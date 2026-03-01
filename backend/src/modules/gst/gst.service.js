const GstSlab = require('../../models/gstSlab.model');

const createGstSlab = async (data) => {
    return await GstSlab.create(data);
};

const getAllGstSlabs = async (query = {}) => {
    return await GstSlab.find({ ...query });
};

const updateGstSlab = async (id, data) => {
    return await GstSlab.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteGstSlab = async (id) => {
    return await GstSlab.findByIdAndDelete(id);
};

module.exports = {
    createGstSlab,
    getAllGstSlabs,
    updateGstSlab,
    deleteGstSlab
};
