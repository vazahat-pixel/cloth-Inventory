const express = require('express');
const router = express.Router();
const schemeController = require('./scheme.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

router.use(protect);

router.post('/', requireAdmin, schemeController.createScheme);
router.get('/', schemeController.getAllSchemes);
router.get('/:id', schemeController.getSchemeById);
router.patch('/:id', requireAdmin, schemeController.updateScheme);
router.delete('/:id', requireAdmin, schemeController.deleteScheme);

module.exports = router;
