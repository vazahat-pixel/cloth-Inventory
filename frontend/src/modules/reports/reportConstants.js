/** Max records per report API request (backend allows up to REPORT_MAX_PAGE_SIZE with forReport). */
export const REPORT_FETCH_LIMIT = 20000;

/** Passed to list APIs so backend allows REPORT_MAX_PAGE_SIZE instead of 100. */
export const REPORT_FETCH_PARAMS = { forReport: true, page: 1, limit: REPORT_FETCH_LIMIT };
