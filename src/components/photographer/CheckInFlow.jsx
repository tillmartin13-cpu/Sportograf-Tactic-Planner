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

// ─── Fullscreen atomic clock overlay ─────────────────────────────────────────

function AtomClockOverlay({ onClose, photographerCode, cameraLabel }) {
  const { now, synced, syncError, tz } = useNtpClock();

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const day  = String(now.getDate()).padStart(2, '0');
  const mon  = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

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

        <div
          className="font-mono text-white/35"
          style={{ fontSize: 'clamp(10px, 2.5vw, 14px)', letterSpacing: '0.1em' }}
        >
          {tz}
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          {synced ? (
            <><span className="h-1.5 w-1.5 rounded-full bg-green-400" /><span className="text-[10px] font-bold text-green-400">NTP sync · TimeAPI.io</span></>
          ) : syncError ? (
            <><span className="h-1.5 w-1.5 rounded-full bg-yellow-400" /><span className="text-[10px] font-bold text-yellow-400">Gerätezeit</span></>
          ) : (
            <><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/30" /><span className="text-[11px] text-white/30">Synchronisiere…</span></>
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
        Tippen zum Schließen
      </div>
    </div>,
    document.body
  );
}

// ─── Button shown in step 5 ───────────────────────────────────────────────────

function LiveClock({ eventDate, cameras, photographerCode }) {
  const [open, setOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [otherText, setOtherText] = useState('');

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
        />
      )}

      {/* Camera selector */}
      <div className="mb-2 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 shrink-0">Kamera:</span>
          <select
            value={selectedCamera || (cameraOptions[0] ?? '__other__')}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#1C2B6B]"
          >
            {cameraOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
            <option value="__other__">Andere / Other…</option>
          </select>
        </div>
        {(selectedCamera === '__other__' || (!hasMultiple && cameraOptions.length === 0)) && (
          <input
            type="text"
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            placeholder="Kamerabezeichnung eingeben…"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#1C2B6B]"
          />
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
    <div className="flex gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3">
      <span className="mt-0.5 shrink-0 text-base leading-none">⚠️</span>
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-amber-700">Electronic Shutter — Rolling Shutter Risk</p>
        <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
          This camera supports electronic shutter (silent mode). At fast-moving spots — e.g. road cycling or other high-speed subjects — <strong>do not use electronic shutter</strong>. The rolling shutter effect can cause significant image distortion. Switch to <strong>mechanical shutter</strong> at these spots.
        </p>
      </div>
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

export function CheckInFlow({ tacticId, cameraString, eventDate, photographerCode }) {
  const { t, language } = usePhTranslation();
  const setCheckInStep = usePhotographerStore((s) => s.setCheckInStep);
  const setCameraCheckResult = usePhotographerStore((s) => s.setCameraCheckResult);
  const completeCheckIn = usePhotographerStore((s) => s.completeCheckIn);
  const closeCheckIn = usePhotographerStore((s) => s.closeCheckIn);
  const rawCheckIn = usePhotographerStore((s) => s.checkIns[tacticId]);
  const checkIn = rawCheckIn ?? {};

  const steps = checkIn.steps || {};
  const cameraResult = checkIn.cameraCheckResult;
  const cameraSettings = findAllCameraSettings(cameraString || '');

  const requiresCardReader = cameraSettings.some((s) => needsCardReader(s.brand, s.model));

  const tutorialsDone = TUTORIAL_LINKS.every((tl) => steps[tl.id]);
  const settingsDone = steps.settings_confirmed;
  const batteryDone = steps.battery_checked;
  const cardDone = steps.card_formatted && (!requiresCardReader || steps.card_reader_packed);
  const cameraDone = ['accepted', 'warning', 'forced'].includes(cameraResult?.status);

  const allDone = tutorialsDone && settingsDone && batteryDone && cardDone && cameraDone;

  function toggle(step) {
    setCheckInStep(tacticId, step, !steps[step]);
  }

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
            {cameraSettings.map((s, i) => (
              <div key={i} className="rounded-xl bg-[#f0f2fa] p-3 text-sm">
                <div className="font-bold text-[#1C2B6B]">{s.brand} {s.model}</div>
                <div className="text-gray-600 mt-1">Image Size: <strong>{s.imageSize}</strong></div>
                <div className="text-gray-600">JPEG Quality: <strong>{s.jpeg}</strong></div>
              </div>
            ))}
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
        <p className="text-sm text-gray-500 mb-3">{t('checkInFlowCardHint')}</p>
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

        <CameraCheck
          lang={language}
          cameraModel={cameraSettings[0] ? `${cameraSettings[0].brand} ${cameraSettings[0].model}` : undefined}
          expectedImageSize={cameraSettings[0]?.imageSize}
          expectedJpeg={cameraSettings[0]?.jpeg}
          initialResult={cameraResult}
          onResult={(result) => setCameraCheckResult(tacticId, result)}
        />
      </div>

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
