import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

// ─── Upload calculator ────────────────────────────────────────────────────────

function formatDuration(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const PRESETS = [
  { label: '100 MB', gb: 0.1 },
  { label: '500 MB', gb: 0.5 },
  { label: '1 GB',   gb: 1 },
  { label: '5 GB',   gb: 5 },
  { label: '10 GB',  gb: 10 },
  { label: '50 GB',  gb: 50 },
  { label: '100 GB', gb: 100 },
  { label: '1 TB',   gb: 1000 },
];

function UploadCalculator({ uploadMbps }) {
  const [gb, setGb] = useState('');
  const [custom, setCustom] = useState('');
  const [unit, setUnit] = useState('GB');

  const effectiveMbps = uploadMbps ?? parseFloat(custom) ?? null;

  function calcSeconds(gigabytes, mbps) {
    // GB → Gbit → Mbit, divide by Mbit/s
    return (gigabytes * 8 * 1024) / mbps;
  }

  const speedMbps = uploadMbps ?? (parseFloat(custom) || null);
  const sizeGb = parseFloat(gb) || null;
  const sizeInGb = sizeGb ? (unit === 'GB' ? sizeGb : sizeGb / 1024) : null;
  const duration = speedMbps && sizeInGb ? calcSeconds(sizeInGb, speedMbps) : null;

  return (
    <div className="space-y-5">
      <p className="text-xs leading-relaxed text-[#8a93b0]">
        Calculate how long it takes to upload a given amount of data based on your connection speed.
      </p>

      {/* Upload speed source */}
      <div>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#8a93b0]">Upload speed (Mbit/s)</div>
        {uploadMbps != null ? (
          <div className="flex items-center gap-2 rounded-xl bg-[#f0f2fa] px-4 py-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
            <span className="text-sm font-extrabold text-[#1C2B6B]">{uploadMbps.toFixed(1)} Mbit/s</span>
            <span className="text-[10px] text-[#8a93b0]">from connection test</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="number" min="0.1" step="0.1" placeholder="e.g. 50"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="w-full rounded-xl border border-[#e3e7f2] px-4 py-3 text-center text-lg font-extrabold text-[#1C2B6B] outline-none focus:border-[#1C2B6B]"
            />
            <span className="self-center text-xs font-bold text-[#8a93b0]">Mbit/s</span>
          </div>
        )}
      </div>

      {/* File size */}
      <div>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#8a93b0]">File / data size</div>
        <div className="flex gap-2 mb-2">
          {['GB', 'TB'].map((u) => (
            <button key={u} type="button" onClick={() => setUnit(u)}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${unit === u ? 'bg-[#1C2B6B] text-white' : 'bg-[#f0f2fa] text-[#8a93b0]'}`}>
              {u}
            </button>
          ))}
        </div>
        <input
          type="number" min="0" step="0.1" placeholder={`Size in ${unit}`}
          value={gb}
          onChange={(e) => setGb(e.target.value)}
          className="w-full rounded-xl border border-[#e3e7f2] px-4 py-3 text-center text-2xl font-extrabold text-[#1C2B6B] outline-none focus:border-[#1C2B6B]"
        />
      </div>

      {/* Result */}
      {duration != null && (
        <div className="rounded-2xl bg-[#1C2B6B] px-5 py-4 text-center">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Upload time</div>
          <div className="text-4xl font-black text-white">{formatDuration(duration)}</div>
          <div className="mt-1.5 text-[11px] text-white/40">
            {sizeInGb} GB @ {speedMbps.toFixed(1)} Mbit/s
          </div>
        </div>
      )}

      {/* Preset grid */}
      {speedMbps && (
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#8a93b0]">Quick reference</div>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESETS.map(({ label, gb: g }) => (
              <button
                key={label}
                type="button"
                onClick={() => { setGb(String(g >= 1000 ? g / 1024 : g)); setUnit(g >= 1000 ? 'TB' : 'GB'); }}
                className="flex items-center justify-between rounded-xl bg-[#f4f5fa] px-3 py-2.5 text-left hover:bg-[#eef1fb] transition-colors"
              >
                <span className="text-[11px] font-semibold text-[#5b6aa8]">{label}</span>
                <span className="text-[11px] font-extrabold text-[#1C2B6B]">{formatDuration(calcSeconds(g, speedMbps))}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Connection Speed Test tab ────────────────────────────────────────────────

const STATUS = { idle: 'idle', running: 'running', done: 'done', error: 'error' };

function gauge(val, max, color) {
  const pct = Math.min((val || 0) / max, 1);
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  return (
    <svg width="90" height="90" viewBox="0 0 90 90">
      <circle cx="45" cy="45" r={r} fill="none" stroke="#e3e7f2" strokeWidth="7" />
      <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.4s ease' }}
      />
    </svg>
  );
}

function ConnectionTest({ onUploadResult }) {
  const [status, setStatus] = useState(STATUS.idle);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState({ download: null, upload: null, latency: null, jitter: null });

  const runTest = useCallback(async () => {
    setStatus(STATUS.running);
    setResults(null);
    setProgress({ download: null, upload: null, latency: null, jitter: null });

    try {
      const { default: SpeedTest } = await import('@cloudflare/speedtest');
      const engine = new SpeedTest({ autoStart: false });

      engine.onResultsChange = () => {
        const r = engine.results;
        setProgress({
          download: r.getDownloadBandwidth ? r.getDownloadBandwidth() / 1e6 : null,
          upload: r.getUploadBandwidth ? r.getUploadBandwidth() / 1e6 : null,
          latency: r.getUnloadedLatency ? r.getUnloadedLatency() : null,
          jitter: r.getUnloadedLatencyJitter ? r.getUnloadedLatencyJitter() : null,
        });
      };

      engine.onFinish = (r) => {
        const final = {
          download: r.getDownloadBandwidth() / 1e6,
          upload: r.getUploadBandwidth() / 1e6,
          latency: r.getUnloadedLatency(),
          jitter: r.getUnloadedLatencyJitter(),
        };
        setResults(final);
        onUploadResult?.(final.upload);
        setStatus(STATUS.done);
      };

      engine.onError = () => setStatus(STATUS.error);
      engine.play();
    } catch (e) {
      console.error(e);
      setStatus(STATUS.error);
    }
  }, [onUploadResult]);

  const display = results || progress;
  const dl = display?.download;
  const ul = display?.upload;
  const lat = display?.latency;
  const jit = display?.jitter;

  return (
    <div className="space-y-5">
      <p className="text-xs leading-relaxed text-[#8a93b0]">
        Measures your connection speed using Cloudflare's global network — the same engine as speed.cloudflare.com. After the test the measured upload speed is automatically used in the Upload Calculator.
      </p>

      {(status === STATUS.running || status === STATUS.done) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center rounded-2xl border border-[#e3e7f2] bg-white py-4">
            <div className="relative">
              {gauge(dl, 500, '#1C2B6B')}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-black text-[#1C2B6B]">{dl != null ? dl.toFixed(1) : '—'}</span>
              </div>
            </div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#8a93b0]">Download</div>
            <div className="text-[9px] text-[#b0b8cf]">Mbit/s</div>
          </div>

          <div className="flex flex-col items-center rounded-2xl border border-[#e3e7f2] bg-white py-4">
            <div className="relative">
              {gauge(ul, 500, '#cc2b2b')}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-black text-[#cc2b2b]">{ul != null ? ul.toFixed(1) : '—'}</span>
              </div>
            </div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#8a93b0]">Upload</div>
            <div className="text-[9px] text-[#b0b8cf]">Mbit/s</div>
          </div>

          <div className="flex flex-col items-center rounded-2xl border border-[#e3e7f2] bg-white py-3">
            <div className="text-2xl font-black text-[#1C2B6B]">{lat != null ? Math.round(lat) : '—'}</div>
            <div className="text-[9px] text-[#b0b8cf]">ms</div>
            <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[#8a93b0]">Latency</div>
          </div>

          <div className="flex flex-col items-center rounded-2xl border border-[#e3e7f2] bg-white py-3">
            <div className="text-2xl font-black text-[#1C2B6B]">{jit != null ? Math.round(jit) : '—'}</div>
            <div className="text-[9px] text-[#b0b8cf]">ms</div>
            <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[#8a93b0]">Jitter</div>
          </div>
        </div>
      )}

      {status === STATUS.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Test failed. Check your internet connection and try again.
        </div>
      )}

      <button
        type="button"
        onClick={runTest}
        disabled={status === STATUS.running}
        className="w-full rounded-2xl bg-[#1C2B6B] py-3.5 text-sm font-extrabold text-white transition-all hover:bg-[#16255e] active:scale-[0.98] disabled:opacity-60"
      >
        {status === STATUS.running ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Testing…
          </span>
        ) : status === STATUS.done ? 'Run again' : 'Start test'}
      </button>

      {status === STATUS.done && (
        <p className="text-center text-[10px] text-[#b0b8cf]">Powered by Cloudflare · speed.cloudflare.com</p>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function SpeedToolsModal({ onClose }) {
  const [tab, setTab] = useState('test');
  const [uploadMbps, setUploadMbps] = useState(null);

  return createPortal(
    <div className="fixed inset-0 z-[9000] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="flex w-full max-w-md flex-col rounded-t-3xl bg-[#f4f5f8] shadow-2xl sm:rounded-3xl max-h-[92dvh]">

        {/* Header */}
        <div className="flex items-center justify-between rounded-t-3xl bg-[#1C2B6B] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-extrabold text-white">Speed Tools</div>
              <div className="text-[10px] text-white/50">Connection test · Upload calculator</div>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-[#e3e7f2] bg-white px-4 pt-2">
          <button type="button" onClick={() => setTab('test')}
            className={`mr-1 rounded-t-lg px-4 py-2.5 text-xs font-bold transition-all ${tab === 'test' ? 'border-b-2 border-[#1C2B6B] text-[#1C2B6B]' : 'text-[#8a93b0] hover:text-[#5b6aa8]'}`}>
            Connection Test
          </button>
          <button type="button" onClick={() => setTab('upload')}
            className={`rounded-t-lg px-4 py-2.5 text-xs font-bold transition-all ${tab === 'upload' ? 'border-b-2 border-[#1C2B6B] text-[#1C2B6B]' : 'text-[#8a93b0] hover:text-[#5b6aa8]'}`}>
            Upload Calculator
            {uploadMbps != null && <span className="ml-1.5 rounded-full bg-[#1C2B6B] px-1.5 py-0.5 text-[9px] font-bold text-white">✓</span>}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'test'
            ? <ConnectionTest onUploadResult={(mbps) => { setUploadMbps(mbps); }} />
            : <UploadCalculator uploadMbps={uploadMbps} />
          }
        </div>
      </div>
    </div>,
    document.body
  );
}
