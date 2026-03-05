const express = require('express');
const router = express.Router();
const bankController = require('./bank.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);

router.get('/', bankController.getAllBanks);
router.post('/', bankController.createBank);
router.patch('/:id', bankController.updateBank);
router.delete('/:id', bankController.deleteBank);

module.exports = router;
