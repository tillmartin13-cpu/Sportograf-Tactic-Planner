function toMinutes(value) {
  if (!value) return null;
  if (value.includes('T')) {
    const time = value.split('T')[1] || value;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function toMinutesFromDateTime(value) {
  return toMinutes(value);
}

export function buildTimelineRange(spots) {
  let min = null;
  let max = null;

  spots.forEach((spot) => {
    const start = toMinutes(spot.time_from);
    const end = toMinutes(spot.time_to);
    if (start != null) min = min == null ? start : Math.min(min, start);
    if (end != null) max = max == null ? end : Math.max(max, end);
  });

  if (min == null || max == null || max <= min) {
    return null;
  }

  return { min, max, span: max - min };
}

export function windowsOverlap(aFrom, aTo, bFrom, bTo) {
  const startA = toMinutes(aFrom);
  const endA = toMinutes(aTo);
  const startB = toMinutes(bFrom);
  const endB = toMinutes(bTo);
  if (startA == null || endA == null || startB == null || endB == null) return false;
  return startA < endB && startB < endA;
}

export function formatTimeShort(value) {
  if (!value) return '—';
  if (value.includes('T')) return value.split('T')[1].slice(0, 5);
  return value.slice(0, 5);
}
