const { body } = require('express-validator');

const companyProfileValidation = [
    body('companyName').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
    body('gstNumber').optional({ checkFalsy: true }).matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).withMessage('Invalid GST format'),
    body('panNumber').optional({ checkFalsy: true }).matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Invalid PAN format'),
    body('phone').optional({ checkFalsy: true }).matches(/^[6-9]\d{9}$/).withMessage('Invalid phone number'),
    body('pincode').optional({ checkFalsy: true }).isLength({ min: 6, max: 6 }).withMessage('Pincode must be 6 digits'),
    
    // Bank Details
    body('bankDetails.bankName').optional({ checkFalsy: true }).matches(/^[a-zA-Z\s]+$/).withMessage('Bank name must contain only letters'),
    body('bankDetails.ifscCode').optional({ checkFalsy: true }).matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Invalid IFSC code format'),
    body('bankDetails.accountNumber').optional({ checkFalsy: true }).isNumeric().withMessage('Account number must be numeric')
];

module.exports = {
    companyProfileValidation
};
