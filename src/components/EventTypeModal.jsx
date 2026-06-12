import { useEffect, useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { useCurrentEvent } from '../hooks/useCurrentEvent';
import { detectEventType } from '../lib/hyrox';

const TYPES = [
  {
    id: 'gpx_race',
    label: 'GPS Race',
    sublabel: 'Marathon · Trail · Cycling · MTB',
    description: 'GPX route, km marks, spot planning along the course.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M3 17l4-8 4 4 4-6 4 6" />
      </svg>
    ),
  },
  {
    id: 'hyrox',
    label: 'HYROX',
    sublabel: 'Indoor fitness race',
    description: 'Station-based planner with wave assignments and HYROX template.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12h8M12 8v8" />
      </svg>
    ),
    autoDetect: true,
  },
  {
    id: 'indoor',
    label: 'Indoor / Stadium',
    sublabel: 'DEKA · Obstacle · Festival',
    description: 'No GPS route — plan spots and assignments for arena events.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <rect x="3" y="10" width="18" height="11" rx="1" />
        <path d="M3 10l9-7 9 7" />
      </svg>
    ),
  },
];

export function EventTypeModal() {
  const event = useCurrentEvent();
  const updateEventType = usePlannerStore((s) => s.updateEventType);
  const [selected, setSelected] = useState(null);

  // Show when event exists but has no eventType set yet
  const needsType = event && !event.eventType;

  useEffect(() => {
    if (!needsType) return;
    const detected = detectEventType(event.name);
    setSelected(detected || 'gpx_race');
  }, [event?.id, needsType]);

  if (!needsType) return null;

  const handleConfirm = () => {
    if (!selected) return;
    updateEventType(event.id, selected);
  };

  return (
    <div className="fixed inset-0 z-[7500] flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="sg-card flex max-h-[92dvh] w-full max-w-md flex-col overflow-y-auto rounded-b-none rounded-t-3xl p-5 sm:rounded-2xl sm:p-6">
        <div className="mb-1">
          <h2 className="sg-card-title">Event type</h2>
          <p className="mt-1 text-sm text-[var(--sg-muted)]">
            Choose the right module for <span className="font-bold text-[var(--sg-navy)]">{event.name || `Event ${event.id}`}</span>.
          </p>
        </div>

        <div className="mt-4 space-y-2.5">
          {TYPES.map((type) => {
            const isSelected = selected === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelected(type.id)}
                className={`w-full rounded-xl border-2 px-4 py-3.5 text-left transition-all ${
                  isSelected
                    ? 'border-[#1C2B6B] bg-[#f0f4ff]'
                    : 'border-[#e3e7f2] bg-white hover:border-[#c0c8e8]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`shrink-0 ${isSelected ? 'text-[#1C2B6B]' : 'text-[#8a93b0]'}`}>
                    {type.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-extrabold ${isSelected ? 'text-[#1C2B6B]' : 'text-[#3a4060]'}`}>
                        {type.label}
                      </span>
                      {type.autoDetect && detectEventType(event.name) === type.id && (
                        <span className="rounded-full bg-[#dbeafe] px-2 py-0.5 text-[10px] font-bold text-[#1d4ed8]">
                          Auto-detected
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-[#8a93b0]">{type.sublabel}</div>
                    {isSelected && (
                      <div className="mt-1 text-[11px] text-[#5b6aa8]">{type.description}</div>
                    )}
                  </div>
                  <div className={`h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${
                    isSelected ? 'border-[#1C2B6B] bg-[#1C2B6B]' : 'border-[#c8cfe0] bg-white'
                  }`} />
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selected}
          className="sg-btn sg-btn-navy mt-5 w-full text-sm disabled:opacity-50"
        >
          Confirm &amp; Open Planner
        </button>
      </div>
    </div>
  );
}
