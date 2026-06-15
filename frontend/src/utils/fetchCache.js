const DEFAULT_TTL_MS = 60 * 1000;

/**
 * Build an RTK thunk `condition` that skips duplicate fetches while data is fresh.
 */
export function createFreshDataCondition({
  sliceSelector,
  ttlMs = DEFAULT_TTL_MS,
  hasData = (slice) => Array.isArray(slice.records) && slice.records.length > 0,
} = {}) {
  return (_, { getState }) => {
    const slice = sliceSelector(getState());
    if (!slice) return true;
    if (slice.loading) return false;
    if (slice.lastFetchedAt && Date.now() - slice.lastFetchedAt < ttlMs && hasData(slice)) {
      return false;
    }
    return true;
  };
}

export function createMasterEntityCondition(entityKey, ttlMs = 5 * 60 * 1000) {
  return (_, { getState }) => {
    const state = getState().masters;
    if (state.inflightKeys?.[entityKey]) return false;
    const existing = state[entityKey];
    const fetchedAt = state.fetchedAt?.[entityKey];
    if (existing?.length > 0 && fetchedAt && Date.now() - fetchedAt < ttlMs) {
      return false;
    }
    return true;
  };
}
