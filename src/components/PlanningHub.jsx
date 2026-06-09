import { useState } from 'react';
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
import { SpotModal } from './SpotModal';
import { PlannerToolsPanel } from './PlannerToolsPanel';
import { HyroxPlanner } from './HyroxPlanner';
import { useTranslation } from '../i18n/useTranslation';

export function PlanningHub({ title = 'Tactic Planner' }) {
  const mapExpanded = usePlannerStore((s) => s.mapExpanded);
  const setMapExpanded = usePlannerStore((s) => s.setMapExpanded);
  const event = useCurrentEvent();
  const tactic = useTactic(event?.id);
  const { t } = useTranslation();

  const [activeView, setActiveView] = useState('planner'); // 'planner' | 'hyrox'

  const showReferenceTimeline =
    tactic.importedFrom?.type === 'infofile' &&
    tactic.spots.some((s) => s.time_from && s.time_to);

  const referenceLabel = tactic.importedFrom?.eventDate
    ? `${t('referenceFrom')} ${tactic.importedFrom.eventDate}`
    : tactic.importedFrom?.eventId
      ? `${t('referenceFrom')} Event ${tactic.importedFrom.eventId}`
      : t('referenceFromInfofile');

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <TopBar title={title} />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left tools panel */}
        <PlannerToolsPanel activeView={activeView} onViewChange={setActiveView} />

        {/* Main content */}
        {activeView === 'hyrox' && event ? (
          <HyroxPlanner />
        ) : (
          <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4">
            {/* Map + spots column */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden">
              {event ? (
                mapExpanded ? (
                  <div className="relative min-h-0 flex-1">
                    <MapPanel fullscreen onCollapse={() => setMapExpanded(false)} />
                  </div>
                ) : (
                  <>
                    {showReferenceTimeline && (
                      <ReferenceTimeline spots={tactic.spots} referenceLabel={referenceLabel} />
                    )}
                    <MapPanel onExpand={() => setMapExpanded(true)} />
                    <div className="min-h-0 flex-1 overflow-hidden">
                      <SpotsList />
                    </div>
                  </>
                )
              ) : (
                <PlannerOnboarding />
              )}
            </div>

            {/* Right sidebar */}
            {!mapExpanded && (
              <div className="flex w-full shrink-0 flex-col gap-4 overflow-y-auto lg:w-80">
                {event ? (
                  <>
                    <PhotographersPanel />
                    <TravelPanel />
                  </>
                ) : (
                  <div className="sg-card p-4 text-sm text-[var(--sg-muted)]">
                    Team and travel appear after you create or select an event.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <SpotModal />
    </div>
  );
}
