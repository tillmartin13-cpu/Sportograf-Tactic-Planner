const KEY = (eventId) => `stp_checkins_${eventId}`;

export function loadCheckIns(eventId) {
  try {
    const raw = localStorage.getItem(KEY(eventId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCheckIn(eventId, acronym, data) {
  const all = loadCheckIns(eventId);
  all[acronym.toUpperCase()] = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(KEY(eventId), JSON.stringify(all));
  return all;
}

export function getCheckInRevision(eventId) {
  return localStorage.getItem(KEY(eventId)) || '';
}
