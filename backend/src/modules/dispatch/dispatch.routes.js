const express = require('express');
const dispatchController = require('./dispatch.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.post('/', dispatchController.create);
router.get('/', dispatchController.get);
router.get('/:id', dispatchController.getById);

// Admin or stock manager only to update status
router.patch('/:id/status', requireAdmin, dispatchController.updateStatus);

module.exports = router;
