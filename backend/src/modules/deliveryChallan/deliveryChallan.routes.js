const express = require('express');
const challanController = require('./deliveryChallan.controller');
const { protect } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/', challanController.create);
router.get('/', challanController.list);
router.get('/:id', challanController.getById);

module.exports = router;
