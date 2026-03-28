const express = require('express');
const customerController = require('./customer.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAny } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.route('/')
    .post(requireAny, customerController.createCustomer)
    .get(requireAny, customerController.getAllCustomers);

router.get('/phone/:phone', requireAny, customerController.getCustomerByPhone);

// Loyalty endpoints (CRM)
router.route('/loyalty')
    .get(customerController.getLoyaltyConfig)
    .patch(customerController.updateLoyaltyConfig);

router.get('/loyalty/history/:id', customerController.getLoyaltyHistory);

router.route('/:id')
    .get(requireAny, customerController.getCustomerById)
    .patch(requireAny, customerController.updateCustomer)
    .delete(requireAny, customerController.deleteCustomer);

module.exports = router;
