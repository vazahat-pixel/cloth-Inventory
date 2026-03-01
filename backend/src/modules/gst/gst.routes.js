const express = require('express');
const gstController = require('./gst.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.use(requireAdmin);

router.route('/')
    .get(gstController.getAllGstSlabs)
    .post(gstController.createGstSlab);

router.route('/:id')
    .patch(gstController.updateGstSlab)
    .delete(gstController.deleteGstSlab);

module.exports = router;
