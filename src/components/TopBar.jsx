import { useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { useCurrentEvent } from '../hooks/useCurrentEvent';
import { BrandLogo } from './BrandLogo';
import { LanguageSettingsModal } from './LanguageSettingsModal';
import { useTranslation } from '../i18n/useTranslation';

export function TopBar({ title = 'Tactic Planner' }) {
  const event = useCurrentEvent();
  const updateEvent = usePlannerStore((s) => s.updateEvent);
  const mapExpanded = usePlannerStore((s) => s.mapExpanded);
  const setMapExpanded = usePlannerStore((s) => s.setMapExpanded);
  const exitToWelcome = usePlannerStore((s) => s.exitToWelcome);
  const { t } = useTranslation();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const startEdit = () => {
    if (!event) return;
    setNameDraft(event.name || '');
    setEditingName(true);
  };

  const commitName = () => {
    if (event && nameDraft.trim() !== (event.name || '')) {
      updateEvent(event.id, { name: nameDraft.trim() });
    }
    setEditingName(false);
  };

  const centerTitle = event
    ? editingName
      ? null
      : event.name || `Event ${event.id}`
    : title;

  return (
    <>
      <header className="sg-topbar relative z-20">
        <BrandLogo variant="white" className="h-7 w-[108px] shrink-0" />

        <div className="sg-topbar-title pointer-events-auto">
          {editingName ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => e.key === 'Enter' && commitName()}
              className="mx-auto w-full max-w-[280px] rounded-[8px] border border-white/20 bg-white/10 px-2 py-1 text-center text-sm font-bold text-white outline-none"
            />
          ) : event ? (
            <button type="button" onClick={startEdit} className="truncate hover:underline">
              {centerTitle}
              <span className="ml-1.5 text-xs font-semibold text-white/55">#{event.id}</span>
              {event.eventDate && (
                <span className="ml-1.5 text-xs font-semibold text-white/45">· {event.eventDate}</span>
              )}
            </button>
          ) : (
            centerTitle
          )}
        </div>

        <div className="flex w-[108px] shrink-0 items-center justify-end gap-0.5">
          {event && (
            <button
              type="button"
              onClick={() => setMapExpanded(!mapExpanded)}
              className="rounded-[10px] px-2.5 py-1.5 text-[11px] font-bold text-white/85 hover:bg-white/10"
            >
              {mapExpanded ? t('toolsBackPlan') : t('toolsMap')}
            </button>
          )}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="rounded-[10px] px-2 py-1.5 text-[11px] font-bold text-white/70 hover:bg-white/10"
            title={t('settings')}
          >
            ⚙
          </button>
          <button
            type="button"
            onClick={exitToWelcome}
            className="ml-1 flex items-center gap-1 rounded-[10px] px-2 py-1.5 text-[11px] font-bold text-white/70 hover:bg-white/10 hover:text-white"
            title="Back to home"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Home
          </button>
        </div>
      </header>
      <LanguageSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
