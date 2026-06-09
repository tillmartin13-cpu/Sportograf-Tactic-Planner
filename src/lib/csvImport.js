import Papa from 'papaparse';
import { normalizeEventId, uid } from './id';

const COL_ALIASES = {
  acronym: ['photographer acronym', 'acronym', 'kuerzel', 'kürzel', 'code', 'short'],
  firstName: ['photographer first name', 'first name', 'firstname', 'first_name', 'vorname'],
  lastName: ['photographer last name', 'last name', 'lastname', 'last_name', 'nachname'],
  email: ['photographer email', 'email', 'e-mail', 'mail'],
  phone: ['photographer phone', 'phone', 'telefon', 'mobile'],
  dateOfBirth: ['photographer date of birth', 'dateofbirth', 'date of birth', 'date_of_birth', 'dob', 'geburtstag'],
  dispatch: ['dispatch name', 'dispatch', 'einsatzort', 'location', 'standort'],
  cameras: ['cameras', 'camera', 'kameras'],
  lenses: ['lenses', 'lens', 'objektive', 'objektiv'],
  flashes: ['flashes', 'flash', 'blitz', 'blitze'],
  eventId: ['event id', 'eventid', 'event_id', 'id'],
  eventName: ['event name', 'eventname', 'event_name', 'event', 'veranstaltung'],
  eventDate: ['event date', 'eventdate', 'event_date', 'date', 'datum'],
  predecessorEventId: [
    'predecessoreventid',
    'predecessor event id',
    'predecessor_event_id',
    'previous event id',
    'previous_event_id',
    'vorjahr',
    'vorjahreventid',
    'last year event id',
  ],
};

function normalizeHeader(header) {
  return String(header || '')
    .replace(/^\ufeff/, '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, ' ');
}

function findColumn(headers, key) {
  const aliases = COL_ALIASES[key] || [key];
  const normalized = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias);
    if (idx >= 0) return idx;
  }
  return -1;
}

/** Normalize office CSV dates (e.g. "13. 06. 2026") to ISO yyyy-mm-dd. */
export function parseCsvDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const german = raw.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/);
  if (german) {
    const day = german[1].padStart(2, '0');
    const month = german[2].padStart(2, '0');
    return `${german[3]}-${month}-${day}`;
  }

  const dotted = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotted) {
    const day = dotted[1].padStart(2, '0');
    const month = dotted[2].padStart(2, '0');
    return `${dotted[3]}-${month}-${day}`;
  }

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const day = slash[1].padStart(2, '0');
    const month = slash[2].padStart(2, '0');
    return `${slash[3]}-${month}-${day}`;
  }

  return raw;
}

function cell(row, colIndex) {
  if (colIndex < 0) return '';
  return String(row[colIndex] ?? '').trim();
}

function readEventMeta(rows, col) {
  const first = rows[0];
  if (!first) {
    return { eventId: '', eventName: '', eventDate: '', predecessorEventId: '' };
  }

  return {
    eventId: col.eventId >= 0 ? normalizeEventId(cell(first, col.eventId)) : '',
    eventName: col.eventName >= 0 ? cell(first, col.eventName) : '',
    eventDate: col.eventDate >= 0 ? parseCsvDate(cell(first, col.eventDate)) : '',
    predecessorEventId:
      col.predecessorEventId >= 0 ? normalizeEventId(cell(first, col.predecessorEventId)) : '',
  };
}

export function parseTeamCsv(text) {
  const parsed = Papa.parse(text, {
    delimiter: '',
    skipEmptyLines: true,
  });

  if (!parsed.data?.length) {
    throw new Error('CSV file is empty.');
  }

  const headers = parsed.data[0].map((h) => String(h || '').replace(/^\ufeff/, '').trim());
  const rows = parsed.data.slice(1).filter((row) => row.some((cell) => String(cell || '').trim()));

  const col = {
    acronym: findColumn(headers, 'acronym'),
    firstName: findColumn(headers, 'firstName'),
    lastName: findColumn(headers, 'lastName'),
    email: findColumn(headers, 'email'),
    phone: findColumn(headers, 'phone'),
    dateOfBirth: findColumn(headers, 'dateOfBirth'),
    dispatch: findColumn(headers, 'dispatch'),
    cameras: findColumn(headers, 'cameras'),
    lenses: findColumn(headers, 'lenses'),
    flashes: findColumn(headers, 'flashes'),
    eventId: findColumn(headers, 'eventId'),
    eventName: findColumn(headers, 'eventName'),
    eventDate: findColumn(headers, 'eventDate'),
    predecessorEventId: findColumn(headers, 'predecessorEventId'),
  };

  if (col.acronym < 0) {
    throw new Error('CSV must include an Acronym column.');
  }

  const { eventId, eventName, eventDate, predecessorEventId } = readEventMeta(rows, col);

  const photographers = [];
  rows.forEach((row) => {
    const acronym = cell(row, col.acronym).toUpperCase();
    if (!acronym) return;

    const firstName = cell(row, col.firstName);
    const lastName = cell(row, col.lastName);
    photographers.push({
      id: uid('ph'),
      code: acronym,
      firstName,
      lastName,
      name: [firstName, lastName].filter(Boolean).join(' ') || acronym,
      email: cell(row, col.email),
      phone: cell(row, col.phone),
      dateOfBirth: col.dateOfBirth >= 0 ? parseCsvDate(cell(row, col.dateOfBirth)) : '',
      dispatch: cell(row, col.dispatch),
      cameras: cell(row, col.cameras),
      lenses: cell(row, col.lenses),
      flashes: cell(row, col.flashes),
    });
  });

  if (!photographers.length) {
    throw new Error('No team members found in CSV.');
  }

  return { eventId, eventName, eventDate, predecessorEventId, photographers };
}
