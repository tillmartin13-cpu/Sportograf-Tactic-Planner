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

// Returns UI label overrides for obstacle event types
export function getSpotTerms(event) {
  const t = event?.eventType;
  if (t === 'obstacle_no_gpx' || t === 'obstacle_gpx') {
    return {
      singular: 'Obstacle / Station',
      plural: 'Obstacles / Stations',
      add: '+ Add obstacle',
      newLabel: 'New obstacle',
      editLabel: 'Edit obstacle',
      sectionTitle: 'Obstacles & assignments',
      emptyHint: 'Add obstacles and stations manually.',
      isObstacle: true,
    };
  }
  return {
    singular: 'Spot',
    plural: 'Spots',
    add: '+ Add spot',
    newLabel: 'New spot',
    editLabel: 'Edit spot',
    sectionTitle: 'Spots & assignments',
    emptyHint: 'Import KML/My Maps or an infofile from the left panel, or add spots manually.',
    isObstacle: false,
  };
}

export const HYROX_STATIONS = [
  { id: 'start',    label: 'Start',           color: '#1C2B6B' },
  { id: 'run',      label: 'Running Corridor', color: '#4B5FA6' },
  { id: 'skierg',   label: 'SkiErg',           color: '#2563eb' },
  { id: 'sled_push',label: 'Sled Push',        color: '#7c3aed' },
  { id: 'sled_pull',label: 'Sled Pull',        color: '#9333ea' },
  { id: 'burpee',   label: 'Burpee Broad Jump',color: '#dc2626' },
  { id: 'rowing',   label: 'RowErg',           color: '#0891b2' },
  { id: 'farmers',  label: 'Farmers Carry',    color: '#059669' },
  { id: 'sandbag',  label: 'Sandbag Lunges',   color: '#d97706' },
  { id: 'wallball', label: 'Wall Balls',        color: '#ea580c' },
  { id: 'finish',   label: 'Finish',           color: '#1C2B6B' },
];

export function defaultShifts() {
  return ['1', '2'];
}

export function shiftLabel(shift) {
  return `Schicht ${shift}`;
}
