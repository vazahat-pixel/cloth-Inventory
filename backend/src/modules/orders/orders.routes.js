const express = require('express');
const ordersController = require('./orders.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAny } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

// Sale Orders
router.route('/sales')
    .get(requireAny, ordersController.getAllSaleOrders)
    .post(requireAny, ordersController.createSaleOrder);

router.route('/sales/:id')
    .get(requireAny, ordersController.getSaleOrderById)
    .patch(requireAny, ordersController.updateSaleOrder);

// Packing Slips
router.post('/packing-slips', requireAny, ordersController.createPackingSlip);

// Delivery Orders
router.post('/delivery', requireAny, ordersController.createDeliveryOrder);

module.exports = router;
