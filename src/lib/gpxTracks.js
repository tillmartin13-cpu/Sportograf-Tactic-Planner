import { buildTrackMetrics } from './trackMath';

export function pointsToLatLngArray(points) {
  return (points || []).map((p) => [p.lat, p.lng]);
}

export function legacyFlatToTrack(flat = [], name = 'route') {
  const points = flat.map(([lat, lng]) => ({ lat, lng }));
  const { totalKm, cumKm } = buildTrackMetrics(points);
  return { name, points, cumKm, totalKm };
}

export function getGpxTracks(tactic) {
  if (Array.isArray(tactic?.gpxTracks) && tactic.gpxTracks.length) {
    return tactic.gpxTracks;
  }
  if (Array.isArray(tactic?.gpxTrack) && tactic.gpxTrack.length) {
    return [legacyFlatToTrack(tactic.gpxTrack)];
  }
  return [];
}

export function getAllTrackLatLng(tactic) {
  return getGpxTracks(tactic).flatMap((t) => pointsToLatLngArray(t.points));
}

export function getPrimaryTrackLatLng(tactic) {
  const tracks = getGpxTracks(tactic);
  return tracks.length ? pointsToLatLngArray(tracks[0].points) : [];
}
