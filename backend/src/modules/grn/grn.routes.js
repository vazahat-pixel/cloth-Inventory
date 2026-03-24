const express = require('express');
const grnController = require('./grn.controller');
const { createGRNValidation } = require('./grn.validation');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAny } = require('../../middlewares/role.middleware');
const { validateRequest } = require('../../middlewares/validation.middleware');
const { validateWorkflowStep } = require('../workflow/workflow.middleware');

const router = express.Router();

router.use(protect);

router.post('/', requireAny, createGRNValidation, validateRequest, validateWorkflowStep, grnController.create);
router.get('/:id', requireAny, grnController.getById);

module.exports = router;
