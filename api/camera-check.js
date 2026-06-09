export const config = { runtime: 'edge' };

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
    "cardImages": { "status": "ok" | "warning" | "unreadable", "detected": "<count or null>", "message": "<null or warning description>" },
    "pictureStyle": { "status": "ok" | "warning" | "unreadable", "detected": "<value or null>", "message": "<null or issue description>" }
  },
  "declineReasons": ["<reason1>", ...],
  "warnings": ["<warning1>", ...],
  "uploadNewPhoto": false
}

Rules:
- status = "declined" if time, date, or format check failed
- status = "warning" if accepted but there are warnings (e.g. images on card)
- status = "accepted" if all critical checks pass and no warnings
- uploadNewPhoto = true if the image is unreadable, not a camera display, too blurry, or critical info cannot be determined
- Time check: look for the clock/time display on camera LCD. It must show a plausible current time. If you cannot read it, mark unreadable.
- Date check: must show correct day, month, and year. Watch for year errors (e.g. 2012, 0001 are wrong).
- Format check: must be JPG. Shown as "NORMAL", "STANDARD", "FINE S", "L" etc depending on brand. RAW or RAW+JPEG = failed. The finest JPG option (FINE L on Nikon, etc.) should also be flagged.
- cardImages check: if the display shows a frame counter with remaining shots and it looks like there are existing images (e.g. frame counter is not at maximum, or file number is not 0001), warn that the card may not be formatted.
- pictureStyle: look for "Neutral", "Standard", "Picture Control" settings. Warn if saturated style detected.
- If the image does not show a camera display at all, set uploadNewPhoto=true and decline.`;

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  const { image, mediaType = 'image/jpeg', cameraModel, expectedImageSize, expectedJpeg } = body;
  if (!image) {
    return new Response(JSON.stringify({ error: 'No image provided' }), { status: 400 });
  }

  const cameraContext = cameraModel
    ? `The photographer is using a ${cameraModel}. Expected settings: Image Size = "${expectedImageSize}", JPEG quality = "${expectedJpeg}". Verify against these exact values.`
    : 'Camera model is unknown. Accept any reasonable JPG setting that is not RAW and not the finest quality option.';

  // Strip data URL prefix if present
  const base64 = image.includes(',') ? image.split(',')[1] : image;

  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: `Please analyze this camera display photo and verify the settings. ${cameraContext} Return only the JSON response.`,
            },
          ],
        },
      ],
    }),
  });

  if (!anthropicResponse.ok) {
    const err = await anthropicResponse.text();
    return new Response(JSON.stringify({ error: 'AI service error', detail: err }), { status: 502 });
  }

  const data = await anthropicResponse.json();
  const content = data.content?.[0]?.text ?? '';

  let result;
  try {
    // Extract JSON even if model wraps it in backticks
    const match = content.match(/\{[\s\S]*\}/);
    result = JSON.parse(match ? match[0] : content);
  } catch {
    return new Response(
      JSON.stringify({
        status: 'declined',
        uploadNewPhoto: true,
        declineReasons: ['Das Bild konnte nicht ausgewertet werden. Bitte lade ein neues Foto hoch.'],
        warnings: [],
        checks: {},
      }),
      { status: 200 },
    );
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
