// Source: Academy Operations camera settings table + team equipment data
// Logic: higher MP sensors get smaller size to keep file sizes manageable
// Brand → Model → { imageSize, jpeg }

export const CAMERA_SETTINGS = [
  // ─── Canon ───────────────────────────────────────────────────────────────
  { brand: 'Canon', model: 'EOS R1',            imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Canon', model: 'EOS R3',            imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Canon', model: 'EOS R5 Mark II',    imageSize: 'S1',                       jpeg: 'JPEG Normal / Standard' }, // 45MP
  { brand: 'Canon', model: 'EOS R5',            imageSize: 'S1',                       jpeg: 'JPEG Normal / Standard' }, // 45MP
  { brand: 'Canon', model: 'EOS R6 Mark II',    imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Canon', model: 'EOS R6',            imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 20MP
  { brand: 'Canon', model: 'EOS R7',            imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 33MP APS-C
  { brand: 'Canon', model: 'EOS R8',            imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Canon', model: 'EOS R10',           imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C
  { brand: 'Canon', model: 'EOS R50',           imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C
  { brand: 'Canon', model: 'EOS R100',          imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C
  { brand: 'Canon', model: 'EOS R',             imageSize: 'M1; Crop 1.6×: L',        jpeg: 'JPEG Normal / Standard' }, // 30MP
  { brand: 'Canon', model: 'EOS RP',            imageSize: 'M1',                       jpeg: 'JPEG Normal / Standard' }, // 26MP
  { brand: 'Canon', model: 'EOS-1D X Mark III', imageSize: 'M1',                       jpeg: 'JPEG Normal / Standard' }, // 20MP
  { brand: 'Canon', model: 'EOS-1D X Mark II',  imageSize: 'M1',                       jpeg: 'JPEG Normal / Standard' }, // 20MP
  { brand: 'Canon', model: 'EOS-1D X',          imageSize: 'M1',                       jpeg: 'JPEG Normal / Standard' }, // 18MP
  { brand: 'Canon', model: 'EOS-1D Mark IV',    imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 16MP
  { brand: 'Canon', model: 'EOS 5DS R',         imageSize: 'S1',                       jpeg: 'JPEG Normal / Standard' }, // 51MP
  { brand: 'Canon', model: 'EOS 5DS',           imageSize: 'S1',                       jpeg: 'JPEG Normal / Standard' }, // 51MP
  { brand: 'Canon', model: 'EOS 5D Mark IV',    imageSize: 'M1',                       jpeg: 'JPEG Normal / Standard' }, // 30MP
  { brand: 'Canon', model: 'EOS 5D Mark III',   imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 22MP
  { brand: 'Canon', model: 'EOS 5D Mark II',    imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 21MP
  { brand: 'Canon', model: 'EOS 6D Mark II',    imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 26MP
  { brand: 'Canon', model: 'EOS 6D',            imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 20MP
  { brand: 'Canon', model: 'EOS 7D Mark II',    imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 20MP APS-C
  { brand: 'Canon', model: 'EOS 7D',            imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 18MP APS-C
  { brand: 'Canon', model: 'EOS 90D',           imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 33MP APS-C
  { brand: 'Canon', model: 'EOS 80D',           imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C
  { brand: 'Canon', model: 'EOS 77D',           imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C
  { brand: 'Canon', model: 'EOS 70D',           imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 20MP APS-C
  { brand: 'Canon', model: 'EOS 800D',          imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C
  { brand: 'Canon', model: 'EOS 750D',          imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C
  { brand: 'Canon', model: 'EOS M50',           imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C

  // ─── Nikon ───────────────────────────────────────────────────────────────
  { brand: 'Nikon', model: 'Z9',                imageSize: 'S',                        jpeg: 'JPEG Normal / Standard' }, // 46MP
  { brand: 'Nikon', model: 'Z8',                imageSize: 'S',                        jpeg: 'JPEG Normal / Standard' }, // 46MP
  { brand: 'Nikon', model: 'Z7 II',             imageSize: 'S',                        jpeg: 'JPEG Normal / Standard' }, // 46MP
  { brand: 'Nikon', model: 'Z7',                imageSize: 'S; D× crop: M',            jpeg: 'JPEG Normal / Standard' }, // 46MP
  { brand: 'Nikon', model: 'Z6 III',            imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Nikon', model: 'Z6 II',             imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Nikon', model: 'Z6',                imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Nikon', model: 'Z5 II',             imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Nikon', model: 'Z5',                imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Nikon', model: 'Zf',                imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Nikon', model: 'Zfc',               imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 21MP APS-C
  { brand: 'Nikon', model: 'Z50 II',            imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 21MP APS-C
  { brand: 'Nikon', model: 'Z50',               imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 21MP APS-C
  { brand: 'Nikon', model: 'D6',                imageSize: 'M; Crop 1.2×: L',          jpeg: 'JPEG Normal / Standard' }, // 21MP
  { brand: 'Nikon', model: 'D5',                imageSize: 'M; Crop 1.2×: L',          jpeg: 'JPEG Normal / Standard' }, // 21MP
  { brand: 'Nikon', model: 'D4s',               imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 16MP
  { brand: 'Nikon', model: 'D4',                imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 16MP
  { brand: 'Nikon', model: 'D3s',               imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 12MP
  { brand: 'Nikon', model: 'D3',                imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 12MP
  { brand: 'Nikon', model: 'D850',              imageSize: 'S; Crop 1.2× & D×: M',    jpeg: 'JPEG Normal / Standard' }, // 46MP
  { brand: 'Nikon', model: 'D810',              imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 36MP
  { brand: 'Nikon', model: 'D800E',             imageSize: 'M; Crop 1.2×: M; D× crop: L', jpeg: 'JPEG Normal / Standard' }, // 36MP
  { brand: 'Nikon', model: 'D800',              imageSize: 'M; Crop 1.2×: M; D× crop: L', jpeg: 'JPEG Normal / Standard' }, // 36MP
  { brand: 'Nikon', model: 'D780',              imageSize: 'M; D× crop: L',            jpeg: 'JPEG Normal / Standard' }, // 25MP
  { brand: 'Nikon', model: 'D750',              imageSize: 'M; Crop 1.2× / D×: L',    jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Nikon', model: 'D700',              imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 12MP
  { brand: 'Nikon', model: 'D610',              imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Nikon', model: 'D600',              imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Nikon', model: 'D500',              imageSize: 'M; Crop 1.3×: L',          jpeg: 'JPEG Normal / Standard' }, // 21MP APS-C
  { brand: 'Nikon', model: 'D300s',             imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 12MP APS-C
  { brand: 'Nikon', model: 'D300',              imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 12MP APS-C
  { brand: 'Nikon', model: 'D7500',             imageSize: 'M; Crop 1.3×: L',          jpeg: 'JPEG Normal / Standard' }, // 21MP APS-C
  { brand: 'Nikon', model: 'D7200',             imageSize: 'M; Crop 1.3×: L',          jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C
  { brand: 'Nikon', model: 'D7100',             imageSize: 'M; Crop 1.3×: L',          jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C
  { brand: 'Nikon', model: 'D7000',             imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 16MP APS-C
  { brand: 'Nikon', model: 'D5600',             imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C
  { brand: 'Nikon', model: 'D5500',             imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C
  { brand: 'Nikon', model: 'D5300',             imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C

  // ─── Sony ────────────────────────────────────────────────────────────────
  { brand: 'Sony',  model: 'A1 II',             imageSize: 'S',                        jpeg: 'JPEG Normal / Standard' }, // 50MP
  { brand: 'Sony',  model: 'A1',                imageSize: 'S',                        jpeg: 'JPEG Normal / Standard' }, // 50MP
  { brand: 'Sony',  model: 'A9 III',            imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Sony',  model: 'A9 II',             imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Sony',  model: 'A9',                imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Sony',  model: 'A7R V',             imageSize: 'S; APS-C: M',             jpeg: 'JPEG Normal / Standard' }, // 61MP
  { brand: 'Sony',  model: 'A7R IV',            imageSize: 'S; APS-C: M',             jpeg: 'JPEG Normal / Standard' }, // 61MP
  { brand: 'Sony',  model: 'A7R III',           imageSize: 'S; APS-C: M',             jpeg: 'JPEG Normal / Standard' }, // 42MP
  { brand: 'Sony',  model: 'A7R II',            imageSize: 'S; APS-C: M',             jpeg: 'JPEG Normal / Standard' }, // 42MP
  { brand: 'Sony',  model: 'A7S III',           imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 12MP
  { brand: 'Sony',  model: 'A7S II',            imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 12MP
  { brand: 'Sony',  model: 'A7 V',              imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 33MP
  { brand: 'Sony',  model: 'A7 IV',             imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 33MP
  { brand: 'Sony',  model: 'A7 III',            imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Sony',  model: 'A7 II',             imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Sony',  model: 'A7',                imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Sony',  model: 'A7C II',            imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 33MP
  { brand: 'Sony',  model: 'A7C',               imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Sony',  model: 'A7CR',              imageSize: 'S',                        jpeg: 'JPEG Normal / Standard' }, // 61MP
  { brand: 'Sony',  model: 'A6700',             imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 26MP APS-C
  { brand: 'Sony',  model: 'A6600',             imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C
  { brand: 'Sony',  model: 'A6500',             imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C
  { brand: 'Sony',  model: 'A6400',             imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C
  { brand: 'Sony',  model: 'A6300',             imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C
  { brand: 'Sony',  model: 'A6100',             imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C
  { brand: 'Sony',  model: 'A6000',             imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C
  { brand: 'Sony',  model: 'A77 II',            imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C
  { brand: 'Sony',  model: 'A68',               imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C
  { brand: 'Sony',  model: 'RX100',             imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // various, use L
  { brand: 'Sony',  model: 'FX30',              imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 20MP APS-C
  { brand: 'Sony',  model: 'FX3',               imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 12MP
  { brand: 'Sony',  model: 'ZV-E1',             imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 12MP
  { brand: 'Sony',  model: 'ZV-E10',            imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C

  // ─── Fujifilm ─────────────────────────────────────────────────────────────
  { brand: 'Fujifilm', model: 'X-H2S',          imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 26MP APS-C
  { brand: 'Fujifilm', model: 'X-H2',           imageSize: 'S',                        jpeg: 'JPEG Normal / Standard' }, // 40MP APS-C
  { brand: 'Fujifilm', model: 'X-H1',           imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C
  { brand: 'Fujifilm', model: 'X-T5',           imageSize: 'S',                        jpeg: 'JPEG Normal / Standard' }, // 40MP APS-C
  { brand: 'Fujifilm', model: 'X-T4',           imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 26MP APS-C
  { brand: 'Fujifilm', model: 'X-T3',           imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 26MP APS-C
  { brand: 'Fujifilm', model: 'X-T2',           imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C
  { brand: 'Fujifilm', model: 'X-T30 II',       imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 26MP APS-C
  { brand: 'Fujifilm', model: 'X-T30',          imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 26MP APS-C
  { brand: 'Fujifilm', model: 'X-T20',          imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C
  { brand: 'Fujifilm', model: 'X-S20',          imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 26MP APS-C
  { brand: 'Fujifilm', model: 'X-Pro2',         imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP APS-C
  { brand: 'Fujifilm', model: 'GFX',            imageSize: 'S',                        jpeg: 'JPEG Normal / Standard' }, // 51-102MP medium format

  // ─── Panasonic ────────────────────────────────────────────────────────────
  { brand: 'Panasonic', model: 'S1R',           imageSize: 'S',                        jpeg: 'JPEG Normal / Standard' }, // 47MP
  { brand: 'Panasonic', model: 'S1H II',        imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Panasonic', model: 'S1H',           imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Panasonic', model: 'S1',            imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Panasonic', model: 'S5 IIX',        imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Panasonic', model: 'S5 II',         imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Panasonic', model: 'S5',            imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Panasonic', model: 'S9',            imageSize: 'M',                        jpeg: 'JPEG Normal / Standard' }, // 24MP
  { brand: 'Panasonic', model: 'GH6',           imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 25MP MFT
  { brand: 'Panasonic', model: 'GH5',           imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 20MP MFT
  { brand: 'Panasonic', model: 'G9 II',         imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 25MP MFT
  { brand: 'Panasonic', model: 'G9',            imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 20MP MFT

  // ─── OM System / Olympus ──────────────────────────────────────────────────
  { brand: 'OM SYSTEM', model: 'OM-1 Mark II',  imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 20MP MFT
  { brand: 'OM SYSTEM', model: 'OM-1',          imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 20MP MFT
  { brand: 'Olympus',   model: 'OM-D EM-1 Mark III', imageSize: 'L',                   jpeg: 'JPEG Normal / Standard' }, // 20MP MFT
  { brand: 'Olympus',   model: 'OM-D EM-1',     imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 20MP MFT
  { brand: 'Olympus',   model: 'OM-D EM-5',     imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' }, // 16-20MP MFT
  { brand: 'Olympus',   model: 'all models',     imageSize: 'L',                        jpeg: 'JPEG Normal / Standard' },
];

// Normalise a string for fuzzy matching
function normalise(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // strip spaces, dashes, dots
    .replace(/mk(\d)/, 'mark$1')
    .replace(/mkii/, 'markii')
    .replace(/mkiii/, 'markiii')
    .replace(/\bii\b/, '2')
    .replace(/\biii\b/, '3')
    .replace(/\biv\b/, '4')
    .replace(/alpha/, 'a')
    .replace(/eos/, '')
    .replace(/ilce/, 'a') // Sony ILCE-7RM5 → a7rm5
    .replace(/lumix/, '')
    .replace(/omsystem/, 'om')
    .replace(/r5c/, 'r5') // treat R5C same as R5
    .trim();
}

/**
 * Find camera settings by a free-form camera string (from team CSV).
 * Returns the best match or null.
 */
export function findCameraSettings(cameraString) {
  if (!cameraString || typeof cameraString !== 'string') return null;
  const input = normalise(cameraString);
  if (!input) return null;

  // Score each entry: higher = better match
  let best = null;
  let bestScore = 0;

  for (const entry of CAMERA_SETTINGS) {
    const modelNorm = normalise(entry.model);
    const brandNorm = normalise(entry.brand);

    let score = 0;
    if (input.includes(modelNorm) || modelNorm.includes(input)) {
      // Base match score; add model length so more specific models beat shorter prefixes
      // e.g. "d500" matches both D5 (len 2) and D500 (len 4) → D500 wins
      score += 10 + modelNorm.length;
    }
    if (input.includes(brandNorm)) score += 2;
    // Partial model overlap
    if (score === 0) {
      const words = modelNorm.split(/\s+/);
      for (const w of words) {
        if (w.length > 2 && input.includes(w)) score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  return bestScore > 0 ? best : null;
}

/**
 * Parse a camera field that may contain multiple cameras (comma/slash/semicolon separated).
 * Returns array of matched settings (deduplicated by model).
 */
export function findAllCameraSettings(cameraString) {
  if (!cameraString) return [];
  // Split on common separators; ignore drone/action cam entries
  const ignore = /drone|dji|gopro|insta360|osmo|mavic|action|fpv|pocket|avata|rx100|zv-e10|zve10|fx3\b|fx30|c70|c200/i;
  const parts = cameraString.split(/[,/;|+&\n]+/).map((s) => s.trim()).filter(Boolean);
  const results = [];
  const seen = new Set();
  for (const part of parts) {
    if (ignore.test(part)) continue;
    const match = findCameraSettings(part);
    if (match && !seen.has(match.model)) {
      seen.add(match.model);
      results.push(match);
    }
  }
  return results;
}
