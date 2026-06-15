import { useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { useCurrentEvent } from '../hooks/useCurrentEvent';
import { HYROX_STATIONS, defaultShifts, shiftLabel, isOldDefaultWaves } from '../lib/hyrox';
import { getStationImages } from '../lib/hyroxStationImages';

// ─── Constants ───────────────────────────────────────────────────────────────

const LATE_STATION_IDS = new Set(['wallball', 'finish', 'sandbag']);

// ─── Data migration: flat → multi-day ────────────────────────────────────────

function defaultDay(id) {
  return { id: String(id), waves: defaultShifts(), assignments: {}, waveTimes: {}, cellTimes: {} };
}

function migrateHyrox(hyrox, activeStationIds) {
  const stations = activeStationIds || HYROX_STATIONS.map((s) => s.id);
  if (!hyrox) return { stations, days: [defaultDay(1)] };
  if (Array.isArray(hyrox.days) && hyrox.days.length) return hyrox;
  // Migrate old flat structure to day 1; reset old A/B/C/D default to 1/2
  const oldWaves = hyrox.waves;
  const waves = (!oldWaves?.length || isOldDefaultWaves(oldWaves)) ? defaultShifts() : oldWaves;
  return {
    stations: hyrox.stations || stations,
    days: [{
      id: '1',
      waves,
      assignments: hyrox.assignments || {},
      waveTimes: hyrox.waveTimes || {},
      cellTimes: hyrox.cellTimes || {},
    }],
  };
}

// ─── Rotation algorithm ───────────────────────────────────────────────────────

function suggestRotation(prevDay, photographers, activeStationIds) {
  const orderedStations = HYROX_STATIONS.filter((s) => activeStationIds.includes(s.id));
  const earlyStations = orderedStations.filter((s) => !LATE_STATION_IDS.has(s.id));
  const shifts = prevDay.waves?.length ? prevDay.waves : defaultShifts();

  // Build ph → Set<stationId> from yesterday
  const phPrev = {};
  Object.entries(prevDay.assignments || {}).forEach(([key, phIds]) => {
    const stationId = key.split('__')[0];
    (phIds || []).forEach((id) => {
      phPrev[id] = phPrev[id] || new Set();
      phPrev[id].add(stationId);
    });
  });

  // Sort: photographers who had late stations yesterday go first → get early today
  const sorted = [...photographers].sort((a, b) => {
    const aLate = [...(phPrev[a.id] || [])].some((s) => LATE_STATION_IDS.has(s));
    const bLate = [...(phPrev[b.id] || [])].some((s) => LATE_STATION_IDS.has(s));
    return (bLate ? 1 : 0) - (aLate ? 1 : 0);
  });

  const newAssignments = {};
  const usedPerShift = {};
  shifts.forEach((s) => { usedPerShift[s] = new Set(); });

  sorted.forEach((ph) => {
    const prev = phPrev[ph.id] || new Set();
    const hadLate = [...prev].some((s) => LATE_STATION_IDS.has(s));
    const preferredPool = hadLate ? earlyStations : orderedStations;

    shifts.forEach((shift, idx) => {
      const used = usedPerShift[shift];

      let candidates = preferredPool.filter((s) => !prev.has(s.id) && !used.has(s.id));
      if (!candidates.length) candidates = preferredPool.filter((s) => !used.has(s.id));
      if (!candidates.length) candidates = orderedStations.filter((s) => !used.has(s.id));
      if (!candidates.length) return;

      // Shift 2 without late-yesterday constraint → prefer later stations
      const chosen = (idx > 0 && !hadLate) ? candidates[candidates.length - 1] : candidates[0];
      const key = `${chosen.id}__${shift}`;
      newAssignments[key] = [...(newAssignments[key] || []), ph.id];
      used.add(chosen.id);
    });
  });

  return newAssignments;
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({ src, onClose }) {
  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/80" onClick={onClose}>
      <img src={src} alt="" className="max-h-[90dvh] max-w-[90vw] rounded-xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
      <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 text-sm font-bold text-white hover:bg-white/40">✕</button>
    </div>
  );
}

// ─── Station image thumbnails ─────────────────────────────────────────────────

function StationImages({ stationId }) {
  const [lightbox, setLightbox] = useState(null);
  const images = getStationImages(stationId);
  if (!images.length) return null;
  return (
    <>
      <div className="mt-1 flex flex-wrap gap-1">
        {images.map((src) => (
          <button key={src} type="button" onClick={() => setLightbox(src)}
            className="h-10 w-10 overflow-hidden rounded-md border border-gray-200 bg-gray-100 hover:border-[#1C2B6B] transition-colors">
            <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cellKey(stationId, shift) {
  return `${stationId}__${shift}`;
}

// ─── Matrix cell ─────────────────────────────────────────────────────────────

function MatrixCell({ stationId, shift, assigned, photographers, times, onDrop, onRemove, onTimeChange }) {
  const [over, setOver] = useState(false);
  const [showTimes, setShowTimes] = useState(false);

  const phs = assigned.map((id) => photographers.find((p) => p.id === id)).filter(Boolean);
  const from = times?.from || '';
  const to = times?.to || '';
  const hasTimes = from || to;

  return (
    <td
      className={`border border-gray-200 p-1 align-top transition-colors min-w-[80px] ${over ? 'bg-blue-50' : 'bg-white'}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); const id = e.dataTransfer.getData('ph_id'); if (id) onDrop(stationId, shift, id); }}
    >
      <div className="flex flex-wrap gap-1">
        {phs.map((ph) => (
          <div key={ph.id} className="group relative">
            <span className="flex items-center gap-0.5 rounded-full bg-[#1C2B6B] px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
              {ph.code}
              <button type="button" onClick={() => onRemove(stationId, shift, ph.id)} className="ml-0.5 opacity-60 hover:opacity-100 leading-none">×</button>
            </span>
          </div>
        ))}
      </div>
      {hasTimes && !showTimes && (
        <button type="button" onClick={() => setShowTimes(true)} className="mt-1 block text-[9px] text-[#6b7db3] hover:underline leading-tight">
          {from || '–'} – {to || '–'}
        </button>
      )}
      {showTimes ? (
        <div className="mt-1 flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
          <input type="time" value={from} onChange={(e) => onTimeChange(stationId, shift, 'from', e.target.value)}
            className="w-full rounded border border-[#d5daea] px-1 py-0.5 text-[9px] outline-none focus:border-[#1C2B6B]" />
          <input type="time" value={to} onChange={(e) => onTimeChange(stationId, shift, 'to', e.target.value)}
            className="w-full rounded border border-[#d5daea] px-1 py-0.5 text-[9px] outline-none focus:border-[#1C2B6B]" />
          <button type="button" onClick={() => setShowTimes(false)} className="text-[9px] font-bold text-[#1C2B6B] hover:underline text-left">Fertig</button>
        </div>
      ) : (
        !hasTimes && (
          <button type="button" onClick={() => setShowTimes(true)} className="mt-1 block text-[9px] text-gray-300 hover:text-[#6b7db3] leading-tight">
            + Zeit
          </button>
        )
      )}
    </td>
  );
}

// ─── Shift header ─────────────────────────────────────────────────────────────

function ShiftHeader({ shift, times, language, onDelete, onTimeChange }) {
  const [open, setOpen] = useState(false);
  const from = times?.from || '';
  const to = times?.to || '';

  return (
    <th className="border border-gray-200 bg-[#f0f2fa] px-2 py-1.5 text-center text-xs font-extrabold text-[#1C2B6B] min-w-[110px]">
      <div className="flex items-center justify-center gap-1">
        <button type="button" onClick={() => setOpen((v) => !v)} className="font-extrabold text-[#1C2B6B] hover:underline" title="Uhrzeit setzen">
          {shiftLabel(shift, language)}
        </button>
        <button type="button" onClick={() => onDelete(shift)} className="text-gray-300 hover:text-red-400 leading-none text-[10px]" title={language === 'de' ? 'Schicht entfernen' : 'Remove shift'}>×</button>
      </div>
      {(from || to) && !open && (
        <div className="mt-0.5 text-[9px] font-normal text-[#6b7db3]">{from || '–'} – {to || '–'}</div>
      )}
      {open && (
        <div className="mt-1.5 flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
          <input type="time" value={from} onChange={(e) => onTimeChange(shift, 'from', e.target.value)}
            className="w-full rounded border border-[#d5daea] px-1 py-0.5 text-[10px] font-normal text-gray-700 outline-none focus:border-[#1C2B6B]" />
          <input type="time" value={to} onChange={(e) => onTimeChange(shift, 'to', e.target.value)}
            className="w-full rounded border border-[#d5daea] px-1 py-0.5 text-[10px] font-normal text-gray-700 outline-none focus:border-[#1C2B6B]" />
          <button type="button" onClick={() => setOpen(false)} className="text-[9px] font-bold text-[#1C2B6B] hover:underline">Fertig</button>
        </div>
      )}
    </th>
  );
}

// ─── Main Hyrox Planner ───────────────────────────────────────────────────────

export function HyroxPlanner() {
  const event = useCurrentEvent();
  const language = usePlannerStore((s) => s.language);
  const allPhotographers = usePlannerStore((s) => s.photographers) || [];
  const photographers = event
    ? allPhotographers.filter((p) => p.eventIds ? p.eventIds.includes(event.id) : p.eventId === event.id)
    : [];
  const updateEvent = usePlannerStore((s) => s.updateEvent);

  const [dragId, setDragId] = useState(null);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [rotationPreview, setRotationPreview] = useState(null);

  if (!event) return null;

  const hyrox = migrateHyrox(event.hyrox);
  const { stations: activeStationIds, days } = hyrox;
  const stations = HYROX_STATIONS.filter((s) => activeStationIds.includes(s.id));

  const safeIdx = Math.min(activeDayIdx, days.length - 1);
  const day = days[safeIdx];

  function patchHyrox(changes) {
    updateEvent(event.id, { hyrox: { ...hyrox, ...changes } });
  }

  function patchDay(dayId, changes) {
    patchHyrox({
      days: days.map((d) => d.id === dayId ? { ...d, ...changes } : d),
    });
  }

  // ── Day management ──────────────────────────────────────────────────────────

  function addDay() {
    const newId = String(days.length + 1);
    const newDay = defaultDay(newId);
    patchHyrox({ days: [...days, newDay] });
    setActiveDayIdx(days.length);
    setRotationPreview(null);
  }

  function deleteDay(dayId) {
    if (days.length <= 1) return;
    patchHyrox({ days: days.filter((d) => d.id !== dayId) });
    setActiveDayIdx((idx) => Math.max(0, idx - 1));
    setRotationPreview(null);
  }

  // ── Shift management ────────────────────────────────────────────────────────

  function addShift() {
    const nextNum = String(day.waves.length + 1);
    patchDay(day.id, { waves: [...day.waves, nextNum] });
  }

  function deleteShift(shift) {
    const newAssignments = { ...day.assignments };
    HYROX_STATIONS.forEach((s) => { delete newAssignments[cellKey(s.id, shift)]; });
    const newWaveTimes = { ...day.waveTimes };
    delete newWaveTimes[shift];
    patchDay(day.id, { waves: day.waves.filter((w) => w !== shift), assignments: newAssignments, waveTimes: newWaveTimes });
  }

  function handleShiftTimeChange(shift, field, value) {
    const waveTimes = { ...day.waveTimes, [shift]: { ...(day.waveTimes[shift] || {}), [field]: value } };
    patchDay(day.id, { waveTimes });
  }

  // ── Cell management ─────────────────────────────────────────────────────────

  function handleDrop(stationId, shift, phId) {
    const key = cellKey(stationId, shift);
    const current = day.assignments[key] || [];
    if (current.includes(phId)) return;
    patchDay(day.id, { assignments: { ...day.assignments, [key]: [...current, phId] } });
    setRotationPreview(null);
  }

  function handleRemove(stationId, shift, phId) {
    const key = cellKey(stationId, shift);
    const current = day.assignments[key] || [];
    patchDay(day.id, { assignments: { ...day.assignments, [key]: current.filter((id) => id !== phId) } });
    setRotationPreview(null);
  }

  function handleCellTimeChange(stationId, shift, field, value) {
    const key = cellKey(stationId, shift);
    const cellTimes = { ...day.cellTimes, [key]: { ...(day.cellTimes[key] || {}), [field]: value } };
    patchDay(day.id, { cellTimes });
  }

  // ── Station toggles ─────────────────────────────────────────────────────────

  function toggleStation(id) {
    const next = activeStationIds.includes(id)
      ? activeStationIds.filter((s) => s !== id)
      : [...activeStationIds, id];
    patchHyrox({ stations: next });
  }

  // ── Rotation ────────────────────────────────────────────────────────────────

  function handleSuggestRotation() {
    const prevDay = days[safeIdx - 1];
    if (!prevDay) return;
    const suggestion = suggestRotation(prevDay, photographers, activeStationIds);
    setRotationPreview(suggestion);
  }

  function applyRotation() {
    if (!rotationPreview) return;
    patchDay(day.id, { assignments: rotationPreview });
    setRotationPreview(null);
  }

  // ── Per-photographer spot count ─────────────────────────────────────────────

  const activeAssignments = rotationPreview || day.assignments;
  const phStations = {};
  stations.forEach((station) => {
    day.waves.forEach((shift) => {
      const key = cellKey(station.id, shift);
      (activeAssignments[key] || []).forEach((phId) => {
        if (!phStations[phId]) phStations[phId] = new Set();
        phStations[phId].add(key);
      });
    });
  });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4">

      {/* Day tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
        {days.map((d, idx) => (
          <div key={d.id} className="flex items-center">
            <button
              type="button"
              onClick={() => { setActiveDayIdx(idx); setRotationPreview(null); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                idx === safeIdx
                  ? 'bg-[#1C2B6B] text-white shadow-sm'
                  : 'bg-[#f0f2fa] text-[#5b6aa8] hover:bg-[#e4e8f5]'
              }`}
            >
              Tag {d.id}
            </button>
            {days.length > 1 && idx === safeIdx && (
              <button
                type="button"
                onClick={() => deleteDay(d.id)}
                className="ml-0.5 rounded p-0.5 text-[10px] text-gray-300 hover:text-red-400 transition-colors"
                title="Tag entfernen"
              >×</button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addDay}
          className="rounded-lg border-2 border-dashed border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-400 hover:border-[#1C2B6B] hover:text-[#1C2B6B] transition-colors whitespace-nowrap"
        >
          + Tag
        </button>
      </div>

      {/* Day header row */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-extrabold text-[#1C2B6B]">Hyrox — Tag {day.id}</h2>
          <p className="text-xs text-gray-400">{day.waves.length} {language === 'de' ? 'Schichten' : 'Shifts'} · {stations.length} {language === 'de' ? 'Stationen' : 'Stations'}</p>
        </div>
        <div className="flex items-center gap-2">
          {safeIdx > 0 && (
            rotationPreview ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#7c3aed] font-semibold">Vorschlag aktiv</span>
                <button
                  type="button"
                  onClick={applyRotation}
                  className="rounded-lg bg-[#7c3aed] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#6d28d9] transition-colors"
                >
                  Übernehmen
                </button>
                <button
                  type="button"
                  onClick={() => setRotationPreview(null)}
                  className="rounded-lg px-2 py-1.5 text-xs text-gray-400 hover:bg-gray-100"
                >
                  Verwerfen
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSuggestRotation}
                className="rounded-lg border border-[#7c3aed] px-3 py-1.5 text-xs font-bold text-[#7c3aed] hover:bg-[#f5f0ff] transition-colors"
              >
                🔄 Rotation aus Tag {days[safeIdx - 1].id}
              </button>
            )
          )}
          <button
            type="button"
            onClick={addShift}
            className="rounded-xl border-2 border-dashed border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-400 hover:border-[#1C2B6B] hover:text-[#1C2B6B] transition-colors"
          >
            + Schicht
          </button>
        </div>
      </div>

      {/* Rotation preview banner */}
      {rotationPreview && (
        <div className="rounded-xl border border-[#c4b5fd] bg-[#f5f0ff] px-4 py-2.5 text-xs text-[#6d28d9]">
          <span className="font-bold">Rotationsvorschlag für Tag {day.id}:</span> Basierend auf Tag {days[safeIdx - 1].id} — späte Stationen (Finish, Wall Balls) werden vermieden, Wiederholungen minimiert. Drag-Drop zum Anpassen, dann „Übernehmen".
        </div>
      )}

      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
        {/* Photographer pool */}
        <div className="flex w-40 shrink-0 flex-col gap-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Team — auf Grid ziehen</div>
          <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
            {photographers.length === 0 && (
              <p className="text-xs text-gray-300 italic">Zuerst Team-CSV importieren</p>
            )}
            {photographers.map((ph) => {
              const spots = phStations[ph.id] ? [...phStations[ph.id]] : [];
              const count = spots.length;
              const isGreen = count >= 2;
              const isYellow = count === 1;
              return (
                <div
                  key={ph.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('ph_id', ph.id); setDragId(ph.id); }}
                  onDragEnd={() => setDragId(null)}
                  className={`flex cursor-grab items-center gap-2 rounded-xl border px-2.5 py-2 select-none transition-opacity ${
                    dragId === ph.id ? 'opacity-40' : ''
                  } ${isGreen ? 'border-green-300 bg-green-50' : isYellow ? 'border-yellow-300 bg-yellow-50' : 'border-[#e3e7f2] bg-white hover:border-[#1C2B6B]'}`}
                >
                  <span className={`text-sm font-extrabold ${isGreen ? 'text-green-700' : isYellow ? 'text-yellow-700' : 'text-[#1C2B6B]'}`}>
                    {ph.code}
                  </span>
                  {count > 0 ? (
                    <span className={`text-[10px] font-bold ${isGreen ? 'text-green-600' : 'text-yellow-600'}`}>
                      {count} {count === 1 ? 'Station' : 'Stationen'}
                    </span>
                  ) : (
                    <span className="truncate text-[10px] text-gray-400">{ph.firstName || ph.name || ''}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Matrix */}
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
          {/* Station toggles */}
          <div className="flex flex-wrap gap-1.5">
            {HYROX_STATIONS.map((s) => {
              const active = activeStationIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleStation(s.id)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors ${active ? 'bg-[#1C2B6B] text-white' : 'bg-gray-100 text-gray-400'}`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Grid */}
          <div className="overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-gray-200 bg-[#f0f2fa] px-3 py-2 text-left text-xs font-extrabold text-[#1C2B6B] min-w-[80px]">
                    Station
                  </th>
                  {day.waves.map((w) => (
                    <ShiftHeader
                      key={w}
                      shift={w}
                      times={day.waveTimes[w]}
                      language={language}
                      onDelete={deleteShift}
                      onTimeChange={handleShiftTimeChange}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {stations.map((station) => {
                  const isLate = LATE_STATION_IDS.has(station.id);
                  return (
                    <tr key={station.id} className="hover:bg-gray-50/50">
                      <td className={`border border-gray-200 px-3 py-2 ${isLate ? 'bg-orange-50/60' : ''}`}>
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: station.color }} />
                          <span className="text-xs font-bold text-gray-700">{station.label}</span>
                          {isLate && <span className="text-[9px] font-bold text-orange-400 uppercase">spät</span>}
                        </div>
                        <StationImages stationId={station.id} />
                      </td>
                      {day.waves.map((w) => {
                        const key = cellKey(station.id, w);
                        return (
                          <MatrixCell
                            key={w}
                            stationId={station.id}
                            shift={w}
                            assigned={rotationPreview ? (rotationPreview[key] || []) : (day.assignments[key] || [])}
                            photographers={photographers}
                            times={day.cellTimes[key]}
                            onDrop={handleDrop}
                            onRemove={handleRemove}
                            onTimeChange={handleCellTimeChange}
                          />
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
