const express = require('express');
const router = express.Router();
const hsnCodeController = require('./hsnCode.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

router.use(protect);

router.get('/', hsnCodeController.getAllHsnCodes);
router.get('/:id', hsnCodeController.getHsnCodeById);

router.post('/', requireAdmin, hsnCodeController.createHsnCode);
router.patch('/:id', requireAdmin, hsnCodeController.updateHsnCode);
router.delete('/:id', requireAdmin, hsnCodeController.deleteHsnCode);

module.exports = router;
