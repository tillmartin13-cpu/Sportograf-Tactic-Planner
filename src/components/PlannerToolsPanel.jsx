import { useRef, useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { useCurrentEvent } from '../hooks/useCurrentEvent';
import { useTactic } from '../hooks/useTactic';
import { LanguageSettingsModal } from './LanguageSettingsModal';
import { useTranslation } from '../i18n/useTranslation';
import { isHyroxEvent } from '../lib/hyrox';

// ─── Icons ───────────────────────────────────────────────────────────────────

function Icon({ d, size = 16, strokeWidth = 1.75 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  );
}

const ICONS = {
  map:      ['M3 6l9-3 9 3v13l-9 3-9-3z','M12 3v17','M3 6l9 4 9-4'],
  hyrox:    ['M6 4h12','M6 20h12','M12 4v16','M4 9h16','M4 15h16'],
  upload:   ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M17 8l-5-5-5 5','M12 3v12'],
  users:    ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 14v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
  gpx:      ['M3 12h18M12 3l4.5 9-9 0zM12 21l-4.5-9 9 0'],
  pin:      ['M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z','M12 10m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0'],
  infofile: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6','M16 13H8','M16 17H8','M10 9H8'],
  expand:   ['M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3'],
  eye:      ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z','M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0'],
  eyeOff:   ['M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24','M1 1l22 22'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M7 10l5 5 5-5','M12 15V3'],
  settings: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z','M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'],
  chevron:  'M6 9l6 6 6-6',
  close:    ['M18 6L6 18','M6 6l12 12'],
  check:    'M20 6L9 17l-5-5',
};

function SvgIcon({ name, size = 16 }) {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  );
}

// ─── File trigger row ─────────────────────────────────────────────────────────

function FileRow({ icon, label, accept, onPick, hint }) {
  const ref = useRef(null);
  return (
    <>
      <input ref={ref} type="file" accept={accept} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ''; }} />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[var(--sg-tint)] group"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#eef1fb] text-[#5b6aa8] group-hover:bg-[#dde3f7]">
          <SvgIcon name={icon} size={14} />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--sg-navy)]">{label}</div>
          {hint && <div className="text-[10px] text-[var(--sg-muted)]">{hint}</div>}
        </div>
      </button>
    </>
  );
}

function ActionRow({ icon, label, hint, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${active ? 'bg-[#1C2B6B]/8' : 'hover:bg-[var(--sg-tint)]'} group`}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${active ? 'bg-[#dde3f7] text-[#1C2B6B]' : 'bg-[#eef1fb] text-[#5b6aa8] group-hover:bg-[#dde3f7]'}`}>
        <SvgIcon name={icon} size={14} />
      </span>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-[var(--sg-navy)]">{label}</div>
        {hint && <div className="text-[10px] text-[var(--sg-muted)]">{hint}</div>}
      </div>
    </button>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function Stat({ label, value, ok }) {
  return (
    <div className={`flex flex-col rounded-lg px-2.5 py-2 ${ok ? 'bg-[#f0fdf4]' : 'bg-[#f3f5fa]'}`}>
      <span className={`text-base font-extrabold leading-none ${ok ? 'text-[#166534]' : 'text-[#9aa3bf]'}`}>{value}</span>
      <span className={`mt-0.5 text-[10px] font-medium ${ok ? 'text-[#22c55e]' : 'text-[#b0b8cf]'}`}>{label}</span>
    </div>
  );
}

// ─── Nav button ───────────────────────────────────────────────────────────────

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
        active ? 'bg-[#1C2B6B] text-white' : 'text-[var(--sg-navy)] hover:bg-[var(--sg-tint)]'
      }`}
    >
      <SvgIcon name={icon} size={15} />
      {label}
    </button>
  );
}

// ─── Main panel content ───────────────────────────────────────────────────────

function PanelContent({ activeView, onViewChange, onClose }) {
  const event = useCurrentEvent();
  const tactic = useTactic(event?.id);
  const allPhotographers = usePlannerStore((s) => s.photographers) || [];
  const photographers = event
    ? allPhotographers.filter((p) => p.eventIds ? p.eventIds.includes(event.id) : p.eventId === event.id)
    : [];
  const importTeamCsv = usePlannerStore((s) => s.importTeamCsv);
  const importInfofile = usePlannerStore((s) => s.importInfofile);
  const loadGpx = usePlannerStore((s) => s.loadGpx);
  const importKml = usePlannerStore((s) => s.importKml);
  const exportTacticJson = usePlannerStore((s) => s.exportTacticJson);
  const setMapExpanded = usePlannerStore((s) => s.setMapExpanded);
  const toggleReferenceLayer = usePlannerStore((s) => s.toggleReferenceLayer);
  const { t } = useTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const hasTeam = photographers.length > 0;
  const hasRoute = tactic.gpxTrack.length > 0;
  const hasSpots = tactic.spots.length > 0;
  const hasReference = (tactic.referenceSpots || []).length > 0;
  const hyrox = isHyroxEvent(event);

  function navTo(view) { onViewChange?.(view); onClose?.(); }

  return (
    <div className="flex h-full flex-col">

      {/* ── Event info ── */}
      <div className="border-b border-[var(--sg-border)] bg-white px-4 py-3.5">
        {event ? (
          <>
            <div className="truncate text-sm font-extrabold text-[var(--sg-navy)]">
              {event.name || `Event ${event.id}`}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="rounded bg-[#e8eaf6] px-1.5 py-0.5 text-[11px] font-extrabold tracking-wide text-[#4a5680]">
                {event.id}
              </span>
              {event.eventDate && (
                <span className="text-xs text-[var(--sg-muted)]">{event.eventDate}</span>
              )}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <Stat label="Photographers" value={hasTeam ? photographers.length : '—'} ok={hasTeam} />
              <Stat label="Spots" value={hasSpots ? tactic.spots.length : '—'} ok={hasSpots} />
              <Stat label="Route" value={hasRoute ? 'GPS' : '—'} ok={hasRoute} />
            </div>
          </>
        ) : (
          <>
            <div className="text-sm font-extrabold text-[var(--sg-navy)]">Tactic Planner</div>
            <div className="mt-1 text-xs leading-relaxed text-[var(--sg-muted)]">
              Import a team CSV to open your event, or create one manually.
            </div>
          </>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-2 py-2.5 space-y-0.5">

        {/* Navigation */}
        {event && (
          <>
            <NavBtn icon="map" label="Tactic Planner" active={activeView === 'planner' || !activeView} onClick={() => navTo('planner')} />
            {hyrox && (
              <NavBtn icon="hyrox" label="Hyrox Planner" active={activeView === 'hyrox'} onClick={() => navTo('hyrox')} />
            )}
            <div className="my-2 border-t border-[var(--sg-border)]" />
          </>
        )}

        {/* Import — collapsible */}
        <button
          type="button"
          onClick={() => setImportOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-bold text-[var(--sg-navy)] hover:bg-[var(--sg-tint)] transition-colors"
        >
          <span className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#1C2B6B] text-white">
              <SvgIcon name="upload" size={14} />
            </span>
            Import
          </span>
          <span className={`text-[#b0b8cf] transition-transform ${importOpen ? 'rotate-180' : ''}`}>
            <SvgIcon name="chevron" size={14} />
          </span>
        </button>

        {importOpen && (
          <div className="ml-2 border-l-2 border-[#eef1fb] pl-2 space-y-0.5">
            <FileRow icon="users" label="Team CSV" hint="Opens or creates the event" accept=".csv,.txt"
              onPick={async (f) => { await importTeamCsv(await f.text()); onClose?.(); }} />
            <FileRow icon="gpx" label="GPX Route" hint="Race course track" accept=".gpx"
              onPick={(f) => { loadGpx(f); onClose?.(); }} />
            <FileRow icon="pin" label="KML / KMZ" hint="Spot coordinates" accept=".kml,.kmz"
              onPick={(f) => { importKml(f); onClose?.(); }} />
            <FileRow icon="infofile" label="Infofile" hint="Spots + assignments from Sportograf" accept=".txt"
              onPick={async (f) => { await importInfofile(await f.text()); onClose?.(); }} />
          </div>
        )}

        {/* Actions */}
        {event && (
          <>
            <div className="my-2 border-t border-[var(--sg-border)]" />
            <ActionRow icon="expand" label="Expand map" onClick={() => { setMapExpanded(true); onClose?.(); }} />
            {hasReference && (
              <ActionRow
                icon={tactic.showReferenceLayer !== false ? 'eyeOff' : 'eye'}
                label={tactic.showReferenceLayer !== false ? 'Hide reference layer' : 'Show reference layer'}
                hint="Previous year's spots"
                active={tactic.showReferenceLayer !== false}
                onClick={() => { toggleReferenceLayer(); onClose?.(); }}
              />
            )}
            <ActionRow icon="download" label="Export JSON" hint="Share with photographers" onClick={() => exportTacticJson(true)} />
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-[var(--sg-border)] bg-white px-3 py-2.5">
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--sg-muted)] transition-colors hover:bg-[var(--sg-tint)] hover:text-[var(--sg-navy)]"
        >
          <SvgIcon name="settings" size={13} />
          {t('settings')}
        </button>
      </div>

      <LanguageSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────

export function PlannerToolsPanel({ activeView, onViewChange, mobileOpen, onMobileClose }) {
  return (
    <>
      <aside className="hidden lg:flex h-full w-56 shrink-0 flex-col border-r border-[var(--sg-border)] bg-[#fafbff]">
        <PanelContent activeView={activeView} onViewChange={onViewChange} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[800] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-[#fafbff] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--sg-border)] bg-white px-4 py-3">
              <span className="text-sm font-extrabold text-[var(--sg-navy)]">Menu</span>
              <button type="button" onClick={onMobileClose} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600">
                <SvgIcon name="close" size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <PanelContent activeView={activeView} onViewChange={onViewChange} onClose={onMobileClose} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
