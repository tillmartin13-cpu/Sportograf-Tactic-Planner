import { detectSpotType } from './spotTypes';
import { uid } from './id';
import { buildTrackMetrics } from './trackMath';

// Parse KML coordinate string "lng,lat[,alt] lng,lat[,alt] ..."
function parseCoordString(text) {
  return (text || '')
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

function buildTrack(name, points) {
  if (points.length < 2) return null;
  let sampled = points;
  if (points.length > 800) {
    const step = Math.ceil(points.length / 800);
    sampled = points.filter((_, i) => i % step === 0);
    const last = points[points.length - 1];
    if (sampled[sampled.length - 1] !== last) sampled.push(last);
  }
  const { totalKm, cumKm } = buildTrackMetrics(sampled);
  return { name, points: sampled, cumKm, totalKm };
}

export function parseKml(xmlText) {
  // Parse as text/html — avoids XML namespace issues entirely.
  // All tag names are lowercased by the HTML parser.
  const doc = new DOMParser().parseFromString(xmlText, 'text/html');

  const placemarks = Array.from(doc.querySelectorAll('placemark'));
  const spots = [];
  const tracks = [];

  placemarks.forEach((pm, index) => {
    const nameEl = pm.querySelector('name');
    const name = (nameEl?.textContent || '').trim();

    // LineString → route track (check first so Point check below can't shadow it)
    const lineCoordEl = pm.querySelector('linestring coordinates');
    if (lineCoordEl) {
      const points = parseCoordString(lineCoordEl.textContent);
      const track = buildTrack(name || 'route', points);
      if (track) tracks.push(track);
      return;
    }

    // MultiGeometry containing LineString(s)
    const multiLineEls = pm.querySelectorAll('multigeometry linestring coordinates');
    if (multiLineEls.length > 0) {
      let allPoints = [];
      multiLineEls.forEach((el) => allPoints.push(...parseCoordString(el.textContent)));
      const track = buildTrack(name || 'route', allPoints);
      if (track) tracks.push(track);
      return;
    }

    // gx:Track (Google extension) — <gx:coord>lng lat alt</gx:coord>
    // In HTML parser gx:track becomes "gx:track" or "gx" — query by text
    const gxCoordEls = pm.querySelectorAll('gx\\:coord, coord');
    if (gxCoordEls.length > 1) {
      const points = Array.from(gxCoordEls).map((el) => {
        const parts = el.textContent.trim().split(/\s+/);
        const lng = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
        return { lat, lng };
      }).filter(Boolean);
      const track = buildTrack(name || 'route', points);
      if (track) tracks.push(track);
      return;
    }

    // Point → spot
    const pointCoordEl = pm.querySelector('point coordinates');
    if (pointCoordEl) {
      const chunk = pointCoordEl.textContent.trim().split(/\s+/)[0] || '';
      const parts = chunk.split(',');
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
  });

  return { spots, tracks };
}
