export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeEventId(value) {
  return String(value || '').trim().replace(/\D/g, '').slice(0, 5);
}
