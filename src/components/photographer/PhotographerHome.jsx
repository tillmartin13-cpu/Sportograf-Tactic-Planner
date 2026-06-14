import { useState, useEffect } from 'react';
import { usePhotographerStore, ACADEMY_URL, EM_URL } from '../../store/usePhotographerStore';
import { usePhTranslation } from '../../i18n/usePhTranslation';

const SUPPORT_URL = 'mailto:support@sportograf.com';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'fr', label: 'Français' },
];

const TILE_DEFS = [
  {
    id: 'tactics',
    labelKey: null, // stays English: "Event Tactics"
    subKey: 'homeTacticsSub',
    color: '#1C2B6B',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    ),
  },
  {
    id: 'academy',
    labelKey: null, // stays English: "Academy"
    subKey: 'homeAcademySub',
    color: '#7c3aed',
    href: ACADEMY_URL,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
  },
  {
    id: 'em',
    labelKey: null, // stays English: "Event Manager"
    subKey: 'homeEMSub',
    color: '#0369a1',
    href: EM_URL,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
        <path d="M7 8h10M7 12h6"/>
      </svg>
    ),
  },
  {
    id: 'support',
    labelKey: null, // stays English: "Support"
    subKey: 'homeSupportSub',
    color: '#059669',
    href: SUPPORT_URL,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <circle cx="12" cy="17" r=".5" fill="currentColor"/>
      </svg>
    ),
  },
];

const TILE_LABELS = { tactics: 'Event Tactics', academy: 'Academy', em: 'Event Manager', support: 'Support' };

// ─── Acronym input step 1 ─────────────────────────────────────────────────────

function AcronymStep1({ initial = '', onNext, onCancel }) {
  const [value, setValue] = useState(initial);
  const { t } = usePhTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onCancel}>
      <div
        className="w-full rounded-t-3xl bg-white px-6 pb-10 pt-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1 text-base font-black text-gray-900">{t('homeAcronymStep1Title')}</h3>
        <p className="mb-5 text-sm text-gray-400 leading-snug">
          {t('homeAcronymStep1Body')}
        </p>

        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
          {t('acronym')}
        </label>
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase().trim())}
          maxLength={8}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-black uppercase tracking-[0.2em] text-[#1C2B6B] focus:outline-none focus:ring-2 focus:ring-[#1C2B6B]/30"
        />

        <p className="mt-3 text-xs text-gray-400">
          {t('homeAcronymUnsure')}{' '}
          <a
            href={EM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#0369a1] underline underline-offset-2"
          >
            {t('homeAcronymEMText')}
          </a>
        </p>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-400 hover:bg-gray-50"
          >
            {t('homeAcronymCancel')}
          </button>
          <button
            type="button"
            disabled={!value}
            onClick={() => onNext(value)}
            className="flex-1 rounded-xl bg-[#1C2B6B] py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            {t('homeAcronymNext')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Acronym confirm step 2 ───────────────────────────────────────────────────

function AcronymStep2({ firstValue, onConfirm, onBack }) {
  const [value, setValue] = useState('');
  const { t } = usePhTranslation();
  const mismatch = value.length > 0 && value !== firstValue;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50">
      <div className="w-full rounded-t-3xl bg-white px-6 pb-10 pt-6 shadow-2xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1C2B6B]/10">
          <svg viewBox="0 0 24 24" fill="none" stroke="#1C2B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>

        <h3 className="mb-1 text-base font-black text-gray-900">{t('homeAcronymStep2Title')}</h3>
        <p className="mb-1 text-sm text-gray-400 leading-snug">
          {t('homeAcronymStep2Body')}
        </p>
        <p className="mb-5 text-sm font-bold text-[#1C2B6B]">
          {t('homeAcronymEntered')} <span className="tracking-widest">{firstValue}</span>
        </p>

        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
          {t('homeAcronymRepeatLabel')}
        </label>
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase().trim())}
          maxLength={8}
          placeholder={firstValue.replace(/./g, '·')}
          className={`w-full rounded-xl border px-4 py-3 text-lg font-black uppercase tracking-[0.2em] text-[#1C2B6B] focus:outline-none focus:ring-2 transition-colors ${
            mismatch
              ? 'border-red-300 bg-red-50 focus:ring-red-200'
              : 'border-gray-200 focus:ring-[#1C2B6B]/30'
          }`}
        />
        {mismatch && (
          <p className="mt-1.5 text-xs font-semibold text-red-500">{t('homeAcronymMismatch')}</p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-400 hover:bg-gray-50"
          >
            {t('homeAcronymBackBtn')}
          </button>
          <button
            type="button"
            disabled={value !== firstValue}
            onClick={() => onConfirm(value)}
            className="flex-1 rounded-xl bg-[#1C2B6B] py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            {t('homeAcronymConfirmBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings sheet ───────────────────────────────────────────────────────────

function SettingsSheet({ onClose }) {
  const acronym = usePhotographerStore((s) => s.acronym);
  const language = usePhotographerStore((s) => s.language);
  const setAcronym = usePhotographerStore((s) => s.setAcronym);
  const setLanguage = usePhotographerStore((s) => s.setLanguage);
  const { t } = usePhTranslation();

  // 'idle' | 'step1' | 'step2'
  const [acronymFlow, setAcronymFlow] = useState('idle');
  const [step1Value, setStep1Value] = useState('');

  function startAcronymEdit() {
    setStep1Value('');
    setAcronymFlow('step1');
  }

  function onStep1Next(val) {
    setStep1Value(val);
    setAcronymFlow('step2');
  }

  function onStep2Confirm(val) {
    setAcronym(val);
    setAcronymFlow('idle');
  }

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-end bg-black/40" onClick={onClose}>
        <div
          className="w-full rounded-t-3xl bg-white px-6 pb-10 pt-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-base font-black text-gray-900">{t('settingsTitle')}</h3>
            <button type="button" onClick={onClose} className="text-xl leading-none text-gray-300 hover:text-gray-500">×</button>
          </div>

          {/* Acronym */}
          <div className="mb-6">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('settingsAcronymLabel')}</p>
            {acronym ? (
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span className="text-base font-black tracking-[0.2em] text-[#1C2B6B]">{acronym}</span>
                <button
                  type="button"
                  onClick={startAcronymEdit}
                  className="text-xs font-semibold text-[#0369a1] hover:underline"
                >
                  {t('homeAcronymChangeBtn')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startAcronymEdit}
                className="w-full rounded-xl border-2 border-dashed border-[#1C2B6B]/30 px-4 py-4 text-sm font-bold text-[#1C2B6B]/60 hover:border-[#1C2B6B]/60 hover:text-[#1C2B6B] transition-colors"
              >
                {t('homeAcronymSetBtn')}
              </button>
            )}
          </div>

          {/* Language */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('settingsLanguageLabel')}</p>
            <div className="grid grid-cols-5 gap-1.5">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  className={`rounded-xl py-2 text-xs font-bold transition-colors ${
                    language === l.code
                      ? 'bg-[#1C2B6B] text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {l.code.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400">
              {LANGUAGES.find((l) => l.code === language)?.label}
            </p>
          </div>
        </div>
      </div>

      {acronymFlow === 'step1' && (
        <AcronymStep1
          initial={acronym}
          onNext={onStep1Next}
          onCancel={() => setAcronymFlow('idle')}
        />
      )}
      {acronymFlow === 'step2' && (
        <AcronymStep2
          firstValue={step1Value}
          onConfirm={onStep2Confirm}
          onBack={() => setAcronymFlow('step1')}
        />
      )}
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function PhotographerHome({ onExit }) {
  const goToTactics = usePhotographerStore((s) => s.goToTactics);
  const acronym = usePhotographerStore((s) => s.acronym);
  const [showSettings, setShowSettings] = useState(false);
  const { t } = usePhTranslation();
  const [acronymFlow, setAcronymFlow] = useState('idle');
  const [step1Value, setStep1Value] = useState('');
  const setAcronym = usePhotographerStore((s) => s.setAcronym);

  useEffect(() => {
    setAcronymFlow(acronym?.trim() ? 'idle' : 'step1');
  }, [acronym]);

  function handleTile(tile) {
    if (tile.id === 'tactics') {
      goToTactics();
    } else if (tile.href) {
      window.open(tile.href, '_blank', 'noopener,noreferrer');
    }
  }

  function onStep1Next(val) {
    setStep1Value(val);
    setAcronymFlow('step2');
  }

  function onStep2Confirm(val) {
    setAcronym(val);
    setAcronymFlow('idle');
  }

  return (
    <div className="flex h-full flex-col bg-[#f4f5f8]">
      {/* Header */}
      <header className="bg-[#cc1336]">
        <div className="safe-top" />
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {t('homeEndModule')}
          </button>
          <span className="text-xs font-bold text-white/60">Photographer</span>
          <div className="w-24" />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <h1 className="mb-1 text-xl font-black text-[#1C2B6B]">Home</h1>
        {acronym ? (
          <p className="mb-6 text-sm text-gray-400">
            {t('homeGreeting').replace('{name}', acronym)}
          </p>
        ) : (
          <p className="mb-6 text-sm text-gray-400">{t('homeSubtitle')}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {TILE_DEFS.map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => handleTile(tile)}
              className="flex flex-col items-start gap-3 rounded-2xl bg-white p-5 text-left shadow-sm border border-gray-100 transition-all active:scale-[0.97] hover:shadow-md"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: tile.color + '18', color: tile.color }}
              >
                {tile.icon}
              </span>
              <div>
                <div className="text-sm font-bold text-gray-800 leading-tight">{TILE_LABELS[tile.id]}</div>
                <div className="mt-0.5 text-[11px] text-gray-400 leading-snug">{t(tile.subKey)}</div>
              </div>
              {tile.href && (
                <span className="mt-auto text-[10px] font-semibold" style={{ color: tile.color }}>
                  {t('homeExternalBadge')}
                </span>
              )}
            </button>
          ))}
        </div>
      </main>

      {/* Settings button */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-400">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          {t('settingsTitle')}
          {!acronym && (
            <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
              {t('homeAcronymMissing')}
            </span>
          )}
        </button>
      </div>

      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}

      {/* Acronym flow on first visit */}
      {acronymFlow === 'step1' && (
        <AcronymStep1
          initial=""
          onNext={onStep1Next}
          onCancel={() => setAcronymFlow('idle')}
        />
      )}
      {acronymFlow === 'step2' && (
        <AcronymStep2
          firstValue={step1Value}
          onConfirm={onStep2Confirm}
          onBack={() => setAcronymFlow('step1')}
        />
      )}
    </div>
  );
}
