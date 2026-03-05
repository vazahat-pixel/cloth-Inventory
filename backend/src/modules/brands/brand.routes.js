const express = require('express');
const router = express.Router();
const brandController = require('./brand.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);

router.get('/', brandController.getAllBrands);
router.post('/', brandController.createBrand);
router.patch('/:id', brandController.updateBrand);
router.delete('/:id', brandController.deleteBrand);

module.exports = router;
