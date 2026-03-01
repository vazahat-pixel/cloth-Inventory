const express = require('express');
const dispatchController = require('./dispatch.controller');
const { createDispatchValidation, updateStatusValidation } = require('./dispatch.validation');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin, requireRole, requireAny } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.route('/')
    .post(requireAdmin, createDispatchValidation, dispatchController.createDispatch)
    .get(requireAny, dispatchController.getAllDispatches);

router.route('/:id')
    .get(requireAny, dispatchController.getDispatchById)
    .delete(requireAdmin, dispatchController.deleteDispatch);

router.patch('/:id/status', requireAny, updateStatusValidation, dispatchController.updateStatus);

module.exports = router;
