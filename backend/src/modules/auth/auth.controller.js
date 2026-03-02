const { validationResult } = require('express-validator');
const User = require('../../models/user.model');
const { generateToken } = require('../../utils/jwt.utils');
const { sendSuccess, sendCreated, sendError, sendUnauthorized, sendForbidden } = require('../../utils/response.handler');

// ── ADMIN REGISTER ───────────────────────────────────────────────
const adminRegister = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return sendError(res, errors.array()[0].msg, 400);

        const { name, email, password, adminSecret } = req.body;
        if (adminSecret !== process.env.ADMIN_REGISTRATION_SECRET) {
            return sendForbidden(res, 'Invalid admin secret key. Registration denied.');
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) return sendError(res, 'Email already registered.', 400);

        const user = await User.create({ name, email: email.toLowerCase(), passwordHash: password, role: 'admin' });
        const token = generateToken({ id: user._id, email: user.email, role: user.role, name: user.name });

        return sendCreated(res, {
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        }, 'Admin registered successfully.');
    } catch (error) { next(error); }
};

// ── ADMIN LOGIN ──────────────────────────────────────────────────
const adminLogin = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return sendError(res, errors.array()[0].msg, 400);

        const { email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase(), role: 'admin' }).select('+passwordHash');
        if (!user || !user.isActive) return sendUnauthorized(res, !user ? 'Invalid email or password.' : 'Account deactivated. Contact support.');

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return sendUnauthorized(res, 'Invalid email or password.');

        const token = generateToken({ id: user._id, email: user.email, role: user.role, name: user.name });
        return sendSuccess(res, {
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        }, 'Admin logged in successfully.');
    } catch (error) { next(error); }
};

// ── STORE REGISTER ───────────────────────────────────────────────
const storeRegister = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return sendError(res, errors.array()[0].msg, 400);

        const { name, email, password, shopName } = req.body;
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) return sendError(res, 'Email already registered.', 400);

        const user = await User.create({ name, email: email.toLowerCase(), passwordHash: password, role: 'store_staff', shopName: shopName || null });
        const token = generateToken({ id: user._id, email: user.email, role: user.role, name: user.name, shopName: user.shopName, shopId: user.shopId });

        return sendCreated(res, {
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, shopName: user.shopName, shopId: user.shopId },
        }, 'Store staff registered successfully.');
    } catch (error) { next(error); }
};

// ── STORE LOGIN ──────────────────────────────────────────────────
const storeLogin = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return sendError(res, errors.array()[0].msg, 400);

        const { email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase(), role: 'store_staff' }).select('+passwordHash');
        if (!user || !user.isActive) return sendUnauthorized(res, !user ? 'Invalid email or password.' : 'Account deactivated. Contact admin.');

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return sendUnauthorized(res, 'Invalid email or password.');

        const token = generateToken({ id: user._id, email: user.email, role: user.role, name: user.name, shopName: user.shopName, shopId: user.shopId });
        return sendSuccess(res, {
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, shopName: user.shopName, shopId: user.shopId },
        }, 'Store staff logged in successfully.');
    } catch (error) { next(error); }
};

// ── GET ME ───────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return sendError(res, 'User not found.', 404);
        return sendSuccess(res, { user });
    } catch (error) { next(error); }
};

// ── LOGOUT ───────────────────────────────────────────────────────
const logout = (req, res) => sendSuccess(res, {}, 'Logged out successfully.');

// ── GET ALL USERS (ADMIN ONLY) ────────────────────────────────────
const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });
        return sendSuccess(res, { users }, 'Users retrieved successfully.');
    } catch (error) { next(error); }
};

// ── UPDATE USER (ADMIN ONLY) ──────────────────────────────────────
const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, role, status, mobile } = req.body;

        const user = await User.findById(id);
        if (!user) return sendError(res, 'User not found.', 404);

        if (name) user.name = name;
        if (email) user.email = email.toLowerCase();
        if (role) user.role = role;
        if (status) user.isActive = status === 'Active';
        if (mobile) user.mobile = mobile;

        await user.save();

        return sendSuccess(res, { user }, 'User updated successfully.');
    } catch (error) { next(error); }
};

const createUser = async (req, res, next) => {
    try {
        const { name, email, password, role, mobile, shopName } = req.body;
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) return sendError(res, 'Email already registered.', 400);

        const user = await User.create({
            name,
            email: email.toLowerCase(),
            passwordHash: password || 'Temporary@123',
            role: role || 'store_staff',
            mobile,
            shopName: shopName || null
        });

        return sendCreated(res, {
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        }, 'User created successfully.');
    } catch (error) { next(error); }
};

module.exports = { adminRegister, adminLogin, storeRegister, storeLogin, getMe, logout, getAllUsers, updateUser, createUser };
