import { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePlannerStore } from '../store/usePlannerStore';

export function CsvDiffModal() {
  const csvDiff = usePlannerStore((s) => s.csvDiff);
  const commitCsvImport = usePlannerStore((s) => s.commitCsvImport);
  const dismissCsvDiff = usePlannerStore((s) => s.dismissCsvDiff);

  const [resolutions, setResolutions] = useState({});

  if (!csvDiff) return null;

  const { added, removed, pending } = csvDiff;
  const { targetEventId } = pending;

  // Photographers available to reassign to — from the merged list (includes newly added), minus those being removed
  const removedIds = new Set(removed.map((p) => p.id));
  const reassignablePhotographers = (pending.merged || []).filter(
    (p) => (p.eventIds || []).includes(targetEventId) && !removedIds.has(p.id),
  );

  const setResolution = (photographerId, action, assignToId = null) => {
    setResolutions((prev) => ({ ...prev, [photographerId]: { photographerId, action, assignToId } }));
  };

  const allResolved = removed.every((p) => resolutions[p.id]);

  const handleConfirm = () => {
    commitCsvImport(Object.values(resolutions));
  };

  const onlyAdded = removed.length === 0 && added.length > 0;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[var(--sg-surface)] border border-[var(--sg-border)] rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-[var(--sg-border)]">
          <h2 className="text-base font-semibold text-[var(--sg-text)]">Team CSV Updated</h2>
          <p className="text-xs text-[var(--sg-muted)] mt-0.5">Changes detected compared to current team</p>
        </div>

        <div className="p-5 space-y-5">
          {/* Added photographers */}
          {added.length > 0 && (
            <div>
              <p className="text-xs font-medium text-green-500 uppercase tracking-wide mb-2">
                Added ({added.length})
              </p>
              <ul className="space-y-1">
                {added.map((p) => (
                  <li key={p.id || p.code} className="text-sm text-[var(--sg-text)] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    <span className="font-medium">{p.code}</span>
                    {(p.firstName || p.lastName) && (
                      <span className="text-[var(--sg-muted)]">{[p.firstName, p.lastName].filter(Boolean).join(' ')}</span>
                    )}
                  </li>
                ))}
              </ul>
              {removed.length === 0 && (
                <p className="text-xs text-[var(--sg-muted)] mt-2">No action needed — new photographers will be added.</p>
              )}
            </div>
          )}

          {/* Removed photographers */}
          {removed.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-400 uppercase tracking-wide mb-2">
                No longer in team ({removed.length})
              </p>
              <div className="space-y-4">
                {removed.map((ph) => {
                  const res = resolutions[ph.id];
                  return (
                    <div key={ph.id} className="rounded-lg border border-[var(--sg-border)] p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                        <span className="text-sm font-medium text-[var(--sg-text)]">{ph.code}</span>
                        {(ph.firstName || ph.lastName) && (
                          <span className="text-xs text-[var(--sg-muted)]">
                            {[ph.firstName, ph.lastName].filter(Boolean).join(' ')}
                          </span>
                        )}
                        {ph.spots.length > 0 && (
                          <span className="ml-auto text-xs text-[var(--sg-muted)]">
                            {ph.spots.length} spot{ph.spots.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {ph.spots.length > 0 && (
                        <div className="text-xs text-[var(--sg-muted)] pl-4">
                          {ph.spots.map((s) => s.label || s.id).join(', ')}
                        </div>
                      )}

                      <div className="pl-4 space-y-1.5">
                        <p className="text-xs text-[var(--sg-muted)]">
                          {ph.spots.length > 0 ? 'What to do with their spots?' : 'Remove from team?'}
                        </p>

                        {ph.spots.length > 0 ? (
                          <>
                            <label className="flex items-center gap-2 text-xs text-[var(--sg-text)] cursor-pointer">
                              <input
                                type="radio"
                                name={`res-${ph.id}`}
                                checked={res?.action === 'keep'}
                                onChange={() => setResolution(ph.id, 'keep')}
                                className="accent-[var(--sg-accent)]"
                              />
                              Keep spots unassigned
                            </label>
                            <label className="flex items-center gap-2 text-xs text-[var(--sg-text)] cursor-pointer">
                              <input
                                type="radio"
                                name={`res-${ph.id}`}
                                checked={res?.action === 'delete'}
                                onChange={() => setResolution(ph.id, 'delete')}
                                className="accent-[var(--sg-accent)]"
                              />
                              Delete spots
                            </label>
                            {reassignablePhotographers.length > 0 && (
                              <div className="space-y-1">
                                <label className="flex items-center gap-2 text-xs text-[var(--sg-text)] cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`res-${ph.id}`}
                                    checked={res?.action === 'assign'}
                                    onChange={() =>
                                      setResolution(ph.id, 'assign', reassignablePhotographers[0]?.id)
                                    }
                                    className="accent-[var(--sg-accent)]"
                                  />
                                  Reassign to…
                                </label>
                                {res?.action === 'assign' && (
                                  <select
                                    value={res.assignToId || ''}
                                    onChange={(e) => setResolution(ph.id, 'assign', e.target.value)}
                                    className="ml-5 text-xs rounded border border-[var(--sg-border)] bg-[var(--sg-bg)] text-[var(--sg-text)] px-2 py-1"
                                  >
                                    {reassignablePhotographers.map((rp) => (
                                      <option key={rp.id || rp.code} value={rp.id || rp.code}>
                                        {rp.code}
                                        {rp.firstName ? ` — ${rp.firstName}` : ''}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <label className="flex items-center gap-2 text-xs text-[var(--sg-text)] cursor-pointer">
                            <input
                              type="radio"
                              name={`res-${ph.id}`}
                              checked={res?.action === 'keep'}
                              onChange={() => setResolution(ph.id, 'keep')}
                              className="accent-[var(--sg-accent)]"
                            />
                            Acknowledge &amp; continue
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-[var(--sg-border)] flex gap-2 justify-end">
          <button
            onClick={dismissCsvDiff}
            className="px-3 py-1.5 text-xs rounded border border-[var(--sg-border)] text-[var(--sg-muted)] hover:text-[var(--sg-text)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!allResolved && removed.length > 0}
            className="px-4 py-1.5 text-xs rounded bg-[var(--sg-accent)] text-white font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {onlyAdded ? 'Add to team' : 'Apply changes'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
