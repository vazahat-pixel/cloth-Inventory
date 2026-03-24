const Customer = require('../../models/customer.model');

const createCustomer = async (customerData) => {
    const customer = await Customer.create(customerData);
    return customer;
};

const getAllCustomers = async (query) => {
    const { page = 1, limit = 10, search } = query;
    const filter = { isActive: true };
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
        ];
    }
    const skip = (page - 1) * limit;
    const [customers, total] = await Promise.all([
        Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
        Customer.countDocuments(filter)
    ]);
    return { customers, total, page: parseInt(page), limit: parseInt(limit) };
};

const getCustomerById = async (id) => {
    const customer = await Customer.findById(id).populate('purchaseHistory');
    if (!customer) throw new Error('Customer not found');
    return customer;
};

const getCustomerByPhone = async (phone) => {
    const customer = await Customer.findOne({ phone, isActive: true });
    return customer;
};

module.exports = {
    createCustomer,
    getAllCustomers,
    getCustomerById,
    getCustomerByPhone
};
