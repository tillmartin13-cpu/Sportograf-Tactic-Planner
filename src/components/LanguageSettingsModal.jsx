import { useEffect, useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { LANGUAGES } from '../i18n/messages';
import { useTranslation } from '../i18n/useTranslation';

export function LanguageSettingsModal({ open, onClose }) {
  const language = usePlannerStore((s) => s.language);
  const setLanguage = usePlannerStore((s) => s.setLanguage);
  const { t } = useTranslation();
  const [draft, setDraft] = useState(language);

  useEffect(() => {
    if (open) setDraft(language);
  }, [open, language]);

  if (!open) return null;

  const save = () => {
    setLanguage(draft);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[8000] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="sg-card w-full max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="lang-settings-title"
      >
        <h2 id="lang-settings-title" className="sg-card-title">
          {t('settings')}
        </h2>
        <p className="mt-2 text-sm text-[var(--sg-muted)]">{t('languageHint')}</p>

        <label className="mt-4 block text-[11px] font-bold uppercase tracking-wide text-[#bbb]">
          {t('language')}
        </label>
        <select
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="sg-input mt-2"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="sg-btn flex-1">
            {t('close')}
          </button>
          <button type="button" onClick={save} className="sg-btn sg-btn-navy flex-1">
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
