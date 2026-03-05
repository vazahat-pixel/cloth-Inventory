const express = require('express');
const router = express.Router();
const accountGroupController = require('./accountGroup.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);

router.get('/', accountGroupController.getAllGroups);
router.post('/', accountGroupController.createGroup);
router.patch('/:id', accountGroupController.updateGroup);
router.delete('/:id', accountGroupController.deleteGroup);

module.exports = router;
