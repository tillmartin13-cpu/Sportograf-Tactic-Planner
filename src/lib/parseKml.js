import { detectSpotType } from './spotTypes';
import { uid } from './id';
import { buildTrackMetrics } from './trackMath';

function parseCoordString(text) {
  // KML coord tuples: "lng,lat[,alt]" separated by whitespace
  return text
    .trim()
    .split(/\s+/)
    .map((chunk) => {
      const parts = chunk.split(',');
      const lng = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
      return { lat, lng };
    })
    .filter(Boolean);
}

function extractLinePoints(placemark) {
  // LineString or MultiGeometry > LineString
  const points = [];
  for (const el of placemark.querySelectorAll('LineString coordinates')) {
    points.push(...parseCoordString(el.textContent));
  }
  return points;
}

export function parseKml(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('Invalid KML file.');
  }

  const placemarks = Array.from(doc.querySelectorAll('Placemark'));
  const spots = [];
  const trackSegments = []; // [{name, points}]

  placemarks.forEach((pm, index) => {
    const nameEl = pm.querySelector('name');
    const name = (nameEl?.textContent || '').trim();

    // Point → spot
    const point = pm.querySelector('Point coordinates');
    if (point) {
      const coordChunk = point.textContent.trim().split(/\s+/)[0] || '';
      const parts = coordChunk.split(',');
      if (parts.length >= 2) {
        const lng = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          spots.push({
            id: uid('spot'),
            name: name || `Spot ${index + 1}`,
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
        }
      }
      return;
    }

    // LineString / MultiGeometry → route track
    const linePoints = extractLinePoints(pm);
    if (linePoints.length > 1) {
      trackSegments.push({ name: name || 'route', points: linePoints });
    }
  });

  // Build track objects (sampled + metrics) for each LineString
  const tracks = trackSegments.map(({ name, points }) => {
    let sampled = points;
    if (points.length > 800) {
      const step = Math.ceil(points.length / 800);
      sampled = points.filter((_, i) => i % step === 0);
      const last = points[points.length - 1];
      if (sampled[sampled.length - 1] !== last) sampled.push(last);
    }
    const { totalKm, cumKm } = buildTrackMetrics(sampled);
    return { name, points: sampled, cumKm, totalKm };
  });

  return { spots, tracks };
}
