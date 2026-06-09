import { usePlannerStore } from '../store/usePlannerStore';
import { useCurrentEvent } from '../hooks/useCurrentEvent';
import { useTactic } from '../hooks/useTactic';

export function PhotographersPanel() {
  const allPhotographers = usePlannerStore((s) => s.photographers) || [];
  const event = useCurrentEvent();
  const tactic = useTactic(event?.id);

  // Only show photographers belonging to the current event
  const photographers = event
    ? allPhotographers.filter((p) =>
        p.eventIds
          ? p.eventIds.includes(event.id)
          : p.eventId === event.id,
      )
    : [];

  if (!event) {
    return (
      <div className="rounded-xl border border-dashed border-[#d5daea] bg-white p-4 text-sm text-[#8a93b0]">
        Import a team CSV to see photographers here.
      </div>
    );
  }

  const assignmentCount = (photographerId) =>
    tactic.assignments.filter((a) => a.photographer_id === photographerId).length;

  const spotBadgeClass = (count) => {
    if (count === 1) return 'bg-[#dcfce7] text-[#166534]';
    if (count >= 2) return 'bg-[#fef3c7] text-[#92400e]';
    return 'bg-[#f0f4ff] text-[#5b6aa8]';
  };

  const spotBadgeLabel = (count) => (count === 1 ? '1 Spot' : `${count} Spots`);

  return (
    <div className="rounded-xl border border-[#e3e7f2] bg-white">
      <div className="border-b border-[#eef0f6] px-4 py-3">
        <h2 className="text-sm font-extrabold text-[#1C2B6B]">Team</h2>
        <p className="text-xs text-[#8a93b0]">Drag onto a spot to assign</p>
      </div>
      <div className="max-h-[420px] overflow-y-auto p-2">
        {photographers.length === 0 && (
          <p className="px-2 py-4 text-sm text-[#9aa3bf]">No team yet — import team CSV from the left panel.</p>
        )}
        {photographers.map((ph) => {
          const count = assignmentCount(ph.id);
          return (
          <div
            key={ph.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify(ph));
              e.dataTransfer.effectAllowed = 'copy';
            }}
            className="mb-1 cursor-grab rounded-lg border border-[#e8ebf4] bg-[#fafbff] px-3 py-2 active:cursor-grabbing"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-extrabold text-[#1C2B6B]">{ph.code}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${spotBadgeClass(count)}`}
              >
                {count === 0 ? '0 Spots' : spotBadgeLabel(count)}
              </span>
            </div>
            {(ph.firstName || ph.lastName) && (
              <div className="text-xs text-[#7b849f]">
                {[ph.firstName, ph.lastName].filter(Boolean).join(' ')}
              </div>
            )}
            {ph.dispatch && (
              <div className="mt-0.5 text-[10px] font-semibold text-[#a8b0c8]">{ph.dispatch}</div>
            )}
            {ph.cameras && (
              <div className="mt-1 text-[10px] leading-snug text-[#9aa3bf]">
                <span className="font-bold text-[#b0b8cf]">Cam: </span>
                <span className="line-clamp-2">{ph.cameras}</span>
              </div>
            )}
            {ph.lenses && (
              <div className="mt-0.5 text-[10px] leading-snug text-[#9aa3bf]">
                <span className="font-bold text-[#b0b8cf]">Lens: </span>
                <span className="line-clamp-3">{ph.lenses}</span>
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}
