import { useState, useEffect, useRef } from 'react';
import { usePhotographerStore } from '../../store/usePhotographerStore';
import { formatTimeShort } from '../../lib/timeConflict';

// ─── Navigation options ───────────────────────────────────────────────────────

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function navOptions(lat, lng) {
  const coord = `${lat},${lng}`;
  const options = [
    {
      id: 'googlemaps',
      label: 'Google Maps',
      icon: '🗺️',
      url: `https://www.google.com/maps/dir/?api=1&destination=${coord}&travelmode=driving`,
    },
    {
      id: 'waze',
      label: 'Waze',
      icon: '🚗',
      url: `https://waze.com/ul?ll=${coord}&navigate=yes`,
    },
    {
      id: 'komoot',
      label: 'Komoot',
      icon: '🥾',
      url: `https://www.komoot.com/plan/@${lat},${lng},15z`,
    },
    {
      id: 'mapillary',
      label: 'Mapillary',
      icon: '📸',
      url: `https://www.mapillary.com/app/?lat=${lat}&lng=${lng}&z=17`,
    },
    {
      id: 'streetview',
      label: 'Street View',
      icon: '👀',
      url: `https://www.google.com/maps?q=&layer=c&cbll=${coord}`,
    },
  ];

  // Apple Maps only on iOS
  if (isIOS()) {
    options.splice(1, 0, {
      id: 'applemaps',
      label: 'Apple Maps',
      icon: '🍎',
      url: `maps://maps.apple.com/?daddr=${coord}&dirflg=d`,
    });
  }

  return options;
}

// ─── Navigate dropdown ────────────────────────────────────────────────────────

function NavigateButton({ lat, lng }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  const options = navOptions(lat, lng);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-xl bg-[#1C2B6B] px-3 py-2 text-xs font-bold text-white hover:bg-[#16225a] active:scale-95 transition-transform"
      >
        Navigate
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
          {options.map((opt) => (
            <a
              key={opt.id}
              href={opt.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-[#f0f2fa] hover:text-[#1C2B6B] transition-colors"
            >
              <span className="text-base leading-none">{opt.icon}</span>
              {opt.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Spot card ────────────────────────────────────────────────────────────────

function SpotCard({ spot, index }) {
  const lat = spot.latitude;
  const lng = spot.longitude;
  const hasCoords = lat != null && lng != null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-bold text-[#1C2B6B] leading-snug">
            <span className="mr-1 font-normal text-gray-400">#{index + 1}</span>
            {spot.name}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {(spot.time_from || spot.time_to) && (
              <span className="rounded-full bg-[#f0f2fa] px-2 py-0.5 text-[11px] font-semibold text-[#1C2B6B]">
                🕐 {formatTimeShort(spot.time_from)}–{formatTimeShort(spot.time_to)}
              </span>
            )}
            {spot.km_mark != null && (
              <span className="rounded-full bg-[#f0f2fa] px-2 py-0.5 text-[11px] font-semibold text-[#1C2B6B]">
                📍 {Number(spot.km_mark).toFixed(1)} km
              </span>
            )}
            {hasCoords && (
              <span className="text-[10px] text-gray-300">
                {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
              </span>
            )}
          </div>
        </div>
        {hasCoords && <NavigateButton lat={lat} lng={lng} />}
      </div>
      {spot.notes && (
        <p className="mt-2 border-t border-gray-100 pt-2 text-xs text-gray-500">{spot.notes}</p>
      )}
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

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

  const date = event?.date
    ? new Date(event.date).toLocaleDateString(undefined, {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      })
    : null;

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <button
            type="button"
            onClick={closeDetail}
            className="mb-1 block text-xs text-gray-400 hover:text-gray-600"
          >
            ← All tactics
          </button>
          <h2 className="text-base font-extrabold leading-tight text-[#1C2B6B]">{event?.name}</h2>
          {date && <div className="mt-0.5 text-xs text-gray-400">{date}</div>}
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
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
          {acronym ? `My spots (${acronym})` : 'All spots'} · {mySpots.length}
        </h3>
        {mySpots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
            {acronym
              ? 'No spots assigned to your acronym.'
              : 'Enter your acronym in settings to filter your spots.'}
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
