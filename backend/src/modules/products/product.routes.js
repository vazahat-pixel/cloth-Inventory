const express = require('express');
const productController = require('./product.controller');
const { updateProductValidation } = require('./product.validation');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.get('/', productController.getAllProducts);
router.post('/', requireAdmin, productController.createProduct);
router.get('/barcode/:barcode', productController.getProductByBarcode);
router.get('/:id', productController.getProductById);

router.patch('/:id', requireAdmin, updateProductValidation, productController.updateProduct);
router.patch('/:id/status', requireAdmin, productController.toggleStatus);
router.delete('/:id', requireAdmin, productController.deleteProduct);

module.exports = router;
