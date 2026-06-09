import { usePlannerStore } from '../store/usePlannerStore';
import { useCurrentEvent } from '../hooks/useCurrentEvent';
import { useTactic } from '../hooks/useTactic';
import { SPOT_TYPE_COLORS } from '../lib/spotTypes';
import { formatTimeShort } from '../lib/timeConflict';

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
      className="spot-drop-target rounded-xl border border-[#e3e7f2] bg-white p-3"
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
      <div className="mb-2 flex items-start gap-2">
        <div
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-black text-white"
          style={{ background: color }}
        >
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <input
            value={spot.name}
            onChange={(e) => updateSpot(spot.id, { name: e.target.value })}
            className="w-full border-none bg-transparent p-0 text-sm font-extrabold text-[#1C2B6B] outline-none"
          />
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[#8a93b0]">
            <span className="rounded bg-[#f4f5fa] px-1.5 py-0.5 font-bold uppercase">{spot.spot_type}</span>
            {spot.km_mark != null && <span>{spot.km_mark} km</span>}
            {spot.latitude != null && (
              <span>
                {spot.latitude.toFixed(5)}, {spot.longitude.toFixed(5)}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => removeSpot(spot.id)}
          className="text-xs font-bold text-[#c5cbe0] hover:text-[#cc2b2b]"
        >
          ✕
        </button>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2">
        <label className="text-[10px] font-bold uppercase text-[#9aa3bf]">
          From
          <input
            type="time"
            value={spot.time_from?.includes('T') ? spot.time_from.split('T')[1].slice(0, 5) : spot.time_from || ''}
            onChange={(e) => updateSpot(spot.id, { time_from: e.target.value })}
            className="mt-1 w-full rounded-lg border border-[#e3e7f2] px-2 py-1.5 text-xs"
          />
        </label>
        <label className="text-[10px] font-bold uppercase text-[#9aa3bf]">
          To
          <input
            type="time"
            value={spot.time_to?.includes('T') ? spot.time_to.split('T')[1].slice(0, 5) : spot.time_to || ''}
            onChange={(e) => updateSpot(spot.id, { time_to: e.target.value })}
            className="mt-1 w-full rounded-lg border border-[#e3e7f2] px-2 py-1.5 text-xs"
          />
        </label>
      </div>

      {(spot.time_from || spot.time_to) && (
        <div className="mb-2 text-[10px] text-[#9aa3bf]">
          Window: {formatTimeShort(spot.time_from)} – {formatTimeShort(spot.time_to)}
        </div>
      )}

      <SpotAssignments spotId={spot.id} />
    </div>
  );
}

export function SpotsList() {
  const event = useCurrentEvent();
  const tactic = useTactic(event?.id);
  const addSpot = usePlannerStore((s) => s.addSpot);

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
          <h2 className="text-base font-extrabold text-[#1C2B6B]">Spots & assignments</h2>
          <p className="text-xs text-[#8a93b0]">
            {tactic.spots.length} spots · {tactic.assignments.length} assignments
            {tactic.importedFrom?.type === 'infofile' && ' · imported from infofile'}
          </p>
        </div>
        <button
          type="button"
          onClick={addSpot}
          className="rounded-lg bg-[#1C2B6B] px-3 py-2 text-xs font-bold text-white hover:bg-[#152258]"
        >
          + Add spot
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {tactic.spots.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#d5daea] bg-white p-6 text-center text-sm text-[#9aa3bf]">
            Import KML/My Maps or an infofile from the left panel, or add spots manually.
          </div>
        )}
        {tactic.spots.map((spot, index) => (
          <SpotCard key={spot.id} spot={spot} index={index} />
        ))}
      </div>
    </div>
  );
}
