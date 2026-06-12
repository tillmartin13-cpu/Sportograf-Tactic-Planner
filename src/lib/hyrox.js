export function isHyroxEvent(event) {
  if (!event) return false;
  if (event.eventType === 'hyrox') return true;
  return (event.name || '').toLowerCase().includes('hyrox');
}

// Events with no GPS route (hide GPX import, KM marks, route features)
export function isNoRouteEvent(event) {
  if (!event) return false;
  return event.eventType === 'obstacle_no_gpx' || event.eventType === 'hyrox';
}

// Keep old name as alias for backwards compat
export function isIndoorEvent(event) {
  return isNoRouteEvent(event);
}

export function detectEventType(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('hyrox')) return 'hyrox';
  return null; // null = no auto-detect, user must choose
}

export const HYROX_STATIONS = [
  { id: 'start',    label: 'Start / Finish',       icon: '🏁', color: '#1C2B6B' },
  { id: 'run',      label: 'Running Corridor',      icon: '🏃', color: '#4B5FA6' },
  { id: 'skierg',   label: 'SkiErg',                icon: '⛷️', color: '#2563eb' },
  { id: 'sled_push',label: 'Sled Push',             icon: '💪', color: '#7c3aed' },
  { id: 'sled_pull',label: 'Sled Pull',             icon: '🔗', color: '#9333ea' },
  { id: 'burpee',   label: 'Burpee Broad Jump',     icon: '🤸', color: '#dc2626' },
  { id: 'rowing',   label: 'RowErg',                icon: '🚣', color: '#0891b2' },
  { id: 'farmers',  label: 'Farmers Carry',         icon: '🏋️', color: '#059669' },
  { id: 'sandbag',  label: 'Sandbag Lunges',        icon: '🎒', color: '#d97706' },
  { id: 'wallball', label: 'Wall Balls',             icon: '🏀', color: '#ea580c' },
];

export function parseWaves(waveString) {
  // "A,B,C" or "A B C" or "Wave A, Wave B"
  return waveString
    .split(/[\s,;]+/)
    .map((w) => w.replace(/^wave\s*/i, '').trim().toUpperCase())
    .filter(Boolean);
}

export function defaultWaves() {
  return ['A', 'B', 'C', 'D'];
}
