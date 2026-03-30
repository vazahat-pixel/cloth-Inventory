const express = require('express');
const router = express.Router();
const groupController = require('./group.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

router.use(protect);

router.get('/tree', groupController.getTree);
router.get('/', groupController.getAll);
router.get('/:id', groupController.getById);
router.post('/', requireAdmin, groupController.create);
router.put('/:id', requireAdmin, groupController.update);
router.patch('/:id', requireAdmin, groupController.update);
router.delete('/:id', requireAdmin, groupController.delete);

module.exports = router;
