const Customer = require('../../models/customer.model');
const { getPagination, getSort } = require('../../utils/pagination.helper');

const createCustomer = async (customerData) => {
    const customer = await Customer.create(customerData);
    return customer;
};

const getAllCustomers = async (query) => {
    const { page, limit, skip } = getPagination(query);
    const { search, isActive } = query;
    const filter = {};
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }
    if (isActive !== undefined && isActive !== 'all') {
        filter.isActive = isActive === 'true' || isActive === true;
    }
    const sort = getSort(query, {
        name: 'name',
        phone: 'phone',
        createdAt: 'createdAt',
        loyaltyPoints: 'loyaltyPoints',
    }, { createdAt: -1 });

    const [customers, total] = await Promise.all([
        Customer.find(filter).sort(sort).skip(skip).limit(limit),
        Customer.countDocuments(filter),
    ]);
    return { customers, total, page, limit };
};

const getCustomerById = async (id) => {
    const customer = await Customer.findById(id);
    if (!customer) throw new Error('Customer not found');
    return customer;
};

const getCustomerByPhone = async (phone) => {
    const customer = await Customer.findOne({ phone });
    return customer;
};

const updateCustomer = async (id, updates) => {
    const customer = await Customer.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
    );
    if (!customer) throw new Error('Customer not found');
    return customer;
};

const deleteCustomer = async (id) => {
    // Soft delete: set isActive to false
    const customer = await Customer.findByIdAndUpdate(
        id,
        { $set: { isActive: false } },
        { new: true }
    );
    if (!customer) throw new Error('Customer not found');
    return customer;
};

module.exports = {
    createCustomer,
    getAllCustomers,
    getCustomerById,
    getCustomerByPhone,
    updateCustomer,
    deleteCustomer
};
