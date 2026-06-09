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

    setLoading(true);
    setError(null);

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
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
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
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

/** Photography-specific weather tips based on weather & time window */
export function getPhotoTips(daily, hourlyWindow) {
  const tips = [];
  const rain = daily?.rain ?? 0;
  const tempMax = daily?.tempMax ?? 20;
  const tempMin = daily?.tempMin ?? 10;
  const avg = hourlyWindow.length
    ? hourlyWindow.reduce((s, h) => s + (h.windspeed ?? 0), 0) / hourlyWindow.length
    : 0;

  if (rain > 5) tips.push('🌧️ Significant rain expected — bring rain covers for your gear');
  else if (rain > 0.5) tips.push('🌦️ Light rain possible — keep a rain cover handy');

  if (avg > 30) tips.push('💨 High wind — brace carefully when shooting with tele lenses');
  else if (avg > 15) tips.push('🌬️ Moderate wind — watch for camera shake at slow shutter speeds');

  if (tempMin < 5) tips.push('🥶 Cold conditions — keep batteries warm in your jacket');
  if (tempMax > 30) tips.push('🌡️ Hot day — protect gear from direct sun, stay hydrated');

  const codes = hourlyWindow.map((h) => h.weathercode ?? 0);
  const hasHarshLight = codes.some((c) => c === 0);
  if (hasHarshLight) {
    tips.push('☀️ Potential harsh direct sunlight — overexposure risk, watch highlights');
  }

  const hasCloudy = codes.some((c) => c >= 1 && c <= 3);
  if (hasCloudy && rain <= 0.5) {
    tips.push('🌤️ Overcast/diffuse light — great for even exposures, no harsh shadows');
  }

  if (tips.length === 0) tips.push('✅ Good shooting conditions expected');
  return tips;
}
