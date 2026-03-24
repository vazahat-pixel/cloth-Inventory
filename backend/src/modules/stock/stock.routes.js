const express = require('express');
const stockController = require('./stock.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAny } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.get('/movements', requireAny, stockController.getMovements);
router.get('/history/:variantId', requireAny, stockController.getHistoryByVariant);

module.exports = router;
