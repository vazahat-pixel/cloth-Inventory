const express = require('express');
const creditNoteController = require('./creditNote.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAny } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(requireAny, creditNoteController.getAllCreditNotes)
    .post(requireAny, creditNoteController.createCreditNote);

router.patch('/:id', requireAny, creditNoteController.updateCreditNote);

module.exports = router;
