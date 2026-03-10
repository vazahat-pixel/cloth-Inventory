const express = require('express');
const router = express.Router();
const billingCounterController = require('./billingCounter.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);

router.post('/', billingCounterController.createCounter);
router.get('/', billingCounterController.getAllCounters);
router.get('/:id', billingCounterController.getCounterById);
router.patch('/:id', billingCounterController.updateCounter);
router.delete('/:id', billingCounterController.deleteCounter);

module.exports = router;
