const express = require('express');
const qcController = require('./qc.controller');
const { createQCValidation } = require('./qc.validation');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAny } = require('../../middlewares/role.middleware');
const { validateRequest } = require('../../middlewares/validation.middleware');
const { validateWorkflowStep } = require('../workflow/workflow.middleware');

const router = express.Router();

router.use(protect);

router.post('/', requireAny, createQCValidation, validateRequest, validateWorkflowStep, qcController.create);
router.put('/:id/approve', requireAny, qcController.approve);

module.exports = router;
