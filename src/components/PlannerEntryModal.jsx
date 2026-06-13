import { useRef, useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { useCurrentEvent } from '../hooks/useCurrentEvent';
import { useTranslation } from '../i18n/useTranslation';
import { EVENT_CODE_LENGTH, normalizeEventCode } from '../lib/eventCode';

export function PlannerEntryModal() {
  const open = usePlannerStore((s) => s.showPlannerEntryModal);
  const closePlannerEntryModal = usePlannerStore((s) => s.closePlannerEntryModal);
  const applyReferenceCode = usePlannerStore((s) => s.applyReferenceCode);
  const importTeamCsv = usePlannerStore((s) => s.importTeamCsv);
  const event = useCurrentEvent();
  const { t } = useTranslation();

  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [csvJustImported, setCsvJustImported] = useState(false);
  const csvRef = useRef(null);

  if (!open) return null;

  const submitReferenceCode = async (e) => {
    e.preventDefault();
    setCodeError('');
    if (!event) {
      setCodeError(t('referenceNeedsEvent'));
      return;
    }
    setCodeLoading(true);
    try {
      const ok = await applyReferenceCode(code);
      if (!ok) setCodeError(t('codeEventMismatch'));
      else setCode('');
    } finally {
      setCodeLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[7000] flex items-end justify-center bg-black/45 sm:items-center sm:p-4">
      <div
        className="sg-card flex max-h-[92dvh] w-full max-w-lg flex-col overflow-y-auto rounded-b-none rounded-t-3xl p-5 sm:rounded-2xl sm:p-6"
        role="dialog"
        aria-labelledby="planner-entry-title"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="planner-entry-title" className="sg-card-title">
              {t('entryModalTitle')}
            </h2>
            <p className="mt-1 text-sm text-[var(--sg-muted)]">{t('entryModalSubtitle')}</p>
          </div>
          <button
            type="button"
            onClick={closePlannerEntryModal}
            className="rounded-lg px-2 py-1 text-lg leading-none text-[#ccc] hover:bg-[#f5f5f5] hover:text-[var(--sg-navy)]"
            aria-label={t('close')}
          >
            ✕
          </button>
        </div>

        <section className="mb-4 rounded-[10px] border border-[var(--sg-border)] bg-[var(--sg-tint)] p-4">
          <h3 className="text-sm font-extrabold text-[var(--sg-navy)]">{t('entryOpenEvent')}</h3>
          <p className="mt-1 text-xs leading-relaxed text-[var(--sg-muted)]">{t('entryOpenEventHint')}</p>

          <input
            ref={csvRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const ok = await importTeamCsv(await file.text());
                if (ok) setCsvJustImported(true);
              } catch {
                /* importTeamCsv reports its own errors */
              } finally {
                e.target.value = '';
              }
            }}
          />
          <button
            type="button"
            onClick={() => csvRef.current?.click()}
            className="sg-btn sg-btn-navy mt-3 w-full text-sm"
          >
            {t('entryImportCsv')}
          </button>

          {csvJustImported && (
            <div className="mt-3 rounded-xl bg-green-50 border border-green-200 px-3 py-2.5 text-xs text-green-800">
              <span className="font-bold">✓ {t('csvImportedShort')}</span>
              <span className="ml-1">{t('csvImportedReferenceHint')}</span>
            </div>
          )}

          {event && !csvJustImported && (
            <p className="mt-2 text-center text-xs font-semibold text-[var(--sg-navy)]">
              {t('eventActive').replace('{id}', event.id)}
            </p>
          )}


          <div className="mt-4 border-t border-[var(--sg-border)] pt-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#bbb]">{t('optional')}</p>
            <h4 className="mt-1 text-sm font-bold text-[var(--sg-navy)]">{t('entryReferenceCode')}</h4>
            <p className="mt-1 text-xs leading-relaxed text-[var(--sg-muted)]">{t('entryReferenceHint')}</p>

            <form onSubmit={submitReferenceCode} className="mt-3">
              <input
                value={code}
                onChange={(e) => setCode(normalizeEventCode(e.target.value))}
                placeholder={t('eventCodePlaceholder')}
                maxLength={EVENT_CODE_LENGTH}
                disabled={!event}
                className="sg-input font-mono text-center font-bold tracking-[0.28em] disabled:opacity-50"
              />
              {codeError && <p className="mt-1.5 text-xs font-semibold text-[var(--sg-red)]">{codeError}</p>}
              <button
                type="submit"
                disabled={!event || codeLoading}
                className="sg-btn mt-3 w-full text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {codeLoading ? '…' : t('entryLoadReference')}
              </button>
              <button
                type="button"
                onClick={closePlannerEntryModal}
                className="mt-2 w-full rounded-xl border border-[var(--sg-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--sg-muted)] hover:border-[#c0c8e8] hover:text-[var(--sg-navy)] transition-colors"
              >
                {t('entryContinueNoRef')}
              </button>
            </form>
          </div>
        </section>

        <button
          type="button"
          onClick={closePlannerEntryModal}
          className="mt-2 w-full rounded-xl border border-[var(--sg-border)] bg-white px-3 py-2.5 text-sm font-semibold text-[var(--sg-muted)] hover:border-[#c0c8e8] hover:text-[var(--sg-navy)] transition-colors"
        >
          {t('entryBack')}
        </button>
      </div>
    </div>
  );
}
