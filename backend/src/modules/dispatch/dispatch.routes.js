const express = require('express');
const dispatchController = require('./dispatch.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.post('/', dispatchController.create);
router.get('/', dispatchController.get);
router.get('/:id', dispatchController.getById);

// Mark as RECEIVED and Update Inventory
router.post('/:id/receive', dispatchController.receive);

module.exports = router;
