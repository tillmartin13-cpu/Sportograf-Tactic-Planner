import { useRef, useState } from 'react';
import { usePhotographerStore } from '../../store/usePhotographerStore';

function eventTypeIcon(pkg) {
  const name = (pkg?.event?.name || '').toLowerCase();
  if (name.includes('hyrox')) return '🏋️';
  return '🏁';
}

function TacticCard({ entry, onOpen, onDelete }) {
  const { pkg } = entry;
  const event = pkg?.event;
  const acronym = usePhotographerStore((s) => s.acronym);
  const checkIn = usePhotographerStore((s) => s.checkIns[entry.id]);
  const isComplete = !!checkIn?.completedAt;

  // Compute my spots locally — never call store functions as selectors (returns new array = infinite loop)
  const spots = pkg?.tactic?.spots ?? [];
  const photographers = pkg?.photographers ?? [];
  const assignments = pkg?.assignments ?? [];
  const ph = photographers.find(
    (p) => p.code === acronym || p.code === acronym?.replace(/\d+$/, ''),
  );
  const mySpotIds = ph
    ? new Set(assignments.filter((a) => a.photographer_id === ph.id).map((a) => a.spot_id))
    : null;
  const mySpots = mySpotIds ? spots.filter((s) => mySpotIds.has(s.id)) : spots;

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
            <span>✅</span> Check-in done
          </span>
        ) : (
          <span className="text-xs text-gray-400">Check-in pending</span>
        )}
        <button
          type="button"
          onClick={() => onOpen(entry.id)}
          className="rounded-xl bg-[#1C2B6B] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#16225a] transition-colors"
        >
          Open
        </button>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="font-bold text-gray-900">Delete tactic?</h3>
        <p className="mt-1 text-sm text-gray-500">
          This cannot be undone. The tactic file will be removed from your device.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function TacticManager() {
  const tactics = usePhotographerStore((s) => s.tactics);
  const importTacticJson = usePhotographerStore((s) => s.importTacticJson);
  const deleteTactic = usePhotographerStore((s) => s.deleteTactic);
  const openTactic = usePhotographerStore((s) => s.openTactic);

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
          <p className="font-semibold text-gray-600 text-sm">No tactics loaded yet</p>
          <p className="text-xs text-gray-400 mt-1">Ask your team lead for the tactic JSON file</p>
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

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#1C2B6B]/30 bg-[#f8f9ff] py-4 text-sm font-bold text-[#1C2B6B] hover:border-[#1C2B6B]/60 hover:bg-[#f0f2fa] transition-colors"
      >
        <span className="text-lg">+</span> Load new tactic (JSON)
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
      />

      {deleteId && (
        <DeleteConfirmModal
          onConfirm={() => { deleteTactic(deleteId); setDeleteId(null); }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
