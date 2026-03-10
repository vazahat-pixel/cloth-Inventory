const BillingCounter = require('../../models/billingCounter.model');

const createCounter = async (data) => {
    return await BillingCounter.create(data);
};

const getAllCounters = async (query = {}) => {
    return await BillingCounter.find(query).populate('storeId');
};

const getCounterById = async (id) => {
    return await BillingCounter.findById(id).populate('storeId');
};

const updateCounter = async (id, data) => {
    return await BillingCounter.findByIdAndUpdate(id, data, { new: true });
};

const deleteCounter = async (id) => {
    return await BillingCounter.findByIdAndDelete(id);
};

module.exports = {
    createCounter,
    getAllCounters,
    getCounterById,
    updateCounter,
    deleteCounter
};
