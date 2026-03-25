const express = require('express');
const notificationController = require('./notification.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

// GET /notifications
router.get('/', notificationController.get);

// POST /notifications
router.post('/', requireAdmin, notificationController.send);

// PUT /notifications/:id/read
router.put('/:id/read', notificationController.read);

// PUT /notifications/read-all
router.put('/read-all', notificationController.readAll);

module.exports = router;
