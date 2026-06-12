import { useMemo, useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';

const PALETTE = [
  '#2563eb','#dc2626','#16a34a','#d97706','#7c3aed','#0891b2',
  '#be185d','#65a30d','#ea580c','#0e7490','#9333ea','#b45309',
  '#15803d','#b91c1c','#1d4ed8','#c2410c','#4f46e5','#047857',
];

function toMinutes(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d)) return null;
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function formatAxisLabel(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

export function PhotographerTimeline({ timeline = [], referenceLabel }) {
  const { t } = useTranslation();
  const [tooltip, setTooltip] = useState(null);

  const { byCode, codes, rangeMin, rangeSpan } = useMemo(() => {
    const byCode = {};
    for (const entry of timeline) {
      if (!entry.code || !entry.time_from || !entry.time_to) continue;
      if (!byCode[entry.code]) byCode[entry.code] = [];
      byCode[entry.code].push(entry);
    }
    const codes = Object.keys(byCode).sort();
    const allMins = timeline.flatMap(e => [toMinutes(e.time_from), toMinutes(e.time_to)]).filter(Boolean);
    const rangeMin = Math.max(0, (Math.min(...allMins) || 0) - 15);
    const rangeMax = Math.min(1440, (Math.max(...allMins) || 1440) + 15);
    const rangeSpan = rangeMax - rangeMin || 1;
    return { byCode, codes, rangeMin, rangeSpan };
  }, [timeline]);

  if (!codes.length) return null;

  const colorOf = (code) => PALETTE[codes.indexOf(code) % PALETTE.length];
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => rangeMin + rangeSpan * t);

  return (
    <div className="shrink-0 rounded-xl border border-[#e3e7f2] bg-white px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8a93b0]">
            {t('refTimelineTitle') || '2025 Event — Photographer Schedule'}
          </p>
          {referenceLabel && (
            <h3 className="text-sm font-extrabold text-[#1C2B6B]">{referenceLabel}</h3>
          )}
        </div>
        <span className="rounded-full bg-[#f0f4ff] px-2 py-0.5 text-[10px] font-bold text-[#5b6aa8]">
          {codes.length} {t('refTimelinePhotographers') || 'photographers'}
        </span>
      </div>

      {/* Time axis */}
      <div className="mb-1 flex pl-14 text-[9px] font-bold text-[#b0b8cf]">
        {ticks.map((tick, i) => (
          <span
            key={tick}
            className="flex-1 text-center first:text-left last:text-right"
          >
            {formatAxisLabel(tick)}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="max-h-64 space-y-1 overflow-y-auto pr-0.5">
        {codes.map((code) => {
          const color = colorOf(code);
          const entries = byCode[code];
          return (
            <div key={code} className="flex items-center gap-2">
              <span
                className="w-12 shrink-0 truncate text-[10px] font-bold"
                style={{ color }}
              >
                {code}
              </span>
              <div className="relative h-4 min-w-0 flex-1 rounded-full bg-[#f3f5fa]">
                {entries.map((entry, i) => {
                  const start = toMinutes(entry.time_from);
                  const end = toMinutes(entry.time_to);
                  if (start == null || end == null) return null;
                  const left = Math.max(0, ((start - rangeMin) / rangeSpan) * 100);
                  const width = Math.max(((end - start) / rangeSpan) * 100, 1);
                  return (
                    <div
                      key={i}
                      className="absolute top-0.5 h-3 rounded-full opacity-85 cursor-default"
                      style={{ left: `${left}%`, width: `${width}%`, background: color }}
                      onMouseEnter={() => setTooltip({ code, entry })}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="mt-2 rounded-lg bg-[#f0f4ff] px-3 py-2 text-[10px] text-[#1C2B6B]">
          <span className="font-bold" style={{ color: colorOf(tooltip.code) }}>{tooltip.code}</span>
          {' · '}
          <span className="font-semibold">{tooltip.entry.spotName}</span>
          {' · '}
          {formatTime(tooltip.entry.time_from)}–{formatTime(tooltip.entry.time_to)}
          {tooltip.entry.images > 0 && (
            <span className="ml-2 text-[#8a93b0]">{tooltip.entry.images.toLocaleString()} img</span>
          )}
        </div>
      )}
    </div>
  );
}
