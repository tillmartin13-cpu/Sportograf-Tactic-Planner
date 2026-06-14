import { useState, useEffect } from 'react';

/**
 * Fetches weather from Open-Meteo for a given lat/lon and date.
 * Returns { weather, loading, error }.
 * weather = {
 *   hourly: [{ hour, temp, rain, windspeed, weathercode }],
 *   daily: { tempMin, tempMax, rain, weathercode, sunrise, sunset },
 * }
 */
export function useWeather(lat, lon, dateStr) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (lat == null || lon == null || !dateStr || dateStr.trim() === '') return;

    // Only fetch if the date is within ±16 days (Open-Meteo forecast window)
    const eventDate = new Date(dateStr);
    const now = new Date();
    const diffDays = (eventDate - now) / 86400000;
    if (diffDays < -1 || diffDays > 16) {
      setWeather(null);
      return;
    }

    const date = dateStr.slice(0, 10); // YYYY-MM-DD
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&hourly=temperature_2m,precipitation,windspeed_10m,weathercode` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,sunrise,sunset` +
      `&timezone=auto` +
      `&start_date=${date}&end_date=${date}`;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const h = data.hourly;
        const d = data.daily;
        const hourly = (h?.time ?? []).map((t, i) => ({
          hour: new Date(t).getHours(),
          temp: h.temperature_2m?.[i],
          rain: h.precipitation?.[i],
          windspeed: h.windspeed_10m?.[i],
          weathercode: h.weathercode?.[i],
        }));
        const daily = {
          tempMin: d?.temperature_2m_min?.[0],
          tempMax: d?.temperature_2m_max?.[0],
          rain: d?.precipitation_sum?.[0],
          weathercode: d?.weathercode?.[0],
          sunrise: d?.sunrise?.[0],
          sunset: d?.sunset?.[0],
        };
        setWeather({ hourly, daily });
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lon, dateStr]);

  return { weather, loading, error };
}

/** WMO weather code → emoji + label */
export function wmoToEmoji(code) {
  if (code == null) return { icon: '❓', label: 'Unknown' };
  if (code === 0) return { icon: '☀️', label: 'Clear sky' };
  if (code <= 2) return { icon: '🌤️', label: 'Partly cloudy' };
  if (code === 3) return { icon: '☁️', label: 'Overcast' };
  if (code <= 49) return { icon: '🌫️', label: 'Fog' };
  if (code <= 59) return { icon: '🌦️', label: 'Drizzle' };
  if (code <= 69) return { icon: '🌧️', label: 'Rain' };
  if (code <= 79) return { icon: '❄️', label: 'Snow' };
  if (code <= 84) return { icon: '🌦️', label: 'Showers' };
  if (code <= 94) return { icon: '⛈️', label: 'Thunderstorm' };
  return { icon: '🌩️', label: 'Heavy storm' };
}

/** Practical event-day tips based on temperature, rain, and wind.
 *  Each condition is evaluated independently so multiple tips can fire
 *  (e.g. morning rain + hot afternoon both produce a tip). */
export function getPhotoTips(daily, hourlyWindow) {
  const tips = [];
  const tempMax = daily?.tempMax ?? 20;

  const avgWind = hourlyWindow.length
    ? hourlyWindow.reduce((s, h) => s + (h.windspeed ?? 0), 0) / hourlyWindow.length
    : 0;

  // Check per-hour conditions so mixed days (rain morning, sun afternoon) show all tips
  const rainyHours = hourlyWindow.filter((h) => (h.rain ?? 0) > 0.3);
  const sunnyHotHours = hourlyWindow.filter(
    (h) => (h.weathercode ?? 99) <= 1 && (h.temp ?? 0) >= 20,
  );
  const totalRain = hourlyWindow.reduce((s, h) => s + (h.rain ?? 0), 0);

  // Rain tip — based on actual hourly rain accumulation within the event window
  if (totalRain > 4 || rainyHours.length >= 3) {
    tips.push('🌧️ Significant rain expected — pack rain protection for you and your gear');
  } else if (rainyHours.length >= 1) {
    tips.push('🌦️ Rain possible — keep a rain cover handy for you and your equipment');
  }

  // Sunny & warm tip — fires even if other hours are rainy
  if (sunnyHotHours.length >= 1) {
    tips.push('☀️ Sunny and warm periods — pack sunscreen, a cap and plenty of water');
  }

  // Temperature (daily high)
  if (tempMax < 10) tips.push('🥶 Cold event — wear warm clothing, gloves and warm socks');
  else if (tempMax < 15) tips.push('🧥 Could be chilly — better bring an extra layer');

  // Strong wind only
  if (avgWind > 30) tips.push('💨 Windy! Secure tripods and stands carefully');

  if (tips.length === 0) tips.push('✅ Good conditions expected — enjoy the event!');
  return tips;
}
