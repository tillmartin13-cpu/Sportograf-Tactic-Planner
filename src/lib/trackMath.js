export function hav(a, b) {
  const R = 6371;
  const dLa = ((b.lat - a.lat) * Math.PI) / 180;
  const dLo = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLa / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLo / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

export function nearestKm(lat, lng, track) {
  let best = Infinity;
  let idx = 0;
  track.points.forEach((p, i) => {
    const d = hav({ lat, lng }, p);
    if (d < best) {
      best = d;
      idx = i;
    }
  });
  return { km: track.cumKm[idx], dist: best };
}

export function snapToTrack(lat, lng, tracks = []) {
  if (!tracks.length) return { lat, lng };
  let best = Infinity;
  let bestPt = { lat, lng };
  tracks.forEach((t) => {
    t.points.forEach((p) => {
      const d = hav({ lat, lng }, p);
      if (d < best) {
        best = d;
        bestPt = p;
      }
    });
  });
  return bestPt;
}

export function findAmbiguous(lat, lng, track) {
  const close = [];
  track.points.forEach((p, i) => {
    const d = hav({ lat, lng }, p);
    if (d <= 0.03) close.push({ i, km: track.cumKm[i], dist: d });
  });
  if (!close.length) return null;

  close.sort((a, b) => a.km - b.km);
  const clusters = [];
  close.forEach((pt) => {
    const last = clusters[clusters.length - 1];
    if (last && pt.km - last[last.length - 1].km <= 0.5) last.push(pt);
    else clusters.push([pt]);
  });
  if (clusters.length < 2) return null;

  const best = clusters.map((cl) => cl.reduce((a, b) => (a.dist < b.dist ? a : b)));
  if (Math.abs(best[0].km - best[best.length - 1].km) < 0.5) return null;

  const deduped = [];
  best.forEach((b) => {
    if (!deduped.length || Math.abs(b.km - deduped[deduped.length - 1].km) > 0.5) deduped.push(b);
  });
  if (deduped.length < 2) return null;
  return deduped.map((b) => ({ km: b.km, dist: b.dist }));
}

export function buildTrackMetrics(points) {
  let totalKm = 0;
  const cumKm = [0];
  for (let i = 1; i < points.length; i += 1) {
    totalKm += hav(points[i - 1], points[i]);
    cumKm.push(totalKm);
  }
  return { totalKm, cumKm };
}

export function buildSpotResults(lat, lng, tracks, kmOverrides = {}, useSnap = true) {
  const snapped = useSnap ? snapToTrack(lat, lng, tracks) : { lat, lng };
  const results = [];

  // Max distance (km) for a spot to be considered on a track
  const MAX_TRACK_DIST = 0.3;

  tracks.forEach((track, trackIndex) => {
    const override = kmOverrides[trackIndex];
    if (Array.isArray(override) && override.length > 0) {
      [...override]
        .sort((a, b) => a - b)
        .forEach((km) => {
          results.push({ trackIndex, trackName: track.name, km, dist: 0 });
        });
    } else {
      const match = nearestKm(snapped.lat, snapped.lng, track);
      if (match.dist <= MAX_TRACK_DIST) {
        results.push({
          trackIndex,
          trackName: track.name,
          km: match.km,
          dist: match.dist,
        });
      }
    }
  });

  return { snapped, results };
}

export function rematchPhotoSpot(spot, tracks) {
  if (spot.location_type && spot.location_type !== 'photo') return spot;
  if (spot.latitude == null || spot.longitude == null) return spot;
  const { snapped, results } = buildSpotResults(spot.latitude, spot.longitude, tracks, {}, true);
  return {
    ...spot,
    latitude: snapped.lat,
    longitude: snapped.lng,
    results,
    km_mark: results[0]?.km ?? spot.km_mark,
  };
}
