import { useRef, useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { useCurrentEvent } from '../hooks/useCurrentEvent';
import { useTactic } from '../hooks/useTactic';
import { LanguageSettingsModal } from './LanguageSettingsModal';
import { useTranslation } from '../i18n/useTranslation';

function ToolButton({ icon, title, hint, accept, onPick, onClick }) {
  const ref = useRef(null);

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
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex w-full items-start gap-3 rounded-xl border border-[var(--sg-border)] bg-white px-3 py-3 text-left transition hover:border-[var(--sg-navy)] hover:bg-[var(--sg-tint)]"
        >
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--sg-tint)] text-base">
            {icon}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-extrabold text-[var(--sg-navy)]">{title}</span>
            <span className="mt-0.5 block text-[11px] leading-snug text-[var(--sg-muted)]">{hint}</span>
          </span>
        </button>
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-xl border border-[var(--sg-border)] bg-white px-3 py-3 text-left transition hover:border-[var(--sg-navy)] hover:bg-[var(--sg-tint)]"
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--sg-tint)] text-base">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold text-[var(--sg-navy)]">{title}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-[var(--sg-muted)]">{hint}</span>
      </span>
    </button>
  );
}

function StatusChip({ ok, label }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
        ok ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#f1f3f9] text-[#8a93b0]'
      }`}
    >
      {label}
    </span>
  );
}

export function PlannerToolsPanel() {
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

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-[var(--sg-border)] bg-[#fafbff]">
      {event && (
        <div className="border-b border-[var(--sg-border)] bg-white px-4 py-4">
          <div className="text-[10px] font-bold uppercase tracking-wide text-[#bbb]">{t('toolsEvent')}</div>
          <div className="mt-1 text-2xl font-black leading-none text-[var(--sg-navy)]">{event.id}</div>
          {event.name && (
            <div className="mt-1 text-sm font-bold leading-snug text-[var(--sg-navy)]">{event.name}</div>
          )}
          {event.eventDate && (
            <div className="mt-1 text-xs text-[var(--sg-muted)]">{event.eventDate}</div>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <StatusChip ok={hasTeam} label={hasTeam ? `${photographers.length} ${t('toolsTeam')}` : t('toolsNoTeam')} />
            <StatusChip ok={hasRoute} label={hasRoute ? t('toolsRouteOk') : t('toolsNoRoute')} />
            <StatusChip ok={hasSpots} label={hasSpots ? `${tactic.spots.length} spots` : t('toolsNoSpots')} />
            {hasReference && (
              <StatusChip
                ok
                label={`${tactic.referenceSpots.length} ${t('toolsReference')}`}
              />
            )}
          </div>
          {event.predecessorEventId && (
            <p className="mt-2 rounded-lg bg-[#f6f8ff] px-2 py-1.5 text-[10px] leading-snug text-[#5b6aa8]">
              {t('toolsPredecessorHint').replace('{id}', event.predecessorEventId)}
            </p>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wide text-[#bbb]">{t('toolsImport')}</div>
        <div className="space-y-2">
          <ToolButton
            icon="👥"
            title={t('toolsTeamCsv')}
            hint={t('toolsTeamCsvHint')}
            accept=".csv,.txt"
            onPick={async (file) => importTeamCsv(await file.text())}
          />
          <ToolButton
            icon="🛤️"
            title={t('toolsGpx')}
            hint={t('toolsGpxHint')}
            accept=".gpx"
            onPick={loadGpx}
          />
          <ToolButton
            icon="📍"
            title={t('toolsKml')}
            hint={t('toolsKmlHint')}
            accept=".kml,.kmz"
            onPick={importKml}
          />
          <ToolButton
            icon="📋"
            title={t('toolsInfofile')}
            hint={t('toolsInfofileHint')}
            accept=".txt"
            onPick={async (file) => importInfofile(await file.text())}
          />
        </div>

        <div className="mb-2 mt-5 px-1 text-[10px] font-bold uppercase tracking-wide text-[#bbb]">{t('toolsActions')}</div>
        <div className="space-y-2">
          <ToolButton
            icon="🗺️"
            title={t('toolsOpenMap')}
            hint={t('toolsOpenMapHint')}
            onClick={() => setMapExpanded(true)}
          />
          {hasReference && (
            <ToolButton
              icon="👁️"
              title={tactic.showReferenceLayer !== false ? t('toolsHideReference') : t('toolsShowReference')}
              hint={t('toolsReferenceHint')}
              onClick={toggleReferenceLayer}
            />
          )}
          <ToolButton
            icon="📤"
            title={t('toolsExport')}
            hint={t('toolsExportHint')}
            onClick={() => exportTacticJson(true)}
          />
        </div>
      </div>

      <div className="border-t border-[var(--sg-border)] bg-white px-3 py-3">
        <button type="button" onClick={() => setSettingsOpen(true)} className="sg-btn w-full !py-2 text-xs">
          {t('settings')}
        </button>
      </div>

      <LanguageSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </aside>
  );
}
