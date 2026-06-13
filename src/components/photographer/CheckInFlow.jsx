import { useState } from 'react';
import { usePhotographerStore } from '../../store/usePhotographerStore';
import { usePhTranslation } from '../../i18n/usePhTranslation';
import { findAllCameraSettings, needsCardReader } from '../../lib/cameraSettings';
import { CameraCheck } from '../CameraCheck';

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

export function CheckInFlow({ tacticId, cameraString, eventDate }) {
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

        {/* time.is link */}
        <a
          href="https://time.is"
          target="_blank"
          rel="noreferrer"
          className="mb-3 flex items-center gap-2 rounded-xl border border-[#e3e7f2] bg-[#f8f9ff] px-3 py-2.5 text-left transition-colors hover:bg-[#eef1fb]"
        >
          <span className="text-base leading-none">🕐</span>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-extrabold text-[#1C2B6B]">Aktuelle Uhrzeit prüfen</div>
            <div className="text-[10px] text-[#8a93b0]">time.is — atomgenaue Lokalzeit öffnen</div>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8a93b0" strokeWidth="2" strokeLinecap="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>

        {/* Future event warning */}
        {(() => {
          if (!eventDate) return null;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const eDate = new Date(eventDate);
          eDate.setHours(0, 0, 0, 0);
          const daysUntil = Math.round((eDate - today) / (1000 * 60 * 60 * 24));
          if (daysUntil <= 0) return null;
          return (
            <div className="mb-3 flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
              <span className="mt-px shrink-0 text-base leading-none">⚠️</span>
              <div>
                <p className="text-[11px] font-extrabold text-amber-800">
                  Event liegt noch {daysUntil} {daysUntil === 1 ? 'Tag' : 'Tage'} in der Zukunft
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-amber-700">
                  Durch Sommer-/Winterzeit oder Zeitzonenwechsel kann sich die lokale Uhrzeit bis zum Event ändern. <strong>Stelle die Kameruhrzeit immer kurz vor dem Event nochmal auf die lokale Ortszeit ein.</strong> Es gilt die lokale Zeit am Eventort.
                </p>
              </div>
            </div>
          );
        })()}

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
