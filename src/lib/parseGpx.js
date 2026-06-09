import { buildTrackMetrics } from './trackMath';

export function parseGpx(xmlText, fileName = 'route') {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  const points = [];

  for (const tag of ['trkpt', 'rtept', 'wpt']) {
    const nodes = doc.querySelectorAll(tag);
    if (nodes.length > 0) {
      nodes.forEach((node) => {
        const lat = parseFloat(node.getAttribute('lat'));
        const lng = parseFloat(node.getAttribute('lon'));
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          points.push({ lat, lng });
        }
      });
      break;
    }
  }

  if (points.length === 0) {
    throw new Error('No track points found in GPX file.');
  }

  let sampled = points;
  if (points.length > 800) {
    const step = Math.ceil(points.length / 800);
    sampled = points.filter((_, i) => i % step === 0);
    const last = points[points.length - 1];
    if (sampled[sampled.length - 1] !== last) sampled.push(last);
  }

  const { totalKm, cumKm } = buildTrackMetrics(sampled);
  const name = fileName.replace(/\.gpx$/i, '');

  return {
    name,
    points: sampled,
    cumKm,
    totalKm,
  };
}

/** @deprecated use track.points mapped to [lat,lng] */
export function trackToLatLng(track) {
  return track.points.map((p) => [p.lat, p.lng]);
}
