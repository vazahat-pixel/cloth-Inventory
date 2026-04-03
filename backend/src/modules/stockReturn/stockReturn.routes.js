const express = require('express');
const router = express.Router();
const stockReturnController = require('./stockReturn.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);

router.post('/', stockReturnController.initiate);
router.post('/:id/receive', stockReturnController.receive);
router.get('/', stockReturnController.getAll);
router.get('/:id', stockReturnController.getById);

module.exports = router;
