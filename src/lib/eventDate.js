/** Event date from planner export (`eventDate`) or legacy/import alias (`date`). */
export function getEventDate(event) {
  if (!event) return '';
  return event.eventDate || event.date || '';
}

/** Parse hour from "HH:MM" or ISO datetime strings. */
export function parseTimeHour(timeStr) {
  if (!timeStr) return NaN;
  const iso = timeStr.match(/T(\d{2}):(\d{2})/);
  if (iso) return parseInt(iso[1], 10);
  const part = timeStr.split(':')[0];
  const n = parseInt(part, 10);
  return Number.isNaN(n) ? NaN : n;
}
