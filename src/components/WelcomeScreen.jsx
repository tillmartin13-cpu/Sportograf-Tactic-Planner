import { useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { BrandLogo } from './BrandLogo';
import { LanguageSettingsModal } from './LanguageSettingsModal';
import { useTranslation } from '../i18n/useTranslation';

export function WelcomeScreen() {
  const openTacticPlanner = usePlannerStore((s) => s.openTacticPlanner);
  const openPhotographerImport = usePlannerStore((s) => s.openPhotographerImport);
  const { t } = useTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-col bg-[var(--sg-bg)]">
      <div className="sg-topbar">
        <BrandLogo variant="white" className="h-7 w-[120px]" />
        <span className="sg-topbar-title">{t('appTitle')}</span>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="w-[120px] text-right text-xs font-bold text-white/85 hover:text-white"
        >
          {t('settings')}
        </button>
      </div>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 px-4 py-8 md:px-6">
        <div className="text-center">
          <BrandLogo className="mx-auto h-16 w-[220px]" />
        </div>

        <div className="hidden items-center justify-between gap-4 px-1 md:flex">
          <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-[var(--sg-red)]">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--sg-red)] text-xs text-white">
              TL
            </span>
            {t('forTeamLeaders')}
          </div>
          <div className="h-px flex-1 bg-[var(--sg-border)]" />
          <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-[var(--sg-navy)]">
            {t('forPhotographers')}
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--sg-navy)] text-xs text-white">
              PH
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-stretch">
          <section className="sg-card flex flex-1 flex-col border-t-4 border-t-[var(--sg-red)] p-5 md:p-6">
            <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-[#fff5f5] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[var(--sg-red)] md:hidden">
              {t('forTeamLeaders')}
            </div>
            <h2 className="sg-card-title">{t('tlHeadline')}</h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--sg-muted)]">{t('tlWelcomeBody')}</p>
            <button type="button" onClick={openTacticPlanner} className="sg-btn sg-btn-navy mt-5 w-full">
              {t('openPlanner')}
            </button>
          </section>

          <section className="sg-card flex flex-1 flex-col border-t-4 border-t-[var(--sg-navy)] p-5 md:p-6">
            <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-[var(--sg-tint)] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[var(--sg-navy)] md:hidden">
              {t('forPhotographers')}
            </div>
            <h2 className="sg-card-title">{t('phHeadline')}</h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--sg-muted)]">{t('phBody')}</p>
            <button type="button" onClick={openPhotographerImport} className="sg-btn sg-btn-navy mt-5 w-full">
              {t('importTactic')}
            </button>
          </section>
        </div>
      </main>

      <footer className="pb-8 text-center text-[11px] text-[#ccc]">{t('footer')}</footer>
      <LanguageSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
