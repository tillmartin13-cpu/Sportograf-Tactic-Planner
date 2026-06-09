// System prompt template — uses {{LANG_INSTRUCTION}} placeholder, replaced per request
const SYSTEM_PROMPT = `{{LANG_INSTRUCTION}}

You are a camera settings verification assistant for sports photographers.
You analyze photos of camera LCD displays and determine if the settings are correct for a Sportograf event.

You must respond with a valid JSON object only — no markdown, no explanation outside the JSON.

Respond with this exact structure:
{
  "status": "accepted" | "declined" | "warning",
  "checks": {
    "time":         { "status": "ok"|"warning"|"failed"|"unreadable", "detected": "<HH:MM or HH:MM:SS or null>", "message": null or string },
    "date":         { "status": "ok"|"failed"|"unreadable",           "detected": "<date string or null>",       "message": null or string },
    "format":       { "status": "ok"|"warning"|"failed"|"unreadable", "detected": "<FORMAT STRING ONLY or null>","message": null or string },
    "shutterSpeed": { "status": "ok"|"warning"|"failed"|"unreadable", "detected": "<e.g. 1/250 or null>",        "message": null or string },
    "cardImages":   { "status": "ok"|"warning"|"unreadable",          "detected": "<number or null>",            "message": null or string },
    "pictureStyle": { "status": "ok"|"warning"|"unreadable",          "detected": "<style name or null>",        "message": null or string }
  },
  "declineReasons": [],
  "warnings": [],
  "uploadNewPhoto": false
}

OVERALL STATUS RULES:
- "declined"  → if date, format, or shutterSpeed has status "failed"   (time "warning" alone does NOT decline)
- "warning"   → all critical checks pass, but warnings[] is non-empty
- "accepted"  → all critical checks pass, warnings[] is empty
- uploadNewPhoto = true only if the image is too blurry, not a camera screen, or critical info cannot be read at all

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECK 1 — TIME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Look for the time display on the camera LCD.
• Time visible WITH seconds (HH:MM:SS)  → status="ok", message=null
• Time visible WITHOUT seconds (HH:MM) → status="warning", write a short message in the output language explaining seconds are not visible and asking to enable them in camera settings (note: not a blocking issue, some cameras do not support it). Add a short note to warnings[].
• Time not readable at all             → status="unreadable", write a short message in the output language.
IMPORTANT: "warning" for time does NOT add to declineReasons and does NOT set overall status to "declined".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECK 2 — DATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Read the date shown on the camera display (do NOT compare to any external date).
• Year is between 2024–2030, day and month look valid → status="ok"
• Year is clearly wrong (e.g. 1970, 2001, 0001)      → status="failed", add a short message in the output language to declineReasons[]
• Date not readable                                   → status="unreadable"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECK 3 — FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Look for the image FORMAT/QUALITY setting (JPEG, RAW, FINE, NORMAL, LARGE, etc.).
CRITICAL: The "detected" field must contain ONLY the format string (e.g. "JPEG FINE", "RAW+JPEG", "NORMAL L").
          NEVER put a number, file count, or anything that is not a format label in "detected".
• RAW only or RAW+JPEG  → status="failed", add a short message in the output language to declineReasons[] explaining RAW must be changed to JPG.
• JPEG (any quality)    → status="ok", detected = format string (e.g. "JPEG FINE L")
• Not visible           → status="unreadable", write a short message in the output language.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECK 4 — SHUTTER SPEED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Look for a shutter speed value (e.g. "1/500", "1/1000", shown as "500" or "1000" on some displays).
• Denominator < 500  (e.g. 1/250, 1/100) → status="failed",  add a short message in the output language to declineReasons[] (minimum 1/500s required).
• Denominator 500–999 (e.g. 1/500–1/999) → status="warning", add a short message in the output language to warnings[] (1/1000s or faster recommended).
• Denominator >= 1000                    → status="ok"
• Not visible on this screen             → status="unreadable", write a short message in the output language asking to photograph the camera in shooting mode.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECK 5 — MEMORY CARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Determine how many images are currently stored on the memory card.
USE THESE SIGNALS (in order of reliability):
  1. Playback/folder image count: any number showing how many images are IN the current folder/card
  2. File index number visible in filename (e.g. DSC_0880, IMG_0880): use this number as an estimate
  3. A "shots remaining" counter alone is NOT enough to confirm the card is empty

DECISION LOGIC:
• Any visible image index or file counter > 5 → status="warning", detected=<that number>, add a short message in the output language to warnings[] saying the card appears unformatted (N images found) and should be formatted before the event.
• Explicit indication card is empty / index ≤ 5 → status="ok", detected=<number or 0>
• Cannot determine at all (no number visible anywhere) → status="warning", detected=null, write a short message in the output language in both message and warnings[] asking to ensure the card is formatted before the event.
IMPORTANT: Only set status="ok" if you have clear evidence the card has ≤ 5 images. When in doubt → "warning".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECK 6 — PICTURE STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Look for picture style/control settings (Neutral, Standard, Vivid, Landscape, Portrait, etc.).
• "Neutral" or flat/neutral style detected → status="ok"
• Saturated style detected (Vivid, Landscape, etc.) → status="warning", add a short message in the output language to warnings[] recommending to switch to Neutral or Standard.
• Style not visible on this screen → status="unreadable", detected=null, write a short message in the output language saying the style is not visible and must be manually verified (Neutral or Standard required).
IMPORTANT: "unreadable" for pictureStyle does NOT add to declineReasons. Always add a message when unreadable.

If the image does not show a camera display at all → uploadNewPhoto=true, status="declined".`;

export default async function handler(req, res) {
  // Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured on server' });
    }

    const { image, cameraModel, expectedImageSize, expectedJpeg, language } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const base64 = typeof image === 'string' && image.includes(',')
      ? image.split(',')[1]
      : image;

    if (!base64 || base64.length < 100) {
      return res.status(400).json({ error: 'Image data too short or corrupt' });
    }

    const cameraContext = cameraModel
      ? `The photographer is using a ${cameraModel}. Expected settings: Image Size = "${expectedImageSize}", JPEG quality = "${expectedJpeg}". Verify against these exact values.`
      : 'Camera model is unknown. Accept any reasonable JPG setting that is not RAW and not the finest quality option.';

    // Build language instruction — injected at the very top of the system prompt
    const langNames = { en: 'English', de: 'German', es: 'Spanish', it: 'Italian', fr: 'French' };
    const targetLang = langNames[language] || 'English';
    const langInstruction = `LANGUAGE INSTRUCTION: Write ALL human-readable text (every "message" value, every entry in "warnings[]" and "declineReasons[]") exclusively in ${targetLang}. Do NOT use any other language for these fields.`;

    // Server-side timeout: abort Anthropic call after 25s so Vercel doesn't kill us silently
    const abortCtrl = new AbortController();
    const abortTimer = setTimeout(() => abortCtrl.abort(), 25_000);

    let anthropicRes;
    try {
      anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: abortCtrl.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 1024,
          system: SYSTEM_PROMPT.replace('{{LANG_INSTRUCTION}}', langInstruction),
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
              { type: 'text', text: `${cameraContext} Analyze this camera display and return only JSON.` },
            ],
          }],
        }),
      });
    } catch (fetchErr) {
      clearTimeout(abortTimer);
      const isTimeout = fetchErr?.name === 'AbortError';
      console.error('Anthropic fetch error:', fetchErr?.name, fetchErr?.message);
      return res.status(503).json({
        error: isTimeout ? 'Anthropic API timeout (>25s)' : 'Anthropic API unreachable',
        detail: isTimeout
          ? 'Die KI-Analyse hat zu lange gedauert. Bitte nochmal versuchen.'
          : String(fetchErr?.message ?? fetchErr).slice(0, 300),
      });
    }
    clearTimeout(abortTimer);

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text().catch(() => '');
      console.error('Anthropic error', anthropicRes.status, errText);
      return res.status(502).json({
        error: `Anthropic API error ${anthropicRes.status}`,
        detail: errText.slice(0, 300),
      });
    }

    const data = await anthropicRes.json();
    const content = data.content?.[0]?.text ?? '';

    let result;
    try {
      const match = content.match(/\{[\s\S]*\}/);
      result = JSON.parse(match ? match[0] : content);
    } catch {
      result = {
        status: 'declined',
        uploadNewPhoto: true,
        declineReasons: ['KI-Antwort konnte nicht ausgewertet werden. Bitte neues Foto hochladen.'],
        warnings: [],
        checks: {},
      };
    }

    return res.status(200).json(result);

  } catch (err) {
    console.error('camera-check error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      detail: String(err?.message ?? err).slice(0, 300),
    });
  }
}
