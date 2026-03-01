/**
 * pagination.helper.js — Extract and normalize pagination params from query string
 */

const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('../core/constants');

const getPagination = (query) => {
    let page = parseInt(query.page, 10) || 1;
    let limit = parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE;

    if (page < 1) page = 1;
    if (limit < 1) limit = DEFAULT_PAGE_SIZE;
    if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;

    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

const buildPaginationMeta = (total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
});

module.exports = { getPagination, buildPaginationMeta };
