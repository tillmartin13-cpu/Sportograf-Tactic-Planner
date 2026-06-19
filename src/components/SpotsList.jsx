import { usePlannerStore } from '../store/usePlannerStore';
import { useCurrentEvent } from '../hooks/useCurrentEvent';
import { useTactic } from '../hooks/useTactic';
import { SPOT_TYPE_COLORS } from '../lib/spotTypes';
import { getSpotTerms } from '../lib/hyrox';

function SpotAssignments({ spotId }) {
  const event = useCurrentEvent();
  const tactic = useTactic(event?.id);
  const photographers = usePlannerStore((s) => s.photographers) || [];
  const unassignPhotographer = usePlannerStore((s) => s.unassignPhotographer);

  const assignments = tactic.assignments.filter((a) => a.spot_id === spotId);

  if (!assignments.length) {
    return <span className="text-xs italic text-[#b0b8cf]">Drop photographer here</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {assignments.map((a) => {
        const ph = photographers.find((p) => p.id === a.photographer_id);
        return (
          <button
            key={a.id}
            type="button"
            onClick={(e) => { e.stopPropagation(); unassignPhotographer(spotId, a.photographer_id); }}
            className="rounded-md bg-[#1C2B6B] px-2 py-0.5 text-[11px] font-bold text-white hover:bg-[#cc2b2b]"
            title="Click to remove assignment"
          >
            {ph?.code || '?'}
          </button>
        );
      })}
    </div>
  );
}

function SpotCard({ spot, index }) {
  const openEditSpotModal = usePlannerStore((s) => s.openEditSpotModal);
  const assignPhotographer = usePlannerStore((s) => s.assignPhotographer);

  const color = SPOT_TYPE_COLORS[spot.spot_type] || SPOT_TYPE_COLORS.custom;

  const timeLabel = (() => {
    const fmt = (t) => t?.includes('T') ? t.split('T')[1].slice(0, 5) : t;
    const from = fmt(spot.time_from);
    const to = fmt(spot.time_to);
    if (from && to) return `${from} – ${to}`;
    if (from) return `From ${from}`;
    if (to) return `Until ${to}`;
    return null;
  })();

  return (
    <div
      className="spot-drop-target group relative rounded-xl border border-[#e3e7f2] bg-white p-2.5 cursor-pointer hover:border-[#1C2B6B]/40 hover:shadow-sm transition-all"
      onClick={() => openEditSpotModal(spot.id)}
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
      }}
      onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        try {
          const ph = JSON.parse(e.dataTransfer.getData('application/json'));
          assignPhotographer(spot.id, ph);
        } catch {
          /* ignore */
        }
      }}
    >
      {/* Header row */}
      <div className="mb-2 flex items-center gap-1.5">
        <div
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-black text-white"
          style={{ background: color }}
        >
          {index + 1}
        </div>
        <span className="min-w-0 flex-1 truncate text-xs font-extrabold text-[#1C2B6B]">
          {spot.name}
        </span>
        {/* edit hint */}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className="shrink-0 text-[#c5cbe0] group-hover:text-[#1C2B6B]/40 transition-colors"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </div>

      {/* Meta: type + km + time */}
      <div className="mb-2 flex flex-wrap items-center gap-1 text-[10px] text-[#8a93b0]">
        <span className="rounded bg-[#f4f5fa] px-1 py-0.5 font-bold uppercase">{spot.spot_type}</span>
        {spot.km_mark != null && <span>{spot.km_mark} km</span>}
        {timeLabel && (
          <span className={spot.time_estimated ? 'text-amber-500 font-medium' : 'text-[#9aa3bf]'}>
            {spot.time_estimated ? `~${timeLabel}` : timeLabel}
          </span>
        )}
        {spot.time_estimated && (
          <span className="rounded bg-amber-50 px-1 py-0.5 text-amber-500 font-bold">Geschätzt</span>
        )}
      </div>

      {/* Notes preview */}
      {spot.notes && (
        <p className="mb-2 line-clamp-2 text-[10px] leading-relaxed text-[#8a93b0] italic">
          {spot.notes}
        </p>
      )}

      <SpotAssignments spotId={spot.id} />

      {spot.refImages?.length > 0 && (
        <div className="mt-2 flex gap-1">
          {spot.refImages.slice(0, 3).map((img, i) => (
            <img
              key={i}
              src={img.data}
              alt=""
              className="h-8 w-8 rounded-md object-cover border border-[#e3e7f2]"
            />
          ))}
          {spot.refImages.length > 3 && (
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e3e7f2] bg-[#f4f5fa] text-[9px] font-bold text-[#8a93b0]">
              +{spot.refImages.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SpotsList() {
  const event = useCurrentEvent();
  const tactic = useTactic(event?.id);
  const addSpot = usePlannerStore((s) => s.addSpot);
  const terms = getSpotTerms(event);

  if (!event) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-[#d5daea] bg-white p-8 text-center text-sm text-[#8a93b0]">
        Create or select an event to start planning spots and assignments.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-[#1C2B6B]">{terms.sectionTitle}</h2>
          <p className="text-xs text-[#8a93b0]">
            {tactic.spots.length} {terms.plural.toLowerCase()} · {tactic.assignments.length} assignments
            {tactic.importedFrom?.type === 'infofile' && ' · imported from infofile'}
          </p>
        </div>
        <button
          type="button"
          onClick={addSpot}
          className="rounded-lg bg-[#1C2B6B] px-3 py-2 text-xs font-bold text-white hover:bg-[#152258]"
        >
          {terms.add}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {tactic.spots.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d5daea] bg-white p-6 text-center text-sm text-[#9aa3bf]">
            {terms.emptyHint}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {tactic.spots.map((spot, index) => (
              <SpotCard key={spot.id} spot={spot} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
