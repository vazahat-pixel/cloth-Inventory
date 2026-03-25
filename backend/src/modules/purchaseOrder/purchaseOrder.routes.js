const express = require('express');
const poController = require('./purchaseOrder.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.post('/', poController.create);
router.get('/', poController.get);
router.get('/:id', poController.getById);

// Admin-only for status move to APPROVED/SENT/CLOSED
router.put('/:id/status', requireAdmin, poController.updateStatus);

module.exports = router;
