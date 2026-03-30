function getStorageKey(moduleKey) {
  return `cloth-erp-ui:${moduleKey}`;
}

export function loadModuleRecords(moduleKey, fallback = []) {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(moduleKey));
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    console.error(`Failed to read ${moduleKey} UI state`, error);
    return fallback;
  }
}

export function saveModuleRecords(moduleKey, records = []) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(getStorageKey(moduleKey), JSON.stringify(records));
  } catch (error) {
    console.error(`Failed to save ${moduleKey} UI state`, error);
  }
}

export function upsertModuleRecord(moduleKey, record, recordIdKey = 'id') {
  const current = loadModuleRecords(moduleKey, []);
  const next = [...current];
  const index = next.findIndex((item) => item?.[recordIdKey] === record?.[recordIdKey]);

  if (index >= 0) {
    next[index] = record;
  } else {
    next.unshift(record);
  }

  saveModuleRecords(moduleKey, next);
  return next;
}
