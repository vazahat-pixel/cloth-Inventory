export function loadModuleRecords(key, fallback = []) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (err) {
    console.error(`Failed to load records for key ${key}:`, err);
    return fallback;
  }
}

export function upsertModuleRecord(key, record) {
  try {
    const records = loadModuleRecords(key);
    const index = records.findIndex((r) => (r.id || r._id) === (record.id || record._id));
    
    if (index !== -1) {
      records[index] = { ...records[index], ...record };
    } else {
      records.push(record);
    }
    
    localStorage.setItem(key, JSON.stringify(records));
    return true;
  } catch (err) {
    console.error(`Failed to upsert record for key ${key}:`, err);
    return false;
  }
}

export function removeModuleRecord(key, recordId) {
  try {
    const records = loadModuleRecords(key);
    const filtered = records.filter((r) => (r.id || r._id) !== recordId);
    localStorage.setItem(key, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error(`Failed to remove record ${recordId} for key ${key}:`, err);
    return false;
  }
}

export function clearModuleRecords(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.error(`Failed to clear records for key ${key}:`, err);
    return false;
  }
}
