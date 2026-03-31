const express = require('express');
const { upload } = require('../../config/cloudinary.config');
const { protect } = require('../../middlewares/auth.middleware');
const { sendSuccess, sendError } = require('../../utils/response.handler');

const router = express.Router();

router.post('/upload', protect, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return sendError(res, 'No file uploaded', 400);
        }
        
        return sendSuccess(res, { 
            url: req.file.path, 
            publicId: req.file.filename,
            size: req.file.size
        }, 'File uploaded to Cloudinary successfully', 201);
    } catch (error) {
        return sendError(res, error.message, 500);
    }
});

// For multiple images
router.post('/upload-multiple', protect, upload.array('files', 10), (req, res) => {
    try {
        if (!req.files || !req.files.length) {
            return sendError(res, 'No files uploaded', 400);
        }
        
        const results = req.files.map(f => ({
            url: f.path,
            publicId: f.filename,
            size: f.size
        }));
        
        return sendSuccess(res, { files: results }, 'Files uploaded to Cloudinary successfully', 201);
    } catch (error) {
        return sendError(res, error.message, 500);
    }
});

module.exports = router;
