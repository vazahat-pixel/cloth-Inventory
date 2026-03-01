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
router.get('/:id', requireAny, customerController.getCustomerById);

module.exports = router;
