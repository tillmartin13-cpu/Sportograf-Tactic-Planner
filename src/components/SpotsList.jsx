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
            onClick={() => unassignPhotographer(spotId, a.photographer_id)}
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
  const updateSpot = usePlannerStore((s) => s.updateSpot);
  const removeSpot = usePlannerStore((s) => s.removeSpot);
  const assignPhotographer = usePlannerStore((s) => s.assignPhotographer);

  const color = SPOT_TYPE_COLORS[spot.spot_type] || SPOT_TYPE_COLORS.custom;

  return (
    <div
      className="spot-drop-target rounded-xl border border-[#e3e7f2] bg-white p-2.5"
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
        <input
          value={spot.name}
          onChange={(e) => updateSpot(spot.id, { name: e.target.value })}
          className="min-w-0 flex-1 border-none bg-transparent p-0 text-xs font-extrabold text-[#1C2B6B] outline-none"
        />
        <button
          type="button"
          onClick={() => removeSpot(spot.id)}
          className="shrink-0 text-[11px] font-bold text-[#c5cbe0] hover:text-[#cc2b2b]"
        >
          ✕
        </button>
      </div>

      {/* Meta: type + km */}
      <div className="mb-2 flex flex-wrap items-center gap-1 text-[10px] text-[#8a93b0]">
        <span className="rounded bg-[#f4f5fa] px-1 py-0.5 font-bold uppercase">{spot.spot_type}</span>
        {spot.km_mark != null && <span>{spot.km_mark} km</span>}
      </div>

      {/* Time inputs */}
      <div className="mb-2 grid grid-cols-2 gap-1">
        <label className="text-[9px] font-bold uppercase text-[#9aa3bf]">
          From <span className="normal-case font-normal">(optional)</span>
          <input
            type="time"
            value={spot.time_from?.includes('T') ? spot.time_from.split('T')[1].slice(0, 5) : spot.time_from || ''}
            onChange={(e) => updateSpot(spot.id, { time_from: e.target.value })}
            className="mt-0.5 w-full rounded-lg border border-[#e3e7f2] px-1.5 py-1 text-[10px]"
          />
        </label>
        <label className="text-[9px] font-bold uppercase text-[#9aa3bf]">
          To
          <input
            type="time"
            value={spot.time_to?.includes('T') ? spot.time_to.split('T')[1].slice(0, 5) : spot.time_to || ''}
            onChange={(e) => updateSpot(spot.id, { time_to: e.target.value })}
            className="mt-0.5 w-full rounded-lg border border-[#e3e7f2] px-1.5 py-1 text-[10px]"
          />
        </label>
      </div>

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
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {tactic.spots.map((spot, index) => (
              <SpotCard key={spot.id} spot={spot} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
