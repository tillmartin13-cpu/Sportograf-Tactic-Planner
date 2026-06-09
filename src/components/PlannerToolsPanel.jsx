import { useRef, useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { useCurrentEvent } from '../hooks/useCurrentEvent';
import { useTactic } from '../hooks/useTactic';
import { LanguageSettingsModal } from './LanguageSettingsModal';
import { useTranslation } from '../i18n/useTranslation';
import { isHyroxEvent } from '../lib/hyrox';

// ─── File-picker button ──────────────────────────────────────────────────────

function ImportRow({ icon, label, accept, onPick, onClick }) {
  const ref = useRef(null);

  const inner = (
    <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--sg-tint)] cursor-pointer group">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--sg-tint)] text-sm group-hover:bg-[#dde3f7]">
        {icon}
      </span>
      <span className="text-sm font-semibold text-[var(--sg-navy)]">{label}</span>
    </div>
  );

  if (accept) {
    return (
      <>
        <input
          ref={ref}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPick(file);
            e.target.value = '';
          }}
        />
        <div onClick={() => ref.current?.click()}>{inner}</div>
      </>
    );
  }

  return <div onClick={onClick}>{inner}</div>;
}

// ─── Status badge ────────────────────────────────────────────────────────────

function Badge({ ok, label }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
      ok ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#f1f3f9] text-[#8a93b0]'
    }`}>
      {label}
    </span>
  );
}

// ─── Section label ───────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div className="mb-1 mt-4 px-3 text-[10px] font-bold uppercase tracking-widest text-[#bcc3d6]">
      {children}
    </div>
  );
}

// ─── Main panel ──────────────────────────────────────────────────────────────

export function PlannerToolsPanel({ activeView, onViewChange }) {
  const event = useCurrentEvent();
  const tactic = useTactic(event?.id);
  const photographers = usePlannerStore((s) => s.photographers) || [];
  const importTeamCsv = usePlannerStore((s) => s.importTeamCsv);
  const importInfofile = usePlannerStore((s) => s.importInfofile);
  const loadGpx = usePlannerStore((s) => s.loadGpx);
  const importKml = usePlannerStore((s) => s.importKml);
  const exportTacticJson = usePlannerStore((s) => s.exportTacticJson);
  const setMapExpanded = usePlannerStore((s) => s.setMapExpanded);
  const toggleReferenceLayer = usePlannerStore((s) => s.toggleReferenceLayer);
  const { t } = useTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const hasTeam = photographers.length > 0;
  const hasRoute = tactic.gpxTrack.length > 0;
  const hasSpots = tactic.spots.length > 0;
  const hasReference = (tactic.referenceSpots || []).length > 0;
  const hyrox = isHyroxEvent(event);

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-[var(--sg-border)] bg-[#fafbff]">

      {/* Event info card */}
      {event ? (
        <div className="border-b border-[var(--sg-border)] bg-white px-4 py-3">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-xl leading-none">{hyrox ? '🏋️' : '🏁'}</span>
            <div className="min-w-0">
              <div className="truncate text-sm font-extrabold leading-snug text-[var(--sg-navy)]">
                {event.name || `Event ${event.id}`}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-bold text-[var(--sg-muted)]">#{event.id}</span>
                {event.eventDate && (
                  <span className="text-[11px] text-[var(--sg-muted)]">· {event.eventDate}</span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1">
            <Badge ok={hasTeam} label={hasTeam ? `${photographers.length} photographers` : 'No team'} />
            <Badge ok={hasRoute} label={hasRoute ? 'Route ✓' : 'No route'} />
            <Badge ok={hasSpots} label={hasSpots ? `${tactic.spots.length} spots` : 'No spots'} />
            {hasReference && <Badge ok label={`${tactic.referenceSpots.length} reference`} />}
          </div>
        </div>
      ) : (
        <div className="border-b border-[var(--sg-border)] bg-white px-4 py-3">
          <div className="text-sm font-bold text-[var(--sg-navy)]">Tactic Planner</div>
          <div className="mt-0.5 text-xs text-[var(--sg-muted)]">Import a team CSV or create an event to get started.</div>
        </div>
      )}

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto py-1">

        {/* View switcher — only when event is active */}
        {event && (
          <>
            <SectionLabel>View</SectionLabel>
            <div className="space-y-0.5 px-1.5">
              <button
                type="button"
                onClick={() => onViewChange?.('planner')}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                  activeView === 'planner' || !activeView
                    ? 'bg-[#1C2B6B] text-white'
                    : 'text-[var(--sg-navy)] hover:bg-[var(--sg-tint)]'
                }`}
              >
                <span className="text-base">🗺️</span> Tactic Planner
              </button>
              {hyrox && (
                <button
                  type="button"
                  onClick={() => onViewChange?.('hyrox')}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                    activeView === 'hyrox'
                      ? 'bg-[#1C2B6B] text-white'
                      : 'text-[var(--sg-navy)] hover:bg-[var(--sg-tint)]'
                  }`}
                >
                  <span className="text-base">🏋️</span> Hyrox Planner
                </button>
              )}
            </div>
          </>
        )}

        {/* Import */}
        <SectionLabel>Import</SectionLabel>
        <div className="space-y-0.5 px-1.5">
          <ImportRow
            icon="👥"
            label="Team CSV"
            accept=".csv,.txt"
            onPick={async (f) => importTeamCsv(await f.text())}
          />
          <ImportRow
            icon="🛤️"
            label="GPX Route"
            accept=".gpx"
            onPick={loadGpx}
          />
          <ImportRow
            icon="📍"
            label="KML / KMZ"
            accept=".kml,.kmz"
            onPick={importKml}
          />
          <ImportRow
            icon="📋"
            label="Infofile"
            accept=".txt"
            onPick={async (f) => importInfofile(await f.text())}
          />
        </div>

        {/* Actions */}
        <SectionLabel>Actions</SectionLabel>
        <div className="space-y-0.5 px-1.5">
          <ImportRow
            icon="🔍"
            label="Expand Map"
            onClick={() => setMapExpanded(true)}
          />
          {hasReference && (
            <ImportRow
              icon="👁️"
              label={tactic.showReferenceLayer !== false ? 'Hide Reference' : 'Show Reference'}
              onClick={toggleReferenceLayer}
            />
          )}
          <ImportRow
            icon="📤"
            label="Export JSON"
            onClick={() => exportTacticJson(true)}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--sg-border)] bg-white px-3 py-2.5">
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-[var(--sg-muted)] hover:bg-[var(--sg-tint)] hover:text-[var(--sg-navy)] transition-colors"
        >
          ⚙️ {t('settings')}
        </button>
      </div>

      <LanguageSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </aside>
  );
}
