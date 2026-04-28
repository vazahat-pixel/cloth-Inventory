const express = require('express');
const router = express.Router();
const taxRuleController = require('./taxRule.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

router.use(protect);

router.get('/', taxRuleController.getTaxRules);
router.post('/', requireAdmin, taxRuleController.createTaxRule);
router.post('/seed', requireAdmin, taxRuleController.seedTaxRules);
router.put('/:id', requireAdmin, taxRuleController.updateTaxRule);
router.delete('/:id', requireAdmin, taxRuleController.deleteTaxRule);

module.exports = router;
