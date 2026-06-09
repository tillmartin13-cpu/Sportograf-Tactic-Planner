import { useRef, useState } from 'react';
import { usePhotographerStore } from '../../store/usePhotographerStore';
import { usePhTranslation } from '../../i18n/usePhTranslation';

/** Inline prompt shown when no acronym is set yet — blocks JSON upload */
function AcronymGate({ onSaved }) {
  const { t } = usePhTranslation();
  const setAcronym = usePhotographerStore((s) => s.setAcronym);
  const [draft, setDraft] = useState('');
  const [touched, setTouched] = useState(false);
  const valid = draft.trim().length >= 2;

  function handleSave() {
    if (!valid) { setTouched(true); return; }
    setAcronym(draft.trim());
    onSaved?.();
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🪪</span>
        <div>
          <p className="font-bold text-amber-900 text-sm">{t('acronymGateTitle')}</p>
          <p className="text-xs text-amber-700 mt-0.5">{t('acronymGateBody')}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => { setDraft(e.target.value.toUpperCase()); setTouched(false); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder={t('settingsAcronymPlaceholder')}
          maxLength={6}
          className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-400 ${
            touched && !valid ? 'border-red-400 bg-red-50' : 'border-amber-300 bg-white'
          }`}
        />
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-[#1C2B6B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#16225a] active:scale-95 transition-transform"
        >
          {t('acronymGateSave')}
        </button>
      </div>
      {touched && !valid && (
        <p className="mt-1.5 text-xs text-red-600">{t('acronymGateError')}</p>
      )}
      <p className="mt-2 text-xs text-amber-600">{t('acronymGateHint')}</p>
    </div>
  );
}

function eventTypeIcon(pkg) {
  const name = (pkg?.event?.name || '').toLowerCase();
  if (name.includes('hyrox')) return '🏋️';
  return '🏁';
}

function TacticCard({ entry, onOpen, onDelete }) {
  const { t } = usePhTranslation();
  const { pkg } = entry;
  const event = pkg?.event;
  const acronym = usePhotographerStore((s) => s.acronym);
  const checkIn = usePhotographerStore((s) => s.checkIns[entry.id]);
  const isComplete = !!checkIn?.completedAt;

  // Compute my spots locally — never call store functions as selectors (returns new array = infinite loop)
  const spots = pkg?.tactic?.spots ?? [];
  const photographers = pkg?.photographers ?? [];
  const assignments = pkg?.tactic?.assignments ?? [];
  const ph = photographers.find(
    (p) => p.code === acronym || p.code === acronym?.replace(/\d+$/, ''),
  );
  const mySpotIds = ph
    ? new Set(assignments.filter((a) => a.photographer_id === ph.id).map((a) => a.spot_id))
    : null;
  const mySpots = mySpotIds
    ? spots.filter(
        (s) =>
          mySpotIds.has(s.id) ||
          (acronym && s.name?.toUpperCase().startsWith(acronym.toUpperCase())),
      )
    : spots;

  const date = event?.date
    ? new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
    : null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none">{eventTypeIcon(pkg)}</span>
          <div>
            <div className="font-bold text-[#1C2B6B] leading-tight">{event?.name || `Event ${event?.id}`}</div>
            {date && <div className="text-xs text-gray-400 mt-0.5">{date}</div>}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDelete(entry.id)}
          className="shrink-0 rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
          aria-label="Delete"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </button>
      </div>

      {mySpots.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {mySpots.slice(0, 4).map((s) => (
            <span key={s.id} className="rounded-full bg-[#f0f2fa] px-2 py-0.5 text-[11px] font-semibold text-[#1C2B6B]">
              {s.name}
            </span>
          ))}
          {mySpots.length > 4 && (
            <span className="rounded-full bg-[#f0f2fa] px-2 py-0.5 text-[11px] text-gray-400">
              +{mySpots.length - 4}
            </span>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        {isComplete ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
            <span>✅</span> {t('tacticManagerCheckInDone')}
          </span>
        ) : (
          <span className="text-xs text-gray-400">{t('tacticManagerCheckInPending')}</span>
        )}
        <button
          type="button"
          onClick={() => onOpen(entry.id)}
          className="rounded-xl bg-[#1C2B6B] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#16225a] transition-colors"
        >
          {t('tacticManagerOpen')}
        </button>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ onConfirm, onCancel }) {
  const { t } = usePhTranslation();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="font-bold text-gray-900">{t('tacticManagerDeleteTitle')}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('tacticManagerDeleteBody')}</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600"
          >
            {t('tacticManagerCancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600"
          >
            {t('tacticManagerDeleteConfirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TacticManager() {
  const { t } = usePhTranslation();
  const tactics = usePhotographerStore((s) => s.tactics);
  const importTacticJson = usePhotographerStore((s) => s.importTacticJson);
  const deleteTactic = usePhotographerStore((s) => s.deleteTactic);
  const openTactic = usePhotographerStore((s) => s.openTactic);
  const acronym = usePhotographerStore((s) => s.acronym);
  const hasAcronym = acronym && acronym.trim().length >= 2;

  const fileRef = useRef(null);
  const [deleteId, setDeleteId] = useState(null);
  const [importError, setImportError] = useState(null);

  const sorted = [...tactics].sort((a, b) => {
    const da = a.pkg?.event?.date ?? a.importedAt;
    const db = b.pkg?.event?.date ?? b.importedAt;
    return new Date(da) - new Date(db);
  });

  async function handleFile(file) {
    if (!file) return;
    setImportError(null);
    const text = await file.text();
    const result = importTacticJson(text);
    if (result?.error) setImportError(result.error);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {sorted.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <div className="text-4xl mb-2">📋</div>
          <p className="font-semibold text-gray-600 text-sm">{t('tacticManagerEmpty')}</p>
          <p className="text-xs text-gray-400 mt-1">{t('tacticManagerEmptyHint')}</p>
        </div>
      )}

      {sorted.map((entry) => (
        <TacticCard
          key={entry.id}
          entry={entry}
          onOpen={openTactic}
          onDelete={setDeleteId}
        />
      ))}

      {importError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {importError}
        </div>
      )}

      {hasAcronym ? (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#1C2B6B]/30 bg-[#f8f9ff] py-4 text-sm font-bold text-[#1C2B6B] hover:border-[#1C2B6B]/60 hover:bg-[#f0f2fa] transition-colors"
          >
            {t('tacticManagerLoad')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
          />
        </>
      ) : (
        <AcronymGate />
      )}

      {deleteId && (
        <DeleteConfirmModal
          onConfirm={() => { deleteTactic(deleteId); setDeleteId(null); }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
