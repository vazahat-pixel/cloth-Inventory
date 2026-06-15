/**
 * Stable idempotency keys for a single user action (double-click safe).
 */
export function createOperationIdempotencyKey(scope, entityId = 'new') {
  const safeScope = String(scope || 'op').replace(/\s+/g, '-').toLowerCase();
  const safeId = String(entityId || 'new');
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${safeScope}:${safeId}:${crypto.randomUUID()}`;
  }
  return `${safeScope}:${safeId}:${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function idempotencyHeaders(key) {
  if (!key) return {};
  return { 'Idempotency-Key': key };
}
