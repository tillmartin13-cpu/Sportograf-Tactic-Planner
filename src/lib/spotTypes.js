export const SPOT_TYPE_COLORS = {
  Start: '#16a34a',
  Swim: '#0891b2',
  T1: '#0d9488',
  Bike: '#d97706',
  T2: '#db2777',
  Run: '#dc2626',
  Finish: '#ea580c',
  km: '#2563eb',
  custom: '#7c3aed',
};

export const SPOT_TYPES = Object.keys(SPOT_TYPE_COLORS);

export function detectSpotType(name) {
  const n = (name || '').toLowerCase();
  if (/\bstart\b/.test(n)) return 'Start';
  if (/\bswim\b/.test(n)) return 'Swim';
  if (/\bt1\b/.test(n)) return 'T1';
  if (/\bbike\b/.test(n)) return 'Bike';
  if (/\bt2\b/.test(n)) return 'T2';
  if (/\brun\b/.test(n)) return 'Run';
  if (/\bfinish\b/.test(n)) return 'Finish';
  if (/^km[\d.]+/i.test(name) || /[\d.]+\s*km/i.test(name)) return 'km';
  return 'custom';
}
