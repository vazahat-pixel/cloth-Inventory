import api from '../services/api';
import { extractPaginationMeta, extractListPayload } from './paginationMeta';

/**
 * Fetch every page of a paginated list API (uses forReport=true for higher backend cap).
 * Stops when hasNextPage is false or a page returns no rows.
 */
export async function fetchAllPaginatedList(endpoint, params = {}, listKeys = []) {
  const pageSize = params.limit || 5000;
  let page = 1;
  let all = [];
  let total = 0;
  let lastMeta = {};

  while (true) {
    const response = await api.get(endpoint, {
      params: { forReport: true, ...params, page, limit: pageSize },
    });
    const payload = response.data?.data || response.data || {};
    const batch = extractListPayload(payload, listKeys);
    const meta = extractPaginationMeta(response.data);
    lastMeta = meta;
    all = all.concat(batch);
    total = meta.total || all.length;
    if (!meta.hasNextPage || batch.length === 0) break;
    page += 1;
  }

  return {
    records: all,
    total,
    page: lastMeta.page || 1,
    limit: pageSize,
  };
}
