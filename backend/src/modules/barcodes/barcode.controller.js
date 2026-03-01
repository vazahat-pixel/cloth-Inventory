const productService = require('../products/product.service');
const { sendSuccess, sendNotFound } = require('../../utils/response.handler');

const getProductByBarcode = async (req, res, next) => {
    try {
        const product = await productService.getProductByBarcode(req.params.barcode);
        return sendSuccess(res, { product }, 'Product found');
    } catch (err) {
        return sendNotFound(res, err.message);
    }
};

const regenerateBarcode = async (req, res, next) => {
    try {
        const barcode = await productService.generateBarcode();
        const product = await productService.updateProduct(req.params.productId, { barcode });
        return sendSuccess(res, { product }, 'Barcode regenerated successfully');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getProductByBarcode,
    regenerateBarcode
};
