import { useState } from 'react';
import { useCurrentEvent } from '../hooks/useCurrentEvent';
import { useTactic } from '../hooks/useTactic';
import { usePlannerStore } from '../store/usePlannerStore';
import { TacticMap } from './TacticMap';
import { ElevationProfile } from './ElevationProfile';
import { useTranslation } from '../i18n/useTranslation';

export function MapPanel({ fullscreen = false, onExpand, onCollapse }) {
  const event = useCurrentEvent();
  const tactic = useTactic(event?.id);
  const photographers = usePlannerStore((s) => s.photographers) || [];
  const openCreateSpotModal = usePlannerStore((s) => s.openCreateSpotModal);
  const openEditSpotModal = usePlannerStore((s) => s.openEditSpotModal);
  const movePhotoSpot = usePlannerStore((s) => s.movePhotoSpot);
  const toggleReferenceLayer = usePlannerStore((s) => s.toggleReferenceLayer);
  const { t } = useTranslation();
  const [hoverKm, setHoverKm] = useState(null);

  if (!event) return null;

  const mapProps = {
    tactic,
    spots: tactic.spots,
    referenceSpots: tactic.referenceSpots || [],
    referenceTimeline: tactic.referenceTimeline || [],
    showReferenceLayer: tactic.showReferenceLayer !== false,
    assignments: tactic.assignments,
    photographers,
    onMapClick: openCreateSpotModal,
    onSpotClick: openEditSpotModal,
    onSpotDragEnd: movePhotoSpot,
    onToggleReferenceLayer: toggleReferenceLayer,
  };

  const tracks = tactic?.gpxTracks ?? [];
  const spots = tactic?.spots ?? [];
  const hasElevation = tracks.some((t) => t.points?.some((p) => p.ele != null));

  if (fullscreen) {
    return (
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#e3e7f2] bg-white shadow-sm">
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] rounded-xl bg-[#1C2B6B] px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-[#152258]"
          >
            ← Back to Planning
          </button>
        )}
        <TacticMap
          {...mapProps}
          interactive
          showLayerToggle
          enableMapClick
          hoverKm={hoverKm}
          className="min-h-0 flex-1 w-full"
        />
        {hasElevation && (
          <div className="shrink-0 border-t border-[#e3e7f2]">
            <ElevationProfile
              tracks={tracks}
              spots={spots}
              onHoverKm={setHoverKm}
              activeHoverKm={hoverKm}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full shrink-0 overflow-hidden rounded-xl border border-[#e3e7f2] bg-white shadow-sm">
      <button
        type="button"
        onClick={onExpand}
        className="group relative block h-[120px] w-full cursor-pointer text-left sm:h-[140px]"
        aria-label={t('toolsOpenMap')}
      >
        <TacticMap
          {...mapProps}
          interactive={false}
          showLayerToggle={false}
          enableMapClick={false}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 z-[600] flex items-end justify-center bg-gradient-to-t from-black/35 via-transparent to-transparent p-3 opacity-0 transition group-hover:opacity-100">
          <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#1C2B6B] shadow">
            {t('mapClickExpand')}
          </span>
        </div>
        <div className="absolute right-2 top-2 z-[600] rounded-full bg-[#1C2B6B]/85 px-2.5 py-1 text-[10px] font-bold text-white shadow">
          {t('mapTapExpand')}
        </div>
      </button>
    </div>
  );
}
