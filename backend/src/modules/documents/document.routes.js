const express = require('express');
const documentController = require('./document.controller');
const { createDocumentValidation } = require('./document.validation');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAny } = require('../../middlewares/role.middleware');
const { validateRequest } = require('../../middlewares/validation.middleware');

const router = express.Router();

router.use(protect);

router.route('/')
    .post(requireAny, createDocumentValidation, validateRequest, documentController.create)
    .get(requireAny, documentController.list);

router.put('/:id/approve', requireAny, documentController.approve);
router.put('/:id/reject', requireAny, documentController.reject);

module.exports = router;
