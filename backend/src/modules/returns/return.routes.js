const express = require('express');
const returnController = require('./return.controller');
const { processReturnValidation } = require('./return.validation');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAny } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.route('/')
    .post(requireAny, processReturnValidation, returnController.processReturn)
    .get(requireAny, returnController.getAllReturns);

router.get('/:id', requireAny, returnController.getReturnById);

module.exports = router;
