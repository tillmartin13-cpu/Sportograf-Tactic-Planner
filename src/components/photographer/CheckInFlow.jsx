import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePhotographerStore } from '../../store/usePhotographerStore';
import { usePhTranslation } from '../../i18n/usePhTranslation';
import { findAllCameraSettings, needsCardReader } from '../../lib/cameraSettings';
import { CameraCheck } from '../CameraCheck';

// ─── NTP hook ────────────────────────────────────────────────────────────────

function useNtpClock() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offsetRef = useRef(0);
  const [synced, setSynced] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const localBefore = Date.now();
    fetch(`https://timeapi.io/api/time/current/zone?timeZone=${encodeURIComponent(tz)}`)
      .then((r) => r.json())
      .then((data) => {
        const localAfter = Date.now();
        const serverMs = new Date(data.dateTime).getTime();
        offsetRef.current = serverMs - (localBefore + (localAfter - localBefore) / 2);
        setSynced(true);
      })
      .catch(() => setSyncError(true));
  }, [tz]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date(Date.now() + offsetRef.current)), 250);
    return () => clearInterval(id);
  }, []);

  return { now, synced, syncError, tz };
}

// ─── Timezone list (sorted by UTC offset) ────────────────────────────────────

const TIMEZONES = [
  { tz: 'Pacific/Honolulu',      label: 'Honolulu',            offset: -10 },
  { tz: 'America/Anchorage',     label: 'Anchorage',           offset: -9  },
  { tz: 'America/Los_Angeles',   label: 'Los Angeles / Seattle', offset: -8 },
  { tz: 'America/Denver',        label: 'Denver / Salt Lake City', offset: -7 },
  { tz: 'America/Chicago',       label: 'Chicago / Dallas',    offset: -6  },
  { tz: 'America/New_York',      label: 'New York / Miami',    offset: -5  },
  { tz: 'America/Halifax',       label: 'Halifax',             offset: -4  },
  { tz: 'America/Sao_Paulo',     label: 'São Paulo / Buenos Aires', offset: -3 },
  { tz: 'Atlantic/Azores',       label: 'Azoren',              offset: -1  },
  { tz: 'Europe/London',         label: 'London / Dublin',     offset: 0   },
  { tz: 'Europe/Paris',          label: 'Paris / Berlin / Rom / Madrid', offset: 1 },
  { tz: 'Europe/Helsinki',       label: 'Helsinki / Athen / Kairo', offset: 2 },
  { tz: 'Europe/Moscow',         label: 'Moskau / Nairobi',    offset: 3   },
  { tz: 'Asia/Dubai',            label: 'Dubai / Abu Dhabi',   offset: 4   },
  { tz: 'Asia/Karachi',          label: 'Karachi / Islamabad', offset: 5   },
  { tz: 'Asia/Kolkata',          label: 'Mumbai / Delhi',      offset: 5.5 },
  { tz: 'Asia/Dhaka',            label: 'Dhaka',               offset: 6   },
  { tz: 'Asia/Bangkok',          label: 'Bangkok / Jakarta',   offset: 7   },
  { tz: 'Asia/Singapore',        label: 'Singapur / Kuala Lumpur', offset: 8 },
  { tz: 'Asia/Shanghai',         label: 'Shanghai / Peking / Perth', offset: 8 },
  { tz: 'Asia/Tokyo',            label: 'Tokio / Seoul',       offset: 9   },
  { tz: 'Australia/Sydney',      label: 'Sydney / Melbourne',  offset: 10  },
  { tz: 'Pacific/Auckland',      label: 'Auckland',            offset: 12  },
];

function formatInTz(date, tz) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    hh: parts.hour,
    mm: parts.minute,
    ss: parts.second,
    day: parts.day,
    mon: parts.month,
    year: parts.year,
  };
}

// ─── Fullscreen atomic clock overlay ─────────────────────────────────────────

function AtomClockOverlay({ onClose, photographerCode, cameraLabel, displayTz }) {
  const { t } = usePhTranslation();
  const { now, synced, syncError, tz: deviceTz } = useNtpClock();

  const activeTz = displayTz || deviceTz;
  const { hh, mm, ss, day, mon, year } = formatInTz(now, activeTz);
  const travelMode = !!displayTz && displayTz !== deviceTz;

  // Corner marker SVG — L-shaped crop marks
  const Corner = ({ style }) => (
    <div className="absolute" style={{ width: 22, height: 22, ...style }}>
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M0 16 L0 0 L16 0" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none"/>
      </svg>
    </div>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: '#000' }}
      onClick={onClose}
    >
      {/* Content box — small, centered, surrounded by black */}
      <div className="relative flex flex-col items-center gap-3 select-none px-10 py-8">

        {/* Crop-corner markers */}
        <Corner style={{ top: -28, left: -28, transform: 'none' }} />
        <Corner style={{ top: -28, right: -28, transform: 'scaleX(-1)' }} />
        <Corner style={{ bottom: -28, left: -28, transform: 'scaleY(-1)' }} />
        <Corner style={{ bottom: -28, right: -28, transform: 'scale(-1,-1)' }} />

        <div
          className="font-mono font-black tabular-nums text-white leading-none"
          style={{ fontSize: 'clamp(32px, 9vw, 48px)', letterSpacing: '0.04em' }}
        >
          {hh}:{mm}:{ss}
        </div>

        <div
          className="font-mono font-bold tabular-nums text-white/70"
          style={{ fontSize: 'clamp(15px, 4vw, 22px)', letterSpacing: '0.08em' }}
        >
          {day}.{mon}.{year}
        </div>

        <div className="flex flex-col items-center gap-1">
          {travelMode && (
            <div className="flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5">
              <span style={{ fontSize: 10 }}>✈</span>
              <span className="text-[10px] font-bold text-amber-300 tracking-wide">{t('travelModeBadge')}</span>
            </div>
          )}
          <div
            className="font-mono text-white/35"
            style={{ fontSize: 'clamp(10px, 2.5vw, 14px)', letterSpacing: '0.1em' }}
          >
            {activeTz}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {synced ? (
            <><span className="h-1.5 w-1.5 rounded-full bg-green-400" /><span className="text-[10px] font-bold text-green-400">NTP sync · TimeAPI.io</span></>
          ) : syncError ? (
            <><span className="h-1.5 w-1.5 rounded-full bg-yellow-400" /><span className="text-[10px] font-bold text-yellow-400">{t('ntpDeviceTime')}</span></>
          ) : (
            <><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/30" /><span className="text-[11px] text-white/30">{t('ntpSyncing')}</span></>
          )}
        </div>

        {(photographerCode || cameraLabel) && (
          <div
            className="mt-2 font-mono text-white/70 tracking-widest text-center"
            style={{ fontSize: 'clamp(11px, 2.8vw, 15px)' }}
          >
            {[photographerCode, cameraLabel].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>

      {/* Tap to close hint */}
      <div className="absolute bottom-8 text-[11px] text-white/20 tracking-widest uppercase">
        {t('tapToClose')}
      </div>
    </div>,
    document.body
  );
}

// ─── Button shown in step 5 ───────────────────────────────────────────────────

function LiveClock({ eventDate, cameras, photographerCode }) {
  const { t } = usePhTranslation();
  const [open, setOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [otherText, setOtherText] = useState('');
  const [travelMode, setTravelMode] = useState(false);
  const [selectedTz, setSelectedTz] = useState(TIMEZONES[10].tz); // default Europe/Paris

  const cameraOptions = cameras.map((c) => `${c.brand} ${c.model}`);
  const hasMultiple = cameraOptions.length > 0;

  const cameraLabel = selectedCamera === '__other__'
    ? (otherText.trim() || 'Other')
    : selectedCamera || (cameraOptions[0] ?? '');

  // Future event warning
  let daysUntil = null;
  if (eventDate) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const eDate = new Date(eventDate); eDate.setHours(0, 0, 0, 0);
    const d = Math.round((eDate - today) / (1000 * 60 * 60 * 24));
    if (d > 0) daysUntil = d;
  }

  return (
    <>
      {open && (
        <AtomClockOverlay
          onClose={() => setOpen(false)}
          photographerCode={photographerCode}
          cameraLabel={cameraLabel}
          displayTz={travelMode ? selectedTz : undefined}
        />
      )}

      {/* Camera selector */}
      <div className="mb-2 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 shrink-0">{t('timeCheckCameraLabel')}</span>
          <select
            value={selectedCamera || (cameraOptions[0] ?? '__other__')}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#1C2B6B]"
          >
            {cameraOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
            <option value="__other__">{t('timeCheckOtherOption')}</option>
          </select>
        </div>
        {(selectedCamera === '__other__' || (!hasMultiple && cameraOptions.length === 0)) && (
          <input
            type="text"
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            placeholder={t('timeCheckOtherPlaceholder')}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#1C2B6B]"
          />
        )}
      </div>

      {/* Travel mode toggle */}
      <div className="mb-2 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
        <button
          type="button"
          onClick={() => setTravelMode((v) => !v)}
          className="flex w-full items-center gap-3 px-3 py-2.5"
        >
          <span className="text-base leading-none">✈️</span>
          <div className="flex-1 text-left">
            <span className="text-sm font-bold text-gray-800">{t('travelModeLabel')}</span>
            <span className="ml-2 text-[10px] text-gray-400">{t('travelModeSubLabel')}</span>
          </div>
          <div className={`relative h-5 w-9 rounded-full transition-colors ${travelMode ? 'bg-[#1C2B6B]' : 'bg-gray-300'}`}>
            <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${travelMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
        </button>
        {travelMode && (
          <div className="border-t border-gray-200 px-3 pb-3 pt-2">
            <select
              value={selectedTz}
              onChange={(e) => setSelectedTz(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#1C2B6B]"
            >
              {TIMEZONES.map(({ tz, label, offset }) => (
                <option key={tz} value={tz}>
                  {offset >= 0 ? `UTC+${offset}` : `UTC${offset}`} · {label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-3 flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors"
        style={{ background: '#0b1129' }}
      >
        <span className="text-2xl leading-none">🕐</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-extrabold text-white">Atomuhr öffnen</div>
          <div className="text-[10px] text-white/40">NTP-synchronisiert · Vollbild zum Fotografieren</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>

      {daysUntil !== null && (
        <div className="mb-3 flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
          <span className="mt-px shrink-0 text-base leading-none">⚠️</span>
          <div>
            <p className="text-[11px] font-extrabold text-amber-800">
              Event in {daysUntil} {daysUntil === 1 ? 'Tag' : 'Tagen'} — Uhrzeit vor Ort nochmal prüfen!
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-amber-700">
              Sommer-/Winterzeit oder Zeitzonenwechsel können die lokale Zeit am Eventort verschieben. Stelle die Kamerauhrzeit <strong>kurz vor dem Event</strong> neu auf die lokale Ortszeit ein.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const TUTORIAL_LINKS = [
  { id: 'settings', labelKey: 'Camera Settings', url: 'https://sportografacademy2.super.site/' },
  { id: 'workflow', labelKey: 'Camera Workflow', url: 'https://sportografacademy2.super.site/' },
  { id: 'newcomer', labelKey: 'Newcomer Info', url: 'https://sportografacademy2.super.site/' },
];

function ElectronicShutterWarning() {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 overflow-hidden">
      <div className="flex gap-2.5 p-3">
        <span className="mt-0.5 shrink-0 text-base leading-none">⚠️</span>
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-amber-700">Electronic Shutter — Rolling Shutter Risk</p>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
            This camera supports electronic shutter (silent mode). At fast-moving spots — e.g. road cycling or other high-speed subjects — <strong>do not use electronic shutter</strong>. The rolling shutter effect can cause significant image distortion. Switch to <strong>mechanical shutter</strong> at these spots.
          </p>
        </div>
      </div>
      <img
        src="/rolling_shutter.jpg"
        alt="Rolling shutter distortion example"
        className="w-full object-contain border-t border-amber-200"
      />
    </div>
  );
}

function StepHeader({ number, title, done }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-green-500 text-white' : 'bg-[#1C2B6B] text-white'}`}>
        {done ? '✓' : number}
      </div>
      <h3 className="font-bold text-gray-900">{title}</h3>
    </div>
  );
}

// ─── Secondary camera check-in modal (full CameraCheck for one camera) ───────

function SecondaryCameraCheckInModal({ cam, tacticId, language, onDone, onBack }) {
  const setSecondaryCameraCheck = usePhotographerStore((s) => s.setSecondaryCameraCheck);
  const [result, setResult] = useState(null);

  const key = `${cam.brand} ${cam.model}`;
  const [mainSize, ...cropParts] = cam.imageSize.split(';');
  const cropInfo = cropParts.join(';').trim();
  const done = ['accepted', 'warning', 'forced'].includes(result?.status);

  function handleResult(r) {
    setResult(r);
    if (['accepted', 'warning', 'forced'].includes(r?.status)) {
      setSecondaryCameraCheck(tacticId, key, true);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[300] flex flex-col bg-white overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
        <button type="button" onClick={onBack} className="text-sm font-semibold text-[#1C2B6B]">← Zurück</button>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-extrabold text-gray-900 truncate">{key}</div>
          <div className="text-[10px] text-gray-400">Kamera einchecken</div>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Camera settings for this camera only */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-3 text-[11px] font-bold text-gray-400 uppercase tracking-wide">Kamera-Einstellungen</div>
          <div className="rounded-xl bg-[#f0f2fa] p-3 text-sm space-y-1">
            <div className="font-bold text-[#1C2B6B]">{key}</div>
            <div className="text-gray-600">Bildgröße: <strong>{mainSize.trim()}</strong>
              {cropInfo && <span className="text-gray-400 font-normal"> · {cropInfo}</span>}
            </div>
            <div className="text-gray-600">JPEG: <strong>{cam.jpeg}</strong></div>
            <div className="text-gray-600">Verschluss: <strong>1/1000s</strong></div>
            <div className="text-gray-600">AF: <strong>Kontinuierlich (AI Servo / AF-C)</strong></div>
            <div className="text-gray-600">Weißabgleich: <strong>Automatisch (AWB)</strong></div>
            <div className="text-gray-600">Bildstil: <strong>Neutral</strong></div>
          </div>
          {cam.electronicShutter && !cam.globalShutter && (
            <div className="mt-2">
              <ElectronicShutterWarning />
            </div>
          )}
        </div>

        {/* Time check + CameraCheck */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-3 text-[11px] font-bold text-gray-400 uppercase tracking-wide">Kamera-Check</div>
          <CameraCheck
            lang={language}
            cameraModel={key}
            expectedImageSize={cam.imageSize}
            expectedJpeg={cam.jpeg}
            initialResult={result}
            onResult={handleResult}
          />
        </div>

        {done && (
          <button
            type="button"
            onClick={onDone}
            className="w-full rounded-2xl bg-green-500 py-4 text-base font-bold text-white hover:bg-green-600 transition-colors shadow-md"
          >
            Fertig — {key} eingecheckt ✓
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}

// ─── Secondary cameras dialog ─────────────────────────────────────────────────

function SecondaryCamerasDialog({ cameras, checks, checkouts, tacticId, language, onCheckout, onClose }) {
  const [selectedCam, setSelectedCam] = useState(null);
  const [expandedKey, setExpandedKey] = useState(null);

  if (selectedCam) {
    return (
      <SecondaryCameraCheckInModal
        cam={selectedCam}
        tacticId={tacticId}
        language={language}
        onDone={() => setSelectedCam(null)}
        onBack={() => setSelectedCam(null)}
      />
    );
  }

  const allDone = cameras.every((c) => {
    const key = `${c.brand} ${c.model}`;
    return checks[key] || checkouts[key] === 'checked_out';
  });

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-8 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#1C2B6B]">Weitere Kameras</h3>
          <button type="button" onClick={onClose} className="text-2xl leading-none text-gray-300 hover:text-gray-500">×</button>
        </div>
        <p className="mb-4 text-[13px] text-gray-500">
          Was möchtest du mit deinen weiteren Kameras tun?
        </p>
        <div className="space-y-2">
          {cameras.map((cam) => {
            const key = `${cam.brand} ${cam.model}`;
            const checkedIn = !!checks[key];
            const checkedOut = checkouts[key] === 'checked_out';
            const isExpanded = expandedKey === key;

            return (
              <div key={key} className={`rounded-2xl border-2 overflow-hidden transition-colors ${
                checkedIn ? 'border-green-400 bg-green-50'
                : checkedOut ? 'border-gray-300 bg-gray-50'
                : isExpanded ? 'border-[#1C2B6B]/40 bg-[#f0f2fa]'
                : 'border-gray-200 bg-white'
              }`}>
                {/* Camera row */}
                <button
                  type="button"
                  onClick={() => setExpandedKey(isExpanded ? null : key)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    checkedIn ? 'bg-green-500 text-white'
                    : checkedOut ? 'bg-gray-400 text-white'
                    : 'border-2 border-gray-300 text-transparent'
                  }`}>✓</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-800">{key}</div>
                    <div className="text-[11px] text-gray-400">
                      {checkedIn ? 'Eingecheckt ✓' : checkedOut ? 'Ausgecheckt' : 'Tippen für Optionen'}
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>

                {/* Action buttons — shown when expanded */}
                {isExpanded && (
                  <div className="flex gap-2 border-t border-gray-100 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => { setExpandedKey(null); setSelectedCam(cam); }}
                      className="flex-1 rounded-xl bg-[#1C2B6B] py-2 text-xs font-bold text-white hover:bg-[#2a3d8f] transition-colors"
                    >
                      Einchecken
                    </button>
                    <button
                      type="button"
                      onClick={() => { onCheckout(key); setExpandedKey(null); }}
                      className="flex-1 rounded-xl border border-gray-300 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      Auschecken
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedKey(null)}
                      className="flex-1 rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-400 hover:bg-gray-50 transition-colors"
                    >
                      Schließen
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {allDone && (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-2xl bg-green-500 py-3 text-sm font-bold text-white hover:bg-green-600 transition-colors"
          >
            Alle Kameras erledigt ✓
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}

export function CheckInFlow({ tacticId, cameraString, eventDate, photographerCode }) {
  const { t, language } = usePhTranslation();
  const setCheckInStep = usePhotographerStore((s) => s.setCheckInStep);
  const setCameraCheckResult = usePhotographerStore((s) => s.setCameraCheckResult);
  const setSecondaryCameraCheck = usePhotographerStore((s) => s.setSecondaryCameraCheck);
  const setCameraCheckout = usePhotographerStore((s) => s.setCameraCheckout);
  const completeCheckIn = usePhotographerStore((s) => s.completeCheckIn);
  const closeCheckIn = usePhotographerStore((s) => s.closeCheckIn);
  const rawCheckIn = usePhotographerStore((s) => s.checkIns[tacticId]);
  const checkIn = rawCheckIn ?? {};

  const [secondaryDialogOpen, setSecondaryDialogOpen] = useState(false);

  const steps = checkIn.steps || {};
  const cameraResult = checkIn.cameraCheckResult;
  const secondaryCameraChecks = checkIn.secondaryCameraChecks ?? {};
  const cameraCheckouts = checkIn.cameraCheckouts ?? {};
  const cameraSettings = findAllCameraSettings(cameraString || '');
  const primaryCamera = cameraSettings[0];
  const secondaryCameras = cameraSettings.slice(1);

  const requiresCardReader = cameraSettings.some((s) => needsCardReader(s.brand, s.model));

  const tutorialsDone = TUTORIAL_LINKS.every((tl) => steps[tl.id]);
  const settingsDone = steps.settings_confirmed;
  const batteryDone = steps.battery_checked;
  const cardDone = steps.card_formatted && (!requiresCardReader || steps.card_reader_packed);
  const primaryCameraDone = ['accepted', 'warning', 'forced'].includes(cameraResult?.status);
  const secondaryAllDone = secondaryCameras.length === 0 ||
    secondaryCameras.every((c) => {
      const key = `${c.brand} ${c.model}`;
      return secondaryCameraChecks[key] || cameraCheckouts[key] === 'checked_out';
    });
  const cameraDone = primaryCameraDone && secondaryAllDone;

  const allDone = tutorialsDone && settingsDone && batteryDone && cardDone && cameraDone;

  function toggle(step) {
    setCheckInStep(tacticId, step, !steps[step]);
  }

  // Auto-open secondary dialog when primary passes and secondary cameras exist
  useEffect(() => {
    if (primaryCameraDone && secondaryCameras.length > 0 && !secondaryAllDone) {
      setSecondaryDialogOpen(true);
    }
  }, [primaryCameraDone]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-[#1C2B6B]">{t('checkInFlowTitle')}</h2>
        <button type="button" onClick={closeCheckIn} className="text-xs text-gray-400 hover:text-gray-600">
          {t('checkInFlowBack')}
        </button>
      </div>

      {/* Step 1: Tutorials */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <StepHeader number="1" title={t('checkInFlowStep1')} done={tutorialsDone} />
        <div className="space-y-2">
          {TUTORIAL_LINKS.map((tl) => (
            <label key={tl.id} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!steps[tl.id]}
                onChange={() => toggle(tl.id)}
                className="h-4 w-4 accent-[#1C2B6B]"
              />
              <span className="flex-1 text-sm text-gray-700">{tl.labelKey}</span>
              <a
                href={tl.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-[#1C2B6B] underline"
                onClick={(e) => e.stopPropagation()}
              >
                {t('checkInFlowTutorialWatch')}
              </a>
            </label>
          ))}
        </div>
      </div>

      {/* Step 2: Camera settings */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <StepHeader number="2" title={t('checkInFlowStep2')} done={settingsDone} />
        {cameraSettings.length > 0 ? (
          <div className="mb-3 space-y-2">
            {cameraSettings.map((s, i) => {
              const [mainSize, ...cropParts] = s.imageSize.split(';');
              const cropInfo = cropParts.join(';').trim();
              return (
                <div key={i} className="rounded-xl bg-[#f0f2fa] p-3 text-sm space-y-1">
                  <div className="font-bold text-[#1C2B6B]">{s.brand} {s.model}</div>
                  <div className="text-gray-600">
                    {t('camSettingImageSize')} <strong>{mainSize.trim()}</strong>
                    {cropInfo && <span className="text-gray-400 font-normal"> · {cropInfo}</span>}
                  </div>
                  <div className="text-gray-600">{t('camSettingJpeg')} <strong>{s.jpeg}</strong></div>
                  <div className="text-gray-600">{t('camSettingShutter')} <strong>1/1000s</strong></div>
                  <div className="text-gray-600">{t('camSettingAF')} <strong>{t('camSettingContinuousAF')}</strong></div>
                  <div className="text-gray-600">{t('camSettingWB')} <strong>{t('camSettingAWB')}</strong> <span className="text-gray-400 font-normal">({t('camSettingAuto')})</span></div>
                  <div className="text-gray-600">{t('camSettingPictureStyle')} <strong>{t('camSettingNeutral')}</strong> <span className="text-gray-400 font-normal">— {t('camSettingNeutralDetail')}</span></div>
                </div>
              );
            })}
            {cameraSettings.some((s) => s.electronicShutter && !s.globalShutter) && (
              <ElectronicShutterWarning />
            )}
          </div>
        ) : (
          <div className="mb-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-500">
            {t('checkInFlowCameraDefault')}
          </div>
        )}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!steps.settings_confirmed}
            onChange={() => toggle('settings_confirmed')}
            className="h-4 w-4 accent-[#1C2B6B]"
          />
          <span className="text-sm text-gray-700">{t('checkInFlowSettingsConfirm')}</span>
        </label>
      </div>

      {/* Step 3: Batteries */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <StepHeader number="3" title={t('checkInFlowBatteryStep')} done={batteryDone} />
        <p className="text-sm text-gray-500 mb-3">{t('checkInFlowBatteryHint')}</p>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!steps.battery_checked}
            onChange={() => toggle('battery_checked')}
            className="h-4 w-4 accent-[#1C2B6B]"
          />
          <span className="text-sm text-gray-700">{t('checkInFlowBatteryConfirm')}</span>
        </label>
      </div>

      {/* Step 4: Memory card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <StepHeader number="4" title={t('checkInFlowStep3')} done={cardDone} />
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-500">{t('checkInFlowCardHint')}</p>
          <a
            href="https://sportografacademy2.super.site/essentials/essential-photographer-know-how#block-262b1e81867780269287c5941c1fc954"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-lg border border-[#1C2B6B]/20 bg-[#f0f2fa] px-2.5 py-1.5 text-[11px] font-bold text-[#1C2B6B] hover:bg-[#e5e9f5] whitespace-nowrap"
          >
            {t('checkInFlowCardGuide')}
          </a>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!steps.card_formatted}
              onChange={() => toggle('card_formatted')}
              className="h-4 w-4 accent-[#1C2B6B]"
            />
            <span className="text-sm text-gray-700">{t('checkInFlowCardConfirm')}</span>
          </label>
          {requiresCardReader && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!steps.card_reader_packed}
                onChange={() => toggle('card_reader_packed')}
                className="h-4 w-4 accent-[#1C2B6B]"
              />
              <span className="text-sm text-gray-700">{t('checkInFlowCardReaderConfirm')}</span>
            </label>
          )}
        </div>
      </div>

      {/* Step 5: Camera check */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <StepHeader number="5" title={t('checkInFlowStep4')} done={cameraDone} />
        <p className="text-sm text-gray-500 mb-3">{t('checkInFlowCameraHint')}</p>

        <LiveClock eventDate={eventDate} cameras={cameraSettings} photographerCode={photographerCode} />

        {/* Primary camera label when multiple cameras */}
        {secondaryCameras.length > 0 && primaryCamera && (
          <div className="mb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wide">
            {primaryCamera.brand} {primaryCamera.model} — Kamera-Check
          </div>
        )}

        <CameraCheck
          lang={language}
          cameraModel={primaryCamera ? `${primaryCamera.brand} ${primaryCamera.model}` : undefined}
          expectedImageSize={primaryCamera?.imageSize}
          expectedJpeg={primaryCamera?.jpeg}
          initialResult={cameraResult}
          onResult={(result) => setCameraCheckResult(tacticId, result)}
        />

        {/* Secondary cameras status — shown after primary passes */}
        {primaryCameraDone && secondaryCameras.length > 0 && (
          <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                Weitere Kameras
              </span>
              <button
                type="button"
                onClick={() => setSecondaryDialogOpen(true)}
                className="text-[11px] font-semibold text-[#1C2B6B] underline"
              >
                Bearbeiten
              </button>
            </div>
            <div className="space-y-1.5">
              {secondaryCameras.map((cam) => {
                const key = `${cam.brand} ${cam.model}`;
                const checkedIn = !!secondaryCameraChecks[key];
                const checkedOut = cameraCheckouts[key] === 'checked_out';
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      checkedIn ? 'bg-green-500 text-white'
                      : checkedOut ? 'bg-gray-400 text-white'
                      : 'border-2 border-gray-300 text-transparent'
                    }`}>✓</div>
                    <span className="text-sm text-gray-700">{key}</span>
                    <span className="ml-auto text-[10px] font-semibold">
                      {checkedIn ? <span className="text-green-600">eingecheckt</span>
                      : checkedOut ? <span className="text-gray-400">ausgecheckt</span>
                      : <span className="text-orange-500">ausstehend</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Secondary cameras dialog */}
      {secondaryDialogOpen && secondaryCameras.length > 0 && (
        <SecondaryCamerasDialog
          cameras={secondaryCameras}
          checks={secondaryCameraChecks}
          checkouts={cameraCheckouts}
          tacticId={tacticId}
          language={language}
          onCheckout={(key) => {
            const model = key.split(' ').slice(1).join(' ');
            setCameraCheckout(tacticId, model, true);
          }}
          onClose={() => setSecondaryDialogOpen(false)}
        />
      )}

      {/* Complete */}
      {allDone && !checkIn.completedAt && (
        <button
          type="button"
          onClick={() => { completeCheckIn(tacticId); closeCheckIn(); }}
          className="w-full rounded-2xl bg-green-500 py-4 text-base font-bold text-white hover:bg-green-600 transition-colors shadow-md"
        >
          {t('checkInFlowComplete')}
        </button>
      )}

      {checkIn.completedAt && (
        <div className="rounded-2xl bg-green-50 border border-green-300 p-4 text-center">
          <div className="text-2xl mb-1">✅</div>
          <div className="font-bold text-green-800">{t('checkInFlowDone')}</div>
          <div className="text-xs text-green-600 mt-1">
            {new Date(checkIn.completedAt).toLocaleString()}
          </div>
          <p className="text-xs text-green-700 mt-2">{t('checkInFlowDoneHint')}</p>
        </div>
      )}
    </div>
  );
}
