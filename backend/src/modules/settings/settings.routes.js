const express = require('express');
const settingsController = require('./settings.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const { companyProfileValidation } = require('./settings.validation');
const validate = require('../../middlewares/validate.middleware');

const router = express.Router();

router.use(protect);

router.route('/company')
    .get(settingsController.getCompanyProfile)
    .patch(requireAdmin, companyProfileValidation, validate, settingsController.updateCompanyProfile);

router.route('/invoicing')
    .get(settingsController.getInvoicingConfig)
    .patch(requireAdmin, settingsController.updateInvoicingConfig);

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

router.post('/generate-discount-key', requireAdmin, settingsController.generateDiscountKey);
router.post('/verify-discount-key', settingsController.verifyDiscountKey);

module.exports = router;
