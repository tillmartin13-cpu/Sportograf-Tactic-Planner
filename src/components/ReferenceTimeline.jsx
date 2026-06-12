import { useState } from 'react';
import { buildTimelineRange, formatTimeShort, toMinutesFromDateTime } from '../lib/timeConflict';
import { useTranslation } from '../i18n/useTranslation';

// Muted, desaturated versions of spot-type colors
const MUTED_COLORS = {
  Start:  { bar: '#4d8c6b', dot: '#3a6b52' },
  Swim:   { bar: '#3a7a8c', dot: '#2d5f6b' },
  T1:     { bar: '#3a8080', dot: '#2d6363' },
  T2:     { bar: '#8c5a7a', dot: '#6b4460' },
  Bike:   { bar: '#8c7040', dot: '#6b5530' },
  Run:    { bar: '#8c4a4a', dot: '#6b3838' },
  Finish: { bar: '#8c5e3a', dot: '#6b4830' },
  km:     { bar: '#4a6a8c', dot: '#385266' },
  custom: { bar: '#6a6a8c', dot: '#525270' },
};

function getMuted(spotType) {
  return MUTED_COLORS[spotType] || MUTED_COLORS.custom;
}

function formatAxisLabel(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function spotLabel(name, index) {
  const short = (name || '').replace(/^km/i, 'km').trim();
  if (short.length <= 14) return short || `#${index + 1}`;
  return `${short.slice(0, 12)}…`;
}

export function ReferenceTimeline({ spots = [], referenceTimeline = [], referenceLabel }) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(null);

  const timedSpots = spots
    .filter((s) => s.time_from && s.time_to)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const range = buildTimelineRange(timedSpots);
  if (!range || !timedSpots.length) return null;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => range.min + range.span * t);

  // Build lookup: spotName → [{code, images, time_from, time_to}]
  const timelineBySpot = {};
  for (const entry of referenceTimeline) {
    if (!entry.spotName) continue;
    if (!timelineBySpot[entry.spotName]) timelineBySpot[entry.spotName] = [];
    timelineBySpot[entry.spotName].push(entry);
  }

  const hoveredSpot = hovered != null ? timedSpots[hovered] : null;
  const hoveredCams = hoveredSpot ? (timelineBySpot[hoveredSpot.name] || []) : [];
  const totalImages = hoveredCams.reduce((s, c) => s + (c.images || 0), 0);

  return (
    <div className="shrink-0 rounded-xl border border-[#e3e7f2] bg-white px-3 py-2.5">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8a93b0]">
            {t('refSpotsTitle') || '2025 Event — Spot Schedule'}
          </p>
          {referenceLabel && (
            <h3 className="text-sm font-extrabold text-[#1C2B6B]">{referenceLabel}</h3>
          )}
        </div>
        <span className="rounded-full bg-[#f0f4ff] px-2 py-0.5 text-[10px] font-bold text-[#5b6aa8]">
          {timedSpots.length} {t('refSpotsCount') || 'spots'}
        </span>
      </div>

      {/* Time axis */}
      <div className="mb-1 flex pl-[5.5rem] pr-[4.5rem] text-[9px] font-bold text-[#b0b8cf]">
        {ticks.map((tick) => (
          <span key={tick} className="flex-1 text-center first:text-left last:text-right">
            {formatAxisLabel(tick)}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="max-h-[180px] space-y-1 overflow-y-auto pr-0.5">
        {timedSpots.map((spot, index) => {
          const start = toMinutesFromDateTime(spot.time_from);
          const end = toMinutesFromDateTime(spot.time_to);
          const left = ((start - range.min) / range.span) * 100;
          const width = Math.max(((end - start) / range.span) * 100, 1.5);
          const { bar } = getMuted(spot.spot_type);
          const cams = timelineBySpot[spot.name] || [];
          const imgs = cams.reduce((s, c) => s + (c.images || 0), 0);
          const isHov = hovered === index;

          return (
            <div
              key={spot.id}
              className="flex items-center gap-2 rounded-md px-0 py-0.5 transition-colors"
              style={{ background: isHov ? '#f4f6fc' : 'transparent' }}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
            >
              <span
                className="w-[5.5rem] shrink-0 truncate text-[10px] font-bold"
                style={{ color: bar }}
                title={spot.name}
              >
                {spotLabel(spot.name, index)}
              </span>

              <div className="relative h-3.5 min-w-0 flex-1 rounded-full bg-[#f0f2f8]">
                <div
                  className="absolute top-0 h-full rounded-full transition-opacity"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    background: bar,
                    opacity: isHov ? 1 : 0.7,
                  }}
                />
              </div>

              <div className="w-[4.5rem] shrink-0 flex flex-col items-end gap-0">
                <span className="text-[9px] font-semibold text-[#8a93b0] leading-tight">
                  {formatTimeShort(spot.time_from)}–{formatTimeShort(spot.time_to)}
                </span>
                {imgs > 0 && (
                  <span className="text-[8px] text-[#aab0c8] leading-tight">
                    {imgs.toLocaleString()} img
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hover tooltip */}
      {hoveredSpot && (
        <div className="mt-2 rounded-lg border border-[#e3e7f2] bg-[#f8f9fd] px-3 py-2">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-extrabold text-[#1C2B6B]">{hoveredSpot.name}</span>
            <span className="text-[10px] font-semibold text-[#8a93b0]">
              {formatTimeShort(hoveredSpot.time_from)} – {formatTimeShort(hoveredSpot.time_to)}
            </span>
          </div>

          {hoveredCams.length > 0 ? (
            <div className="space-y-0.5">
              {hoveredCams.map((cam, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px]">
                  <span
                    className="w-10 shrink-0 font-bold"
                    style={{ color: getMuted(hoveredSpot.spot_type).bar }}
                  >
                    {cam.code}
                  </span>
                  <span className="text-[#6b7280]">
                    {formatTimeShort(cam.time_from)} – {formatTimeShort(cam.time_to)}
                  </span>
                  {cam.images > 0 && (
                    <span className="ml-auto text-[#aab0c8]">{cam.images.toLocaleString()} img</span>
                  )}
                </div>
              ))}
              {totalImages > 0 && (
                <div className="mt-1 border-t border-[#e8eaf2] pt-1 text-right text-[9px] font-bold text-[#8a93b0]">
                  {totalImages.toLocaleString()} {t('totalImages') || 'total images'}
                </div>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-[#aab0c8]">{t('noCameraData') || 'No camera data'}</p>
          )}
        </div>
      )}
    </div>
  );
}
