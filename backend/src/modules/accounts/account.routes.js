const express = require('express');
const router = express.Router();
const accountController = require('./account.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);

router.get('/', accountController.getAllAccounts);
router.post('/', accountController.createAccount);

module.exports = router;
