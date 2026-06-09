import { SPOT_TYPE_COLORS } from '../lib/spotTypes';
import { buildTimelineRange, formatTimeShort, toMinutesFromDateTime } from '../lib/timeConflict';

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

export function ReferenceTimeline({ spots = [], referenceLabel }) {
  const timedSpots = spots
    .filter((s) => s.time_from && s.time_to)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const range = buildTimelineRange(timedSpots);
  if (!range || !timedSpots.length) return null;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => range.min + range.span * t);

  return (
    <div className="shrink-0 rounded-xl border border-[#e3e7f2] bg-white px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-extrabold text-[#1C2B6B]">Reference schedule</h3>
          {referenceLabel && (
            <p className="text-[10px] text-[#8a93b0]">{referenceLabel}</p>
          )}
        </div>
        <span className="rounded-full bg-[#f0f4ff] px-2 py-0.5 text-[10px] font-bold text-[#5b6aa8]">
          {timedSpots.length} spots
        </span>
      </div>

      <div className="mb-1 flex pl-[5.5rem] pr-[4.5rem] text-[9px] font-bold text-[#b0b8cf]">
        {ticks.map((tick) => (
          <span key={tick} className="flex-1 text-center first:text-left last:text-right">
            {formatAxisLabel(tick)}
          </span>
        ))}
      </div>

      <div className="max-h-[132px] space-y-1 overflow-y-auto pr-0.5">
        {timedSpots.map((spot, index) => {
          const start = toMinutesFromDateTime(spot.time_from);
          const end = toMinutesFromDateTime(spot.time_to);
          const left = ((start - range.min) / range.span) * 100;
          const width = Math.max(((end - start) / range.span) * 100, 1.5);
          const color = SPOT_TYPE_COLORS[spot.spot_type] || SPOT_TYPE_COLORS.custom;

          return (
            <div key={spot.id} className="flex items-center gap-2">
              <span
                className="w-[5.5rem] shrink-0 truncate text-[10px] font-bold text-[#5b6aa8]"
                title={spot.name}
              >
                {spotLabel(spot.name, index)}
              </span>
              <div className="relative h-3.5 min-w-0 flex-1 rounded-full bg-[#f3f5fa]">
                <div
                  className="absolute top-0 h-full rounded-full opacity-90"
                  style={{ left: `${left}%`, width: `${width}%`, background: color }}
                  title={`${formatTimeShort(spot.time_from)} – ${formatTimeShort(spot.time_to)}`}
                />
              </div>
              <span className="w-[4.5rem] shrink-0 text-right text-[9px] font-semibold text-[#8a93b0]">
                {formatTimeShort(spot.time_from)}–{formatTimeShort(spot.time_to)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
