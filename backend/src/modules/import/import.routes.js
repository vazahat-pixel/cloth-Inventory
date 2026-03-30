const express = require('express');
const router = express.Router();
const importController = require('./import.controller');
const multer = require('multer');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.use(protect);
router.post('/items', requireAdmin, upload.single('file'), (req, res) => importController.importItems(req, res));

module.exports = router;
