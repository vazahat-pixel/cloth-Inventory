const express = require('express');
const dispatchController = require('./dispatch.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { validateRequest } = require('../../middlewares/validation.middleware');
const { idempotency } = require('../../middlewares/idempotency.middleware');
const {
    createDispatchValidation,
    updateDispatchValidation,
} = require('./dispatch.validation');

const router = express.Router();

router.use(protect);

router.post('/', idempotency, createDispatchValidation, validateRequest, dispatchController.create);
router.get('/', dispatchController.get);
router.get('/:id', dispatchController.getById);
router.put('/:id', idempotency, updateDispatchValidation, validateRequest, dispatchController.update);

router.post('/combine-dispatch', idempotency, dispatchController.combineAndConfirm);
router.post('/:id/pack', idempotency, dispatchController.pack);
router.post('/:id/confirm', idempotency, dispatchController.confirm);
router.post('/:id/cancel-draft', idempotency, dispatchController.cancel);
router.post('/:id/receive', idempotency, dispatchController.receive);
router.delete('/:id', dispatchController.remove);

module.exports = router;
