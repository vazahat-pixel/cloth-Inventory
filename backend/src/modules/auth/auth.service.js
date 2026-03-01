/**
 * auth.service.js — Business logic layer for auth (future refactor target)
 * Currently auth logic lives in auth.controller.js.
 * This service is the place to extract reusable auth logic as the app grows.
 */

const User = require('../../models/user.model');
const { generateToken } = require('../../utils/jwt.utils');

const findUserById = async (id) => {
    return await User.findById(id);
};

const findUserByEmail = async (email, role = null) => {
    const query = { email: email.toLowerCase() };
    if (role) query.role = role;
    return await User.findOne(query).select('+passwordHash');
};

module.exports = { findUserById, findUserByEmail };
