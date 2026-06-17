/**
 * pagination.helper.js — Extract and normalize pagination params from query string
 */

const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, REPORT_MAX_PAGE_SIZE } = require('../core/constants');

const getPagination = (query) => {
    let page = parseInt(query.page, 10) || 1;
    let limit = parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE;
    const forReport = query.forReport === true || query.forReport === 'true';
    const maxLimit = forReport ? REPORT_MAX_PAGE_SIZE : MAX_PAGE_SIZE;

    if (page < 1) page = 1;
    if (limit < 1) limit = DEFAULT_PAGE_SIZE;
    if (limit > maxLimit) limit = maxLimit;

    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

const buildPaginationMeta = (total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 0,
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
});

/**
 * Build a safe Mongo sort object from query.sortBy / query.sortOrder.
 * @param {object} query - req.query
 * @param {Record<string, string>} allowedFields - client field -> DB field
 * @param {object} defaultSort - fallback sort e.g. { createdAt: -1 }
 */
const getSort = (query = {}, allowedFields = {}, defaultSort = { createdAt: -1 }) => {
    const sortBy = query.sortBy;
    if (sortBy && allowedFields[sortBy]) {
        const order = query.sortOrder === 'asc' ? 1 : -1;
        return { [allowedFields[sortBy]]: order };
    }
    return defaultSort;
};

const PAGINATION_QUERY_KEYS = new Set(['page', 'limit', 'sortBy', 'sortOrder', 'search']);

const stripPaginationKeys = (query = {}) => {
    const filter = { ...query };
    PAGINATION_QUERY_KEYS.forEach((key) => delete filter[key]);
    return filter;
};

module.exports = { getPagination, buildPaginationMeta, getSort, stripPaginationKeys, PAGINATION_QUERY_KEYS };
