const express = require('express');
const productController = require('./product.controller');
const { updateProductValidation } = require('./product.validation');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');
const { upload } = require('../../config/cloudinary.config');

const router = express.Router();

router.use(protect);

router.get('/', productController.getAllProducts);
router.post('/', requireAdmin, upload.single('image'), productController.createProduct);
router.post('/bulk-import', requireAdmin, productController.bulkImportProducts);
router.get('/barcode/:barcode', productController.getProductByBarcode);
router.get('/:id', productController.getProductById);

router.patch('/:id', requireAdmin, upload.single('image'), updateProductValidation, productController.updateProduct);
router.patch('/:id/status', requireAdmin, productController.toggleStatus);
router.delete('/:id', requireAdmin, productController.deleteProduct);

module.exports = router;
