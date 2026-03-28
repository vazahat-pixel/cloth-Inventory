const express = require('express');
const gstController = require('./gst.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

// GST Slabs (Admin only)
router.route('/')
    .get(gstController.getAllGstSlabs)
    .post(requireAdmin, gstController.createGstSlab);

router.route('/:id')
    .patch(requireAdmin, gstController.updateGstSlab)
    .delete(requireAdmin, gstController.deleteGstSlab);

// GST Groups
router.route('/groups')
    .get(gstController.getAllGstGroups)
    .post(requireAdmin, gstController.createGstGroup);

router.patch('/groups/:id', requireAdmin, gstController.updateGstGroup);

module.exports = router;
