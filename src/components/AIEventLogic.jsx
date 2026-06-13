import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LS_KEY = 'sg_ai_api_key';

function getStoredKey() {
  try { return localStorage.getItem(LS_KEY) || ''; } catch { return ''; }
}
function saveKey(k) {
  try { localStorage.setItem(LS_KEY, k); } catch {}
}

async function readFileAsText(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsText(file);
  });
}

// ─── File chip ────────────────────────────────────────────────────────────────

function FileChip({ file, onRemove }) {
  const ext = file.name.split('.').pop().toLowerCase();
  const icons = { json: '📋', txt: '📄', pdf: '📕', csv: '📊', xlsx: '📊' };
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-[#e3e7f2] bg-white px-2.5 py-1.5">
      <span className="text-sm">{icons[ext] || '📄'}</span>
      <span className="max-w-[120px] truncate text-[11px] font-semibold text-[#1C2B6B]">{file.name}</span>
      <button type="button" onClick={onRemove} className="text-[#c5cbe0] hover:text-[#cc2b2b] transition-colors">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

// ─── Result renderer ──────────────────────────────────────────────────────────

function SpotTimingCard({ spot }) {
  return (
    <div className="rounded-2xl border border-[#e3e7f2] bg-white overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-[#f0f2fa] bg-[#f4f5fa] px-4 py-3">
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-black text-white"
          style={{ background: '#1C2B6B' }}
        >
          {spot.spotNumber ?? '?'}
        </div>
        <span className="font-extrabold text-[#1C2B6B] text-sm">{spot.spotName}</span>
        {spot.kmMark && (
          <span className="ml-auto text-[10px] font-bold text-[#8a93b0]">km {spot.kmMark}</span>
        )}
      </div>
      <div className="grid grid-cols-3 divide-x divide-[#f0f2fa] px-0 py-0">
        <div className="flex flex-col items-center py-3">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#b0b8cf]">First</span>
          <span className="mt-1 text-base font-black text-[#22c55e]">{spot.firstAthlete || '—'}</span>
        </div>
        <div className="flex flex-col items-center py-3">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#b0b8cf]">Peak</span>
          <span className="mt-1 text-base font-black text-[#1C2B6B]">{spot.peakWindow || '—'}</span>
        </div>
        <div className="flex flex-col items-center py-3">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#b0b8cf]">Last</span>
          <span className="mt-1 text-base font-black text-[#cc2b2b]">{spot.lastAthlete || '—'}</span>
        </div>
      </div>
      {spot.notes && (
        <div className="border-t border-[#f0f2fa] px-4 py-2.5 text-[11px] leading-relaxed text-[#8a93b0]">
          {spot.notes}
        </div>
      )}
    </div>
  );
}

// ─── Markdown-ish result block (fallback) ────────────────────────────────────

function MarkdownResult({ text }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i} className="mt-4 text-sm font-extrabold text-[#1C2B6B]">{line.slice(4)}</h3>;
        if (line.startsWith('## '))  return <h2 key={i} className="mt-4 text-base font-extrabold text-[#1C2B6B]">{line.slice(3)}</h2>;
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-xs font-bold text-[#1C2B6B]">{line.slice(2, -2)}</p>;
        if (line.startsWith('- '))   return <p key={i} className="text-xs text-[#5b6aa8]">• {line.slice(2)}</p>;
        if (line.trim() === '')       return <div key={i} className="h-1" />;
        return <p key={i} className="text-xs text-[#5b6aa8]">{line}</p>;
      })}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

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

export function AIEventLogicModal({ onClose }) {
  const [apiKey, setApiKey] = useState(getStoredKey);
  const [keyVisible, setKeyVisible] = useState(false);
  const [keyEditing, setKeyEditing] = useState(!getStoredKey());
  const [files, setFiles] = useState([]);
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [result, setResult] = useState(null);   // parsed JSON or raw text
  const [rawText, setRawText] = useState('');
  const [streamText, setStreamText] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function saveApiKey() {
    saveKey(apiKey.trim());
    setKeyEditing(false);
  }

  function addFiles(newFiles) {
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...newFiles.filter((f) => !names.has(f.name))];
    });
  }

  function onFileDrop(e) {
    e.preventDefault();
    addFiles(Array.from(e.dataTransfer.files));
  }

  async function runAnalysis() {
    const key = apiKey.trim();
    if (!key) { alert('Please enter your Anthropic API key.'); setKeyEditing(true); return; }
    if (files.length === 0) { alert('Please upload at least one file (event schedule or tactic JSON).'); return; }

    setStatus('loading');
    setResult(null);
    setRawText('');
    setStreamText('');

    try {
      // Read all files as text
      const fileContents = await Promise.all(
        files.map(async (f) => {
          try {
            const text = await readFileAsText(f);
            return `=== FILE: ${f.name} ===\n${text}`;
          } catch {
            return `=== FILE: ${f.name} === (could not read)`;
          }
        })
      );

      const userMessage = [
        ...fileContents,
        question.trim() ? `\nAdditional context from user:\n${question.trim()}` : '',
      ].filter(Boolean).join('\n\n');

      // Stream via fetch (browser-safe, no SDK needed)
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-allow-browser': 'true',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-8',
          max_tokens: 4096,
          stream: true,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error ${resp.status}`);
      }

      // Read stream
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const ev = JSON.parse(data);
            if (ev.type === 'content_block_delta' && ev.delta?.text) {
              accumulated += ev.delta.text;
              setStreamText(accumulated);
            }
          } catch {}
        }
      }

      setRawText(accumulated);

      // Try to parse as structured JSON
      try {
        const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setResult(parsed);
        }
      } catch {
        // fallback to raw text display
      }

      setStatus('done');
    } catch (e) {
      console.error(e);
      setStreamText(e.message || 'Unknown error');
      setStatus('error');
    }
  }

  const hasKey = apiKey.trim().length > 0;
  const structured = result && result.spots?.length > 0;

  return createPortal(
    <div className="fixed inset-0 z-[9000] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4">
      <div className="flex w-full max-w-lg flex-col rounded-t-3xl bg-[#f4f5f8] shadow-2xl sm:rounded-3xl max-h-[94dvh]">

        {/* Header */}
        <div className="flex items-center justify-between rounded-t-3xl bg-gradient-to-r from-[#1C2B6B] to-[#2d3e8f] px-5 py-4 sm:rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10"/>
                <path d="M12 6v6l4 2"/>
                <path d="M18 12h4M22 8v4"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-extrabold text-white">AI Event Logic</div>
              <div className="text-[10px] text-white/50">Upload schedule · Get spot timings</div>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* API Key */}
          <div className="rounded-2xl border border-[#e3e7f2] bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a93b0]">Anthropic API Key</span>
              {hasKey && !keyEditing && (
                <button type="button" onClick={() => setKeyEditing(true)}
                  className="text-[10px] font-semibold text-[#5b6aa8] hover:text-[#1C2B6B]">Edit</button>
              )}
            </div>
            {keyEditing ? (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={keyVisible ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-ant-…"
                    className="w-full rounded-xl border border-[#e3e7f2] bg-[#f8f9ff] px-3 py-2 pr-9 text-xs font-mono outline-none focus:border-[#1C2B6B]"
                  />
                  <button type="button" onClick={() => setKeyVisible((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#c5cbe0] hover:text-[#8a93b0]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      {keyVisible
                        ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                      }
                    </svg>
                  </button>
                </div>
                <button type="button" onClick={saveApiKey}
                  disabled={!apiKey.trim()}
                  className="rounded-xl bg-[#1C2B6B] px-4 py-2 text-xs font-bold text-white disabled:opacity-40">
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-[#22c55e] font-semibold">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                Key saved · stored locally in browser
              </div>
            )}
          </div>

          {/* File upload */}
          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#8a93b0]">Upload files</div>
            <div
              className="rounded-2xl border-2 border-dashed border-[#d5daea] bg-white p-5 text-center cursor-pointer hover:border-[#1C2B6B]/40 hover:bg-[#f8f9ff] transition-all"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onFileDrop}
            >
              <input
                ref={fileRef} type="file" className="hidden" multiple
                accept=".txt,.json,.csv,.pdf,.xlsx,.xls,.xml,.html"
                onChange={(e) => { addFiles(Array.from(e.target.files || [])); e.target.value = ''; }}
              />
              <svg className="mx-auto mb-2 text-[#b0b8cf]" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <p className="text-xs font-semibold text-[#8a93b0]">Drop files or click to upload</p>
              <p className="mt-0.5 text-[10px] text-[#b0b8cf]">Event schedule, start list, tactic JSON, infofile…</p>
            </div>

            {files.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {files.map((f, i) => (
                  <FileChip key={f.name + i} file={f} onRemove={() => setFiles((prev) => prev.filter((_, j) => j !== i))} />
                ))}
              </div>
            )}
          </div>

          {/* Optional context */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8a93b0] mb-1.5">
              Additional context <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. &quot;Elite wave starts at 09:00, mass start at 09:30. Focus on km 12 and km 28.&quot;"
              className="w-full rounded-xl border border-[#e3e7f2] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#1C2B6B] min-h-[60px] resize-none"
            />
          </div>

          {/* Run button */}
          <button
            type="button"
            onClick={runAnalysis}
            disabled={status === 'loading' || !hasKey || files.length === 0}
            className="w-full rounded-2xl bg-gradient-to-r from-[#1C2B6B] to-[#2d3e8f] py-3.5 text-sm font-extrabold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 shadow-md"
          >
            {status === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Analyzing…
              </span>
            ) : '✦ Analyze Event Timing'}
          </button>

          {/* Streaming preview */}
          {status === 'loading' && streamText && (
            <div className="rounded-2xl border border-[#e3e7f2] bg-white p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#8a93b0]">AI is thinking…</p>
              <pre className="whitespace-pre-wrap text-[10px] text-[#8a93b0] font-mono max-h-32 overflow-y-auto">{streamText}</pre>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-bold text-red-700 mb-1">Analysis failed</p>
              <p className="text-[11px] text-red-600">{streamText}</p>
            </div>
          )}

          {/* Results */}
          {status === 'done' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-[#e3e7f2]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a93b0]">Results</span>
                <div className="h-px flex-1 bg-[#e3e7f2]" />
              </div>

              {structured ? (
                <>
                  {/* Event summary banner */}
                  <div className="rounded-2xl bg-[#1C2B6B] px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs leading-relaxed text-white/80">{result.eventSummary}</p>
                      {result.raceStart && (
                        <div className="shrink-0 text-right">
                          <div className="text-[9px] font-bold uppercase tracking-widest text-white/40">Race start</div>
                          <div className="text-base font-black text-white">{result.raceStart}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Spot timing cards */}
                  <div className="space-y-2.5">
                    {result.spots.map((spot, i) => (
                      <SpotTimingCard key={i} spot={spot} />
                    ))}
                  </div>
                </>
              ) : (
                // Fallback: plain text
                <div className="rounded-2xl border border-[#e3e7f2] bg-white p-4">
                  <MarkdownResult text={rawText} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
