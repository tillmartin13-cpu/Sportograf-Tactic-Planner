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
            {cameraSettings.map((s, i) => {
              // Split imageSize at ';' — first part is the main size (bold), rest is crop info (normal)
              const [mainSize, ...cropParts] = s.imageSize.split(';');
              const cropInfo = cropParts.join(';').trim();
              return (
                <div key={i} className="rounded-xl bg-[#f0f2fa] p-3 text-sm space-y-1">
                  <div className="font-bold text-[#1C2B6B]">{s.brand} {s.model}</div>
                  <div className="text-gray-600">
                    {t('camSettingImageSize')} <strong>{mainSize.trim()}</strong>
                    {cropInfo && <span className="text-gray-400 font-normal"> · {cropInfo}</span>}
                  </div>
                  <div className="text-gray-600">{t('camSettingJpeg')} <strong>{s.jpeg}</strong> <span className="text-red-500 font-semibold text-xs">— {t('camSettingJpegNoFine')}</span></div>
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
