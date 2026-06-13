import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-black text-white" style={{ background: '#1C2B6B' }}>
          {spot.spotNumber ?? '?'}
        </div>
        <span className="font-extrabold text-[#1C2B6B] text-sm">{spot.spotName}</span>
        {spot.kmMark && (
          <span className="ml-auto text-[10px] font-bold text-[#8a93b0]">km {spot.kmMark}</span>
        )}
      </div>
      <div className="grid grid-cols-3 divide-x divide-[#f0f2fa]">
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

function MarkdownResult({ text }) {
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i} className="mt-4 text-sm font-extrabold text-[#1C2B6B]">{line.slice(4)}</h3>;
        if (line.startsWith('## '))  return <h2 key={i} className="mt-4 text-base font-extrabold text-[#1C2B6B]">{line.slice(3)}</h2>;
        if (line.startsWith('- '))   return <p key={i} className="text-xs text-[#5b6aa8]">• {line.slice(2)}</p>;
        if (line.trim() === '')       return <div key={i} className="h-1" />;
        return <p key={i} className="text-xs text-[#5b6aa8]">{line}</p>;
      })}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function AIEventLogicModal({ onClose }) {
  const [files, setFiles] = useState([]);
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [rawText, setRawText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function addFiles(newFiles) {
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...newFiles.filter((f) => !names.has(f.name))];
    });
  }

  async function runAnalysis() {
    if (files.length === 0) {
      alert('Please upload at least one file (event schedule or tactic JSON).');
      return;
    }

    setStatus('loading');
    setResult(null);
    setRawText('');
    setErrorMsg('');

    try {
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

      const content = [
        ...fileContents,
        question.trim() ? `\nAdditional context:\n${question.trim()}` : '',
      ].filter(Boolean).join('\n\n');

      const resp = await fetch('/api/ai-event-logic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.detail || data.error || `Server error ${resp.status}`);
      }

      const text = data.text || '';
      setRawText(text);

      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setResult(parsed);
        }
      } catch { /* fallback to raw */ }

      setStatus('done');
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message || 'Unknown error');
      setStatus('error');
    }
  }

  const structured = result?.spots?.length > 0;

  return createPortal(
    <div className="fixed inset-0 z-[9000] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4">
      <div className="flex w-full max-w-lg flex-col rounded-t-3xl bg-[#f4f5f8] shadow-2xl sm:rounded-3xl max-h-[94dvh]">

        {/* Header */}
        <div className="flex items-center justify-between rounded-t-3xl bg-gradient-to-r from-[#1C2B6B] to-[#2d3e8f] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><path d="M18 12h4M22 8v4"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-extrabold text-white">Event Logic</div>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Experimental warning */}
          <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
            <span className="mt-px shrink-0 text-base leading-none">⚠️</span>
            <p className="text-[11px] leading-relaxed text-amber-800">
              <strong>Experimentelles KI-Feature.</strong> Die Ergebnisse sind KI-generiert und können unvollständig oder fehlerhaft sein. Bitte alle Angaben eigenständig prüfen und nicht blind vertrauen.
            </p>
          </div>

          {/* File upload */}
          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#8a93b0]">Upload files</div>
            <div
              className="rounded-2xl border-2 border-dashed border-[#d5daea] bg-white p-5 text-center cursor-pointer hover:border-[#1C2B6B]/40 hover:bg-[#f8f9ff] transition-all"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); addFiles(Array.from(e.dataTransfer.files)); }}
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
              placeholder={'e.g. "Elite wave starts at 09:00, mass start at 09:30. Focus on km 12 and km 28."'}
              className="w-full rounded-xl border border-[#e3e7f2] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#1C2B6B] min-h-[60px] resize-none"
            />
          </div>

          {/* Run button */}
          <button
            type="button"
            onClick={runAnalysis}
            disabled={status === 'loading' || files.length === 0}
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

          {/* Error */}
          {status === 'error' && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-bold text-red-700 mb-1">Analysis failed</p>
              <p className="text-[11px] text-red-600">{errorMsg}</p>
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
                  <div className="space-y-2.5">
                    {result.spots.map((spot, i) => (
                      <SpotTimingCard key={i} spot={spot} />
                    ))}
                  </div>
                </>
              ) : (
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
