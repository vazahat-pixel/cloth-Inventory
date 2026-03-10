const express = require('express');
const router = express.Router();
const accountMasterController = require('./accountMaster.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

router.use(protect);

router.get('/', accountMasterController.getAllAccounts);
router.get('/:id', accountMasterController.getAccountById);

router.post('/', requireAdmin, accountMasterController.createAccount);
router.patch('/:id', requireAdmin, accountMasterController.updateAccount);
router.delete('/:id', requireAdmin, accountMasterController.deleteAccount);

module.exports = router;
