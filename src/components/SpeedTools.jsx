import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../i18n/useTranslation';

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
  { label: '10 GB',   gb: 10 },
  { label: '50 GB',   gb: 50 },
  { label: '100 GB',  gb: 100 },
  { label: '250 GB',  gb: 250 },
  { label: '500 GB',  gb: 500 },
  { label: '1000 GB', gb: 1000 },
];

function UploadCalculator({ uploadMbps }) {
  const { t } = useTranslation();
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
        {t('speedToolsDesc')}
      </p>

      {/* Upload speed source */}
      <div>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#8a93b0]">{t('speedToolsSpeedLabel')}</div>
        {uploadMbps != null ? (
          <div className="flex items-center gap-2 rounded-xl bg-[#f0f2fa] px-4 py-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
            <span className="text-sm font-extrabold text-[#1C2B6B]">{uploadMbps.toFixed(1)} Mbit/s</span>
            <span className="text-[10px] text-[#8a93b0]">{t('speedToolsFromTest')}</span>
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
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#8a93b0]">{t('speedToolsFileSizeLabel')}</div>
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
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">{t('speedToolsUploadTime')}</div>
          <div className="text-4xl font-black text-white">{formatDuration(duration)}</div>
          <div className="mt-1.5 text-[11px] text-white/40">
            {sizeInGb} GB @ {speedMbps.toFixed(1)} Mbit/s
          </div>
        </div>
      )}

      {/* Preset grid */}
      {speedMbps && (
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#8a93b0]">{t('speedToolsQuickRef')}</div>
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

// ─── Upload Speed Test tab ────────────────────────────────────────────────────

const STATUS = { idle: 'idle', running: 'running', done: 'done', error: 'error' };

function uploadColor(mbps) {
  if (mbps == null) return '#b0b8cf';
  if (mbps < 20) return '#cc2b2b';
  if (mbps < 40) return '#f59e0b';
  return '#22c55e';
}

function uploadLabel(mbps, t) {
  if (mbps == null) return null;
  if (mbps < 20) return { text: t('speedToolsSlowLabel'), color: '#cc2b2b', bg: '#fff5f5', border: '#fecaca' };
  if (mbps < 40) return { text: t('speedToolsModerateLabel'), color: '#92400e', bg: '#fffbeb', border: '#fde68a' };
  return { text: t('speedToolsGoodLabel'), color: '#166534', bg: '#f0fdf4', border: '#bbf7d0' };
}

function UploadGauge({ mbps }) {
  const color = uploadColor(mbps);
  const r = 54;
  const circ = 2 * Math.PI * r;
  const pct = Math.min((mbps || 0) / 200, 1);
  const dash = pct * circ;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={r} fill="none" stroke="#e3e7f2" strokeWidth="10" />
          <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`}
            strokeDashoffset={circ * 0.25}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black" style={{ color }}>
            {mbps != null ? mbps.toFixed(1) : '—'}
          </span>
          <span className="text-[11px] font-bold text-[#8a93b0]">Mbit/s</span>
        </div>
      </div>
    </div>
  );
}

function ConnectionTest({ onUploadResult }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState(STATUS.idle);
  const [results, setResults] = useState(null);
  const [liveUpload, setLiveUpload] = useState(null);
  const [latency, setLatency] = useState(null);
  const [progress, setProgress] = useState(0); // 0–100
  const [phaseIdx, setPhaseIdx] = useState(0);
  const progressRef = useRef(null);

  // Simulate smooth progress during test — ticks forward, never exceeds 95 until done
  function startProgress() {
    let val = 0;
    let phase = 0;
    progressRef.current = setInterval(() => {
      val += Math.random() * 2.5 + 0.5;
      if (val > 95) val = 95;
      setProgress(val);
      const newPhase = Math.min(Math.floor(val / 25), 3);
      if (newPhase !== phase) { phase = newPhase; setPhaseIdx(newPhase); }
    }, 300);
  }
  function stopProgress() {
    clearInterval(progressRef.current);
    setProgress(100);
  }

  const runTest = useCallback(async () => {
    setStatus(STATUS.running);
    setResults(null);
    setLiveUpload(null);
    setLatency(null);
    setProgress(0);
    setPhaseIdx(0);
    startProgress();

    try {
      const { default: SpeedTest } = await import('@cloudflare/speedtest');
      const engine = new SpeedTest({
        autoStart: false,
        measurements: [
          { type: 'latency', numPackets: 5 },
          { type: 'upload', bytes: 1e5, count: 5, bypassMinDuration: true },
          { type: 'upload', bytes: 1e6, count: 8 },
          { type: 'upload', bytes: 1e7, count: 6 },
        ],
      });

      engine.onResultsChange = () => {
        const r = engine.results;
        if (r.getUploadBandwidth) {
          const ul = r.getUploadBandwidth() / 1e6;
          if (ul > 0) setLiveUpload(ul);
        }
        if (r.getUnloadedLatency) {
          const lat = r.getUnloadedLatency();
          if (lat > 0) setLatency(lat);
        }
      };

      engine.onFinish = (r) => {
        stopProgress();
        const ul = r.getUploadBandwidth() / 1e6;
        const lat = r.getUnloadedLatency?.() ?? null;
        setResults({ upload: ul, latency: lat });
        setLiveUpload(ul);
        onUploadResult?.(ul);
        setStatus(STATUS.done);
      };

      engine.onError = () => { stopProgress(); setStatus(STATUS.error); };
      engine.play();
    } catch (e) {
      stopProgress();
      console.error(e);
      setStatus(STATUS.error);
    }
  }, [onUploadResult]);

  const ul = results?.upload ?? liveUpload;
  const lat = results?.latency ?? latency;
  const badge = ul != null ? uploadLabel(ul, t) : null;
  const color = uploadColor(ul);

  return (
    <div className="space-y-5">
      <p className="text-xs leading-relaxed text-[#8a93b0]">
        {t('speedToolsDesc')}
      </p>

      <div className="flex gap-2.5 rounded-xl border border-[#e3e7f2] bg-[#f8f9ff] px-3.5 py-3">
        <span className="mt-px shrink-0 text-base leading-none">💡</span>
        <p className="text-[11px] leading-relaxed text-[#5b6aa8]">
          {t('speedToolsTip')}
        </p>
      </div>

      {/* Running state */}
      {status === STATUS.running && (
        <div className="rounded-2xl border border-[#e3e7f2] bg-white p-5 space-y-4">
          {/* Live gauge (small, greyed until we have data) */}
          <div className="flex flex-col items-center">
            <UploadGauge mbps={ul} />
          </div>
          {/* Progress bar */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#8a93b0]">{t(`speedToolsPhase${phaseIdx}`)}</span>
              <span className="text-[10px] font-bold text-[#1C2B6B]">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#f0f2fa]">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #1C2B6B, #4f6aff)' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Done state */}
      {status === STATUS.done && (
        <div className="space-y-3">
          <div className="flex flex-col items-center gap-3">
            <UploadGauge mbps={ul} />
            {badge && (
              <div className="w-full rounded-xl border px-4 py-2.5 text-center text-xs font-semibold"
                style={{ background: badge.bg, borderColor: badge.border, color: badge.color }}>
                {badge.text}
              </div>
            )}
            {lat != null && (
              <div className="flex items-center gap-2 text-[11px] text-[#8a93b0]">
                <span className="font-bold text-[#1C2B6B]">{Math.round(lat)} ms</span> {t('speedToolsLatency')}
              </div>
            )}
          </div>
          {/* Completion bar — full green */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#22c55e]">{t('speedToolsTestComplete')}</span>
              <span className="text-[10px] font-bold text-[#22c55e]">100%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#f0fdf4]">
              <div className="h-full w-full rounded-full bg-[#22c55e]" />
            </div>
          </div>
        </div>
      )}

      {status === STATUS.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {t('speedToolsTestFailed')}
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
            {t('speedToolsMeasuring')}
          </span>
        ) : status === STATUS.done ? t('speedToolsTestAgain') : t('speedToolsStartTest')}
      </button>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-[10px] font-semibold">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#cc2b2b]" /> &lt; 20 Mbit/s</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> 20–40</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#22c55e]" /> &gt; 40</span>
      </div>

      {status === STATUS.done && (
        <p className="text-center text-[10px] text-[#b0b8cf]">{t('speedToolsPoweredBy')}</p>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function SpeedToolsModal({ onClose }) {
  const { t } = useTranslation();
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
              <div className="text-sm font-extrabold text-white">{t('speedToolsTitle')}</div>
              <div className="text-[10px] text-white/50">{t('speedToolsSubtitle')}</div>
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
            {t('speedTestTab')}
          </button>
          <button type="button" onClick={() => setTab('upload')}
            className={`rounded-t-lg px-4 py-2.5 text-xs font-bold transition-all ${tab === 'upload' ? 'border-b-2 border-[#1C2B6B] text-[#1C2B6B]' : 'text-[#8a93b0] hover:text-[#5b6aa8]'}`}>
            {t('fileDurationTab')}
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
