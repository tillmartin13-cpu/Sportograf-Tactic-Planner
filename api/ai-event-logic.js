const SYSTEM_PROMPT = `You are an expert sports event analyst for Sportograf, a professional sports photography company. Your task is to analyze race/event schedules and spot tactic plans, then predict athlete timing at each photography spot.

Given:
- Event schedule / start list / timing information
- Spot tactic plan (spot names, positions, km marks)

Produce a structured JSON response. For each spot, estimate:
- firstAthlete: time when the first athlete passes (HH:MM format)
- peakWindow: busiest period, e.g. "10:15–10:45"
- lastAthlete: time when the last athlete passes (HH:MM format)
- notes: brief relevant notes (cutoff times, wave info, special considerations)

Base your timing on:
1. Race start times and wave starts from the schedule
2. Expected finish times for elite vs. mass participants
3. Spot km position relative to total race distance
4. Typical athlete pace ranges for the sport type (cycling ~30–40 km/h elite, running ~3:30–8:00 /km, etc.)

Return ONLY valid JSON in this exact format, no other text:
{
  "eventSummary": "Brief 1–2 sentence summary of the event",
  "raceStart": "HH:MM",
  "sport": "cycling|running|triathlon|obstacle|other",
  "spots": [
    {
      "spotNumber": 1,
      "spotName": "Spot name",
      "kmMark": 12.5,
      "firstAthlete": "10:05",
      "peakWindow": "10:20–11:00",
      "lastAthlete": "13:30",
      "notes": "Elite wave passes first, mass start follows ~15 min later"
    }
  ]
}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  const { content } = req.body;
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'No content provided' });
  }

  const abortCtrl = new AbortController();
  const abortTimer = setTimeout(() => abortCtrl.abort(), 55_000);

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: abortCtrl.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content }],
      }),
    });

    clearTimeout(abortTimer);

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text().catch(() => '');
      return res.status(502).json({ error: `Anthropic API error ${anthropicRes.status}`, detail: errText.slice(0, 300) });
    }

    const data = await anthropicRes.json();
    const text = data.content?.[0]?.text ?? '';
    return res.status(200).json({ text });

  } catch (err) {
    clearTimeout(abortTimer);
    const isTimeout = err?.name === 'AbortError';
    return res.status(503).json({
      error: isTimeout ? 'Request timed out' : 'API unreachable',
      detail: String(err?.message ?? err).slice(0, 300),
    });
  }
}
