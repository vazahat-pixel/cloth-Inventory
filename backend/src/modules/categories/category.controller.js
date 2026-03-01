const categoryService = require('./category.service');
const { sendSuccess, sendError, sendCreated, sendNotFound } = require('../../utils/response.handler');

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Private
 */
const getAllCategories = async (req, res, next) => {
    try {
        const categories = await categoryService.getAllCategories(req.query);
        return sendSuccess(res, { categories }, 'Categories retrieved successfully');
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Create a new category
 * @route   POST /api/categories
 * @access  Private (Admin Only)
 */
const createCategory = async (req, res, next) => {
    try {
        const category = await categoryService.createCategory(req.body, req.user._id);
        return sendCreated(res, { category }, 'Category created successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

/**
 * @desc    Update category
 * @route   PATCH /api/categories/:id
 * @access  Private (Admin Only)
 */
const updateCategory = async (req, res, next) => {
    try {
        const category = await categoryService.updateCategory(req.params.id, req.body);
        return sendSuccess(res, { category }, 'Category updated successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 * @access  Private (Admin Only)
 */
const deleteCategory = async (req, res, next) => {
    try {
        await categoryService.deleteCategory(req.params.id);
        return sendSuccess(res, {}, 'Category deleted successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

module.exports = {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
