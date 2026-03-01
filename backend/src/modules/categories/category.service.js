const Category = require('../../models/category.model');

/**
 * Get all categories
 */
const getAllCategories = async (query = {}) => {
    const categories = await Category.find({ isDeleted: false, ...query }).sort({ name: 1 });
    return categories;
};

/**
 * Get category by ID
 */
const getCategoryById = async (id) => {
    const category = await Category.findById(id);
    if (!category || category.isDeleted) {
        throw new Error('Category not found');
    }
    return category;
};

/**
 * Create a new category
 */
const createCategory = async (categoryData, userId) => {
    const categoryExists = await Category.findOne({ name: categoryData.name, isDeleted: false });
    if (categoryExists) {
        throw new Error('Category already exists');
    }

    const category = await Category.create({
        ...categoryData,
        createdBy: userId
    });

    return category;
};

/**
 * Update a category
 */
const updateCategory = async (id, updateData) => {
    const category = await Category.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
    );
    if (!category) {
        throw new Error('Category not found');
    }
    return category;
};

/**
 * Delete a category
 */
const deleteCategory = async (id) => {
    const category = await Category.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!category) {
        throw new Error('Category not found');
    }
    return category;
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
