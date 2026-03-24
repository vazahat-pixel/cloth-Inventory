const express = require('express');
const dispatchController = require('./dispatch.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAny } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.get('/', requireAny, dispatchController.getAll);
router.post('/', requireAny, dispatchController.create);
router.get('/:id', requireAny, dispatchController.getById);

// PUT /dispatch/:id/complete
router.put('/:id/complete', requireAny, dispatchController.complete);

module.exports = router;
