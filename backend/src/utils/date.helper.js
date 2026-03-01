/**
 * date.helper.js — Date formatting and utility functions
 */

const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
};

const formatDateTime = (date) => {
    if (!date) return null;
    return new Date(date).toISOString().replace('T', ' ').substring(0, 19);
};

const startOfDay = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

const endOfDay = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
};

const startOfMonth = (date = new Date()) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

const endOfMonth = (date = new Date()) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

module.exports = { formatDate, formatDateTime, startOfDay, endOfDay, startOfMonth, endOfMonth };
