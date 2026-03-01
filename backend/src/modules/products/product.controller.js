const productService = require('./product.service');
const { validationResult } = require('express-validator');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/response.handler');
const { buildPaginationMeta } = require('../../utils/pagination.helper');

const validate = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendError(res, errors.array()[0].msg, 400);
    }
};

const getAllProducts = async (req, res, next) => {
    try {
        const { products, total, page, limit } = await productService.getAllProducts(req.query);
        const meta = buildPaginationMeta(total, page, limit);
        return sendSuccess(res, { products, meta }, 'Products retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const getProductById = async (req, res, next) => {
    try {
        const product = await productService.getProductById(req.params.id);
        return sendSuccess(res, { product }, 'Product details retrieved');
    } catch (err) {
        return sendNotFound(res, err.message);
    }
};

const getProductByBarcode = async (req, res, next) => {
    try {
        const product = await productService.getProductByBarcode(req.params.barcode);
        return sendSuccess(res, { product }, 'Product found by barcode');
    } catch (err) {
        return sendNotFound(res, err.message);
    }
};

const updateProduct = async (req, res, next) => {
    try {
        const error = validate(req, res);
        if (error) return error;

        const product = await productService.updateProduct(req.params.id, req.body);
        return sendSuccess(res, { product }, 'Product updated successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const toggleStatus = async (req, res, next) => {
    try {
        const { isActive } = req.body;
        if (typeof isActive !== 'boolean') return sendError(res, 'isActive must be a boolean', 400);

        const product = await productService.toggleStatus(req.params.id, isActive);
        return sendSuccess(res, { product }, `Product status changed to ${isActive ? 'Active' : 'Inactive'}`);
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const deleteProduct = async (req, res, next) => {
    try {
        await productService.deleteProduct(req.params.id);
        return sendSuccess(res, {}, 'Product deleted successfully');
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

const createProduct = async (req, res, next) => {
    try {
        const product = await productService.createProduct(req.body, req.user._id);
        return sendSuccess(res, { product }, 'Product created successfully', 201);
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    getProductByBarcode,
    updateProduct,
    toggleStatus,
    deleteProduct,
    createProduct
};
