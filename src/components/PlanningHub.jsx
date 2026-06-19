import { useState, useEffect } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { useCurrentEvent } from '../hooks/useCurrentEvent';
import { useTactic } from '../hooks/useTactic';
import { SpotsList } from './SpotsList';
import { PhotographersPanel } from './PhotographersPanel';
import { MapPanel } from './MapPanel';
import { TopBar } from './TopBar';
import { TravelPanel } from './TravelPanel';
import { PlannerOnboarding } from './PlannerOnboarding';
import { SpotModal } from './SpotModal';
import { EventTypeModal } from './EventTypeModal';
import { PlannerToolsPanel } from './PlannerToolsPanel';
import { HyroxPlanner } from './HyroxPlanner';
import { TLInfoEditor } from './TLInfoEditor';
import { PhotographerTimeline } from './PhotographerTimeline';
import { useTranslation } from '../i18n/useTranslation';

// ─── Reference Spots List ─────────────────────────────────────────────────────

function fmtTime(iso) {
  if (!iso) return '–';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(fromIso, toIso) {
  if (!fromIso || !toIso) return null;
  const diff = (new Date(toIso) - new Date(fromIso)) / 60000;
  if (isNaN(diff) || diff <= 0) return null;
  const h = Math.floor(diff / 60);
  const m = Math.round(diff % 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

function ReferenceSpotCard({ spot, eventId, photographers, imageCount }) {
  const deleteReferenceSpot = usePlannerStore((s) => s.deleteReferenceSpot);
  const adoptReferenceSpot = usePlannerStore((s) => s.adoptReferenceSpot);
  const openCreateSpotModal = usePlannerStore((s) => s.openCreateSpotModal);
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const phId = e.dataTransfer.getData('photographer_id');
    if (!phId) return;
    const ph = photographers.find((p) => p.id === phId);
    if (!ph) return;
    adoptReferenceSpot(eventId, spot, ph.code);
  }

  function handleAdopt() {
    adoptReferenceSpot(eventId, spot, null);
  }

  const hasTime = spot.time_from || spot.time_to;
  const duration = fmtDuration(spot.time_from, spot.time_to);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`flex flex-col gap-2 rounded-xl border-2 p-3 transition-colors ${
        dragOver
          ? 'border-[#1C2B6B] bg-[#eef1fb]'
          : 'border-[#e3e7f2] bg-white'
      }`}
    >
      {/* Header row: name + delete */}
      <div className="flex items-start justify-between gap-1">
        <div className="text-xs font-bold text-gray-800 leading-tight">{spot.name}</div>
        <button
          type="button"
          onClick={() => deleteReferenceSpot(eventId, spot.id)}
          className="shrink-0 text-gray-300 hover:text-red-400 transition-colors text-sm leading-none mt-0.5"
        >
          ✕
        </button>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-0.5">
        {imageCount > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-[#1C2B6B]">{imageCount.toLocaleString()}</span>
            <span className="text-[10px] text-gray-400">Bilder</span>
          </div>
        )}
        {hasTime && (
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-[#5b6aa8]">{fmtTime(spot.time_from)} – {fmtTime(spot.time_to)}</span>
          </div>
        )}
        {duration && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] text-amber-600 font-medium">⏱ ~{duration}</span>
          </div>
        )}
        {spot.km_mark != null && (
          <div className="text-[10px] text-gray-400">km {Number(spot.km_mark).toFixed(1)}</div>
        )}
      </div>

      {/* Drop hint + adopt button */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <div className="flex-1 rounded-lg border border-dashed border-gray-200 px-2 py-1 text-[10px] text-gray-300 text-center leading-tight">
          Ph. ziehen
        </div>
        <button
          type="button"
          onClick={handleAdopt}
          className="shrink-0 rounded-lg bg-[#1C2B6B] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#16225a] transition-colors"
        >
          Übernehmen
        </button>
      </div>
    </div>
  );
}

function ReferenceSpotsPanel({ spots, eventId, photographers, referenceLabel, timeline }) {
  const [open, setOpen] = useState(true);
  if (!spots.length) return null;

  // Sort chronologically by time_from
  const sorted = [...spots].sort((a, b) => {
    if (!a.time_from && !b.time_from) return 0;
    if (!a.time_from) return 1;
    if (!b.time_from) return -1;
    return a.time_from.localeCompare(b.time_from);
  });

  // Image count per spot name from referenceTimeline
  const imagesBySpot = {};
  (timeline || []).forEach((entry) => {
    if (!imagesBySpot[entry.spotName]) imagesBySpot[entry.spotName] = 0;
    imagesBySpot[entry.spotName] += entry.images || 0;
  });

  return (
    <div className="rounded-xl border border-[#e8a0ac] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 bg-[#cc1336] hover:bg-[#b01030] transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
          {referenceLabel}
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white/90">
            {spots.length} Spots
          </span>
        </span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          className={`text-white/70 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="p-3 bg-[#fff8f9] space-y-3">
          <p className="text-[11px] text-gray-400">
            Fotografen-Kürzel auf einen Spot ziehen zum direkten Zuweisen.
          </p>
          {/* Photographer timeline — above the cards */}
          {timeline && timeline.length > 0 && (
            <PhotographerTimeline timeline={timeline} />
          )}
          {/* Grid: 2 cols on mobile, 3 on sm, 4 on lg, 5 on xl */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {sorted.map((spot) => (
              <ReferenceSpotCard
                key={spot.id}
                spot={spot}
                eventId={eventId}
                photographers={photographers}
                imageCount={imagesBySpot[spot.name] || 0}
              />
            ))}
          </div>
          <p className="text-[10px] text-amber-600/70 italic">
            ⏱ Zeiten und Dauer basieren auf dem Vorjahresevent — können dieses Jahr abweichen.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Logistics Tab ────────────────────────────────────────────────────────────

function LogisticsTab() {
  return (
    <div className="flex flex-col gap-4">
      {/* Placeholder for team GPX map */}
      <div className="rounded-xl border border-[#e3e7f2] bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-[#eef0f6]">
          <h2 className="text-sm font-extrabold text-[#1C2B6B]">🗺️ Team Location</h2>
          <p className="text-xs text-[#8a93b0]">Team GPX coming soon</p>
        </div>
        <div className="flex items-center justify-center bg-[#f4f5f8] text-[#b0b8cf] text-sm font-semibold" style={{ height: 160 }}>
          Team map will appear here once GPX is available
        </div>
      </div>
      <TravelPanel alwaysExpanded />
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'spots', label: 'Spots' },
  { id: 'map', label: 'Map' },
  { id: 'logistics', label: 'Logistik' },
  { id: 'teaminfo', label: 'Team Info' },
];

function TabBar({ active, onChange }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 border-b border-[#e3e7f2] bg-[#1C2B6B] px-3 py-2">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
            active === tab.id
              ? 'bg-white text-[#1C2B6B] shadow-sm'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PlanningHub({ title = 'Tactic Planner' }) {
  const mapExpanded = usePlannerStore((s) => s.mapExpanded);
  const setMapExpanded = usePlannerStore((s) => s.setMapExpanded);
  const event = useCurrentEvent();
  const tactic = useTactic(event?.id);
  const allPhotographers = usePlannerStore((s) => s.photographers) || [];
  const photographers = event
    ? allPhotographers.filter((p) => p.eventIds ? p.eventIds.includes(event.id) : p.eventId === event.id)
    : [];
  const { t } = useTranslation();

  const [activeView, setActiveView] = useState(() =>
    event?.eventType === 'hyrox' ? 'hyrox' : 'planner',
  );
  const [activeTab, setActiveTab] = useState('spots');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setActiveView(event?.eventType === 'hyrox' ? 'hyrox' : 'planner');
  }, [event?.id, event?.eventType]);

  const refSpots = tactic.referenceSpots || [];
  const refSource = tactic.referenceImportedFrom || tactic.importedFrom;
  const fmtEuDate = (d) => { const [y, m, day] = d.split('-'); return `${day}.${m}.${y}`; };
  const referenceLabel = refSource?.eventDate
    ? `${t('referenceFrom')} ${fmtEuDate(refSource.eventDate)}`
    : refSource?.eventId
      ? `${t('referenceFrom')} Event ${refSource.eventId}`
      : t('referenceFromInfofile');

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <TopBar title={title} onMenuOpen={() => setMobileMenuOpen(true)} />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left tools panel */}
        <PlannerToolsPanel
          activeView={activeView}
          onViewChange={setActiveView}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        {/* Main content */}
        {activeView === 'hyrox' && event ? (
          <HyroxPlanner />
        ) : (
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            {event ? (
              <>
                {/* Tab bar */}
                {!mapExpanded && <TabBar active={activeTab} onChange={setActiveTab} />}

                <div className="flex min-h-0 flex-1 overflow-hidden lg:flex-row">
                  {/* Tab content */}
                  <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                    {mapExpanded ? (
                      <div className="relative min-h-0 flex-1">
                        <MapPanel fullscreen onCollapse={() => setMapExpanded(false)} />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 p-3">
                        {/* SPOTS TAB */}
                        {activeTab === 'spots' && (
                          <>
                            {refSpots.length > 0 && (
                              <ReferenceSpotsPanel
                                spots={refSpots}
                                eventId={event.id}
                                photographers={photographers}
                                referenceLabel={referenceLabel}
                                timeline={tactic.referenceTimeline || []}
                              />
                            )}
                            <SpotsList />
                          </>
                        )}

                        {/* MAP TAB */}
                        {activeTab === 'map' && (
                          <div className="relative" style={{ height: 'calc(100vh - 140px)' }}>
                            <MapPanel fullscreen onCollapse={() => setActiveTab('spots')} />
                          </div>
                        )}

                        {/* LOGISTICS TAB */}
                        {activeTab === 'logistics' && <LogisticsTab />}

                        {/* TEAM INFO TAB */}
                        {activeTab === 'teaminfo' && (
                          <div className="rounded-xl border border-[#e3e7f2] bg-white p-4">
                            <TLInfoEditor />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right sidebar — always visible on desktop */}
                  {!mapExpanded && (
                    <div className="hidden lg:flex w-80 shrink-0 flex-col gap-3 overflow-y-auto p-3 border-l border-[#e3e7f2] bg-[#f8f9fb]">
                      <PhotographersPanel />
                    </div>
                  )}
                </div>

                {/* Mobile: floating team button */}
                {!mapExpanded && (
                  <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(true)}
                    className="fixed bottom-5 right-4 z-[600] flex items-center gap-2 rounded-2xl bg-[#1C2B6B] px-4 py-3 text-sm font-bold text-white shadow-xl lg:hidden"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Team
                  </button>
                )}

                {/* Mobile sidebar drawer */}
                {mobileSidebarOpen && (
                  <div className="fixed inset-0 z-[800] lg:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setMobileSidebarOpen(false)} />
                    <aside className="absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-3xl bg-[#f4f5f8] shadow-2xl flex flex-col">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white rounded-t-3xl">
                        <span className="font-extrabold text-[#1C2B6B]">Team</span>
                        <button type="button" onClick={() => setMobileSidebarOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4">
                        <PhotographersPanel />
                      </div>
                    </aside>
                  </div>
                )}
              </>
            ) : (
              <div className="p-3">
                <PlannerOnboarding />
              </div>
            )}
          </div>
        )}
      </div>

      <SpotModal />
      <EventTypeModal />
    </div>
  );
}
