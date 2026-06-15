/**
 * Normalize pagination metadata from varied API response shapes.
 */
export function extractPaginationMeta(responseData = {}) {
  const data = responseData.data || responseData;
  const meta = data.meta || data.pagination || {};
  const total = meta.total ?? data.total ?? 0;
  const page = meta.page ?? data.page ?? 1;
  const limit = meta.limit ?? data.limit ?? 20;
  return {
    total,
    page,
    limit,
    totalPages: meta.totalPages ?? (Math.ceil(total / limit) || 0),
    hasNextPage: meta.hasNextPage ?? page * limit < total,
    hasPrevPage: meta.hasPrevPage ?? page > 1,
  };
}

export function extractListPayload(responseData = {}, listKeys = []) {
  const data = responseData.data || responseData;
  for (const key of listKeys) {
    if (Array.isArray(data[key])) return data[key];
  }
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.records)) return data.records;
  return [];
}

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
