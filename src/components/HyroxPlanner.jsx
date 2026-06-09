import { useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { useCurrentEvent } from '../hooks/useCurrentEvent';
import { HYROX_STATIONS, defaultWaves } from '../lib/hyrox';

// ─── helpers ────────────────────────────────────────────────────────────────

function cellKey(stationId, wave) {
  return `${stationId}__${wave}`;
}

function getAssignment(hyrox, stationId, wave) {
  return (hyrox.assignments || {})[cellKey(stationId, wave)] || [];
}

// ─── Photographer chip (draggable) ──────────────────────────────────────────

function PhChip({ ph, onDragStart, small = false }) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(ph.id)}
      className={`cursor-grab select-none rounded-full font-bold leading-none ${
        small
          ? 'px-1.5 py-0.5 text-[10px] bg-[#1C2B6B] text-white'
          : 'px-2.5 py-1 text-xs bg-[#1C2B6B] text-white hover:bg-[#16225a]'
      }`}
      title={ph.name || ph.code}
    >
      {ph.code}
    </div>
  );
}

// ─── Cell in the matrix ─────────────────────────────────────────────────────

function MatrixCell({ stationId, wave, assigned, photographers, onDrop, onRemove }) {
  const [over, setOver] = useState(false);

  const phs = assigned
    .map((id) => photographers.find((p) => p.id === id))
    .filter(Boolean);

  return (
    <td
      className={`border border-gray-200 p-1 align-top transition-colors min-w-[72px] ${
        over ? 'bg-blue-50' : 'bg-white'
      }`}
      style={{ minWidth: 72 }}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); const id = e.dataTransfer.getData('ph_id'); if (id) onDrop(stationId, wave, id); }}
    >
      <div className="flex flex-wrap gap-1">
        {phs.map((ph) => (
          <div key={ph.id} className="group relative">
            <span className="flex items-center gap-0.5 rounded-full bg-[#1C2B6B] px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
              {ph.code}
              <button
                type="button"
                onClick={() => onRemove(stationId, wave, ph.id)}
                className="ml-0.5 opacity-60 hover:opacity-100 leading-none"
              >×</button>
            </span>
          </div>
        ))}
      </div>
    </td>
  );
}

// ─── Wave header controls ────────────────────────────────────────────────────

function WaveHeader({ wave, onDelete }) {
  return (
    <th className="border border-gray-200 bg-[#f0f2fa] px-3 py-2 text-center text-xs font-extrabold text-[#1C2B6B]">
      <div className="flex items-center justify-center gap-1">
        Wave {wave}
        <button
          type="button"
          onClick={() => onDelete(wave)}
          className="text-gray-300 hover:text-red-400 leading-none text-[10px]"
          title="Remove wave"
        >×</button>
      </div>
    </th>
  );
}

// ─── Main Hyrox Planner ─────────────────────────────────────────────────────

export function HyroxPlanner() {
  const event = useCurrentEvent();
  const photographers = usePlannerStore((s) => s.photographers) || [];
  const updateEvent = usePlannerStore((s) => s.updateEvent);

  const [dragId, setDragId] = useState(null);
  const [newWave, setNewWave] = useState('');
  const [addingWave, setAddingWave] = useState(false);

  if (!event) return null;

  const hyrox = event.hyrox || { waves: defaultWaves(), assignments: {}, stations: HYROX_STATIONS.map(s => s.id) };
  const waves = hyrox.waves || defaultWaves();
  const assignments = hyrox.assignments || {};

  // Active stations (all by default, can be toggled)
  const activeStationIds = hyrox.stations || HYROX_STATIONS.map(s => s.id);
  const stations = HYROX_STATIONS.filter(s => activeStationIds.includes(s.id));

  function patch(changes) {
    updateEvent(event.id, { hyrox: { ...hyrox, ...changes } });
  }

  function handleDrop(stationId, wave, phId) {
    const key = cellKey(stationId, wave);
    const current = assignments[key] || [];
    if (current.includes(phId)) return;
    patch({ assignments: { ...assignments, [key]: [...current, phId] } });
  }

  function handleRemove(stationId, wave, phId) {
    const key = cellKey(stationId, wave);
    const current = assignments[key] || [];
    patch({ assignments: { ...assignments, [key]: current.filter(id => id !== phId) } });
  }

  function addWave() {
    const w = newWave.trim().toUpperCase();
    if (!w || waves.includes(w)) return;
    patch({ waves: [...waves, w] });
    setNewWave('');
    setAddingWave(false);
  }

  function deleteWave(wave) {
    const newAssignments = { ...assignments };
    HYROX_STATIONS.forEach(s => { delete newAssignments[cellKey(s.id, wave)]; });
    patch({ waves: waves.filter(w => w !== wave), assignments: newAssignments });
  }

  function toggleStation(id) {
    const current = hyrox.stations || HYROX_STATIONS.map(s => s.id);
    const next = current.includes(id) ? current.filter(s => s !== id) : [...current, id];
    patch({ stations: next });
  }

  // Which photographers are already assigned somewhere (for visual hint)
  const allAssigned = new Set(Object.values(assignments).flat());

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-[#1C2B6B]">🏋️ Hyrox Planner</h2>
          <p className="text-xs text-gray-400">{waves.length} waves · {stations.length} stations</p>
        </div>
        <div className="flex items-center gap-2">
          {addingWave ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={newWave}
                onChange={(e) => setNewWave(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && addWave()}
                placeholder="E"
                maxLength={3}
                className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-center text-sm font-bold uppercase outline-none focus:border-[#1C2B6B]"
              />
              <button type="button" onClick={addWave} className="rounded-lg bg-[#1C2B6B] px-3 py-1 text-xs font-bold text-white">Add</button>
              <button type="button" onClick={() => setAddingWave(false)} className="rounded-lg px-2 py-1 text-xs text-gray-400 hover:bg-gray-100">✕</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingWave(true)}
              className="rounded-xl border-2 border-dashed border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-400 hover:border-[#1C2B6B] hover:text-[#1C2B6B] transition-colors"
            >
              + Wave
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
        {/* Left: Photographer pool */}
        <div className="flex w-40 shrink-0 flex-col gap-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Team — drag onto grid</div>
          <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
            {photographers.length === 0 && (
              <p className="text-xs text-gray-300 italic">Import team CSV first</p>
            )}
            {photographers.map((ph) => (
              <div
                key={ph.id}
                draggable
                onDragStart={(e) => { e.dataTransfer.setData('ph_id', ph.id); setDragId(ph.id); }}
                onDragEnd={() => setDragId(null)}
                className={`flex cursor-grab items-center gap-2 rounded-xl border px-2.5 py-2 select-none transition-opacity ${
                  dragId === ph.id ? 'opacity-40' : allAssigned.has(ph.id) ? 'border-gray-100 bg-gray-50' : 'border-[#e3e7f2] bg-white hover:border-[#1C2B6B]'
                }`}
              >
                <span className="text-xs font-extrabold text-[#1C2B6B]">{ph.code}</span>
                <span className="truncate text-[10px] text-gray-400">{ph.firstName || ph.name || ''}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Matrix */}
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
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors ${
                    active ? 'bg-[#1C2B6B] text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {s.icon} {s.label}
                </button>
              );
            })}
          </div>

          {/* Grid */}
          <div className="overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-gray-200 bg-[#f0f2fa] px-3 py-2 text-left text-xs font-extrabold text-[#1C2B6B] min-w-[140px]">
                    Station
                  </th>
                  {waves.map((w) => (
                    <WaveHeader key={w} wave={w} onDelete={deleteWave} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {stations.map((station) => (
                  <tr key={station.id} className="hover:bg-gray-50/50">
                    <td className="border border-gray-200 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span style={{ color: station.color }}>{station.icon}</span>
                        <span className="text-xs font-bold text-gray-700">{station.label}</span>
                      </div>
                    </td>
                    {waves.map((w) => (
                      <MatrixCell
                        key={w}
                        stationId={station.id}
                        wave={w}
                        assigned={getAssignment(hyrox, station.id, w)}
                        photographers={photographers}
                        onDrop={handleDrop}
                        onRemove={handleRemove}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
