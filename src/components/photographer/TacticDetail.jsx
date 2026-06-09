import { usePhotographerStore } from '../../store/usePhotographerStore';
import { formatTimeShort } from '../../lib/timeConflict';

function SpotCard({ spot, index }) {
  const lat = spot.latitude;
  const lng = spot.longitude;
  const mapsUrl = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-[#1C2B6B]">
            <span className="text-gray-400 font-normal mr-1">#{index + 1}</span>
            {spot.name}
          </div>
          {(spot.time_from || spot.time_to) && (
            <div className="text-sm text-gray-500 mt-0.5">
              {formatTimeShort(spot.time_from)} – {formatTimeShort(spot.time_to)}
            </div>
          )}
          {spot.km_mark != null && (
            <div className="text-xs text-gray-400 mt-0.5">{Number(spot.km_mark).toFixed(1)} km</div>
          )}
        </div>
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-xl bg-[#f0f2fa] px-3 py-1.5 text-xs font-bold text-[#1C2B6B] hover:bg-[#e3e7f8]"
          >
            Navigate ↗
          </a>
        )}
      </div>
      {spot.notes && (
        <p className="mt-2 text-xs text-gray-500 border-t border-gray-100 pt-2">{spot.notes}</p>
      )}
    </div>
  );
}

export function TacticDetail({ onOpenCheckIn }) {
  const entry = usePhotographerStore((s) => s.getActiveTactic());
  const closeDetail = usePhotographerStore((s) => s.closeDetail);
  const acronym = usePhotographerStore((s) => s.acronym);
  const mySpots = usePhotographerStore((s) => s.getMySpots(entry?.id));
  const isComplete = usePhotographerStore((s) => s.isCheckInComplete(entry?.id));

  if (!entry) return null;

  const { pkg } = entry;
  const event = pkg?.event;
  const photographers = pkg?.photographers ?? [];
  const myPhotographer = photographers.find(
    (p) => p.code === acronym || p.code === acronym.replace(/\d+$/, ''),
  );
  const cameraString = myPhotographer?.cameras || myPhotographer?.equipment || '';

  const date = event?.date
    ? new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <button type="button" onClick={closeDetail} className="text-xs text-gray-400 hover:text-gray-600 mb-1 block">
            ← All tactics
          </button>
          <h2 className="text-base font-extrabold text-[#1C2B6B] leading-tight">{event?.name}</h2>
          {date && <div className="text-xs text-gray-400 mt-0.5">{date}</div>}
        </div>
        <button
          type="button"
          onClick={onOpenCheckIn}
          className={`shrink-0 rounded-2xl px-4 py-2 text-xs font-bold transition-colors ${
            isComplete
              ? 'bg-green-100 text-green-700'
              : 'bg-[#1C2B6B] text-white hover:bg-[#16225a]'
          }`}
        >
          {isComplete ? '✅ Checked in' : 'Check-in'}
        </button>
      </div>

      {/* My spots */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
          {acronym ? `My spots (${acronym})` : 'All spots'} · {mySpots.length}
        </h3>
        {mySpots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
            {acronym ? 'No spots assigned to your acronym.' : 'Enter your acronym in settings to filter your spots.'}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {mySpots.map((spot, i) => (
              <SpotCard key={spot.id || i} spot={spot} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
