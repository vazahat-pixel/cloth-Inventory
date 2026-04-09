const express = require('express');
const router = express.Router();
const salesReturnController = require('./salesReturn.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAny } = require('../../middlewares/role.middleware');

router.use(protect);

router.route('/')
  .post(requireAny, salesReturnController.createReturn)
  .get(requireAny, salesReturnController.getAllReturns);

router.get('/:id', requireAny, salesReturnController.getReturnById);

module.exports = router;
