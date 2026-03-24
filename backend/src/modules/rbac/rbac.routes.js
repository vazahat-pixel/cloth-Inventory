const express = require('express');
const rbacController = require('./rbac.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.use(requireAdmin);

// GET /api/rbac/roles
router.get('/roles', rbacController.getAllRoles);

// POST /api/rbac/roles
router.post('/roles', rbacController.updatePermissions);

module.exports = router;
