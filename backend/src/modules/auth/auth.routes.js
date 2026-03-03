const express = require('express');
const {
    adminRegister,
    adminLogin,
    storeRegister,
    storeLogin,
    getMe,
    logout,
    getAllUsers,
    updateUser,
    createUser
} = require('./auth.controller');
const { adminRegisterValidation, loginValidation, storeRegisterValidation } = require('./auth.validation');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

// Admin
router.post('/admin/register', adminRegisterValidation, adminRegister);
router.post('/admin/login', loginValidation, adminLogin);

// Store Staff (Public registration)
router.post('/store/register', storeRegisterValidation, storeRegister);
router.post('/store/login', loginValidation, storeLogin);

// Shared protected
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

// User Management (Admin Only)
router.get('/users', protect, requireAdmin, getAllUsers);
router.post('/users', protect, requireAdmin, createUser);
router.patch('/users/:id', protect, requireAdmin, updateUser);

module.exports = router;
