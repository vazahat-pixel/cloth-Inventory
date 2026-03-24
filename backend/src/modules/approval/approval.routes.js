const express = require('express');
const approvalController = require('./approval.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

// Check if an action needs approval
router.post('/check', approvalController.check);

// Decision action (Approve/Reject)
router.post('/approve', requireAdmin, approvalController.approve);

// Admin-only: define rules
router.post('/rules', requireAdmin, approvalController.createRule);

// Get pending for dashboard
router.get('/pending', requireAdmin, approvalController.getPending);

module.exports = router;
