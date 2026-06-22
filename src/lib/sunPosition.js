import * as SunCalc from 'suncalc';

const DIRECTIONS = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];

function azimuthLabel(azimuthRad) {
  const deg = (azimuthRad * 180) / Math.PI + 180; // SunCalc: 0=S, convert to 0=N
  const idx = Math.round(deg / 45) % 8;
  return DIRECTIONS[idx];
}

function altitudeDeg(altitudeRad) {
  return Math.round((altitudeRad * 180) / Math.PI);
}

/**
 * Returns sun info for a given lat/lng and datetime string (ISO or "HH:MM").
 * eventDate: "YYYY-MM-DD"
 * time: "HH:MM" or full ISO
 */
export function getSunInfo(lat, lng, eventDate, time) {
  if (lat == null || lng == null || !eventDate) return null;

  let date;
  if (time && time.includes('T')) {
    date = new Date(time);
  } else if (time && /^\d{2}:\d{2}/.test(time)) {
    date = new Date(`${eventDate}T${time.slice(0, 5)}:00`);
  } else {
    // No time — use solar noon
    const times = SunCalc.getTimes(new Date(eventDate), lat, lng);
    date = times.solarNoon;
  }

  if (!date || isNaN(date)) return null;

  const pos = SunCalc.getPosition(date, lat, lng);
  const alt = altitudeDeg(pos.altitude);
  const dir = azimuthLabel(pos.azimuth);
  const times = SunCalc.getTimes(new Date(eventDate), lat, lng);

  return {
    azimuthDeg: Math.round(((pos.azimuth * 180) / Math.PI + 180 + 360) % 360),
    altitudeDeg: alt,
    direction: dir,
    isBelowHorizon: alt < 0,
    isLow: alt >= 0 && alt < 15,        // golden hour / very low sun
    isGolden: alt >= 0 && alt < 20,
    sunrise: times.sunrise,
    sunset: times.sunset,
    goldenHourEnd: times.goldenHourEnd,
    goldenHour: times.goldenHour,        // evening golden hour start
  };
}

export function formatSunTime(date) {
  if (!date || isNaN(date)) return '–';
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

/** Returns a short quality label for the light condition */
export function lightQuality(info) {
  if (!info) return null;
  if (info.isBelowHorizon) return { label: 'Nacht', color: '#6b7280', bg: '#f3f4f6' };
  if (info.altitudeDeg < 6) return { label: 'Dämmerung', color: '#7c3aed', bg: '#f5f3ff' };
  if (info.isGolden) return { label: 'Goldene Stunde', color: '#b45309', bg: '#fffbeb' };
  if (info.altitudeDeg < 40) return { label: 'Gutes Licht', color: '#15803d', bg: '#f0fdf4' };
  return { label: 'Hohes Licht', color: '#0369a1', bg: '#f0f9ff' };
}
