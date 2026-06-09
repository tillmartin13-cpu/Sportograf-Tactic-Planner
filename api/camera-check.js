export const config = { runtime: 'edge', maxDuration: 30 };

const SYSTEM_PROMPT = `You are a camera settings verification assistant for sports photographers.
You analyze photos of camera LCD displays and determine if the settings are correct for a Sportograf event.

You must respond with a valid JSON object only — no markdown, no explanation outside the JSON.

Respond with this exact structure:
{
  "status": "accepted" | "declined" | "warning",
  "checks": {
    "time": { "status": "ok" | "failed" | "unreadable", "detected": "<value or null>", "message": "<null or issue description>" },
    "date": { "status": "ok" | "failed" | "unreadable", "detected": "<value or null>", "message": "<null or issue description>" },
    "format": { "status": "ok" | "failed" | "unreadable", "detected": "<value or null>", "message": "<null or issue description>" },
    "shutterSpeed": { "status": "ok" | "warning" | "failed" | "unreadable", "detected": "<value or null>", "message": "<null or issue description>" },
    "cardImages": { "status": "ok" | "warning" | "unreadable", "detected": "<count or null>", "message": "<null or warning description>" },
    "pictureStyle": { "status": "ok" | "warning" | "unreadable", "detected": "<value or null>", "message": "<null or issue description>" }
  },
  "declineReasons": ["<reason1>", ...],
  "warnings": ["<warning1>", ...],
  "uploadNewPhoto": false
}

Rules:
- status = "declined" if time, date, format, or shutterSpeed check failed
- status = "warning" if accepted but there are warnings
- status = "accepted" if all critical checks pass and no warnings
- uploadNewPhoto = true if the image is unreadable, not a camera display, too blurry, or critical info cannot be determined
- Time check: look for the clock/time display on camera LCD. It must show a plausible current time. If you cannot read it, mark unreadable.
- Date check: read the date directly from the camera display. Accept it if it shows a plausible date (year between 2024 and 2030, valid day and month). Only fail if the year is clearly wrong (e.g. 2001, 0001, 1970) or the date is unreadable. Do NOT compare against any external reference date — trust what the display shows.
- Format check: must be JPG. Shown as "NORMAL", "STANDARD", "FINE S", "L" etc depending on brand. RAW or RAW+JPEG = failed. The finest JPG option (FINE L on Nikon, etc.) should also be flagged.
- Shutter speed check: look for the shutter speed value on the display (shown as e.g. "1/500", "1/1000", "500", "1000"). Extract the denominator as a number.
  - If shutter speed < 1/500 (e.g. 1/250, 1/100): status = "failed", add to declineReasons: "Verschlusszeit zu langsam (${detected}) — mindestens 1/500s erforderlich."
  - If shutter speed is 1/500 to 1/999: status = "warning", add to warnings: "Verschlusszeit (${detected}) könnte zu langsam sein — 1/1000s oder schneller empfohlen."
  - If shutter speed >= 1/1000: status = "ok"
  - If not visible on this screen / camera is in a mode that doesn't show shutter speed: status = "unreadable", message = "Verschlusszeit nicht ablesbar — bitte im Aufnahmemodus fotografieren."
- cardImages check: if the display shows a frame counter with remaining shots and it looks like there are existing images (e.g. frame counter is not at maximum, or file number is not 0001), warn that the card may not be formatted.
- pictureStyle: look for "Neutral", "Standard", "Picture Control" settings. Warn if saturated style detected.
- If the image does not show a camera display at all, set uploadNewPhoto=true and decline.`;

export default async function handler(req) {
  // Top-level try-catch so Vercel never returns a silent HTML 500
  try {
    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return json({ error: 'API key not configured on server' }, 500);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const { image, mediaType = 'image/jpeg', cameraModel, expectedImageSize, expectedJpeg, currentDate } = body;
    if (!image) return json({ error: 'No image provided' }, 400);

    const base64 = image.includes(',') ? image.split(',')[1] : image;
    if (!base64 || base64.length < 100) return json({ error: 'Image data too short / corrupt' }, 400);

    const cameraContext = cameraModel
      ? `The photographer is using a ${cameraModel}. Expected settings: Image Size = "${expectedImageSize}", JPEG quality = "${expectedJpeg}". Verify against these exact values.`
      : 'Camera model is unknown. Accept any reasonable JPG setting that is not RAW and not the finest quality option.';

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
            { type: 'text', text: `${cameraContext} Analyze this camera display and return only JSON.` },
          ],
        }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text().catch(() => '');
      console.error('Anthropic API error', anthropicResponse.status, errText);
      return json({ error: `Anthropic ${anthropicResponse.status}`, detail: errText.slice(0, 300) }, 502);
    }

    const data = await anthropicResponse.json();
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

    return json(result, 200);

  } catch (err) {
    // Catch-all — ensures we always return JSON, never a Vercel HTML error page
    console.error('camera-check unhandled error:', err);
    return json({ error: 'Internal server error', detail: String(err?.message ?? err).slice(0, 200) }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
