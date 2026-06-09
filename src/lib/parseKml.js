import { detectSpotType } from './spotTypes';
import { uid } from './id';

export function parseKml(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('Invalid KML file.');
  }

  const placemarks = Array.from(doc.querySelectorAll('Placemark'));
  const spots = [];

  placemarks.forEach((pm, index) => {
    const point = pm.querySelector('Point coordinates');
    if (!point) return;

    const coordChunk = point.textContent.trim().split(/\s+/)[0] || '';
    const parts = coordChunk.split(',');
    if (parts.length < 2) return;

    const lng = parseFloat(parts[0]);
    const lat = parseFloat(parts[1]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    const nameEl = pm.querySelector('name');
    const name = (nameEl?.textContent || `Spot ${index + 1}`).trim();

    spots.push({
      id: uid('spot'),
      name,
      location_type: 'photo',
      spot_type: detectSpotType(name),
      position: spots.length,
      km_mark: null,
      latitude: lat,
      longitude: lng,
      results: [],
      time_from: '',
      time_to: '',
      tele: true,
      wide: false,
      notes: '',
    });
  });

  if (!spots.length) {
    throw new Error('No point placemarks found in KML.');
  }

  return spots;
}
