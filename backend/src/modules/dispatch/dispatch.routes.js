const express = require('express');
const dispatchController = require('./dispatch.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.post('/', dispatchController.create);
router.get('/', dispatchController.get);
router.get('/:id', dispatchController.getById);

// Admin or stock manager only to complete movement
router.put('/:id/complete', requireAdmin, dispatchController.complete);

module.exports = router;
