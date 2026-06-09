import { useState } from 'react';
import { usePhotographerStore } from '../../store/usePhotographerStore';
import { findAllCameraSettings } from '../../lib/cameraSettings';
import { CameraCheck } from '../CameraCheck';

const TUTORIAL_LINKS = [
  { id: 'settings', label: 'Camera Settings', url: 'https://sportografacademy2.super.site/' },
  { id: 'workflow', label: 'Camera Workflow', url: 'https://sportografacademy2.super.site/' },
  { id: 'newcomer', label: 'Newcomer Info', url: 'https://sportografacademy2.super.site/' },
];

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

export function CheckInFlow({ tacticId, cameraString }) {
  const setCheckInStep = usePhotographerStore((s) => s.setCheckInStep);
  const setCameraCheckResult = usePhotographerStore((s) => s.setCameraCheckResult);
  const completeCheckIn = usePhotographerStore((s) => s.completeCheckIn);
  const closeCheckIn = usePhotographerStore((s) => s.closeCheckIn);
  const checkIn = usePhotographerStore((s) => s.checkIns[tacticId] ?? {});

  const steps = checkIn.steps || {};
  const cameraResult = checkIn.cameraCheckResult;
  const cameraSettings = findAllCameraSettings(cameraString || '');

  const tutorialsDone = TUTORIAL_LINKS.every((t) => steps[t.id]);
  const settingsDone = steps.settings_confirmed;
  const cardDone = steps.card_formatted;
  const cameraDone = cameraResult?.status === 'accepted' || cameraResult?.status === 'warning';

  const allDone = tutorialsDone && settingsDone && cardDone && cameraDone;

  function toggle(step) {
    setCheckInStep(tacticId, step, !steps[step]);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-[#1C2B6B]">Pre-Event Check-in</h2>
        <button type="button" onClick={closeCheckIn} className="text-xs text-gray-400 hover:text-gray-600">
          ← Back
        </button>
      </div>

      {/* Step 1: Tutorials */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <StepHeader number="1" title="Academy Tutorials" done={tutorialsDone} />
        <div className="space-y-2">
          {TUTORIAL_LINKS.map((t) => (
            <label key={t.id} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!steps[t.id]}
                onChange={() => toggle(t.id)}
                className="h-4 w-4 accent-[#1C2B6B]"
              />
              <span className="flex-1 text-sm text-gray-700">{t.label}</span>
              <a
                href={t.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-[#1C2B6B] underline"
                onClick={(e) => e.stopPropagation()}
              >
                Watch ↗
              </a>
            </label>
          ))}
        </div>
      </div>

      {/* Step 2: Camera settings */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <StepHeader number="2" title="Camera Settings" done={settingsDone} />
        {cameraSettings.length > 0 ? (
          <div className="mb-3 space-y-2">
            {cameraSettings.map((s, i) => (
              <div key={i} className="rounded-xl bg-[#f0f2fa] p-3 text-sm">
                <div className="font-bold text-[#1C2B6B]">{s.brand} {s.model}</div>
                <div className="text-gray-600 mt-1">Image Size: <strong>{s.imageSize}</strong></div>
                <div className="text-gray-600">JPEG Quality: <strong>{s.jpeg}</strong></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-500">
            General: JPG Normal/Standard, not RAW, not finest quality option. AWB, sRGB, neutral picture style.
          </div>
        )}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!steps.settings_confirmed}
            onChange={() => toggle('settings_confirmed')}
            className="h-4 w-4 accent-[#1C2B6B]"
          />
          <span className="text-sm text-gray-700">I have set my camera correctly</span>
        </label>
      </div>

      {/* Step 3: Memory card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <StepHeader number="3" title="Memory Card" done={cardDone} />
        <p className="text-sm text-gray-500 mb-3">Use empty, freshly formatted 64GB+ fast cards only.</p>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!steps.card_formatted}
            onChange={() => toggle('card_formatted')}
            className="h-4 w-4 accent-[#1C2B6B]"
          />
          <span className="text-sm text-gray-700">Cards are empty and formatted</span>
        </label>
      </div>

      {/* Step 4: Camera check */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <StepHeader number="4" title="Camera Time Check" done={cameraDone} />
        <p className="text-sm text-gray-500 mb-4">
          Open an atomic clock app on your phone, photograph the phone screen with your camera, then photograph the camera display with your phone. Upload that photo here.
        </p>
        <CameraCheck
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
          ✅ Complete Check-in
        </button>
      )}

      {checkIn.completedAt && (
        <div className="rounded-2xl bg-green-50 border border-green-300 p-4 text-center">
          <div className="text-2xl mb-1">✅</div>
          <div className="font-bold text-green-800">Check-in complete</div>
          <div className="text-xs text-green-600 mt-1">
            {new Date(checkIn.completedAt).toLocaleString()}
          </div>
          <p className="text-xs text-green-700 mt-2">Take a screenshot and share it with your team lead.</p>
        </div>
      )}
    </div>
  );
}
