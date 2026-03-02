const express = require('express');
const settingsController = require('./settings.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.route('/company')
    .get(settingsController.getCompanyProfile)
    .patch(requireAdmin, settingsController.updateCompanyProfile);

router.route('/roles')
    .get(settingsController.getRoles)
    .post(requireAdmin, settingsController.addRole);

router.patch('/roles/:id', requireAdmin, settingsController.updateRole);

router.route('/number-series')
    .get(settingsController.getNumberSeries)
    .post(requireAdmin, settingsController.addNumberSeries);

router.patch('/number-series/:id', requireAdmin, settingsController.updateNumberSeries);

router.route('/preferences')
    .get(settingsController.getPreferences)
    .patch(requireAdmin, settingsController.updatePreferences);

router.route('/purchase-voucher-config')
    .get(settingsController.getPVConfig)
    .patch(requireAdmin, settingsController.updatePVConfig);

router.route('/print-templates')
    .get(settingsController.getPrintTemplates)
    .post(requireAdmin, settingsController.addPrintTemplate);

router.patch('/print-templates/:id', requireAdmin, settingsController.updatePrintTemplate);

module.exports = router;
