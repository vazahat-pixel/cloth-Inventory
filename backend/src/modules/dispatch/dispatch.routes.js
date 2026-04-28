const express = require('express');
const dispatchController = require('./dispatch.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.post('/', dispatchController.create);
router.get('/', dispatchController.get);
router.get('/:id', dispatchController.getById);
router.put('/:id', dispatchController.update);

// Mark as PACKED (from DRAFT / Sale Challan)
router.post('/:id/pack', dispatchController.pack);

// Mark as DISPATCHED (from DRAFT)
router.post('/:id/confirm', dispatchController.confirm);

// Mark as CANCELLED (from DRAFT)
router.post('/:id/cancel-draft', dispatchController.cancel);

// Mark as RECEIVED and Update Inventory
router.post('/:id/receive', dispatchController.receive);

router.delete('/:id', dispatchController.remove);

module.exports = router;
