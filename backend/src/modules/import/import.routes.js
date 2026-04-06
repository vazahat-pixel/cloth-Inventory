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
router.use(requireAdmin);

// Exports
router.get('/export-items', (req, res) => importController.exportItems(req, res));
router.get('/export-purchase', (req, res) => importController.exportPurchases(req, res));
router.get('/export-transfers', (req, res) => importController.exportTransfers(req, res));

// Imports
router.post('/items', upload.single('file'), (req, res) => importController.importItems(req, res));
router.post('/items-text', upload.single('file'), (req, res) => importController.importItemsText(req, res));
router.post('/purchase-text', upload.single('file'), (req, res) => importController.importPurchaseText(req, res));

module.exports = router;
