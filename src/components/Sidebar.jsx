import { useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { BrandLogo } from './BrandLogo';
import { LanguageSettingsModal } from './LanguageSettingsModal';
import { useTranslation } from '../i18n/useTranslation';

export function Sidebar() {
  const events = usePlannerStore((s) => s.events);
  const currentEventId = usePlannerStore((s) => s.currentEventId);
  const selectEvent = usePlannerStore((s) => s.selectEvent);
  const createEvent = usePlannerStore((s) => s.createEvent);
  const deleteEvent = usePlannerStore((s) => s.deleteEvent);
  const copyEventCode = usePlannerStore((s) => s.copyEventCode);
  const currentEvent = events.find((e) => e.id === currentEventId);

  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { t } = useTranslation();

  const handleCreate = () => {
    const created = createEvent({ id: newId, name: newName });
    if (created) {
      setNewId('');
      setNewName('');
    }
  };

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-[var(--sg-border)] bg-white">
      <div className="border-b border-[#f0f0f0] px-4 py-4">
        <BrandLogo className="h-11 w-[200px]" />
        <div className="mt-2 text-[11px] font-bold uppercase tracking-wide text-[var(--sg-muted)]">
          {t('appTitle')}
        </div>
      </div>

      <div className="border-b border-[#f0f0f0] px-4 py-3">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#bbb]">New event</div>
        <input
          className="sg-input mb-2 text-sm"
          placeholder="Event ID"
          inputMode="numeric"
          maxLength={5}
          value={newId}
          onChange={(e) => setNewId(e.target.value.replace(/\D/g, '').slice(0, 5))}
        />
        <input
          className="sg-input mb-2 text-sm"
          placeholder="Event name (optional)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="button" onClick={handleCreate} className="sg-btn sg-btn-navy w-full text-sm">
          Create event
        </button>
      </div>

      {currentEvent?.eventCode && (
        <div className="border-b border-[#f0f0f0] px-4 py-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-[#bbb]">Event code (TL only)</div>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 rounded-[10px] bg-[var(--sg-tint)] px-2 py-1.5 font-mono text-sm font-extrabold tracking-wider text-[var(--sg-navy)]">
              {currentEvent.eventCode}
            </code>
            <button
              type="button"
              onClick={() => copyEventCode(currentEvent.id)}
              className="sg-btn !w-auto !px-2.5 !py-1.5 text-[10px]"
            >
              Copy
            </button>
          </div>
          <p className="mt-1 text-[10px] leading-snug text-[#ccc]">Share via internal chat — not for photographers.</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wide text-[#bbb]">Events</div>
        {events.length === 0 && (
          <p className="px-2 text-sm text-[#ccc]">No events yet. Create one or import a team CSV.</p>
        )}
        {events.map((event) => (
          <div
            key={event.id}
            className={`mb-1 flex items-center gap-1 rounded-[10px] px-2 py-1 ${
              currentEventId === event.id ? 'bg-[var(--sg-tint)]' : 'hover:bg-[#fafafa]'
            }`}
          >
            <button
              type="button"
              onClick={() => selectEvent(event.id)}
              className="min-w-0 flex-1 rounded-md px-2 py-2 text-left"
            >
              <div className="sg-eid text-lg leading-none">{event.id}</div>
              {event.name && <div className="truncate text-xs text-[var(--sg-muted)]">{event.name}</div>}
              {event.eventDate && (
                <div className="truncate text-[10px] text-[#bbb]">{event.eventDate}</div>
              )}
            </button>
            <button
              type="button"
              onClick={() => deleteEvent(event.id)}
              className="rounded-md px-2 py-1 text-xs font-bold text-[#ddd] hover:bg-[#fff0f0] hover:text-[var(--sg-red)]"
              title="Delete event"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-[#f0f0f0] px-4 py-3">
        <button type="button" onClick={() => setSettingsOpen(true)} className="sg-btn w-full !py-2 text-xs">
          {t('settings')}
        </button>
      </div>
      <LanguageSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </aside>
  );
}
