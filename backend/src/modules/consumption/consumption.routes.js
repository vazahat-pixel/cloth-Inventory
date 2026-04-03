const express = require('express');
const router = express.Router();
const consumptionController = require('./consumption.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);

router.post('/', consumptionController.createConsumption);
router.get('/', consumptionController.getConsumptions);
router.get('/:id', consumptionController.getConsumptionById);

module.exports = router;
