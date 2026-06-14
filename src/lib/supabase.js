const SUPABASE_URL = 'https://upijqspdxkpcyexgqewd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qk6pam1kd3m6UXOPGdp72w_65FZNmWi';
const BUCKET = 'certificates';

/** Upload a certificate blob to Supabase Storage. Returns public URL. */
export async function uploadCertificate(blob, filename) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'image/jpeg',
      'x-upsert': 'true',
    },
    body: blob,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.status);
    throw new Error(`Upload failed: ${msg}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
}

/** List all certificates for a given event ID. Returns array of { acronym, url, updatedAt }. */
export async function listCertificatesForEvent(eventId) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prefix: '', limit: 500, sortBy: { column: 'updated_at', order: 'desc' } }),
  });
  if (!res.ok) throw new Error('List failed');
  const files = await res.json();
  const suffix = `_${eventId}.jpg`;
  return files
    .filter((f) => f.name && f.name.endsWith(suffix))
    .map((f) => ({
      filename: f.name,
      acronym: f.name.slice(0, -suffix.length),
      url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${f.name}`,
      updatedAt: f.updated_at,
    }));
}
