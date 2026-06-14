import { useRef, useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { useCurrentEvent } from '../hooks/useCurrentEvent';
import { useTactic } from '../hooks/useTactic';
import { LanguageSettingsModal } from './LanguageSettingsModal';
import { useTranslation } from '../i18n/useTranslation';
import { isHyroxEvent, isIndoorEvent } from '../lib/hyrox';
import { TLInfoEditor } from './TLInfoEditor';
import { SpeedToolsModal } from './SpeedTools';
import { AIEventLogicModal } from './AIEventLogic';
import { uploadTacticJson } from '../lib/supabase';

// ─── Icons ───────────────────────────────────────────────────────────────────

const ICONS = {
  map:      ['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2','M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2','M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2','M9 12h6','M9 16h4'],
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
  arrow:    'M9 18l6-6-6-6',
  zap:      'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  academy:  ['M22 10v6M2 10l10-5 10 5-10 5z','M6 12v5c3 3 9 3 12 0v-5'],
  extlink:  ['M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6','M15 3h6v6','M10 14L21 3'],
  ai:       ['M12 2a10 10 0 1 0 10 10','M12 6v6l4 2','M18 12h4M22 8v4'],
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

function FileRow({ icon, label, accept, onPick, hint, multiple = false }) {
  const ref = useRef(null);
  return (
    <>
      <input ref={ref} type="file" accept={accept} multiple={multiple} className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (multiple) { files.forEach((f) => onPick(f)); }
          else if (files[0]) onPick(files[0]);
          e.target.value = '';
        }} />
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

// ─── Team Info modal ──────────────────────────────────────────────────────────

function TeamInfoModal({ onClose }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-[900] flex items-end justify-stretch lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-2xl flex-col bg-white shadow-2xl lg:max-h-[90vh] lg:rounded-2xl rounded-t-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#e3e7f2] bg-[#1C2B6B] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span className="text-sm font-extrabold text-white">{t('toolsTeamInfo')}</span>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors">
            <SvgIcon name="close" size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <TLInfoEditor />
        </div>
      </div>
    </div>
  );
}

// ─── Main panel content ───────────────────────────────────────────────────────

function PanelContent({ activeView, onViewChange, onClose }) {
  const event = useCurrentEvent();
  const tactic = useTactic(event?.id);
  const importTeamCsv = usePlannerStore((s) => s.importTeamCsv);
  const importTacticJson = usePlannerStore((s) => s.importTacticJson);
  const importInfofile = usePlannerStore((s) => s.importInfofile);
  const loadGpx = usePlannerStore((s) => s.loadGpx);
  const importKml = usePlannerStore((s) => s.importKml);
  const exportTacticJson = usePlannerStore((s) => s.exportTacticJson);
  const setMapExpanded = usePlannerStore((s) => s.setMapExpanded);
  const toggleReferenceLayer = usePlannerStore((s) => s.toggleReferenceLayer);
  const { t } = useTranslation();
  const photographers = usePlannerStore((s) => s.photographers);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [teamInfoOpen, setTeamInfoOpen] = useState(false);
  const [speedToolsOpen, setSpeedToolsOpen] = useState(false);
  const [aiEventOpen, setAiEventOpen] = useState(false);
  const [tacticUploading, setTacticUploading] = useState(false);
  const [tacticUploadStatus, setTacticUploadStatus] = useState(null); // null | 'ok' | 'error'
  const [mailOpen, setMailOpen] = useState(false);

  async function handleUploadTactic() {
    if (!event) return;
    setTacticUploading(true);
    setTacticUploadStatus(null);
    try {
      const { eventCode, ...publicEvent } = event;
      const payload = {
        _sportograf: { format: 'tactic-package', version: '1.0.0', exportedAt: new Date().toISOString() },
        event: publicEvent,
        photographers,
        tactic,
      };
      await uploadTacticJson(payload, event.id);
      setTacticUploadStatus('ok');
    } catch {
      setTacticUploadStatus('error');
    } finally {
      setTacticUploading(false);
    }
  }

  const hasReference = (tactic.referenceSpots || []).length > 0;
  const hyrox = isHyroxEvent(event);
  const indoor = isIndoorEvent(event);

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
            {event.eventType && event.eventType !== 'standard_race' && (
              <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                event.eventType === 'hyrox' ? 'bg-[#fef3c7] text-[#92400e]' :
                event.eventType === 'obstacle_gpx' ? 'bg-[#f0fdf4] text-[#166534]' :
                event.eventType === 'obstacle_no_gpx' ? 'bg-[#fdf4ff] text-[#7e22ce]' :
                'bg-[#f1f5f9] text-[#475569]'
              }`}>
                {{ hyrox:'HYROX', obstacle_gpx:'Obstacle w/ GPX', obstacle_no_gpx:'Obstacle w/o GPX', other:'Other' }[event.eventType] || event.eventType}
              </span>
            )}
          </>
        ) : (
          <>
            <div className="text-sm font-extrabold text-[var(--sg-navy)]">Tactic Planner</div>
            <div className="mt-1 text-xs leading-relaxed text-[var(--sg-muted)]">
              Import a team CSV to get started, or create one manually.
            </div>
          </>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-2 py-2.5 space-y-0.5">

        {/* View switcher — only for Hyrox */}
        {event && hyrox && (
          <>
            <NavBtn icon="map" label="Tactic Planner" active={activeView === 'planner' || !activeView} onClick={() => navTo('planner')} />
            <NavBtn icon="hyrox" label="Hyrox Planner" active={activeView === 'hyrox'} onClick={() => navTo('hyrox')} />
            <div className="my-2 border-t border-[var(--sg-border)]" />
          </>
        )}

        {/* ── Import (big, always visible) ── */}
        <button
          type="button"
          onClick={() => setImportOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-bold text-[var(--sg-navy)] hover:bg-[var(--sg-tint)] transition-colors"
        >
          <span className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#1C2B6B] text-white">
              <SvgIcon name="download" size={14} />
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
            <FileRow icon="download" label={t('toolsTacticJson')} hint={t('toolsTacticJsonHint')} accept=".json"
              onPick={async (f) => { const ok = await importTacticJson(await f.text()); if (ok) onClose?.(); }} />
            {!indoor && (
              <FileRow icon="gpx" label="GPX Route" hint="Race course track — select multiple" accept=".gpx" multiple
                onPick={(f) => { loadGpx(f); }} />
            )}
            {!indoor && (
              <FileRow icon="pin" label="KML / KMZ" hint="Spots + route from Google Maps" accept=".kml,.kmz"
                onPick={(f) => { importKml(f); onClose?.(); }} />
            )}
            {!indoor && (
              <FileRow icon="infofile" label="Infofile" hint="Spots + assignments from Sportograf" accept=".txt"
                onPick={async (f) => { await importInfofile(await f.text()); onClose?.(); }} />
            )}
          </div>
        )}

        {/* ── Tools section ── */}
        <div className="my-2 border-t border-[var(--sg-border)]" />
        <div className="px-1 pb-0.5">
          <p className="px-2 pb-1 pt-0.5 text-[9px] font-bold uppercase tracking-widest text-[#b0b8cf]">Tools</p>
          <div className="space-y-0.5">

            {/* AI Event Logic */}
            <button
              type="button"
              onClick={() => setAiEventOpen(true)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--sg-tint)]"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#eef1fb] text-[#5b6aa8]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 1 7 7c0 2.6-1.4 4.9-3.5 6.2-.5.3-.5.8-.5 1.3V17H9v-.5c0-.5 0-1-.5-1.3A7 7 0 0 1 12 2z"/>
                </svg>
              </span>
              <span className="flex-1 text-xs font-semibold text-[var(--sg-navy)]">Event Logic</span>
              <span className="rounded bg-[#1C2B6B] px-1 py-0.5 text-[9px] font-bold text-white">AI</span>
            </button>

            {/* Upload Calculator */}
            <button
              type="button"
              onClick={() => setSpeedToolsOpen(true)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--sg-tint)]"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#eef1fb] text-[#5b6aa8]">
                <SvgIcon name="zap" size={12} />
              </span>
              <span className="text-xs font-semibold text-[var(--sg-navy)]">Upload Calculator</span>
            </button>

            {/* TL Academy */}
            <a
              href="https://sportografacademy2.super.site/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--sg-tint)]"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#eef1fb] text-[#5b6aa8]">
                <SvgIcon name="academy" size={12} />
              </span>
              <span className="flex-1 text-xs font-semibold text-[var(--sg-navy)]">TL Academy</span>
              <SvgIcon name="extlink" size={11} />
            </a>
          </div>
        </div>

        {event && (
          <>
            {/* ── Team Info (big) ── */}
            <div className="my-2 border-t border-[var(--sg-border)]" />
            <div className="px-1">
              <button
                type="button"
                onClick={() => setTeamInfoOpen(true)}
                className="flex w-full items-center gap-3 rounded-xl bg-[#1C2B6B] px-4 py-3.5 text-left text-white transition-all hover:bg-[#16255e] active:scale-[0.98]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-extrabold leading-tight">{t('toolsTeamInfo')}</div>
                  <div className="text-[11px] text-white/55 mt-0.5">{t('toolsTeamInfoSub')}</div>
                </div>
                <SvgIcon name="arrow" size={14} />
              </button>
            </div>

            {/* ── Export — green, workflow conclusion ── */}
            <div className="px-1 pb-1 pt-1">
              <button
                type="button"
                onClick={() => exportTacticJson(true)}
                className="flex w-full items-center gap-3 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-left transition-all hover:bg-[#dcfce7] active:scale-[0.98]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#22c55e]/15 text-[#16a34a]">
                  <SvgIcon name="upload" size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[#166534] leading-tight">{t('toolsExportTacticJson')}</div>
                  <div className="text-[10px] text-[#4ade80] mt-0.5">{t('toolsExportTacticJsonHint')}</div>
                </div>
              </button>
            </div>

            {/* ── Mail tactic to team ── */}
            <div className="px-1 pb-1">
              {(() => {
                const emails = (photographers || []).map((p) => p.email).filter(Boolean);
                const eventName = event?.name || 'the event';
                const eventDate = event?.date ? new Date(event.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
                const subject = `Tactic — ${eventName}${eventDate ? ' · ' + eventDate : ''}`;
                const body = `Hi team,\n\nPlease find the tactic for ${eventName}${eventDate ? ' on ' + eventDate : ''} attached as a JSON file.\n\nHow to import:\n1. Open the Sportograf Tactic Tool\n2. Tap "Import Tactic JSON"\n3. Select the attached file\n\nBest,`;

                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setMailOpen((v) => !v)}
                      className="flex w-full items-center gap-2.5 rounded-xl border border-[#e3e7f2] bg-white px-3 py-2 text-left transition-all hover:bg-[#f4f5fb] active:scale-[0.98]"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#eef1fb] text-[#1C2B6B]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-semibold text-[#1C2B6B] leading-tight">Mail tactic to team</div>
                        <div className="text-[10px] text-[#8a93b0] mt-0.5">
                          {emails.length > 0 ? `${emails.length} address${emails.length !== 1 ? 'es' : ''} ready` : 'No emails in team CSV'}
                        </div>
                      </div>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-[#8a93b0] transition-transform ${mailOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
                    </button>

                    {mailOpen && (
                      <div className="mt-1 rounded-xl border border-[#e3e7f2] bg-[#f8f9ff] p-3 space-y-2.5">
                        {/* Email addresses */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a93b0]">To</span>
                            <button type="button" onClick={() => navigator.clipboard?.writeText(emails.join(', '))}
                              className="text-[10px] font-bold text-[#1C2B6B] hover:underline">Copy</button>
                          </div>
                          <div className="rounded-lg bg-white border border-[#e3e7f2] px-2.5 py-2 text-[11px] text-[#1C2B6B] leading-relaxed break-all select-all">
                            {emails.length > 0 ? emails.join(', ') : <span className="text-[#8a93b0]">No email addresses found in team CSV</span>}
                          </div>
                        </div>

                        {/* Subject */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a93b0]">Subject</span>
                            <button type="button" onClick={() => navigator.clipboard?.writeText(subject)}
                              className="text-[10px] font-bold text-[#1C2B6B] hover:underline">Copy</button>
                          </div>
                          <div className="rounded-lg bg-white border border-[#e3e7f2] px-2.5 py-2 text-[11px] text-[#1C2B6B] select-all">
                            {subject}
                          </div>
                        </div>

                        {/* Body */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a93b0]">Message</span>
                            <button type="button" onClick={() => navigator.clipboard?.writeText(body)}
                              className="text-[10px] font-bold text-[#1C2B6B] hover:underline">Copy</button>
                          </div>
                          <div className="rounded-lg bg-white border border-[#e3e7f2] px-2.5 py-2 text-[11px] text-[#1C2B6B] whitespace-pre-wrap leading-relaxed select-all">
                            {body}
                          </div>
                        </div>

                        <p className="text-[10px] text-[#8a93b0] leading-snug">Attach the exported tactic JSON file to your email.</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* ── Save to cloud archive ── */}
            <div className="px-1 pb-2">
              <button
                type="button"
                onClick={handleUploadTactic}
                disabled={tacticUploading || !event}
                className="flex w-full items-center gap-2.5 rounded-xl border border-[#e3e7f2] bg-white px-3 py-2 text-left transition-all hover:bg-[#f4f5fb] disabled:opacity-50 active:scale-[0.98]"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#eef1fb] text-[#1C2B6B]">
                  {tacticUploading
                    ? <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    : tacticUploadStatus === 'ok'
                      ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                      : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v10M8 6l4-4 4 4M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2"/></svg>
                  }
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-semibold text-[#1C2B6B] leading-tight">
                    {tacticUploading ? 'Uploading…' : tacticUploadStatus === 'ok' ? 'Saved to cloud ✓' : 'Save tactic to cloud archive'}
                  </div>
                  {tacticUploadStatus === 'error' && (
                    <div className="text-[10px] text-red-500 mt-0.5">Upload failed — check connection</div>
                  )}
                  {!tacticUploadStatus && !tacticUploading && (
                    <div className="text-[10px] text-[#8a93b0] mt-0.5">Saves as {event?.id}_{new Date().getFullYear()}.json</div>
                  )}
                </div>
              </button>
            </div>
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
      {teamInfoOpen && <TeamInfoModal onClose={() => setTeamInfoOpen(false)} />}
      {speedToolsOpen && <SpeedToolsModal onClose={() => setSpeedToolsOpen(false)} />}
      {aiEventOpen && <AIEventLogicModal onClose={() => setAiEventOpen(false)} />}
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
        <div className="fixed inset-0 z-[2000] lg:hidden">
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
