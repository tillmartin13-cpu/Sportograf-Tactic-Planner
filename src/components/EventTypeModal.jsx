import { useEffect, useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { useCurrentEvent } from '../hooks/useCurrentEvent';
import { detectEventType } from '../lib/hyrox';

const TYPES = [
  { id: 'standard_race',  label: 'Standard Race',           sublabel: 'Marathon · Trail · Cycling · MTB',      description: 'GPX route, km marks, spot planning along the course.',          hasRoute: true  },
  { id: 'hyrox',          label: 'HYROX',                   sublabel: 'Indoor fitness race',                   description: 'Station-based planner with wave assignments and HYROX template.', hasRoute: false, autoDetect: true },
  { id: 'obstacle_gpx',   label: 'Obstacle Race with GPX',  sublabel: 'OCR · DEKA · Spartan with course map',  description: 'GPX route available — plan spots along the course.',             hasRoute: true  },
  { id: 'obstacle_no_gpx',label: 'Obstacle Race without GPX',sublabel: 'Stadium · Arena · Indoor course',      description: 'No GPS route — plan spots and assignments without km marks.',    hasRoute: false },
  { id: 'other',          label: 'Other',                   sublabel: 'Any event type',                        description: 'Full planner with GPX route support.',                          hasRoute: true  },
];

export function EventTypeModal() {
  const event = useCurrentEvent();
  const updateEventType = usePlannerStore((s) => s.updateEventType);
  const [selected, setSelected] = useState(null);

  const needsType = event && !event.eventType;

  useEffect(() => {
    if (!needsType) return;
    const detected = detectEventType(event.name);
    setSelected(detected || 'standard_race');
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
            Choose the right module for{' '}
            <span className="font-bold text-[var(--sg-navy)]">
              {event.name || `Event ${event.id}`}
            </span>.
          </p>
        </div>

        <div className="mt-4 space-y-2">
          {TYPES.map((type) => {
            const isSelected = selected === type.id;
            const isAutoDetected = type.autoDetect && detectEventType(event.name) === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelected(type.id)}
                className={`w-full rounded-xl border-2 px-4 py-3 text-left transition-all ${
                  isSelected
                    ? 'border-[#1C2B6B] bg-[#f0f4ff]'
                    : 'border-[#e3e7f2] bg-white hover:border-[#c0c8e8]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-extrabold ${isSelected ? 'text-[#1C2B6B]' : 'text-[#3a4060]'}`}>
                        {type.label}
                      </span>
                      {isAutoDetected && (
                        <span className="rounded-full bg-[#dbeafe] px-2 py-0.5 text-[10px] font-bold text-[#1d4ed8]">
                          Auto-detected
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#8a93b0]">{type.sublabel}</div>
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

// Export type metadata for use elsewhere
export { TYPES as EVENT_TYPES };
