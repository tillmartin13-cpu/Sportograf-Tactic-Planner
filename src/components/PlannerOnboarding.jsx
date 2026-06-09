import { useTranslation } from '../i18n/useTranslation';

export function PlannerOnboarding() {
  const { t } = useTranslation();

  return (
    <div className="sg-card flex flex-1 flex-col items-center justify-center p-8 text-center">
      <h2 className="sg-card-title">{t('plannerWelcomeTitle')}</h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--sg-muted)]">{t('plannerWelcomeBody')}</p>
      <ol className="mt-6 max-w-sm space-y-3 text-left text-sm text-[var(--sg-muted)]">
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--sg-navy)] text-xs font-bold text-white">
            1
          </span>
          {t('plannerStep1')}
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--sg-navy)] text-xs font-bold text-white">
            2
          </span>
          {t('plannerStep2')}
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--sg-navy)] text-xs font-bold text-white">
            3
          </span>
          {t('plannerStep3')}
        </li>
      </ol>
      <p className="mt-6 text-xs font-semibold text-[var(--sg-navy)]">{t('plannerWelcomeHint')}</p>
    </div>
  );
}
