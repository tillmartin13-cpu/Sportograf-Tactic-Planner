import { useRef, useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { useCurrentEvent } from '../hooks/useCurrentEvent';
import { useTactic } from '../hooks/useTactic';
import { LsIcon } from './LsIcon';
import { useTranslation } from '../i18n/useTranslation';

// ─── Edit photographer modal ──────────────────────────────────────────────────

function EditPhotographerModal({ photographer, assignmentCount, onClose }) {
  const replacePhotographer = usePlannerStore((s) => s.replacePhotographer);
  const deletePhotographer = usePlannerStore((s) => s.deletePhotographer);
  const { t } = useTranslation();

  const [view, setView] = useState('menu'); // 'menu' | 'replace' | 'confirmDelete'
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  function handleReplace() {
    if (!newCode.trim()) { setError(t('teamAcronymRequired')); return; }
    replacePhotographer(photographer.id, { code: newCode, firstName: newName });
    onClose();
  }

  function handleDelete() {
    deletePhotographer(photographer.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[900] flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-2xl">

        {/* ── Menu ── */}
        {view === 'menu' && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#1C2B6B]">{photographer.code}</h3>
                {photographer.firstName && (
                  <p className="text-xs text-gray-400">{photographer.firstName} {photographer.lastName || ''}</p>
                )}
              </div>
              <button type="button" onClick={onClose} className="text-xl leading-none text-gray-300 hover:text-gray-500">×</button>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setView('replace')}
                className="flex items-center gap-3 rounded-xl border border-[#e3e7f2] bg-[#f8f9ff] px-4 py-3.5 text-left hover:bg-[#eef1fb] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#1C2B6B" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0">
                  <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                  <path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
                <div>
                  <div className="text-sm font-bold text-[#1C2B6B]">{t('teamEditReplaceLabel')}</div>
                  <div className="text-[11px] text-gray-400">
                    {t('teamEditReplaceSubLabel').replace('{count}', assignmentCount)}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setView('confirmDelete')}
                className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3.5 text-left hover:bg-red-100 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#cc1336" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
                <div>
                  <div className="text-sm font-bold text-[#cc1336]">{t('teamEditDeleteLabel')}</div>
                  <div className="text-[11px] text-gray-400">
                    {t('teamEditDeleteSubLabel')}
                  </div>
                </div>
              </button>
            </div>
          </>
        )}

        {/* ── Replace ── */}
        {view === 'replace' && (
          <>
            <div className="mb-5 flex items-center gap-3">
              <button type="button" onClick={() => setView('menu')} className="text-gray-300 hover:text-gray-500">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <h3 className="text-base font-black text-[#1C2B6B]">{t('teamReplaceTitle')}</h3>
            </div>
            <p className="mb-4 text-xs text-gray-400 leading-snug">
              {t('teamReplaceExplain').replace('{code}', photographer.code).replace('{count}', assignmentCount)}
            </p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {t('teamNewAcronymLabel')} <span className="text-[#cc1336]">*</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  value={newCode}
                  onChange={(e) => { setNewCode(e.target.value.toUpperCase()); setError(''); }}
                  maxLength={8}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold uppercase tracking-widest text-[#1C2B6B] focus:outline-none focus:ring-2 focus:ring-[#1C2B6B]/20"
                />
                {error && <p className="mt-1 text-xs font-semibold text-[#cc1336]">{error}</p>}
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {t('teamNewNameLabel')}
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1C2B6B]/20"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setView('menu')} className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-400 hover:bg-gray-50">
                {t('teamBackBtn')}
              </button>
              <button type="button" onClick={handleReplace} className="flex-1 rounded-xl bg-[#1C2B6B] py-3 text-sm font-bold text-white hover:bg-[#16255e] transition-colors">
                {t('teamReplaceBtn')}
              </button>
            </div>
          </>
        )}

        {/* ── Confirm delete ── */}
        {view === 'confirmDelete' && (
          <>
            <div className="mb-5 flex items-center gap-3">
              <button type="button" onClick={() => setView('menu')} className="text-gray-300 hover:text-gray-500">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <h3 className="text-base font-black text-[#cc1336]">{t('teamDeleteTitle')}</h3>
            </div>

            <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-4">
              <p className="text-sm font-bold text-[#cc1336]">{t('teamDeleteConfirm').replace('{code}', photographer.code)}</p>
              <p className="mt-1 text-xs text-gray-500 leading-snug">
                {assignmentCount > 0
                  ? t('teamDeleteWithSpots').replace('{count}', assignmentCount)
                  : t('teamDeleteNoSpots')}
              </p>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setView('menu')} className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-400 hover:bg-gray-50">
                {t('teamCancelBtn')}
              </button>
              <button type="button" onClick={handleDelete} className="flex-1 rounded-xl bg-[#cc1336] py-3 text-sm font-bold text-white hover:bg-[#b01030] transition-colors">
                {t('teamDeleteBtn')}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

// ─── Manual add modal ─────────────────────────────────────────────────────────

function AddManuallyModal({ onClose }) {
  const addPhotographerManually = usePlannerStore((s) => s.addPhotographerManually);
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [cameras, setCameras] = useState('');
  const [added, setAdded] = useState([]);
  const [error, setError] = useState('');

  function handleAdd() {
    if (!code.trim()) { setError(t('teamAcronymRequired')); return; }
    const ok = addPhotographerManually({ code, firstName, cameras });
    if (ok) {
      setAdded((prev) => [...prev, code.trim().toUpperCase()]);
      setCode('');
      setFirstName('');
      setCameras('');
      setError('');
    }
  }

  return (
    <div className="fixed inset-0 z-[900] flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-2xl">

        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-black text-[#1C2B6B]">{t('teamAddTitle')}</h3>
          <button type="button" onClick={onClose} className="text-xl leading-none text-gray-300 hover:text-gray-500">×</button>
        </div>

        {added.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {added.map((c) => (
              <span key={c} className="rounded-full bg-[#eef1fb] px-2.5 py-1 text-xs font-bold text-[#1C2B6B]">
                ✓ {c}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {/* Acronym — required */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {t('acronym')} <span className="text-[#cc1336]">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
              maxLength={8}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold uppercase tracking-widest text-[#1C2B6B] focus:outline-none focus:ring-2 focus:ring-[#1C2B6B]/20"
            />
            {error && <p className="mt-1 text-xs font-semibold text-[#cc1336]">{error}</p>}
          </div>

          {/* Name — optional */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {t('teamNameLabel')} <span className="text-gray-300">({t('optional')})</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={t('teamNameLabel')}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1C2B6B]/20"
            />
          </div>

          {/* Equipment — optional */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {t('teamEquipmentLabel')} <span className="text-gray-300">({t('optional')})</span>
            </label>
            <input
              type="text"
              value={cameras}
              onChange={(e) => setCameras(e.target.value)}
              placeholder={t('teamEquipmentLabel')}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1C2B6B]/20"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 rounded-xl bg-[#1C2B6B] py-3 text-sm font-bold text-white hover:bg-[#16255e] transition-colors"
          >
            {t('teamAddBtn')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-400 hover:bg-gray-50"
          >
            {t('teamDoneBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function PhotographersPanel() {
  const allPhotographers = usePlannerStore((s) => s.photographers) || [];
  const importTeamCsv = usePlannerStore((s) => s.importTeamCsv);
  const event = useCurrentEvent();
  const tactic = useTactic(event?.id);
  const csvRef = useRef(null);
  const [showManual, setShowManual] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const { t } = useTranslation();

  const photographers = event
    ? allPhotographers.filter((p) =>
        p.eventIds ? p.eventIds.includes(event.id) : p.eventId === event.id,
      )
    : [];

  if (!event) {
    return (
      <div className="rounded-xl border border-dashed border-[#d5daea] bg-white p-4 text-sm text-[#8a93b0]">
        Import a team CSV to see photographers here.
      </div>
    );
  }

  const assignmentCount = (photographerId) =>
    tactic.assignments.filter((a) => a.photographer_id === photographerId).length;

  const spotBadgeClass = (count) => {
    if (count === 1) return 'bg-[#dcfce7] text-[#166534]';
    if (count >= 2) return 'bg-[#fef3c7] text-[#92400e]';
    return 'bg-[#f0f4ff] text-[#5b6aa8]';
  };

  const spotBadgeLabel = (count) => (count === 1 ? '1 Spot' : `${count} Spots`);

  return (
    <>
      <input
        ref={csvRef}
        type="file"
        accept=".csv,.txt"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          await importTeamCsv(await file.text());
          e.target.value = '';
        }}
      />

      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-[#e3e7f2] bg-white">
        <div className="shrink-0 border-b border-[#eef0f6] px-4 py-3">
          <h2 className="text-sm font-extrabold text-[#1C2B6B]">Team</h2>
          <p className="text-xs text-[#8a93b0]">Drag onto a spot to assign</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {photographers.length === 0 ? (
            <div className="flex flex-col gap-2 px-2 py-4">
              <p className="mb-1 text-xs text-[#9aa3bf]">{t('teamNoTeamHint')}</p>
              <button
                type="button"
                onClick={() => csvRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-[#e3e7f2] bg-[#f8f9ff] px-3 py-2.5 text-sm font-semibold text-[#1C2B6B] hover:bg-[#eef1fb] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                {t('teamImportCsv')}
              </button>
              <button
                type="button"
                onClick={() => setShowManual(true)}
                className="flex items-center gap-2 rounded-xl border border-[#e3e7f2] bg-white px-3 py-2.5 text-sm font-semibold text-[#1C2B6B] hover:bg-[#f8f9ff] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                {t('teamAddManually')}
              </button>
            </div>
          ) : (
            <>
              {photographers.map((ph) => {
                const count = assignmentCount(ph.id);
                return (
                  <div
                    key={ph.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify(ph));
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="mb-1 cursor-grab rounded-lg border border-[#e8ebf4] bg-[#fafbff] px-3 py-2 active:cursor-grabbing"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-sm font-extrabold text-[#1C2B6B]">
                        {ph.code}
                        {ph.hasLs && <LsIcon size={14} className="text-[#5b6aa8] shrink-0" />}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${spotBadgeClass(count)}`}>
                          {count === 0 ? '0 Spots' : spotBadgeLabel(count)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setEditTarget(ph); }}
                          className="rounded-md px-1.5 py-0.5 text-[10px] font-bold text-[#9aa3bf] hover:bg-[#eef1fb] hover:text-[#1C2B6B] transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                    {(ph.firstName || ph.lastName) && (
                      <div className="text-xs text-[#7b849f]">
                        {[ph.firstName, ph.lastName].filter(Boolean).join(' ')}
                      </div>
                    )}
                    {ph.dispatch && (
                      <div className="mt-0.5 text-[10px] font-semibold text-[#a8b0c8]">{ph.dispatch}</div>
                    )}
                    {ph.cameras && (
                      <div className="mt-1 text-[10px] leading-snug text-[#9aa3bf]">
                        <span className="font-bold text-[#b0b8cf]">Cam: </span>{ph.cameras}
                      </div>
                    )}
                    {ph.lenses && (
                      <div className="mt-0.5 text-[10px] leading-snug text-[#9aa3bf]">
                        <span className="font-bold text-[#b0b8cf]">Lens: </span>{ph.lenses}
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Add more button when team already has members */}
              <button
                type="button"
                onClick={() => setShowManual(true)}
                className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#d5daea] py-2 text-xs font-semibold text-[#9aa3bf] hover:border-[#1C2B6B]/30 hover:text-[#1C2B6B] transition-colors"
              >
                {t('teamAddMore')}
              </button>
            </>
          )}
        </div>
      </div>

      {showManual && <AddManuallyModal onClose={() => setShowManual(false)} />}
      {editTarget && (
        <EditPhotographerModal
          photographer={editTarget}
          assignmentCount={assignmentCount(editTarget.id)}
          onClose={() => setEditTarget(null)}
        />
      )}
    </>
  );
}
