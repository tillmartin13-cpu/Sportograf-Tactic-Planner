export function extractCoords(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;

  let m = text.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m) return { lat: +m[1], lng: +m[2], src: 'Google Maps' };

  m = text.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m) return { lat: +m[1], lng: +m[2], src: 'Google Maps' };

  m = text.match(/maps\/place\/[^/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m) return { lat: +m[1], lng: +m[2], src: 'Google Maps' };

  m = text.match(/!3d(-?\d+\.?\d+)!4d(-?\d+\.?\d+)/);
  if (m) return { lat: +m[1], lng: +m[2], src: 'Google Maps' };

  const wa = text.replace(/&amp;/g, '&');
  m = wa.match(/[?&](?:lat|q)=(-?\d+\.?\d*)(?:[,&]|%2C)(?:lng=)?(-?\d+\.?\d*)/);
  if (m) return { lat: +m[1], lng: +m[2], src: 'WhatsApp' };

  m = text.match(/(-?\d{1,3}\.?\d+)[,;\s]+(-?\d{1,3}\.?\d+)/);
  if (m) {
    const a = +m[1];
    const b = +m[2];
    if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return { lat: a, lng: b, src: 'Coordinates' };
  }

  return null;
}
