const express = require('express');
const router = express.Router();
const sizeController = require('./size.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

router.use(protect);

router.get('/', sizeController.getAll);
router.get('/:id', sizeController.getById);
router.post('/', requireAdmin, sizeController.create);
router.put('/:id', requireAdmin, sizeController.update);
router.patch('/:id', requireAdmin, sizeController.update);
router.delete('/:id', requireAdmin, sizeController.delete);

module.exports = router;
