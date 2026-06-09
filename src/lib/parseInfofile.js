import { detectSpotType } from './spotTypes';
import { uid } from './id';

const CAMERA_SKIP = /(LS\d*|DRONE|IMP)/i;

function normalizeCameraCode(code) {
  let c = (code || '').trim().toUpperCase();
  if (c === 'MAWI1') c = 'MAWI';
  return c;
}

function shouldSkipCamera(code) {
  return CAMERA_SKIP.test(code);
}

function parseGermanDateTime(value) {
  if (!value) return null;
  const m = value.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!m) return value;
  const [, dd, mm, yyyy, hh, mi, ss] = m;
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
}

function parseLocation(line) {
  const m = line.match(/Location:\s*([\d.\-]+)\s+([\d.\-NULL]+)/i);
  if (!m || m[1] === 'NULL' || m[2] === 'NULL') return { lat: null, lng: null };
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return { lat: null, lng: null };
  return { lat, lng };
}

export function parseInfofile(text) {
  const lines = text.split(/\r?\n/);
  const meta = {};
  const rawSpots = [];
  let currentSpot = null;
  let currentCamera = null;

  const flushCamera = () => {
    if (currentCamera && currentSpot) {
      currentSpot.cameras.push(currentCamera);
    }
    currentCamera = null;
  };

  const flushSpot = () => {
    flushCamera();
    if (currentSpot) rawSpots.push(currentSpot);
    currentSpot = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('EventId:')) {
      meta.eventId = line.split(':').slice(1).join(':').trim();
      continue;
    }
    if (line.startsWith('Spots:')) {
      meta.spots = parseInt(line.split(':')[1], 10);
      continue;
    }
    if (line.startsWith('Total Images:')) {
      meta.totalImages = line.split(':').slice(1).join(':').trim();
      continue;
    }
    if (line.startsWith('Time:') && !currentCamera) {
      const m = line.match(/Time:\s+(\S+)\s+(\S+)\s+to\s+(\S+)\s+(\S+)/);
      if (m) {
        meta.date = m[1];
        meta.time_from = m[2];
        meta.time_to = m[4];
      }
      continue;
    }

    const spotMatch = line.match(/^\((\d+)\)\s*-\s*(.+)$/);
    if (spotMatch) {
      flushSpot();
      const name = spotMatch[2].trim();
      const kmFromPrefix = name.match(/^km([\d.]+)/i);
      const kmFromSuffix = name.match(/([\d.]+)\s*km/i);
      currentSpot = {
        position: parseInt(spotMatch[1], 10) - 1,
        name,
        spot_type: detectSpotType(name),
        km_mark: kmFromPrefix ? parseFloat(kmFromPrefix[1]) : kmFromSuffix ? parseFloat(kmFromSuffix[1]) : null,
        cameras: [],
      };
      continue;
    }

    if (currentSpot && !line.includes(':')) {
      flushCamera();
      const code = normalizeCameraCode(line);
      if (shouldSkipCamera(code)) {
        currentCamera = null;
        continue;
      }
      currentCamera = {
        code,
        images: 0,
        time_from: null,
        time_to: null,
        lat: null,
        lng: null,
      };
      continue;
    }

    if (currentCamera) {
      if (line.startsWith('Images:')) {
        currentCamera.images = parseInt(line.split(':')[1], 10) || 0;
      } else if (line.startsWith('Time:')) {
        const m = line.match(/Time:\s+(\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}:\d{2})\s+until\s+(\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}:\d{2})/);
        if (m) {
          currentCamera.time_from = parseGermanDateTime(m[1]);
          currentCamera.time_to = parseGermanDateTime(m[2]);
        }
      } else if (line.startsWith('Location:')) {
        Object.assign(currentCamera, parseLocation(line));
      }
    }
  }

  flushSpot();

  return { meta, rawSpots };
}

function averageCoords(cameras) {
  const valid = cameras.filter((c) => c.lat != null && c.lng != null);
  if (!valid.length) return { latitude: null, longitude: null };
  const lat = valid.reduce((s, c) => s + c.lat, 0) / valid.length;
  const lng = valid.reduce((s, c) => s + c.lng, 0) / valid.length;
  return { latitude: lat, longitude: lng };
}

export function infofileToTactic({ meta, rawSpots }, photographerIndex = new Map()) {
  const spots = [];
  const assignments = [];
  const photographerCodes = new Set();

  rawSpots.forEach((raw) => {
    const coords = averageCoords(raw.cameras);
    const spotId = uid('spot');
    const spot = {
      id: spotId,
      name: raw.name,
      location_type: 'photo',
      spot_type: raw.spot_type,
      position: raw.position,
      km_mark: raw.km_mark,
      latitude: coords.latitude,
      longitude: coords.longitude,
      results: [],
      time_from: null,
      time_to: null,
      tele: true,
      wide: false,
      notes: '',
    };

    const times = raw.cameras
      .filter((c) => c.time_from && c.time_to)
      .map((c) => ({ from: c.time_from, to: c.time_to }));

    if (times.length) {
      spot.time_from = times.reduce((min, t) => (t.from < min ? t.from : min), times[0].from);
      spot.time_to = times.reduce((max, t) => (t.to > max ? t.to : max), times[0].to);
    }

    spots.push(spot);

    raw.cameras.forEach((camera) => {
      photographerCodes.add(camera.code);
      const photographerId = photographerIndex.get(camera.code);
      if (!photographerId) return;
      assignments.push({
        id: uid('asg'),
        spot_id: spotId,
        photographer_id: photographerId,
        time_from: camera.time_from || spot.time_from,
        time_to: camera.time_to || spot.time_to,
        tele: true,
        wide: false,
      });
    });
  });

  return {
    meta,
    spots,
    assignments,
    photographerCodes: [...photographerCodes],
  };
}
