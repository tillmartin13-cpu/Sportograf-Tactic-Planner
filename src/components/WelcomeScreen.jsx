import { useState, useEffect, useRef } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { normalizeEventId } from '../lib/id';
import { LanguageSettingsModal } from './LanguageSettingsModal';
import { useTranslation } from '../i18n/useTranslation';

// ─── Event cards ──────────────────────────────────────────────────────────────

function EventTypeIcon({ name = '', type }) {
  const isHyrox = type === 'hyrox' || name.toLowerCase().includes('hyrox');
  return <span className="text-xl leading-none">{isHyrox ? '🏋️' : '🏁'}</span>;
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
      className="group relative flex cursor-pointer flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-[#293377]/30 hover:shadow-md"
      onClick={() => onOpen(event.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div>
            <div className="font-bold text-[#293377] leading-tight">{event.name || `Event ${event.id}`}</div>
            {date && <div className="text-xs text-gray-400 mt-0.5">{date}</div>}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(event.id); }}
          className="shrink-0 rounded-lg p-1.5 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
          </svg>
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {spotCount > 0 && (
          <span className="rounded-full bg-[#f0f2fa] px-2.5 py-0.5 text-[11px] font-semibold text-[#293377]">{spotCount} spots</span>
        )}
        {photoCount > 0 && (
          <span className="rounded-full bg-[#f0f2fa] px-2.5 py-0.5 text-[11px] font-semibold text-[#293377]">{photoCount} photographers</span>
        )}
        {hasGpx && (
          <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">GPX ✓</span>
        )}
        {hasReference && (
          <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700">Reference ✓</span>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-gray-400">#{event.id}</span>
        <span className="text-xs font-bold text-[#293377] group-hover:underline">Open →</span>
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

// ─── Module picker (fullscreen hero) ─────────────────────────────────────────

const APP_VERSION = '1.0.0';
const LAST_UPDATE = '12.06.2026';

function ModulePicker({ onSelect, onSettings }) {
  const [hovered, setHovered] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // Mobile: straight 50/50 split. Desktop: diagonal with 8vw offset.
  const diagOffset = isMobile ? '0px' : '8vw';

  // Shared panel content block
  function PanelContent({ side }) {
    const isTl = side === 'tl';
    const icon = isTl ? (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 sm:h-7 sm:w-7">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="2"/>
        <path d="M9 12h6M9 16h4"/>
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 sm:h-7 sm:w-7">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    );

    return (
      <div className={`relative flex flex-col items-center gap-3 sm:gap-5 ${isTl ? 'sm:mr-[12%] sm:w-[38%]' : 'sm:ml-[12%] sm:w-[38%]'} w-[44%]`}>
        <div className="flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-sm">
          {icon}
        </div>
        <div className="text-center">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Module</p>
          <h1 className="mt-1 text-xl sm:text-3xl lg:text-5xl font-black leading-tight text-white">
            {isTl ? <><span>Team</span><br /><span>Leader</span></> : <><span>Photo-</span><br /><span>grapher</span></>}
          </h1>
        </div>
        <p className="hidden sm:block text-center text-sm leading-relaxed text-white/55 max-w-[180px]">
          {isTl ? 'Spots, photographers, routes & team tactics.' : 'Your spots, route & weather in one view.'}
        </p>
        <div
          className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-white transition-all duration-200"
          style={{ transform: hovered === side || (side === 'tl' && hovered === 'tl') || (side === 'photo' && hovered === 'photo') ? 'translateX(4px)' : 'translateX(0)' }}
        >
          Open
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 sm:h-3.5 sm:w-3.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden select-none">
      {/* ── Decorative speed lines ── */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        {[...Array(18)].map((_, i) => (
          <line key={i} x1={`${-10 + i * 7}%`} y1="0%" x2={`${-10 + i * 7 + 12}%`} y2="100%" stroke="white" strokeWidth="1.5" />
        ))}
      </svg>

      {/* ── Left panel (TL / blue) ── */}
      <button
        type="button"
        onClick={() => onSelect('tl')}
        onMouseEnter={() => setHovered('tl')}
        onMouseLeave={() => setHovered(null)}
        className="relative z-10 flex flex-1 flex-col items-center justify-center pb-10 transition-all duration-400 outline-none"
        style={{
          background: '#293377',
          clipPath: `polygon(0 0, 100% 0, calc(100% - ${diagOffset}) 100%, 0 100%)`,
          opacity: hovered === 'photo' ? 0.72 : 1,
          transform: hovered === 'tl' ? 'scale(1.012)' : 'scale(1)',
          transformOrigin: 'left center',
        }}
      >
        <div className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{ background: 'radial-gradient(ellipse at 35% 50%, rgba(255,255,255,0.08) 0%, transparent 65%)', opacity: hovered === 'tl' ? 1 : 0 }} />
        <PanelContent side="tl" />
      </button>

      {/* ── Right panel (Photographer / red) ── */}
      <button
        type="button"
        onClick={() => onSelect('photographer')}
        onMouseEnter={() => setHovered('photo')}
        onMouseLeave={() => setHovered(null)}
        className="relative z-10 flex flex-1 flex-col items-center justify-center pb-10 transition-all duration-400 outline-none"
        style={{
          background: '#cc1336',
          clipPath: `polygon(${diagOffset} 0, 100% 0, 100% 100%, 0 100%)`,
          marginLeft: isMobile ? '0' : `-${diagOffset}`,
          opacity: hovered === 'tl' ? 0.72 : 1,
          transform: hovered === 'photo' ? 'scale(1.012)' : 'scale(1)',
          transformOrigin: 'right center',
        }}
      >
        <div className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{ background: 'radial-gradient(ellipse at 65% 50%, rgba(255,255,255,0.08) 0%, transparent 65%)', opacity: hovered === 'photo' ? 1 : 0 }} />
        <PanelContent side="photo" />
      </button>

      {/* ── Mascot: top-center on mobile, center on desktop ── */}
      <div className="pointer-events-none absolute z-20 left-1/2 -translate-x-1/2
        top-[30%] sm:top-1/2 sm:-translate-y-1/2 sm:translate-x-[-50%]">
        <img
          src="/mascot.png"
          alt=""
          className="transition-transform duration-300"
          style={{
            width: 'clamp(80px, 20vw, 200px)',
            filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.4))',
            transform: hovered === 'tl' ? 'translateX(-8px) scale(1.05)' : hovered === 'photo' ? 'translateX(8px) scale(1.05)' : 'scale(1)',
          }}
        />
      </div>

      {/* ── Settings gear (top right) ── */}
      <button
        type="button"
        onClick={onSettings}
        className="absolute right-4 top-4 z-30 rounded-xl p-2.5 text-white/35 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {/* ── Footer ── */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-30 flex flex-col items-center gap-0.5 pb-3 pt-2">
        <span className="text-[10px] font-semibold tracking-wide text-white/30">Sportograf Digital Solutions GmbH</span>
        <span className="text-[9px] text-white/20">v{APP_VERSION} · Stand {LAST_UPDATE}</span>
      </div>
    </div>
  );
}

// ─── Main WelcomeScreen ───────────────────────────────────────────────────────

export function WelcomeScreen() {
  const events = usePlannerStore((s) => s.events);
  const openTacticPlanner = usePlannerStore((s) => s.openTacticPlanner);
  const openPhotographerImport = usePlannerStore((s) => s.openPhotographerImport);
  const selectEvent = usePlannerStore((s) => s.selectEvent);
  const deleteEvent = usePlannerStore((s) => s.deleteEvent);
  const importTeamCsv = usePlannerStore((s) => s.importTeamCsv);
  const importTacticJson = usePlannerStore((s) => s.importTacticJson);
  const createEvent = usePlannerStore((s) => s.createEvent);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activeRole, setActiveRole] = useState(null); // null = picker, 'tl' | 'photographer'
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState('');
  const csvRef = useRef(null);
  const jsonRef = useRef(null);

  const sorted = [...(events || [])].sort((a, b) => {
    const da = a.eventDate || '';
    const db = b.eventDate || '';
    return da < db ? 1 : da > db ? -1 : 0;
  });

  // Show fullscreen module picker when no role selected
  if (!activeRole) {
    return (
      <>
        <ModulePicker
          onSelect={(role) => {
            if (role === 'photographer') openPhotographerImport();
            else setActiveRole(role);
          }}
          onSettings={() => setSettingsOpen(true)}
        />
        <LanguageSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </>
    );
  }

  const accentColor = activeRole === 'tl' ? '#293377' : '#cc1336';

  return (
    <div className="flex min-h-full flex-col bg-[#f4f5f8]">
      {/* Compact branded header */}
      <header style={{ background: accentColor }}>
        <div className="safe-top" />
        <div className="flex items-center gap-3 px-4 py-3">
        {/* Back to picker */}
        <button
          type="button"
          onClick={() => setActiveRole(null)}
          className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Back to module selection"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>

        <img src="/sg-logo.svg" alt="Sportograf" className="h-8 w-auto object-contain my-auto" style={{ filter: 'brightness(0) invert(1)' }} />

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6">
        {activeRole === 'tl' ? (
          <>
            {/* Hidden file inputs */}
            <input ref={csvRef} type="file" accept=".csv,.txt" className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                await importTeamCsv(await file.text());
                e.target.value = '';
              }} />
            <input ref={jsonRef} type="file" accept=".json" className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                await importTacticJson(await file.text());
                e.target.value = '';
              }} />

            {/* Option cards — always shown above the event list */}
            <div className="grid gap-3 sm:grid-cols-3">
              {/* Card 1: CSV */}
              <button
                type="button"
                onClick={() => csvRef.current?.click()}
                className="relative flex flex-col items-start gap-2 rounded-2xl border border-[#293377]/25 bg-white p-4 text-left shadow-sm transition-all hover:border-[#293377]/40 hover:shadow-md"
              >
                <span className="absolute right-3 top-3 flex items-center gap-0.5 rounded-full bg-[#293377]/8 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#293377]/70">
                  ★ Recommended
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef1fb] text-[#293377]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </span>
                <div>
                  <div className="text-sm font-bold text-[#293377]">Open with CSV</div>
                  <div className="mt-0.5 text-[11px] leading-snug text-gray-400">Team file from Sportograf</div>
                </div>
              </button>

              {/* Card 2: JSON import */}
              <button
                type="button"
                onClick={() => jsonRef.current?.click()}
                className="flex flex-col items-start gap-2 rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-[#293377]/30 hover:shadow-md"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef1fb] text-[#293377]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </span>
                <div>
                  <div className="text-sm font-bold text-[#293377]">Open existing event</div>
                  <div className="mt-0.5 text-[11px] leading-snug text-gray-400">Import tactic JSON</div>
                </div>
              </button>

              {/* Card 3: Create new */}
              <div className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef1fb] text-[#293377]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </span>
                <div className="text-sm font-bold text-[#293377]">Create new event</div>
                <input
                  value={newId}
                  onChange={(e) => setNewId(normalizeEventId(e.target.value))}
                  placeholder="Event ID"
                  inputMode="numeric"
                  maxLength={5}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#293377]/30"
                />
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Event name"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#293377]/30"
                />
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#293377]/30"
                />
                <button
                  type="button"
                  onClick={() => {
                    const created = createEvent({ id: newId, name: newName, eventDate: newDate });
                    if (created) { setNewId(''); setNewName(''); setNewDate(''); }
                  }}
                  className="mt-1 w-full rounded-xl py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: '#293377' }}
                >
                  Create
                </button>
              </div>
            </div>

            {/* Event list */}
            {sorted.length > 0 && (
              <>
                <h2 className="text-sm font-extrabold text-[#293377]">Your Events</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {sorted.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onOpen={(id) => selectEvent(id)}
                      onDelete={(id) => setDeleteTarget(events.find((e) => e.id === id))}
                    />
                  ))}
                </div>
              </>
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
              className="mt-5 rounded-xl px-6 py-2.5 text-sm font-bold text-white hover:opacity-90"
              style={{ background: '#cc1336' }}
            >
              Open Photographer App
            </button>
          </div>
        )}
      </main>

      {deleteTarget && (
        <DeleteConfirmModal
          eventName={deleteTarget.name || `Event ${deleteTarget.id}`}
          onConfirm={() => { deleteEvent(deleteTarget.id); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <LanguageSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
