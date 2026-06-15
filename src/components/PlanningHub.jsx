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
import { ReferenceTimeline } from './ReferenceTimeline';
import { PhotographerTimeline } from './PhotographerTimeline';
import { SpotModal } from './SpotModal';
import { EventTypeModal } from './EventTypeModal';
import { PlannerToolsPanel } from './PlannerToolsPanel';
import { HyroxPlanner } from './HyroxPlanner';
import { useTranslation } from '../i18n/useTranslation';

export function PlanningHub({ title = 'Tactic Planner' }) {
  const mapExpanded = usePlannerStore((s) => s.mapExpanded);
  const setMapExpanded = usePlannerStore((s) => s.setMapExpanded);
  const event = useCurrentEvent();
  const tactic = useTactic(event?.id);
  const { t } = useTranslation();

  const [activeView, setActiveView] = useState(() =>
    event?.eventType === 'hyrox' ? 'hyrox' : 'planner',
  );
  const [refExpanded, setRefExpanded] = useState(false);

  useEffect(() => {
    setActiveView(event?.eventType === 'hyrox' ? 'hyrox' : 'planner');
  }, [event?.id, event?.eventType]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const refSpots = tactic.referenceSpots || [];
  const showReferenceTimeline =
    refSpots.some((s) => s.time_from && s.time_to);

  const refSource = tactic.referenceImportedFrom || tactic.importedFrom;
  const referenceLabel = refSource?.eventDate
    ? `${t('referenceFrom')} ${refSource.eventDate}`
    : refSource?.eventId
      ? `${t('referenceFrom')} Event ${refSource.eventId}`
      : t('referenceFromInfofile');

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <TopBar title={title} onMenuOpen={() => setMobileMenuOpen(true)} />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left tools panel (sidebar on desktop, drawer on mobile) */}
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
          <div className="relative flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden p-3 lg:flex-row lg:overflow-hidden lg:gap-4 lg:p-4">
            {/* Map + spots */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 lg:overflow-hidden">
              {event ? (
                mapExpanded ? (
                  <div className="relative min-h-0 flex-1">
                    <MapPanel fullscreen onCollapse={() => setMapExpanded(false)} />
                  </div>
                ) : (
                  <>
                    {(showReferenceTimeline || tactic.referenceTimeline?.length > 0) && (
                      <div className="rounded-xl overflow-hidden border border-[#c4b5fd] shadow-sm">
                        <button
                          type="button"
                          onClick={() => setRefExpanded((v) => !v)}
                          className="flex w-full items-center justify-between px-3 py-2.5 text-left bg-[#7c3aed] hover:bg-[#6d28d9] transition-colors"
                        >
                          <span className="flex items-center gap-2 text-sm font-bold text-white">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
                            {referenceLabel}
                            {refSpots.length > 0 && (
                              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white/90">
                                {refSpots.length} Spots
                              </span>
                            )}
                          </span>
                          <svg
                            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            className={`text-white/70 transition-transform ${refExpanded ? 'rotate-180' : ''}`}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                        {refExpanded && (
                          <div className="border-t border-[#c4b5fd] bg-white">
                            {showReferenceTimeline && (
                              <ReferenceTimeline
                                spots={refSpots}
                                referenceTimeline={tactic.referenceTimeline || []}
                                referenceLabel={referenceLabel}
                              />
                            )}
                            {tactic.referenceTimeline?.length > 0 && (
                              <PhotographerTimeline timeline={tactic.referenceTimeline} referenceLabel={referenceLabel} />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <MapPanel onExpand={() => setMapExpanded(true)} />
                    <div className="flex min-h-0 flex-1 flex-col">
                      <SpotsList />
                    </div>
                  </>
                )
              ) : (
                <PlannerOnboarding />
              )}
            </div>

            {/* Right sidebar — always visible on desktop, drawer on mobile */}
            {!mapExpanded && (
              <>
                {/* Desktop */}
                <div className="hidden lg:flex w-80 shrink-0 flex-col gap-3 overflow-hidden min-h-0">
                  {event ? (
                    <>
                      <PhotographersPanel />
                      <div className="shrink-0">
                        <TravelPanel />
                      </div>
                    </>
                  ) : (
                    <div className="sg-card p-4 text-sm text-[var(--sg-muted)]">
                      Team and travel appear after you create or select an event.
                    </div>
                  )}
                </div>

                {/* Mobile: floating team button */}
                {event && (
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
                        <span className="font-extrabold text-[#1C2B6B]">Team & Travel</span>
                        <button type="button" onClick={() => setMobileSidebarOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <PhotographersPanel />
                        <TravelPanel />
                      </div>
                    </aside>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <SpotModal />
      <EventTypeModal />
    </div>
  );
}
