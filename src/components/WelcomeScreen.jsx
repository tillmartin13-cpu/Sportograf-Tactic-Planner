import { useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { BrandLogo } from './BrandLogo';
import { LanguageSettingsModal } from './LanguageSettingsModal';
import { useTranslation } from '../i18n/useTranslation';

function EventTypeIcon({ name = '', type }) {
  const isHyrox = type === 'hyrox' || name.toLowerCase().includes('hyrox');
  return (
    <span className="text-xl leading-none">{isHyrox ? '🏋️' : '🏁'}</span>
  );
}

function EventCard({ event, onOpen, onDelete }) {
  const date = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString(undefined, {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
      })
    : null;

  const spotCount = event.spots?.length ?? 0;
  const photoCount = event.photographers?.length ?? 0;
  const hasGpx = !!event.gpxTrack?.length || !!event.gpxFiles?.length;
  const hasReference = !!event.referenceSpots?.length;

  return (
    <div
      className="group relative flex cursor-pointer flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-[#1C2B6B]/30 hover:shadow-md"
      onClick={() => onOpen(event.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <EventTypeIcon name={event.name} type={event.eventType} />
          <div>
            <div className="font-bold text-[#1C2B6B] leading-tight">{event.name || `Event ${event.id}`}</div>
            {date && <div className="text-xs text-gray-400 mt-0.5">{date}</div>}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(event.id); }}
          className="shrink-0 rounded-lg p-1.5 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-400"
          aria-label="Delete event"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
          </svg>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {spotCount > 0 && (
          <span className="rounded-full bg-[#f0f2fa] px-2.5 py-0.5 text-[11px] font-semibold text-[#1C2B6B]">
            {spotCount} spots
          </span>
        )}
        {photoCount > 0 && (
          <span className="rounded-full bg-[#f0f2fa] px-2.5 py-0.5 text-[11px] font-semibold text-[#1C2B6B]">
            {photoCount} photographers
          </span>
        )}
        {hasGpx && (
          <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
            GPX ✓
          </span>
        )}
        {hasReference && (
          <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700">
            Reference ✓
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-gray-400">#{event.id}</span>
        <span className="text-xs font-bold text-[#1C2B6B] group-hover:underline">Open →</span>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ eventName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="font-bold text-gray-900">Delete event?</h3>
        <p className="mt-1 text-sm text-gray-500">
          "<strong>{eventName}</strong>" will be removed permanently.
        </p>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function WelcomeScreen() {
  const events = usePlannerStore((s) => s.events);
  const openTacticPlanner = usePlannerStore((s) => s.openTacticPlanner);
  const openPhotographerImport = usePlannerStore((s) => s.openPhotographerImport);
  const selectEvent = usePlannerStore((s) => s.selectEvent);
  const deleteEvent = usePlannerStore((s) => s.deleteEvent);
  const { t } = useTranslation();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activeRole, setActiveRole] = useState('tl'); // 'tl' | 'photographer'

  const sorted = [...(events || [])].sort((a, b) => {
    const da = a.eventDate || '';
    const db = b.eventDate || '';
    return da < db ? 1 : da > db ? -1 : 0;
  });

  function handleOpenEvent(id) {
    selectEvent(id);
    openTacticPlanner();
  }

  function handleDeleteConfirm() {
    if (deleteTarget) deleteEvent(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <div className="flex min-h-full flex-col bg-[#f4f5f8]">
      {/* Header — logo only here, nowhere else */}
      <header className="flex items-center justify-between bg-[#1C2B6B] px-5 py-3">
        <BrandLogo variant="white" className="h-7 w-[120px]" />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="rounded-lg p-2 text-white/60 hover:text-white"
            aria-label="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Role switcher */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          type="button"
          onClick={() => setActiveRole('tl')}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${
            activeRole === 'tl'
              ? 'border-b-2 border-[#1C2B6B] text-[#1C2B6B]'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Team Leader
        </button>
        <button
          type="button"
          onClick={() => setActiveRole('photographer')}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${
            activeRole === 'photographer'
              ? 'border-b-2 border-[#1C2B6B] text-[#1C2B6B]'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Photographer
        </button>
      </div>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6">
        {activeRole === 'tl' ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#1C2B6B]">
                {sorted.length > 0 ? 'Your Events' : 'Get started'}
              </h2>
              <button
                type="button"
                onClick={openTacticPlanner}
                className="rounded-xl bg-[#1C2B6B] px-4 py-2 text-xs font-bold text-white hover:bg-[#16225a] transition-colors"
              >
                + New Event
              </button>
            </div>

            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white px-6 py-16 text-center">
                <div className="text-5xl mb-3">📋</div>
                <h3 className="font-bold text-gray-700">No events yet</h3>
                <p className="mt-1 text-sm text-gray-400 max-w-xs">
                  Load your team CSV to get started, or create an event manually.
                </p>
                <button
                  type="button"
                  onClick={openTacticPlanner}
                  className="mt-5 rounded-xl bg-[#1C2B6B] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#16225a]"
                >
                  Create first event
                </button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {sorted.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onOpen={handleOpenEvent}
                    onDelete={(id) => setDeleteTarget(events.find((e) => e.id === id))}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
            <div className="text-5xl mb-3">📱</div>
            <h3 className="font-bold text-gray-700">Photographer Mode</h3>
            <p className="mt-1 text-sm text-gray-400 max-w-xs">
              Load the tactic JSON file your team lead sent you to see your spots and complete your check-in.
            </p>
            <button
              type="button"
              onClick={openPhotographerImport}
              className="mt-5 rounded-xl bg-[#1C2B6B] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#16225a]"
            >
              Open Photographer App
            </button>
          </div>
        )}
      </main>

      {deleteTarget && (
        <DeleteConfirmModal
          eventName={deleteTarget.name || `Event ${deleteTarget.id}`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <LanguageSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
