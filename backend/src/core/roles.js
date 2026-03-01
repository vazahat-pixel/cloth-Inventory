/**
 * roles.js — Role definitions
 */

const { Roles } = require('./enums');

const ROLES = [Roles.ADMIN, Roles.STORE_STAFF];

const isAdmin = (role) => role === Roles.ADMIN;
const isStoreStaff = (role) => role === Roles.STORE_STAFF;

module.exports = { ROLES, isAdmin, isStoreStaff };
