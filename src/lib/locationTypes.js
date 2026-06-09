export const LOCATION_TYPES = {
  photo: { id: 'photo', label: 'Photo spot', color: '#CC2B2B', emoji: null },
  meeting: { id: 'meeting', label: 'Meeting', color: '#2196F3', emoji: '🤝' },
  copy: { id: 'copy', label: 'Copy station', color: '#2196F3', emoji: '💻' },
  parking: { id: 'parking', label: 'Parking', color: '#2196F3', emoji: '🅿' },
  other: { id: 'other', label: 'Other', color: '#2196F3', emoji: '🚩' },
};

export const TRACK_COLORS = ['#CC2B2B', '#1C2B6B', '#d97706', '#0891b2', '#7c3aed', '#db2777'];

export function isPhotoLocation(spot) {
  return !spot?.location_type || spot.location_type === 'photo';
}

export function getLocationType(spot) {
  return spot?.location_type || 'photo';
}

export function getLocationColor(spot) {
  const type = getLocationType(spot);
  return LOCATION_TYPES[type]?.color || LOCATION_TYPES.photo.color;
}

export function getMarkerDisplayName(spot) {
  const type = getLocationType(spot);
  const cfg = LOCATION_TYPES[type];
  if (type === 'photo') return spot.name || '?';
  if (cfg?.emoji) return `${cfg.emoji} ${spot.name || ''}`.trim();
  return spot.name || '?';
}
